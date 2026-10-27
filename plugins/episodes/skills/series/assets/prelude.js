/* A series' shared frame (sunday:series). Fill __SERIES__ and __COUNT__ when copying it. Every frame is a pure function of t. The voice clock (voice.js) keys every beat.
   An episode defines EP = {n, title, clock: [startMin, endMin], states: [[t, state, color]…], orbAt(t), world(ctx, t, tint)}. */
(() => {
const {W, H, C, E, bg, grain, clamp, lerp, pr, env, rnd, hex, T, dot, path, travel, stamp, cap, cubic, blur, font} = KX.h;
const CH = window.CHARACTER, LIGHT = document.documentElement.classList.contains('light');
const MOOD = LIGHT ? CH.orb.moods_light : CH.orb.moods, ORB = Orb.create({seed: CH.orb.seed, spark: CH.orb.spark, paper: CH.orb.paper});
const DAY = MOOD.rest, DUSK = MOOD.watch, NIGHT = MOOD.solve, INK = C.white;
const SERIES = '__SERIES__', COUNT = __COUNT__, NAME = CH.display_name.toUpperCase();

/* ---------- the voice clock ---------- */
const V = window.VOICE, LINES = V.lines.map((l, i) => ({id: l.id || `l${i + 1}`, ...l}));
const LN = Object.fromEntries(LINES.map(l => [l.id, l]));
const S = id => LN[id].start, END = id => LN[id].end;
const WORDS = LINES.flatMap(l => l.words.map(w => ({t: w.t, e: w.e ?? w.t + .3})));
const LAST = LINES.at(-1), CLOSE = LAST.end + 1.4, DUR = +(LAST.end + 4.8).toFixed(2);   // = sound.json "tail": 4.8
const pulse = t => { let b = 0; for (const w of WORDS) { if (w.t > t) break; const up = clamp((t - w.t) / .08), down = t > w.e ? Math.exp(-(t - w.e) / .45) : 1;
  b = Math.max(b, up * down); } return .6 * b; };
const mixc = (a, b, p) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), k = s => Math.round(lerp(A >> s & 255, B >> s & 255, clamp(p)));
  return '#' + [16, 8, 0].map(s => k(s).toString(16).padStart(2, '0')).join(''); };

/* ---------- small drawings the episodes share ---------- */
const label = (ctx, s, x, y, a, o = {}) => T(ctx, s, x, y, {mono: 1, s: o.s || 17, ls: o.ls ?? 4, w: o.w || 500, c: o.c || C.steel, al: o.al || 'center', a});
const words = (ctx, s, x, y, a, o = {}) => T(ctx, s, x, y, {s: o.s || 30, w: o.w || 300, ls: o.ls ?? 1, c: o.c || INK, al: o.al || 'center', a, grad: o.grad});
function mask(ctx, x, y, s, rot, a, col = INK) {
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  ctx.beginPath(); ctx.moveTo(-s * .5, -s * .42); ctx.quadraticCurveTo(0, -s * .62, s * .5, -s * .42);
  ctx.quadraticCurveTo(s * .56, s * .3, 0, s * .62); ctx.quadraticCurveTo(-s * .56, s * .3, -s * .5, -s * .42); ctx.closePath();
  ctx.fillStyle = hex(C.night, .85); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
  ctx.lineWidth = 1.6;
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * s * .2, -s * .1, s * .11, s * .055, sx * .18, 0, 7); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, s * .16, s * .17, .25, Math.PI - .25); ctx.stroke();
  ctx.restore();
}
function sky(ctx, t, a, seed = 3, n = 140) {                        // a still field of stars that twinkle
  if (a <= 0) return; const r = rnd(seed);
  for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H * .78, s = .6 + r() * 1.6, ph = r() * 7, tw = .55 + .45 * Math.sin(t * (.6 + r()) + ph);
    ctx.save(); ctx.globalAlpha = a * tw * (.25 + .5 * r()); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); ctx.restore(); }
}
const typed = (s, t, a, cps = 26) => s.slice(0, Math.max(0, Math.floor((t - a) * cps)));
const clockAt = (t, [m0, m1]) => { const m = Math.floor(lerp(m0, m1, clamp(t / DUR))); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
