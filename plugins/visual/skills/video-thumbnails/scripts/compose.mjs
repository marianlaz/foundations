// Composes video thumbnails from a spec and renders them with Chrome headless (CDP, own port + profile).
//
//   node compose.mjs render <spec.json> [--only a,b] [--out <dir>]   thumb.jpg (1280×720) + thumb-hero.jpg (1600×800) + thumb.md per item
//   node compose.mjs sheet  <spec.json> <out.png> [--card 320]        contact sheet: every thumb at card size with title + summary's 1st line
//                                                                      (+ "was → now" when the item has oldHook), + 2 heroes
//   node compose.mjs cover  <spec.json> [--only a,b] [--out <dir>]   items with "cover":{…}: thumb-cover.jpg (1280×720) + thumb-cover-hero.jpg (1600×800)
//   node compose.mjs compare <spec.json> <out.png>                    normal vs cover, side by side, for every item with "cover"
//
// spec.json:
// { "root": "/abs/episodes", "port": 9495, "tmp": "/abs/tmp/dir",
//   "items": [{ "id": "season-1/02-why-caches-lie", "title": "Why caches lie",
//               "t": 31.5, "video": "episode.mp4",            // optional; default: episode-16x9.mp4 if it exists, else episode.mp4
//               "hook": "When the cache *lies*", "focus": [.5,.5], "zoom": 1.4, "anchor": [.7,.46],
//               "hero": { ...overrides for 1600×800 },        // optional
//               "why": "...", "alts": ["..."], "hookAlts": ["..."], "oldHook": "...",
//               "cover": { "eyebrow": "Introducing", "title": "The Library", "desc": "Everything we know, in one place.",   // optional: cover mode
//                          "seal": {"rank": 1, "label": "Most voted · October 2026"}, "focus": [.5,.4], "zoom": 1.2, "hero": {...} } }] }
// "logo" (spec level, optional) = absolute path to a white wordmark SVG for covers; without it, covers have no logo. Summaries for the sheet: <root>/tags.json.
// Without --out, files go into <root>/<id>/. Times (t) are seconds in the same video candidates.sh used.
import {spawn, execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = resolve(HERE, '../assets/thumb.html'), COVER = resolve(HERE, '../assets/cover.html');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [cmd, specPath, ...rest] = process.argv.slice(2);
if (!cmd || !specPath) { console.error('usage: compose.mjs render|sheet <spec.json> ...'); process.exit(1); }
const arg = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const PORT = spec.port || 9495, TMP = spec.tmp || join(dirname(resolve(specPath)), '_tmp');
mkdirSync(TMP, {recursive: true});
const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- Chrome over CDP ---------------------------------------------------------------------------------
async function chrome() {
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(TMP, 'chrome-prof')}`,
    '--allow-file-access-from-files', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-color-profile=srgb', 'about:blank'], {stdio: 'ignore'});
  let ver; for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(200); } }
  if (!ver) throw new Error(`Chrome did not answer on port ${PORT}`);
  const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({id: i, method, params, sessionId})); });
  const {result: {targetId}} = await send('Target.createTarget', {url: 'about:blank'});
  const {result: {sessionId}} = await send('Target.attachToTarget', {targetId, flatten: true});
  await send('Page.enable', {}, sessionId); await send('Runtime.enable', {}, sessionId);
  const s = (m, p) => send(m, p, sessionId);
  return {
    async shot(url, w, h, format = 'jpeg', quality = 85, full = false) {
      await s('Emulation.setDeviceMetricsOverride', {width: w, height: h, deviceScaleFactor: 1, mobile: false});
      await s('Page.navigate', {url});
      for (let i = 0; i < 150; i++) { await sleep(100); const r = await s('Runtime.evaluate', {expression: 'window.__done===true', returnByValue: true}); if (r.result?.result?.value) break; }
      const err = (await s('Runtime.evaluate', {expression: 'window.__err||""', returnByValue: true})).result?.result?.value;
      if (err) throw new Error(err);
      let ch = h;
      if (full) { const r = await s('Runtime.evaluate', {expression: 'document.documentElement.scrollHeight', returnByValue: true}); ch = r.result.result.value;
        await s('Emulation.setDeviceMetricsOverride', {width: w, height: ch, deviceScaleFactor: 1, mobile: false}); await sleep(300); }
      const r = await s('Page.captureScreenshot', {format, ...(format === 'jpeg' ? {quality} : {}), clip: {x: 0, y: 0, width: w, height: ch, scale: 1}, captureBeyondViewport: true});
      return Buffer.from(r.result.data, 'base64');
    },
    close() { ws.close(); proc.kill(); },
  };
}

// --- frames --------------------------------------------------------------------------------------------
function frameOf(it) {
  const dir = join(spec.root, it.id);
  const video = join(dir, it.video || (existsSync(join(dir, 'episode-16x9.mp4')) ? 'episode-16x9.mp4' : 'episode.mp4'));
  const out = join(TMP, it.id.replace(/\//g, '__') + `-${it.t}.png`);
  if (!existsSync(out)) execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(it.t), '-i', video, '-frames:v', '1', out]);
  return {video, png: out};
}
let nav = 0;  // a fresh query per shot: a hash-only change would be a same-document navigation and the page would not re-run
const url = (o, tpl = TEMPLATE) => 'file://' + tpl + '?n=' + (++nav) + '#' + encodeURIComponent(JSON.stringify(o));
const pick = (it, extra) => { const {id, title, t, cand, video, why, alts, hookAlts, oldHook, hero, cover, ...look} = it; return {...look, ...extra}; };
const LOGO = spec.logo ? resolve(spec.logo) : null;
// cover look: only the frame fields of the item carry over (focus/zoom/t); everything else comes from item.cover
const coverOf = it => { const {hero, t, ...c} = it.cover; return {item: {...it, t: t ?? it.t}, look: {focus: it.focus, zoom: 1, title: it.title, ...c, logo: LOGO}, hero: hero || {}}; };
const SUM = (() => { try { return JSON.parse(readFileSync(join(spec.root, 'tags.json'), 'utf8')); } catch { return {}; } })();
const firstLine = id => ((SUM[id] || {}).summary || '').split(/(?<=[.?!])\s/)[0];
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const plain = h => esc((h || '').replace(/[*|]/g, ' ').replace(/\s+/g, ' ').trim());
async function page(name, html, w, h = 900) { const f = join(TMP, name); writeFileSync(f, html); return C.shot('file://' + f, w, h, 'png', 0, true); }
const CSS = `@font-face{font-family:"Brand Sans";src:url("file://${resolve(HERE, '../assets/PlusJakartaSans-Variable.ttf')}")}
  body{margin:0;background:#141414;color:#e5e5e5;font:500 14px/1.3 "Brand Sans",sans-serif;padding:28px} figure{margin:0} img{display:block;border-radius:4px}
  .t{font-weight:700;color:#fff;margin-top:8px} .s{color:#9a9a9a;font-size:12.5px;margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .h{font-size:12.5px;margin-top:5px;color:#cfcfcf} .h s{color:#777} .h b{color:#FF6447;font-weight:700}`;
const done = `<script>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))).then(()=>window.__done=true)</script>`;

function md(it, video) {
  return `# Thumbnail · ${it.title || it.id}

- **Gancho:** ${it.hook.replace(/\|/g, ' ').replace(/\*/g, '')}  (coral: ${(it.hook.match(/\*([^*]+)\*/) || [, '—'])[1]})${it.oldHook ? `  · antes: ${it.oldHook.replace(/[*|]/g, '')}` : ''}
- **Tema (summary):** ${firstLine(it.id) || '—'}
- **Frame:** ${it.cand ? `candidato #${it.cand} · ` : ''}${it.t} s de \`${video.split('/').pop()}\` · foco ${JSON.stringify(it.focus || [.5, .5])} · zoom ${it.zoom || 1}
- **Archivos:** \`thumb.jpg\` (1280×720, q85) · \`thumb-hero.jpg\` (1600×800, q85)

## Por qué este frame
${it.why || '—'}

## Descartados
${(it.alts || []).map(a => `- ${a}`).join('\n') || '—'}

## Ganchos descartados
${(it.hookAlts || []).map(a => `- ${a}`).join('\n') || '—'}

_Hecho con la skill \`video-thumbnails\` (plugin visual@foundations)._
`;
}

// --- commands ------------------------------------------------------------------------------------------
const C = await chrome();
try {
  if (cmd === 'render') {
    const only = arg('--only') ? arg('--only').split(',') : null, outDir = arg('--out');
    for (const it of spec.items) {
      if (only && !only.some(o => it.id.includes(o))) continue;
      const {video, png} = frameOf(it);
      const dest = outDir ? join(outDir, it.id.replace(/\//g, '__')) : join(spec.root, it.id);
      mkdirSync(dest, {recursive: true});
      writeFileSync(join(dest, 'thumb.jpg'), await C.shot(url(pick(it, {img: png, w: 1280, h: 720})), 1280, 720));
      writeFileSync(join(dest, 'thumb-hero.jpg'), await C.shot(url(pick(it, {img: png, w: 1600, h: 800, col: .5, ...(it.hero || {})})), 1600, 800));
      writeFileSync(join(dest, 'thumb.md'), md(it, video));
      console.log('ok', it.id, '→', dest);
    }
  } else if (cmd === 'sheet') {
    // the check that matters: does the thumb say what the video is about? title + summary's 1st line next to each one
    const out = rest[0], card = +arg('--card', 320), dirOf = it => join(spec.root, it.id), now = Date.now();
    const cards = spec.items.map(it => `<figure style="width:${card}px"><img src="file://${dirOf(it)}/thumb.jpg?${now}" width="${card}" height="${card * 9 / 16}">
      <div class="t">${esc(it.title || it.id)}</div><div class="s">${esc(firstLine(it.id))}</div>
      ${it.oldHook ? `<div class="h"><s>${plain(it.oldHook)}</s> → <b>${plain(it.hook)}</b></div>` : ''}</figure>`).join('');
    const heroes = spec.items.slice(0, 2).map(it => `<img style="width:${card * 2.4}px" src="file://${dirOf(it)}/thumb-hero.jpg?${now}">`).join('');
    const cols = +arg('--cols', 5);
    writeFileSync(out, await page('sheet.html', `<!doctype html><meta charset="utf-8"><style>${CSS} .grid{display:grid;grid-template-columns:repeat(${cols},${card}px);gap:26px 14px}
      .heroes{display:flex;gap:16px;margin-top:36px}</style><div class="grid">${cards}</div><div class="heroes">${heroes}</div>${done}`, cols * card + (cols - 1) * 14 + 56));
    console.log('sheet →', out);
  } else if (cmd === 'cover') {
    const only = arg('--only') ? arg('--only').split(',') : null, outDir = arg('--out');
    for (const it0 of spec.items.filter(i => i.cover)) {
      if (only && !only.some(o => it0.id.includes(o))) continue;
      const {item, look, hero} = coverOf(it0), {png} = frameOf(item);
      const dest = outDir ? join(outDir, it0.id.replace(/\//g, '__')) : join(spec.root, it0.id);
      mkdirSync(dest, {recursive: true});
      writeFileSync(join(dest, 'thumb-cover.jpg'), await C.shot(url({...look, img: png, w: 1280, h: 720}, COVER), 1280, 720, 'jpeg', 88));
      writeFileSync(join(dest, 'thumb-cover-hero.jpg'), await C.shot(url({...look, ...hero, img: png, w: 1600, h: 800}, COVER), 1600, 800, 'jpeg', 88));
      console.log('cover', it0.id, '→', dest);
    }
  } else if (cmd === 'compare') {
    const out = rest[0], dirOf = it => join(spec.root, it.id), now = Date.now(), cw = 560;
    const rows = spec.items.filter(i => i.cover).map(it => `<div class="row"><figure><img width="${cw}" src="file://${dirOf(it)}/thumb.jpg?${now}"><div class="t">normal · ${esc(it.title)}</div></figure>
      <figure><img width="${cw}" src="file://${dirOf(it)}/thumb-cover.jpg?${now}"><div class="t">cover · ${esc(it.cover.eyebrow || '')}</div></figure>
      <figure><img width="${cw * 1.1}" src="file://${dirOf(it)}/thumb-cover-hero.jpg?${now}"><div class="t">cover hero 2:1</div></figure></div>`).join('');
    writeFileSync(out, await page('compare.html', `<!doctype html><meta charset="utf-8"><style>${CSS} .row{display:flex;gap:18px;align-items:flex-start;margin-bottom:26px}</style>${rows}${done}`, cw * 3.1 + 36 + 56));
    console.log('compare →', out);
  } else throw new Error('unknown command ' + cmd);
} finally { C.close(); }
