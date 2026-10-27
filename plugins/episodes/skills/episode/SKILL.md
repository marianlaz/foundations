---
name: episode
description: >-
  Makes a short animated episode told by the plugin's character, in the character's own voice: script → voice (ElevenLabs, with
  word timings) → scenes drawn in code on canvas, every frame a pure function of time → episode.mp4 + poster.jpg. Use when the
  user asks for "un episodio", "un video de <character>", "que <character> explique X", "armá el guion", "generá la voz",
  "renderizá el episodio", "la versión light", or wants an existing episode re-timed to a new voice take.
---

# episode

One episode = one idea, told by the character in under ~90 s. The character is whatever `character/` at the plugin root says:
name, voice, palette, orb and personality. Nothing in this skill names a character; read it from there.

`<skill>` below is this skill's base directory, and `<plugin>` is two levels up from it.

## Before writing anything
1. Read `<plugin>/character/persona.md` (who the character is, how they speak, the tags allowed) and
   `<plugin>/character/character.json`. If either still has TODO in the part you need (personality, voice), stop and tell the
   user what is missing. Never invent the character's personality.
2. Read `assets/grammar.md` (the visual vocabulary). Use it as a vocabulary, not a checklist.
3. Ask, or infer from the request: the audience, where they watch (social on mute, a meeting, a laptop), the format
   (16:9 `1600x1000` or 4:5 `1080x1350`), the language, and the one thing the viewer should think after watching.

## Files of an episode
`node <skill>/scripts/new.mjs <episodes>/<NN-slug> [--size 1080x1350]` creates them from the templates (it never overwrites):

| File | What |
|---|---|
| `script.md` | Audience card first, then the beats table (time · voice · on screen), what is real / example / roadmap, open problems |
| `voice.txt` | What the character says: one line per beat, `id \| text` |
| `voice.json` + `voice.js` (+ `voice.mp3`) | The take with per-word times, written by `voice.py` |
| `scenes.js` | The episode: `window.EPISODE = {title, duration, poster, draw(ctx, t)}` |
| `index.html` | The player (`?render=1` hides the controls, `?theme=light` paints the light palette) |
| `runtime/` | Engine, orb and character, relinked from the plugin on every render. Never edit it |
| `episode.mp4`, `poster.jpg` | Written by `render.mjs` |

The episodes folder is data, not code: it lives wherever the user keeps content (see `<plugin>/episodes/README.md`).

## Flow
1. **Audience card + script.** Fill the card in `script.md`, then write `voice.txt` in the character's voice (persona.md rules,
   only the tags it allows). Reread it as the audience; cut what doesn't serve them.
2. **Clock.** `python3 <skill>/scripts/voice.py <dir> --synthetic` gives an estimated per-word clock with no audio, so the
   beats can be built before the voice exists.
3. **Scenes.** Edit `scenes.js` (the template already plays: orb, captions from the voice lines, closing card). Key every beat
   to the voice: `S('id')` is a line's start, `wt('id', 'word')` a word's time, `pulse(t)` the voice swell for the orb.
   Captions ≤ 9 words with one **accent** word. Show the mechanism, not a picture of it. End on a still payoff ≥ 2 s.
4. **Look at it.** Render a stretch (`--from`/`--to`), pull 6–10 frames with `ffmpeg -ss <t> -i episode.mp4 -frames:v 1 f.jpg`
   and read them. Fix overlaps, clipped text, things that appear early, captions that say something the picture doesn't.
5. **Voice.** `python3 <skill>/scripts/voice.py <dir>`: one take of the whole `voice.txt` (one take sounds like one person in
   one breath). Needs `ELEVENLABS_API_KEY` in the environment and `voice.voice_id` in character.json; it fails with a clear
   message if either is missing. The beats re-time themselves; check the frames again.
   If `character.json → voice.mode` is `"written"`, the character has no sound voice: skip this step, keep the synthetic
   clock, and let the captions carry the whole voice (the mp4 has no audio track).
6. **Render.** `node <skill>/scripts/render.mjs <dir> --port <free port>` → `episode.mp4` + `poster.jpg`. Light version:
   `--query theme=light --out <dir>/episode-light.mp4` → `poster-light.jpg`. Use your own port when renders run in parallel.

## Sound (no voice needed)
`sound.json` + `python3 <skill>/scripts/sound.py <dir>` synthesizes `sound.wav` (a bed of chords plus cues keyed to the voice
lines: chime, thump, tick, wind, breath, glide, swell; see the script's docstring). `render.mjs` mixes it into the mp4, with
`voice.mp3` when there is one. A written voice (`voice.mode: "written"`) reads at `voice.pace` (< 1 is slower).
For several episodes with one frame and a trailer, use the `series` skill (`trailer.py` cuts the trailer).

## Honesty
- Facts, numbers, names and quotes come from a source; cite it in `script.md`. Filler is generic and tagged `EXAMPLE` on screen.
- Don't draw capabilities that don't exist as if they did: label them `ROADMAP` or `VISION`.
- No real people's data, no third-party logos or brands on screen.

## Engine (`runtime/engine.js`, `KX.h`)
- Size: `window.KX_SIZE = [w, h]` (the page sets it). Theme: the page calls `KX.theme` with character.json and `KX.light(true)`
  for `?theme=light`; scenes use the tokens of `C` (`night, card, card2, rule, steel, ice, text, white, violet, lav, pink, red,
  orange, amber, green, teal, blue`), never literal colors, so both palettes and every character work.
- Time: `pr(t, a, b, E.expo|out|io|back|lin)` progress 0..1 in [a, b]; `env(t, a, b, in, out)` in-hold-out; `rnd(seed)` fixed
  random. Never keep state between frames.
- Text: `T(ctx, s, x, y, {s, w, mono, body, c, al, a, grad, ls})`; `cap(ctx, t, a, b, 'text with **accent**', {x, y, s, al, ls})`
  kinetic caption; `kv(ctx, [[k, v, color]], x, y, t0, t)` typed mono rows.
- Shapes: `card(ctx, x, y, w, h, {fill, stroke, glow, dash, r, a})`, `rr`, `dot(ctx, x, y, r, col, a)`,
  `stamp(ctx, 'TEXT', x, y, p, col, rot)`, `orb(...)` (a simple 2D orb; the character's real orb is below).
- Paths: `bez(a, d, bend, vertical)`, `path(ctx, P, u0, u1, col, {lw, dash, glow})`, `travel(ctx, P, t, a, b, col)` (a pulse
  with a tail), `cubic(...P, u)`.
- Chrome: `bg`, `bgLight`, `hud(ctx, t, label | {left, right}, light)`, `grain`; `grad(ctx, x, w)` is the character's gradient.
- Scenes for web pages (not episodes): `KX.scene(name, {D, poster, label, col, draw, light, once, custom, hud, bg})` mounted on
  `<canvas data-kx="name">`; `?kxt=<s>` freezes every scene at that time.

## The orb (`runtime/orb.js`, `window.Orb`)
```js
const k = Orb.create({seed: CH.orb.seed, spark: CH.orb.spark});
k.draw(ctx, x, y, r, t, {state, from, mix, tint, pulse, wake, dark, dens});
```
- `state`: breathing (rest) · listening · searching · connecting · weaving · composing · shaping · working · solving. Change it
  with a cross-fade: `from` = previous, `mix` 0→1 over ~1.2 s.
- `tint`: a mood from `character.json → orb.moods` (`moods_light` on paper): `rest`, `watch`, `solve`. Change colors slowly.
- `pulse` 0..1 from the voice (`pulse(t)` in the template), `wake` 0→1 to appear, `dens` 0..1 how many points it has gathered,
  `dark: false` on light backgrounds. Big reads better: r ≥ 120 at 1080 px wide.
- The orb is the character on screen: in frame the whole episode, introduced by name in the first seconds.
- To change the orb's code, edit `scripts/orb-src/` and rebuild `scripts/orb.js` with the command at the top of `orb-src/orb.js`.
