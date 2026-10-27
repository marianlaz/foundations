// Render an episode page to MP4, frame by frame, with Chrome headless over CDP, then its poster.
// usage: node render.mjs <episode dir> [--fps 30] [--port 9400] [--from 0] [--to <s>] [--out file.mp4] [--query theme=light]
// Contract: <dir>/index.html sets window.EP = { duration (s), seek(t) } where seek(t) paints the exact frame at t
// (pure function of time, may return a Promise), and ?render=1 hides any UI that isn't part of the video.
// If <dir>/voice.mp3 and/or <dir>/sound.wav exist they're muxed in (mixed). Frame size: 1600×1000 (EP.size = [w, h] overrides).
// First it relinks <dir>/runtime/ (the plugin's engine, orb and character); last it writes the poster (EP.poster, default the
// last half second) next to the video: episode.mp4 → poster.jpg, episode-light.mp4 → poster-light.jpg.
// Chrome: CHROME=<binary> overrides the macOS default. Use your own --port when other renders run in parallel.
import {spawn} from 'node:child_process';
import {existsSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {resolve, join, dirname, basename} from 'node:path';
import {tmpdir} from 'node:os';
import {sync} from './runtime.mjs';
const args = process.argv.slice(2), dir = resolve(args[0] || '.');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > 0 ? args[i + 1] : d; };
const FPS = +opt('fps', 30), PORT = +opt('port', 9400), OUT = resolve(opt('out', join(dir, 'episode.mp4')));
sync(dir);
const prof = mkdtempSync(join(tmpdir(), 'ep-prof-'));
const chrome = spawn(process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${prof}`, '--allow-file-access-from-files', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], {stdio: 'ignore'});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ver; for (let i = 0; i < 80 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(200); } }
if (!ver) { console.error('chrome did not start'); process.exit(1); }
const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({id: i, method, params, sessionId})); });
const {result: {targetId}} = await send('Target.createTarget', {url: 'about:blank'});
const {result: {sessionId}} = await send('Target.attachToTarget', {targetId, flatten: true});
const ev = async expr => (await send('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true}, sessionId)).result;
await send('Page.enable', {}, sessionId);
await send('Page.navigate', {url: 'file://' + join(dir, 'index.html') + '?render=1' + (opt('query') ? '&' + opt('query') : '')}, sessionId);
let info; for (let i = 0; i < 100; i++) { await sleep(150); const r = await ev('window.EP && document.fonts.ready.then(() => ({d: EP.duration, s: EP.size || [1600, 1000], p: EP.poster ?? EP.duration - .5}))'); if (r.result?.value) { info = r.result.value; break; } }
if (!info) { console.error('window.EP not found'); chrome.kill(); process.exit(1); }
const [W, H] = info.s;
await send('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: 1, mobile: false}, sessionId);
const from = +opt('from', 0), to = +opt('to', info.d), n = Math.round((to - from) * FPS);
// audio: voice.mp3 (the take) and sound.wav (sound.py: bed + cues), mixed when both exist; only for full renders
const auds = from === 0 ? [join(dir, 'voice.mp3'), join(dir, 'sound.wav')].filter(f => existsSync(f)) : [];
const mixIn = auds.map((_, i) => `[${i + 1}:a]`).join(''), afx = auds.length > 1 ? `${mixIn}amix=inputs=${auds.length}:normalize=0,apad[a]` : '[1:a]apad[a]';
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  ...(auds.length ? [...auds.flatMap(a => ['-i', a]), '-filter_complex', afx, '-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '192k', '-t', String(to - from)] : []),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', OUT], {stdio: ['pipe', 'inherit', 'inherit']});
for (let f = 0; f < n; f++) {
  const r = await ev(`Promise.resolve(EP.seek(${from + f / FPS})).then(() => new Promise(r => requestAnimationFrame(() => r(1))))`);
  if (r.exceptionDetails) { console.error('seek failed at', f, JSON.stringify(r.exceptionDetails).slice(0, 400)); break; }
  const s = await send('Page.captureScreenshot', {format: 'jpeg', quality: 92}, sessionId);
  if (!ff.stdin.write(Buffer.from(s.result.data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  if (f % (FPS * 5) === 0) process.stdout.write(`\r${(from + f / FPS).toFixed(1)}s / ${to}s`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r));
const POSTER = join(dirname(OUT), basename(OUT, '.mp4').replace(/^episode/, 'poster') + '.jpg');
await ev(`Promise.resolve(EP.seek(${info.p})).then(() => new Promise(r => requestAnimationFrame(() => r(1))))`);
writeFileSync(POSTER, Buffer.from((await send('Page.captureScreenshot', {format: 'jpeg', quality: 90}, sessionId)).result.data, 'base64'));
ws.close(); chrome.kill(); await new Promise(r => chrome.on('exit', r)); try { rmSync(prof, {recursive: true, force: true, maxRetries: 5}); } catch {}
console.log(`\n${OUT}\n${POSTER}`);
