---
name: instance
description: >-
  Makes a new instance of the ecosystem: a character plugin of its own (name, persona, voice, palette) with the same
  episode and gallery skills, in one command. Use when the user says "creá una instancia", "instanciá un personaje",
  "nuevo personaje", "armame un Friday", "sunday new <name>", or wants another character built on this ecosystem.
---

# instance

This plugin is the ecosystem. An instance is a copy of it with its own `character/`: the skills stay the same,
the character changes. `<skill>` below is this skill's base directory.

## Make one
```
node <skill>/scripts/instance.mjs <name> [--into <parent dir>] [--display "Display Name"] [--owner "Owner"]
```
- `<name>`: lowercase, it becomes the plugin name and the skills' namespace (`<name>:episode`).
- `--into`: where the folder goes. Default: next to the ecosystem (`<parent of the plugin>/<name>`).
- It never overwrites. If the folder exists, it stops.

What it does: copies the plugin without this skill, episodes, `.git` or media; renames `plugin.json` and `character/`;
writes a short README and `.sunday.json` (ecosystem version it came from).

## After
1. Tell the user the path and the command to try it: `claude --plugin-dir <path>`.
2. The new character is all TODO. Don't invent its personality: define it with the user, starting with
   `character/persona.md` (who it is, how it speaks), then `character.json` (voice, palette, orb, fonts, gallery copy).
