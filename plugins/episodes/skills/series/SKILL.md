---
name: series
description: >-
  Makes a mini series of the character's episodes from the owner's own notes (Notion or any text), with a story arc across
  episodes, synthesized sound and a trailer, and publishes it to the gallery. Use when the user says "armá una serie",
  "una mini serie", "una serie de N episodios sobre…", "tirame un trailer", "hacé episodios con mis notas", or leaves the
  character to develop content on its own.
---

# series

A series is 3–5 episodes that share one frame (HUD, clock, closing card) and one arc. It is built with the `episode` skill's
tools; this skill adds the frame, the arc, the sound plan and the trailer. `<skill>` is this skill's base directory, `<plugin>`
two levels up, `<ep>` = `<plugin>/skills/episode`.

## 1. Find the material (the character's past, not its present)
- Read the owner's notes (the source in `character.json → memory`). Pick 3–5 that each hold one idea with a turn in it:
  a scene, a problem, a reversal, a question. Prefer notes in the owner's own voice over summaries.
- Quote, don't invent. Every line the character says comes from the note, shortened. If a note ends mid-sentence, end there.
- Note the source (title + date) in the first line of each `voice.txt`.

## 2. The arc (storytelling first)
- **One frame for the whole series**: a name, a time of day, a reason to watch them in order. Example: "Antes de dormir",
  4 talks with yourself between 22:00 and 23:59; the HUD clock runs through the night and the palette goes day → dusk → night.
- **Each episode**: hook in the first line (a claim or a question) → the mechanism drawn on screen (show it, don't illustrate
  it) → a turn → a payoff held ≥ 2 s → the character's own open question or sign-off. The last episode closes the series.
- Order the episodes so the mood moves (heavy → light, or day → night). Assign each a gallery series (`meta.json → tanda`).

## 3. Build each episode
1. `node <ep>/scripts/new.mjs <episodes>/<series>/0N-slug`, then write `voice.txt` (one beat per line, `id | text`, one
   `**accent**` word per line at most).
2. `scenes.js` = `assets/prelude.js` (fill `__SERIES__`, `__COUNT__`) + the episode body + `assets/footer.js`. The body
   defines `const EP = {n, title, clock: [startMin, endMin], states: [[t, state, color]…], orbAt(t), world(ctx, t, tint)}`,
   keying every beat to `S('id')` (a line's start). Helpers: `label`, `words`, `mask`, `sky`, `typed`, `mixc`, plus `KX.h`.
3. `python3 <ep>/scripts/voice.py <dir> --synthetic` (written voice; `voice.pace` in character.json slows it for reading).
4. `sound.json` → `python3 <ep>/scripts/sound.py <dir>`: a bed of chords that change at the turns, plus cues on the beats
   (chime on accent words, thump on stamps, wind for movement, tick for time, breath for pauses, glide for falls).
   Set `"tail": 4.8` (the prelude's length after the last line). Cue times that depend on line lengths: build the voice
   first and generate the cues from `voice.json`.
5. `node <ep>/scripts/render.mjs <dir> --port <free port>` (render two at a time on different ports), then look at 10
   frames as a contact sheet. Fix overlaps and beats that land late before moving on.

## 4. The trailer: one story, not a montage
A montage of clips with their captions out of context reads as noise (the owner's verdict on the first one: "muy malo e
inconexo"). A trailer is its own short story, 45–60 s, built from ONE note with a story in it:
1. **World** (calm, concrete): who, where, an ordinary detail with a number or a name ("10:00", "la valija", "27 OCT").
2. **The question**: one line that opens a tension the trailer never closes ("¿Y si de verdad este fuera mi último día?").
3. **Escalation**: lines get shorter and faster (`timing.json`: smaller gaps, higher pace), the sound climbs (a heartbeat
   that speeds up, a swell), the images change faster. Use the note's own lists: they are the rhythm.
4. **The drop**: cut to silence (an empty chord in the bed) for 1.5–2 s. One short line.
5. **Title**: the world goes dark, the title lands on a low thump + chime. "UNA SERIE DE <NAME>" above, "PRÓXIMAMENTE" below.
6. **The button**: one last line under the title, ideally the note's own last words ("Elijo vivir.", "Mientras haya vida.").
Rules: one visual metaphor carries the whole piece (a luggage tag, a book that becomes a life line, a heart monitor); show the
mechanism, never decorate; ≤ 12 captions; every number and name from the note; sound and picture share one schedule (generate
the heartbeat times once and use them in both).

How: `scenes.js` = `assets/prelude.js` + the trailer body (`EP = {title, titleAt, states, orbAt, world, over?, big?}`) +
`assets/trailer-frame.js`. Write `timing.json` and run `retime.py` after `voice.py --synthetic`. Build `sound.json` from the
re-timed `voice.json` (silence before `titleAt`). `trailer.py` (clips + cards) is only for a recap of finished episodes.

## 5. Publish
`gallery-data.mjs`, upload each `episode.mp4` + `poster.jpg`, write the rows in one batch (`order`: trailer first). Tell the
owner what is a quote and what was cut, and what you could not check (you can't hear the mix: say so).
