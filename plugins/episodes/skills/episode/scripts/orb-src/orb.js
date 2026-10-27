// The character's orb (aura shader + thinking-orbs constellation + the state's core), drawn into any 2D canvas as a pure
// function of time: same t, same frame. Bundled to ../orb.js (window.Orb) so pages load it as a classic script:
//   npx esbuild@0.24.0 orb-src/orb.js --bundle --format=iife --global-name=Orb --outfile=orb.js   (from scripts/)
//
//   const k = Orb.create({seed, spark});          seed and spark come from character.json → orb

//   k.draw(ctx, x, y, r, t, {state, from, mix, tint, pulse, wake, dark, dens})
//     state  'breathing' | 'searching' | 'solving' | 'listening' | 'connecting' | 'weaving' | 'composing' | 'shaping' | 'working'
//     from   previous state, cross-faded by mix (0 = from, 1 = state)       tint   hex, the mood color (character.json → orb.moods)
//     pulse  0..1 voice swell (feed it from voice.json word times)           wake   0..1 fades/grows him in
//     dark   true on dark backgrounds, false on paper                        dens   0..1 how many points he has gathered
import { MODE_FRAMES, resolvePreset, paintFrame, finalizeFrame } from "./thinking-orbs@0.3.2/engine.es.js";
import { Aura } from "./aura.js";
import { rgb } from "./color.js";

const BASE = 64, CALM = .38, PULSE_GAIN = .35;
const ENERGY = {breathing: .34, listening: .35, weaving: .36, composing: .36, connecting: .37, shaping: .37, working: .38, searching: .38, solving: .38};

const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
function constellation(n, k, seed) {
  const r = rnd(seed), pts = [], ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + .5) / n, rr = Math.sqrt(1 - y * y), a = i * ga; pts.push([Math.cos(a) * rr, y, Math.sin(a) * rr, r() * 6.283]); }
  const pairs = [], seen = new Set();
  pts.forEach((p, i) => { pts.map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, k)
    .forEach(([j]) => { const key = i < j ? i + "-" + j : j + "-" + i; if (!seen.has(key)) { seen.add(key); pairs.push([Math.min(i, j), Math.max(i, j), r() * 6.283]); } }); });
  return {pts, pairs};
}
function frame(C, t, energy, R, cx, cy) {
  const yaw = t * (.16 + .22 * energy), tilt = .42 + .12 * Math.sin(t * .13), cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
  const amp = .05 + .1 * energy, P = [], dots = [], lines = [];
  for (const [x0, y0, z0, ph] of C.pts) {
    const d = 1 + amp * (Math.sin(x0 * 3.1 + t * 1.05 + ph) + Math.sin(y0 * 4.3 - t * .83) + Math.sin(z0 * 5.2 + t * .61)) / 3;
    const x = x0 * d, y = y0 * d, z = z0 * d, x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y1 = y * ct - z1 * st, z2 = y * st + z1 * ct;
    const f = 3.2 / (3.2 - z2), depth = (z2 + 1) / 2;
    P.push([cx + x1 * R * f, cy + y1 * R * f, depth]);
    dots.push({x: cx + x1 * R * f, y: cy + y1 * R * f, z: depth, r: (.35 + .75 * depth) * (.8 + .3 * energy), white: .6 * (1 - depth), a: .2 + .8 * depth * depth});
  }
  for (const [i, j, ph] of C.pairs) { const a = P[i], b = P[j], dep = (a[2] + b[2]) / 2, tw = .55 + .45 * Math.sin(t * (1.2 + energy) + ph);
    const al = (.05 + .42 * dep * dep) * tw * (.55 + .6 * energy); if (al < .03) continue;
    lines.push({x1: a[0], y1: a[1], x2: b[0], y2: b[1], white: .55 * (1 - dep), a: al, w: .18 + .22 * dep}); }
  return finalizeFrame(dots, lines);
}

export function create({seed = 7, spark = "#FF8A29", paper = "#FF9E61"} = {}) {     // spark: the warm light on the aura's rim; paper: the orb's ink on the light theme
  const off = document.createElement("canvas"), o = off.getContext("2d"), cons = {}, speed = resolvePreset("breathing", BASE).speed;
  const get = n => cons[n] || (cons[n] = constellation(n, 3, seed * 7919 + n));
  return {draw(ctx, x, y, r, t, {state = "breathing", from = null, mix = 1, tint = "#FFFFFF", pulse = 0, wake = 1, dark = true, dens = 1} = {}) {
    const px = Math.max(8, Math.round(r * 2 * Math.min(2, devicePixelRatio || 1)));
    if (off.width !== px || off.height !== px) { off.width = off.height = px; }
    const c = rgb(tint), p = Math.min(1, pulse) * PULSE_GAIN, en = Math.min(CALM, ENERGY[state] ?? .35), clock = t * speed * (1 + .05 * p);
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, px, px);
    if (Aura) Aura.render(o, px, {t: t + seed, energy: Math.min(CALM + .06, en * (.4 + .6 * wake) + .16 * p), seed, dark, tint: c, spark: rgb(dark ? spark : paper)});
    if (wake < 1) { o.globalCompositeOperation = "destination-in"; o.fillStyle = `rgba(0,0,0,${wake})`; o.fillRect(0, 0, px, px); o.globalCompositeOperation = "source-over"; }
    const breath = 1 + .025 * Math.sin(t * (.7 + .5 * en)) * (.6 + en) + .03 * p, grow = .55 + .45 * wake, s = px / BASE * .86 * breath * grow, sh = px * (1 - .86 * breath * grow) / 2;
    o.setTransform(s, 0, 0, s, sh, sh);
    const light = v => Math.round(Math.min(255, v * .35 + 255 * .65)), dot = dark ? {r: light(c.r), g: light(c.g), b: light(c.b)} : c;
    const full = r * 2 > 260 ? 110 : r * 2 > 150 ? 80 : 48, n = Math.max(12, Math.round((18 + (full - 18) * dens) / 4) * 4);
    o.globalAlpha = wake; paintFrame(o, frame(get(n), clock * .8 + seed, Math.min(CALM + .06, en + .14 * p), BASE * .43, BASE / 2, BASE / 2), dark, dot);
    const cs = .58, co = BASE * (1 - cs) / 2; o.transform(cs, 0, 0, cs, co, co);
    const core = st => { const {mode, opts} = resolvePreset(st, BASE); return MODE_FRAMES[mode](BASE, clock, opts); };
    if (from && mix < 1) { o.globalAlpha = (1 - mix) * wake * .7; paintFrame(o, core(from), dark, dot); }
    o.globalAlpha = (from && mix < 1 ? mix : 1) * wake * .7; paintFrame(o, core(state), dark, dot); o.globalAlpha = 1;
    ctx.drawImage(off, x - r, y - r, r * 2, r * 2);
  }};
}
