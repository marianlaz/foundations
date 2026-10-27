// Build the gallery artifact from an episodes folder: the page (assets.json → page) filled with the character, its two published
// files (character.js, orb.js) and episodes.json, the rows for the artifact's db with the local files each one needs uploaded.
// usage: node gallery-data.mjs <episodes dir> [--out <dir>]          (default out: <episodes dir>/_gallery)
// An episode is a folder NN-slug (at the root or one series folder down) with script.md and episode.mp4. Title: the first
// "# " line of script.md; series: the parent folder; wide: a page wider than tall. meta.json in the episode overrides any of
// {title, tanda, wide, areas, order, sub, post, series}. Rows also carry dur (s) and series (the parent folder). Episodes without episode.mp4 are listed as skipped.
import {readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync, copyFileSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const seconds = f => Math.round(+spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).stdout || 0);
const SKILL = join(dirname(fileURLToPath(import.meta.url)), '..'), PLUGIN = join(SKILL, '..', '..');
const ASSETS = JSON.parse(readFileSync(join(SKILL, 'assets.json'), 'utf8')), asset = name => join(SKILL, ASSETS[name]);
const CH = JSON.parse(readFileSync(join(PLUGIN, 'character', 'character.json'), 'utf8'));
const args = process.argv.slice(2), root = resolve(args[0] || '.'), oi = args.indexOf('--out'), OUT = resolve(oi > 0 ? args[oi + 1] : join(root, '_gallery'));
const read = f => existsSync(f) ? readFileSync(f, 'utf8') : null;
const isEp = d => /^\d\d/.test(d.split('/').pop()) && existsSync(join(root, d, 'script.md'));
const sub = base => readdirSync(join(root, base)).filter(d => !d.startsWith('_') && !d.startsWith('.') && statSync(join(root, base, d)).isDirectory()).map(d => base ? `${base}/${d}` : d);
const dirs = sub('').flatMap(d => isEp(d) ? [d] : sub(d).filter(isEp));

const rows = [], skipped = [];
dirs.forEach((d, i) => {
  const dir = join(root, d), meta = JSON.parse(read(join(dir, 'meta.json')) || '{}');
  if (!existsSync(join(dir, 'episode.mp4'))) return skipped.push(d);
  const size = (read(join(dir, 'index.html')) || '').match(/KX_SIZE = \[(\d+), (\d+)\]/);
  const doc = {path: d, title: (read(join(dir, 'script.md')).match(/^# (.+)$/m) || [, d])[1].trim(), tanda: d.includes('/') ? d.split('/')[0] : '',
    order: i, wide: size ? +size[1] > +size[2] : true, series: d.includes('/') ? d.split('/')[0] : '', dur: seconds(join(dir, 'episode.mp4')), ...meta};
  const files = {video: join(dir, 'episode.mp4'), ...(existsSync(join(dir, 'poster.jpg')) ? {poster: join(dir, 'poster.jpg')} : {})};
  rows.push({id: d.replaceAll('/', '--'), doc, files});
});

mkdirSync(OUT, {recursive: true});
const say = s => s.replaceAll('{name}', CH.display_name);
writeFileSync(join(OUT, 'index.html'), readFileSync(asset('page'), 'utf8').replace('__TITLE__', say(CH.gallery.title))
  .replace('__FONTS__', CH.fonts.google).replace('__DISPLAY__', CH.fonts.sans).replace('__BODY__', CH.fonts.body));
writeFileSync(join(OUT, 'character.js'), `// generated from character/character.json — do not edit\nwindow.CHARACTER = ${JSON.stringify(CH)};\n`);
copyFileSync(asset('orb'), join(OUT, 'orb.js'));
writeFileSync(join(OUT, 'episodes.json'), JSON.stringify(rows, null, 1));
console.log(`${OUT}\n${rows.length} episodes${skipped.length ? ` · skipped (no episode.mp4): ${skipped.join(', ')}` : ''}`);
