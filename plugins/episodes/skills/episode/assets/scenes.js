/* The episode: one frame = pure function of t. Every beat and the orb's pulse read their time from window.VOICE (voice.js).
   Loaded after runtime/character.js, runtime/orb.js, runtime/engine.js (themed with the character) and voice.js.
   Sets window.EPISODE = {title, duration, poster, draw(ctx, t)}; index.html turns it into window.EP for render.mjs.
   This template already plays: the orb breathes and pulses with each word, every voice line is a caption, and it closes on the
   character's name. Replace CAPS with ≤ 9-word captions (one **accent** each) and add the scenes that show the mechanism. */
(() => {
const {W, H, C, E, BRAND, bg, bgLight, hud, grain, clamp, lerp, pr, env, rnd, hex, T, card, dot, bez, path, travel, stamp, kv, cap} = KX.h;
const CH = window.CHARACTER, LIGHT = document.documentElement.classList.contains('light');
const MOOD = LIGHT ? CH.orb.moods_light : CH.orb.moods, ORB = Orb.create({seed: CH.orb.seed, spark: CH.orb.spark, paper: CH.orb.paper});
const TITLE = 'TODO: episode title';

/* ---------- the voice clock ---------- */
const V = window.VOICE, LINES = V.lines.map((l, i) => ({id: l.id || `l${i + 1}`, ...l}));
const LN = Object.fromEntries(LINES.map(l => [l.id, l]));
const S = id => LN[id].start, END = id => LN[id].end;
const clean = w => w.toLowerCase().replace(/[^a-z0-9$']/g, '');
const wt = (id, k, n = 0) => { const ws = LN[id].words.filter(w => clean(w.w).startsWith(k)); if (!ws[n]) throw Error(`no word ${id}:${k}`); return ws[n].t; };
const WORDS = LINES.flatMap(l => l.words.map(w => ({t: w.t, e: w.e ?? w.t + .3})));
const LAST = LINES.at(-1), DUR = +(Math.max(V.duration, LAST.end) + 3.4).toFixed(2);
// the voice swell: rises with each word, falls slowly (never a tick)
const pulse = t => { let b = 0; for (const w of WORDS) { if (w.t > t) break; const up = clamp((t - w.t) / .08), down = t > w.e ? Math.exp(-(t - w.e) / .45) : 1;
  b = Math.max(b, up * down); } return .75 * b; };

/* ---------- the orb: [time, state, mood] — states cross-fade over 1.4 s, moods are character.json → orb.moods ---------- */
const mix = (a, b, p) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), k = s => Math.round(lerp(A >> s & 255, B >> s & 255, clamp(p)));
  return '#' + [16, 8, 0].map(s => k(s).toString(16).padStart(2, '0')).join(''); };
const STATES = [[0, 'breathing', 'rest'], [V.duration * .3, 'searching', 'watch'], [V.duration * .7, 'solving', 'solve'], [LAST.end, 'breathing', 'solve']];
const orbState = t => { let i = 0; while (i + 1 < STATES.length && t >= STATES[i + 1][0]) i++;
  const [a, st, md] = STATES[i], prev = STATES[Math.max(0, i - 1)], m = i ? pr(t, a, a + 1.4, E.io) : 1;
  return {state: st, from: i ? prev[1] : null, mix: m, tint: mix(MOOD[prev[2]], MOOD[md], m)}; };
const R = Math.min(W, H) * .14;
const orbAt = t => [W / 2, lerp(H * .36, H * .42, pr(t, LAST.end, LAST.end + 1.4, E.io)), R * lerp(1, 1.25, pr(t, LAST.end, LAST.end + 1.4, E.io))];
function character(ctx, t) {
  const [x, y, r] = orbAt(t), st = orbState(t);
  ORB.draw(ctx, x, y, r, t, {...st, pulse: pulse(t), wake: pr(t, 0, 1.4, E.out), dark: !LIGHT});
}

/* ---------- captions: the story without sound ---------- */
const CAPS = LINES.map((l, i) => [l.start - .1, (LINES[i + 1]?.start ?? LAST.end + .6) - .1, l.text]);
const CAP = {x: W / 2, y: H * .8, s: Math.round(W / 26), al: 'center'};

function closing(ctx, t) {
  const a = pr(t, LAST.end + .4, LAST.end + 1.6);
  const TT = CH.fonts.title || {}, s = Math.round(W / 18);   // character.json → fonts.title: {w, ls (em), upper}
  T(ctx, TT.upper ? CH.display_name.toUpperCase() : CH.display_name, W / 2, H * .72, {s, w: TT.w ?? 700, ls: s * (TT.ls ?? 0), al: 'center', grad: 1, a});
}

function draw(ctx, t) {
  (LIGHT ? bgLight : bg)(ctx, t, MOOD.solve);
  hud(ctx, t, {left: BRAND.name, right: TITLE.toUpperCase()}, LIGHT);
  character(ctx, t);
  CAPS.forEach(([a, b, s]) => cap(ctx, t, a, b, s, CAP));
  closing(ctx, t);
  grain(ctx, t);
}
window.EPISODE = {title: TITLE, duration: DUR, poster: DUR - .5, draw};
})();
