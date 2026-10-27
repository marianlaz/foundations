// Make an instance of the ecosystem: copy the plugin into <parent>/<name>, rename it, and reset its character to TODO.
// usage: node instance.mjs <name> [--into <parent dir>] [--display "Display Name"] [--owner "Owner"]
// → <parent>/<name>/ with plugin.json, character/ and README.md renamed; .sunday.json records where it came from.
// Never overwrites: if <parent>/<name> exists it stops.
import {cpSync, existsSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, join, relative, sep, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const name = (args[0] || '').toLowerCase();
if (!/^[a-z][a-z0-9-]*$/.test(name)) { console.error('usage: instance.mjs <name> [--into <dir>] [--display "Name"] [--owner "Owner"]  (name: a-z, 0-9, -)'); process.exit(1); }
const plugin = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const eco = JSON.parse(readFileSync(join(plugin, '.claude-plugin/plugin.json'), 'utf8'));
const from = JSON.parse(readFileSync(join(plugin, 'character/character.json'), 'utf8'));
const display = opt('--display') || name[0].toUpperCase() + name.slice(1);
const out = join(resolve(opt('--into') || dirname(plugin)), name);
if (existsSync(out)) { console.error(`${out} already exists: pick another name or --into`); process.exit(1); }

// What an instance doesn't carry: this skill (only the ecosystem makes instances), episodes, git, deps, media.
const skip = new Set(['.git', 'node_modules', '.sunday.json', join('skills', 'instance')]);
cpSync(plugin, out, {recursive: true, filter: src => {
  const rel = relative(plugin, src);
  if (!rel) return true;
  if (skip.has(rel) || rel.split(sep).some(p => skip.has(p))) return false;
  if (rel.startsWith('episodes' + sep)) return rel === join('episodes', 'README.md');
  return !/\.(mp4|mp3|jpg|png)$/.test(rel) || rel.includes('orb-src');
}});

// Rename: the character's name only lives in plugin.json and character/.
const swap = s => s.replaceAll(from.display_name, display).replaceAll(from.name, name);
for (const f of ['character/persona.md', 'character/character.json', '.claude-plugin/plugin.json'])
  writeFileSync(join(out, f), swap(readFileSync(join(out, f), 'utf8')));
const ch = JSON.parse(readFileSync(join(out, 'character/character.json'), 'utf8'));
Object.assign(ch, {name, display_name: display, owner: opt('--owner') ?? null});
writeFileSync(join(out, 'character/character.json'), JSON.stringify(ch, null, 2) + '\n');

writeFileSync(join(out, '.sunday.json'), JSON.stringify({ecosystem: eco.name, version: eco.version, from: plugin, created: new Date().toISOString().slice(0, 10)}, null, 2) + '\n');
writeFileSync(join(out, 'README.md'), `# ${name}

${display}: an instance of the ${eco.name} ecosystem (v${eco.version}). Skills: \`${name}:episode\`, \`${name}:gallery\`.

- Who ${display} is: \`character/persona.md\` (fill the TODOs before the first episode).
- Voice, palette, orb, fonts, gallery copy: \`character/character.json\` (its \`todo\` list says what is missing).
- Try it: \`claude --plugin-dir ${out}\`, then "armame un episodio de ${display} sobre X".

The engine comes from ${eco.name}; \`.sunday.json\` records the version this copy was made from.
`);
console.log(`created ${out}\n  plugin   ${name}  (skills ${name}:episode, ${name}:gallery)\n  next     fill character/persona.md and character/character.json → todo\n  try      claude --plugin-dir ${out}`);
