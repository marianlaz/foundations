// What the episode scripts share: the plugin's character (character/character.json) and this skill's assets, asked for by
// name through assets.json, never by path.
import {readFileSync, writeFileSync, mkdirSync, copyFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const SKILL = join(dirname(fileURLToPath(import.meta.url)), '..'), PLUGIN = join(SKILL, '..', '..');
const ASSETS = JSON.parse(readFileSync(join(SKILL, 'assets.json'), 'utf8'));
export const asset = name => { if (!ASSETS[name]) throw Error(`no asset "${name}" in assets.json`); return join(SKILL, ASSETS[name]); };
export const character = () => JSON.parse(readFileSync(join(PLUGIN, 'character', 'character.json'), 'utf8'));
// <episode>/runtime/: the engine, the orb and the character as classic scripts (a file:// page can't fetch JSON). Rewritten on every
// render, so an episode always draws with the plugin's current engine and character. Never edit it: episode changes go in scenes.js.
export function sync(dir) {
  const out = join(dir, 'runtime'); mkdirSync(out, {recursive: true});
  copyFileSync(asset('engine'), join(out, 'engine.js'));
  copyFileSync(asset('orb'), join(out, 'orb.js'));
  writeFileSync(join(out, 'character.js'), `// generated from character/character.json — do not edit\nwindow.CHARACTER = ${JSON.stringify(character(), null, 1)};\n`);
  return out;
}
