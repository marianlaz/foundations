/* motion-scenes engine: scenes drawn in code, mounted on <canvas data-kx="name"> or painted by an episode page (EP.seek).
   Every frame is a pure function of time (scene.draw(ctx, t)), drawn in a W×H logical space: window.KX_SIZE = [w, h] before
   loading (default 1600×1000; 4:5 = [1080, 1350]), or KX.size(w, h) before the scenes load.
   Scenes live in their own file and register with KX.scene(name, {D, poster, label, col, draw, light, once, custom, hud, bg}):
   once clamps time instead of looping, custom: true draws its own bg and HUD, hud: false drops the HUD, bg/hud: own functions.
   Brand: KX.theme({name, colors, light, gradient, sans, body, mono}) before the scenes draw (the episode page passes character.json).
   The grammar comes from code-drawn motion pieces: HUD chrome with a timecode, captions that land
   word by word with one accent word, glowing pulses along paths, ticking counters, stamps and grain.
   Plays only while on screen and restarts on entry; reduced motion shows one still (scene.poster).
   ?kxt=<seconds> freezes every scene at that time (handy for screenshots). */
(() => {
let [W, H] = window.KX_SIZE || [1600, 1000];
const C = {night:'#08070E', card:'#0D0B18', card2:'#131126', rule:'#24213C', steel:'#7D91B0', ice:'#B0D1FF', text:'#C9CFE0',
  white:'#FFFFFF', violet:'#8B5CF6', lav:'#A78BFA', pink:'#FF00A1', red:'#FF3E60', orange:'#FF6447', amber:'#FBB040',
  green:'#34D399', teal:'#2DD4BF', blue:'#60A5FA'};
const F = {sans: '"Plus Jakarta Sans",system-ui,-apple-system,sans-serif', body: 'Inter,system-ui,sans-serif', mono: '"JetBrains Mono",ui-monospace,Menlo,monospace'};

/* ---------- time ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  lin: p => p,
  out: p => 1 - Math.pow(1 - p, 3),
  expo: p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p),
  io: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  back: p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
};
const pr = (t, a, b, e = E.out) => e(clamp((t - a) / (b - a)));           // progress inside [a, b]
const env = (t, a, b, i = .45, o = .45) => Math.min(pr(t, a, a + i), 1 - pr(t, b - o, b, E.io)); // in, hold, out
const rnd = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed);
  x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };

/* ---------- paint ---------- */
const hex = (h, a = 1) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
let FILTER = null;
const blur = (ctx, px) => { if (FILTER === null) FILTER = typeof ctx.filter === 'string'; if (FILTER) ctx.filter = px > .3 ? `blur(${px.toFixed(1)}px)` : 'none'; };
const GRAD = {dark: null, light: null}, LIT = {on: false};                    // the accent-word gradient (theme), per palette
function grad(ctx, x, w) { const g = ctx.createLinearGradient(x, 0, x + w, 0), s = (LIT.on && GRAD.light) || GRAD.dark || [C.pink, C.red, C.orange];
  g.addColorStop(0, s[0]); g.addColorStop(.28, s[1]); g.addColorStop(1, s[2]); return g; }
let VIEW = 1;                                                                // on-screen px per logical px, set per canvas before each frame
// On narrow screens small mono labels would shrink to ~3 px: give them a legible floor (max ×1.6 so layouts hold).
const legible = (s, floor, cap) => VIEW >= .6 ? s : Math.min(s * cap, Math.max(s, floor / VIEW));
function font(ctx, o) { const s = o.mono ? legible(o.s || 26, 8.5, 1.6) : (o.s || 26);
  ctx.font = `${o.w || 500} ${s}px ${o.mono ? F.mono : o.body ? F.body : F.sans}`; if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px'; }
function T(ctx, s, x, y, o = {}) {
  if ((o.a ?? 1) <= 0) return 0;
  ctx.save(); ctx.globalAlpha *= o.a ?? 1; font(ctx, o);
  ctx.textAlign = o.al || 'left'; ctx.textBaseline = o.bl || 'alphabetic';
  const w = ctx.measureText(s).width;
  ctx.fillStyle = o.grad ? grad(ctx, o.al === 'center' ? x - w / 2 : o.al === 'right' ? x - w : x, w) : (o.c || C.white);
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 18; }
  ctx.fillText(s, x, y); ctx.restore(); return w;
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function card(ctx, x, y, w, h, o = {}) {
  if ((o.a ?? 1) <= 0) return;
  ctx.save(); ctx.globalAlpha *= o.a ?? 1; rr(ctx, x, y, w, h, o.r ?? 14);
  ctx.fillStyle = o.fill || C.card; ctx.fill();
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.lineWidth = o.lw || 1.5; ctx.strokeStyle = o.stroke || C.rule;
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.gb || 28; ctx.strokeStyle = o.glow; }
  ctx.stroke(); ctx.restore();
}
function dot(ctx, x, y, r, col, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4); g.addColorStop(0, hex(col, .55)); g.addColorStop(1, hex(col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * .55, 0, 7); ctx.fill();
  ctx.fillStyle = col; ctx.globalAlpha *= .9; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
}
const cubic = (a, b, c, d, u) => { const v = 1 - u; return [0, 1].map(k => v * v * v * a[k] + 3 * v * v * u * b[k] + 3 * v * u * u * c[k] + u * u * u * d[k]); };
function path(ctx, P, u0, u1, col, o = {}) {                                // part of a cubic, drawn on
  if (u1 <= u0) return;
  ctx.save(); ctx.globalAlpha *= o.a ?? 1; ctx.beginPath();
  for (let i = 0; i <= 48; i++) { const [x, y] = cubic(...P, lerp(u0, u1, i / 48)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.lineWidth = o.lw || 2; ctx.strokeStyle = col; ctx.lineCap = 'round';
  if (o.glow) { ctx.shadowColor = col; ctx.shadowBlur = 16; }
  ctx.stroke(); ctx.restore();
}
const bez = (a, d, bend = .45, vert = false) => vert
  ? [a, [a[0], lerp(a[1], d[1], bend)], [d[0], lerp(d[1], a[1], bend)], d]
  : [a, [lerp(a[0], d[0], bend), a[1]], [lerp(d[0], a[0], bend), d[1]], d];
function travel(ctx, P, t, a, b, col, o = {}) {                            // one pulse along P during [a, b]
  const u = (t - a) / (b - a); if (u < 0 || u > 1) return;
  const e = E.io(u), tail = o.tail ?? .22;
  path(ctx, P, Math.max(0, e - tail), e, hex(col, .8), {lw: o.lw || 3, glow: 1, a: Math.sin(Math.PI * Math.min(1, u * 1.2)) });
  const [x, y] = cubic(...P, e); dot(ctx, x, y, o.r || 6, col);
}
function orb(ctx, x, y, r, t, col = C.violet, o = {}) {
  const a = o.a ?? 1; if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  let g = ctx.createRadialGradient(x, y, r * .3, x, y, r * 2.8); g.addColorStop(0, hex(col, .42 * (o.glow ?? 1))); g.addColorStop(1, hex(col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.8, 0, 7); ctx.fill();
  const R = r * (1 + .035 * Math.sin(t * 2.2));
  g = ctx.createRadialGradient(x - R * .35, y - R * .42, R * .04, x, y, R);
  g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.28, hex(col, .95)); g.addColorStop(.82, hex(col, .5)); g.addColorStop(1, hex(col, .15));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = Math.max(1, r / 40);
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x, y, R * .95, R * (.25 + .15 * i), t * (.35 + i * .17) + i * 2, 0, 7); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = hex(col, .9); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.stroke();
  ctx.restore();
}
function stamp(ctx, s, x, y, p, col, rot = -.1) {                          // slams in with overshoot
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const k = lerp(2.2, 1, E.back(clamp(p)));
  ctx.scale(k, k); ctx.globalAlpha *= clamp(p * 2.5);
  font(ctx, {mono: 1, w: 700, s: 22, ls: 3}); const w = ctx.measureText(s).width + 36;
  rr(ctx, -w / 2, -24, w, 48, 8); ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
  rr(ctx, -w / 2 + 5, -19, w - 10, 38, 5); ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, 0, 1);
  ctx.restore();
}
function kv(ctx, rows, x, y, t0, t, o = {}) {                              // mono key/value rows, typed in
  rows.forEach(([k, v, c], i) => {
    const p = pr(t, t0 + i * .16, t0 + i * .16 + .5, E.expo);
    T(ctx, k, x, y + i * (o.lh || 34), {mono: 1, s: o.s || 17, c: C.lav, a: p});
    const n = Math.round(v.length * pr(t, t0 + i * .16 + .1, t0 + i * .16 + .6, E.lin));
    T(ctx, v.slice(0, n), x + (o.kw || 130), y + i * (o.lh || 34), {mono: 1, s: o.s || 17, c: c || C.text, a: p});
  });
}
let GRAIN;
function grain(ctx, t) {
  if (!GRAIN) { const g = document.createElement('canvas'); g.width = g.height = 180; const x = g.getContext('2d'), d = x.createImageData(180, 180), r = rnd(7);
    for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); GRAIN = ctx.createPattern(g, 'repeat'); }
  const f = Math.floor(t * 18); ctx.save(); ctx.globalAlpha = .045; ctx.globalCompositeOperation = 'overlay';
  ctx.translate((f * 37) % 180, (f * 61) % 180); ctx.fillStyle = GRAIN; ctx.fillRect(-180, -180, W + 360, H + 360); ctx.restore();
}
function bg(ctx, t, col) {
  ctx.fillStyle = C.night; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * (.6 + .05 * Math.sin(t * .3)), H * .42, 0, W * .6, H * .42, W * .7);
  g.addColorStop(0, hex(col, .13)); g.addColorStop(1, hex(col, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.strokeStyle = 'rgba(125,145,176,.05)'; ctx.lineWidth = 1;          // faint blueprint grid
  for (let x = 0; x <= W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}
// Light variant of any dark scene: the same drawing with an equivalent light palette (ink text, white cards, deeper accents).
const DARK = {...C}, LIGHT = {night: '#F7F8FE', card: '#FFFFFF', card2: '#F1F3FB', rule: '#D3D9EE', steel: '#5E6F8C', ice: '#3B6FD8', text: '#3B4256',
  white: '#0B0A14', lav: '#7C3AED', amber: '#D97706', green: '#16A34A', teal: '#0D9488', blue: '#2563EB'};
function bgLight(ctx, t, col) {                                              // light scenes (the deep dive on white): paper, a violet haze, a faint grid
  ctx.fillStyle = LIGHT.night; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * (.62 + .05 * Math.sin(t * .3)), H * .4, 0, W * .6, H * .4, W * .7);
  g.addColorStop(0, hex(col, .08)); g.addColorStop(1, hex(col, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.strokeStyle = 'rgba(94,111,140,.07)'; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}
function hud(ctx, t, label, light) {                                         // label: string, or {left, right} (no timecode)
  if (label && typeof label === 'object') {
    if (label.left) T(ctx, label.left, 64, 86, {mono: 1, w: 600, s: 20, c: C.steel, ls: 2, a: .85});
    if (label.right) T(ctx, label.right, W - 64, 86, {mono: 1, w: 500, s: 20, c: C.steel, al: 'right', ls: 2, a: .85});
    return;
  }
  const m = 34, l = 26; ctx.save(); ctx.strokeStyle = light ? 'rgba(94,111,140,.4)' : 'rgba(176,209,255,.32)'; ctx.lineWidth = 2;
  [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(x, y + l * sy); ctx.lineTo(x, y); ctx.lineTo(x + l * sx, y); ctx.stroke(); });
  ctx.restore();
  T(ctx, label, m + 22, m + 34, {mono: 1, s: 15, c: light ? LIGHT.steel : C.steel, ls: 1});
  const s = String(Math.floor(t / 60)).padStart(2, '0') + ':' + (t % 60).toFixed(2).padStart(5, '0');
  dot(ctx, W - m - 214, m + 29, 3.5, C.red, .5 + .5 * Math.sin(t * 5));
  T(ctx, `${BRAND.name}  ${s}`, W - m - 22, m + 34, {mono: 1, s: 15, c: light ? LIGHT.steel : C.steel, al: 'right', ls: 1});
}
/* caption: words land one by one (blur + rise); **x** is the accent word */
function cap(ctx, t, a, b, text, o = {}) {
  if (t < a || t > b) return;
  const s = legible(o.s || 42, 15, 1.9), x0 = o.x ?? 74, y = o.y ?? 930, fo = {s, w: o.w || 600, ls: o.ls ?? -.4};
  const words = []; text.split('**').forEach((part, i) => part.split(/(?<= )/).forEach(w => w && words.push([w, i % 2])));
  ctx.save(); font(ctx, fo);
  const ws = words.map(([w]) => ctx.measureText(w).width), max = o.al === 'center' ? W - 128 : W - 2 * Math.min(x0, W - x0) - 20;
  const lines = [[]]; let lw = 0;                                            // wrap when it doesn't fit (narrow screens)
  ws.forEach((w, i) => { if (lw + w > max && lines.at(-1).length) { lines.push([]); lw = 0; } lines.at(-1).push(i); lw += w; });
  const out = pr(t, b - .5, b, E.io);
  lines.forEach((ln, L) => {
    const total = ln.reduce((p, i) => p + ws[i], 0), ly = y - (lines.length - 1 - L) * s * 1.12;
    let x = o.al === 'center' ? x0 - total / 2 : x0;
    ln.forEach(i => { const [w, em] = words[i], p = pr(t, a + i * .07, a + i * .07 + .7, E.expo);
      ctx.save(); ctx.globalAlpha = p * (1 - out); blur(ctx, (1 - p) * 9 + out * 6);
      font(ctx, fo); ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = em ? grad(ctx, x, ws[i]) : (o.c || C.white);
      ctx.fillText(w, x, ly + (1 - p) * 20 - out * 12); ctx.restore(); x += ws[i]; });
  });
  blur(ctx, 0); ctx.restore();
}
const BRAND = {name: 'MOTION'};
const fmt = n => Math.round(n).toLocaleString('en');

const S = {};

/* ================= mounting ================= */
const FROZEN = (() => { try { const v = new URLSearchParams(location.search).get('kxt'); return v === null ? null : +v; } catch { return null; } })();
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
function mount(cv) {
  const sc = S[cv.dataset.kx]; if (!sc || cv.kx) return;
  const ctx = cv.getContext('2d'); let t = FROZEN ?? (REDUCED ? sc.poster : 0), last = 0, on = false, paused = false;
  const fit = () => { const w = cv.clientWidth || 800, d = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(w * d); cv.height = Math.round(w * H / W * d); paint(); };
  const paint = () => { if (!cv.width) return; ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); VIEW = (cv.clientWidth || W) / W;
    const tt = sc.once ? clamp(t, 0, sc.D) : ((t % sc.D) + sc.D) % sc.D, th = cv.dataset.kxTheme;
    const light = sc.light || th === 'light' || (th === 'auto' && document.body.classList.contains('tone-light')), swap = light && !sc.light;
    if (swap) Object.assign(C, LIGHT); LIT.on = light;
    const back = sc.custom ? null : sc.bg || (light ? bgLight : bg), chrome = sc.custom || sc.hud === false ? null : sc.hud || hud;
    try { back && back(ctx, tt, sc.col); sc.draw(ctx, tt); chrome && chrome(ctx, tt, sc.label, light); grain(ctx, tt); }
    finally { if (swap) Object.assign(C, DARK); LIT.on = false; }
    cv.dispatchEvent(new CustomEvent('kx:frame', {detail: {t: tt, D: sc.D}})); };
  const loop = now => { if (!on || paused) return; t += Math.min(.05, (now - last) / 1000); last = now; paint(); requestAnimationFrame(loop); };
  const play = () => { if (on && !paused) { last = performance.now(); requestAnimationFrame(loop); } };
  cv.kx = {D: sc.D, paint, seek(x) { t = x; paint(); }, pause(v) { paused = v; play(); }, get paused() { return paused; }, restart() { t = 0; paint(); }};
  new ResizeObserver(fit).observe(cv);
  if (FROZEN !== null || REDUCED) return;
  new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting;
    if (on && !was) { if (!cv.hasAttribute('data-kx-keep')) t = 0; play(); } }, {threshold: .35}).observe(cv);
}
const all = () => document.querySelectorAll('canvas[data-kx]').forEach(mount);
const scene = (name, def) => { S[name] = def; document.querySelectorAll(`canvas[data-kx="${name}"]`).forEach(mount); };
// light: the palette for light scenes and ?theme=light pages; KX.light(true) switches a page to it (EP pages paint without mount)
const theme = ({colors, light, gradient, sans, body, mono, name} = {}) => { Object.assign(C, colors || {}); Object.assign(DARK, colors || {});
  Object.assign(LIGHT, light || {}); if (gradient) Object.assign(GRAD, gradient); if (sans) F.sans = sans; if (body) F.body = body; if (mono) F.mono = mono; if (name) BRAND.name = name; };
const setLight = on => { Object.assign(C, on ? LIGHT : DARK); LIT.on = on; };
const size = (w, hh) => { W = w; H = hh; h.W = w; h.H = hh; };
// helpers for scene files: const {W, H, C, E, pr, env, T, card, ...} = KX.h;
const h = {W, H, C, F, E, BRAND, bg, bgLight, hud, grain, legible, clamp, lerp, pr, env, rnd, hex, blur, grad, font, T, rr, card, dot, cubic, path, bez, travel, orb, stamp, kv, cap, fmt};
window.KX = {scenes: S, scene, theme, light: setLight, size, mount, all, h};
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { all(); document.querySelectorAll('canvas[data-kx]').forEach(c => c.kx && c.kx.paint()); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
})();
