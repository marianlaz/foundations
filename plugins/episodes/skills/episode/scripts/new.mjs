// Start an episode: copy the templates into <dir> (an existing file is never overwritten) and link the runtime.
// usage: node new.mjs <episode dir> [--size 1080x1350]      (default 1600x1000; 4:5 for social = 1080x1350)
// → index.html (player), scenes.js (the episode), script.md (audience card + beats), voice.txt (what the character says), runtime/
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {asset, sync} from './runtime.mjs';
const args = process.argv.slice(2), dir = resolve(args[0] || '.');
const i = args.indexOf('--size'), [W, H] = (i > 0 ? args[i + 1] : '1600x1000').split('x').map(Number);
if (!(W > 0 && H > 0)) { console.error('--size is WxH, e.g. 1080x1350'); process.exit(1); }
mkdirSync(dir, {recursive: true});
for (const [name, file] of [['page', 'index.html'], ['scenes', 'scenes.js'], ['script', 'script.md'], ['voice', 'voice.txt']]) {
  const out = join(dir, file);
  if (existsSync(out)) { console.log(`kept    ${file}`); continue; }
  writeFileSync(out, readFileSync(asset(name), 'utf8').replaceAll('__W__', W).replaceAll('__H__', H));
  console.log(`created ${file}`);
}
sync(dir); console.log('linked  runtime/ (engine, orb, character)');
