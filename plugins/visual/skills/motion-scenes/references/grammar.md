# Grammar: what code-drawn motion pieces do

Reverse-engineered on 2026-09-29 from 8 motion pieces that Opus 5.5 drew in code and people posted on X
(Pocketsflow ×3, ClimbX, Weespy, a paper plane, a P(doom) anime piece and its dark HUD remake).
These are the moves they all share. Use them as a vocabulary, not a checklist: pick the few that tell the concept.

## Structure
- **One concept per scene, 10–20 s, in beats of 2–4 s.** Each beat has one visual change and one caption.
- **A hero that persists.** A mascot or orb that comes back in every beat, and often lives in a corner badge. Here it's usually the orb.
- **Show the mechanism, not a picture of it.** The product UI is rebuilt in code and *used*: fields fill in, a cursor clicks, a counter ticks, a check lands.
- **End on the payoff and hold it** (≥1.5 s) so the loop reads as a statement. Poster frame = that hold.
- **Rhythm through contrast.** Alternate dense and empty beats, dark and light, close and wide (a final zoom-out that shows the whole path).

## Typography
- **Kinetic captions:** words land one by one (≈70 ms stagger) with blur, a small rise and expo-out easing. They leave by blurring upward.
- **One accent word per line,** in the brand gradient or a serif italic swap ("You *create.*", "*memberships.*"). Never two.
- **Short lines,** ≤ 9 words. The caption says what the visual proves.
- **Mono metadata:** section labels (`// 03 · checkout`), timecode, ids, hashes, scores. It reads as "real system" and fills the frame.

## Chrome
- **HUD frame:** corner brackets, a top-left label, a top-right timecode with a blinking rec dot.
- **Blueprint grid** or paper texture at ~5 % opacity. **Grain** as an overlay at ~4–6 %.
- **One background tone and one accent color;** secondary colors only to encode categories.

## Motion atoms
- **Pulses along paths:** a glowing dot with a short tail travels a cubic curve (ease in-out). Many small ones make a stream.
- **Hub and spoke:** sources on both sides, lines draw on, pulses flow into a center that reacts (glow, scale).
- **Counters** that tick up to the real number with tabular figures. **Bars** that fill to a score.
- **Stamps** that slam in with overshoot (scale 2.2 → 1, back-ease, slight rotation): SOLVED, UNVERIFIED, SWAPPED, Handled.
- **Typed text** with a block cursor for commands and questions.
- **Highlight sweeps:** a band scans a document, then one line lights up.
- **Camera:** pan between stations and scale out at the end. Depth via blur on elements that leave.
- **Particles:** converge to show gathering, crumble and fall to show something discarded.
- **Swap/transition flashes** are light bands that sweep, never full-frame gray boxes.

## Honesty rules (for product and internal pieces)
- Numbers, ids, names and quotes come from the source material. When you need filler, make it generic ("a runbook", "the area's owner") and flag it to the user.
- Don't draw capabilities the product doesn't have. If something is "next" or "soon", label it.
