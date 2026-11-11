/* Carpincho y el Akasha · motion engine (adapted from the motion-scenes skill engine).
   Every frame is a pure function of time (scene.draw(ctx, t)) in a 1600×1000 logical space.
   Scenes register with KX.scene(name, {D, poster, label, hot, draw}). The engine paints the cobalt night,
   the honeycomb and the accent haze behind them; then either the HUD + grain (gallery) or, with
   data-kx-integrated, an alpha vignette so the scene dissolves into the page, and the captions last.
   Plays only while on screen and restarts on entry; reduced motion shows one still (scene.poster).
   ?kxt=<seconds> freezes every scene at that time (screenshots). */
(() => {
const W = 1600, H = 1000;
const C = {night: '#0B0E6B', deep: '#070948', cobalt: '#1A1FD0', royal: '#2B36F2', card: '#0E127E', card2: '#151BA6', rule: '#3B46E0',
  steel: '#8E9BFF', ice: '#CFE0FF', text: '#DCE3FF', white: '#FFFFFF', mint: '#5FF0D0', aqua: '#7FE9FF', teal: '#2FC4B2',
  orange: '#FF7A3D', coral: '#FF5B4E', amber: '#FFB547', plum: '#8E2F6E', violet: '#7B6CFF', lav: '#AEB8FF'};
const STORY = window.STORY || {}, SC = STORY.scenes || {};
Object.assign(C, STORY.palette || {});                                         // the story's palette, from config.js
const flagOf = (name, k) => ((SC[name] || {})[k] ?? (SC.default || {})[k] ?? true);
let CUR = '', CHAR = 'karpincho', SEED = 4062;                              // the illustration being painted, its character, its seed
const flag = k => flagOf(CUR, k);
const F = {sans: '"Inter",system-ui,-apple-system,sans-serif', mono: '"IBM Plex Mono",ui-monospace,Menlo,monospace',
  serif: '"Newsreader","Iowan Old Style",Georgia,serif', cap: '"Cormorant Garamond",Georgia,serif'};

/* ---------- time ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  lin: p => p,
  out: p => 1 - Math.pow(1 - p, 3),
  expo: p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p),
  io: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  sine: p => .5 - .5 * Math.cos(Math.PI * p),
  back: p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
};
const pr = (t, a, b, e = E.out) => e(clamp((t - a) / (b - a)));
const env = (t, a, b, i = .45, o = .45) => Math.min(pr(t, a, a + i), 1 - pr(t, b - o, b, E.io));
const rnd = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed);
  x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };

/* ---------- paint ---------- */
const hex = (h, a = 1) => { if (h[0] !== '#') return h; const n = parseInt(h.slice(1, 7), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
let FILTER = null;
const blur = (ctx, px) => { if (FILTER === null) FILTER = typeof ctx.filter === 'string'; if (FILTER) ctx.filter = px > .3 ? `blur(${px.toFixed(1)}px)` : 'none'; };
function grad(ctx, x, w) { const g = ctx.createLinearGradient(x, 0, x + w, 0);   // the accent: mint light
  g.addColorStop(0, '#5FF0D0'); g.addColorStop(.55, '#9DFBEA'); g.addColorStop(1, '#D8FFF7'); return g; }
let VIEW = 1, INTEG = false, FLUSH = false, CAPQ = [];
let V = {x0: 0, y0: 0, x1: W, y1: H, w: W, h: H};                              // the visible logical rect (cover-fit scenes see more or less than 1600×1000)
const legible = (s, floor, cap) => VIEW >= .6 ? s : Math.min(s * cap, Math.max(s, floor / VIEW));
// one voice: Cormorant for words, Plex Mono for marks
function font(ctx, o) { const s = o.mono ? legible(o.s || 26, 8.5, 1.6) : (o.s || 26);
  ctx.font = `${o.it ? 'italic ' : ''}${o.mono ? (o.w || 500) : (o.w || 500) >= 600 ? 500 : 400} ${o.mono ? s : s * 1.12}px ${o.mono ? F.mono : F.cap}`; if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px'; }
function T(ctx, s, x, y, o = {}) {
  if ((o.a ?? 1) <= 0 || (o.lab && !flag('labels'))) return 0;      // o.lab: a label, silenced by the labels flag
  ctx.save(); ctx.globalAlpha *= o.a ?? 1; font(ctx, o);
  ctx.textAlign = o.al || 'left'; ctx.textBaseline = o.bl || 'alphabetic';
  const w = ctx.measureText(s).width;
  ctx.fillStyle = o.grad ? grad(ctx, o.al === 'center' ? x - w / 2 : o.al === 'right' ? x - w : x, w) : (o.c || C.white);
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.gb || 18; }
  ctx.fillText(s, x, y); ctx.restore(); return w;
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function card(ctx, x, y, w, h, o = {}) {
  if ((o.a ?? 1) <= 0) return;
  ctx.save(); ctx.globalAlpha *= o.a ?? 1; rr(ctx, x, y, w, h, o.r ?? 14);
  ctx.fillStyle = o.fill || hex(C.deep, .72); ctx.fill();
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.lineWidth = o.lw || 1.5; ctx.strokeStyle = o.stroke || hex(C.lav, .22);
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.gb || 28; ctx.strokeStyle = o.glow; }
  ctx.stroke(); ctx.restore();
}
// Soft light as cached sprites (drawImage + globalAlpha), never per-frame gradients on big areas.
const SOFT = {};
const sprite = (key, n, fn) => SOFT[key] || (SOFT[key] = (() => { const c = document.createElement('canvas'); c.width = c.height = n; fn(c.getContext('2d'), n); return c; })());
// physical falloff exp(-k·r) under a smooth window, dithered so a dim halo scaled up shows no bands
const halo = (col, k = 5, n = 256) => sprite(`h${col}|${k}|${n}`, n, (x) => {
  const im = x.createImageData(n, n), d = im.data, v = parseInt(col.slice(1, 7), 16), h = n / 2; let s = 7;
  for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) { const r = Math.hypot(i + .5 - h, y + .5 - h) / h, f = r >= 1 ? 0 : Math.exp(-k * r) * (1 - r * r) * (1 - r * r), o = (y * n + i) * 4;
    s = (s * 16807) % 2147483647; d[o] = v >> 16 & 255; d[o + 1] = v >> 8 & 255; d[o + 2] = v & 255; d[o + 3] = clamp(Math.round(f * 255 + s / 2147483647 - .5), 0, 255); }
  x.putImageData(im, 0, 0); });
const spark = col => sprite('s' + col, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.16, hex(col, .95)); g.addColorStop(.42, hex(col, .25)); g.addColorStop(1, hex(col, 0)); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
const ringS = col => sprite('r' + col, 256, (x) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);   // a wave of energy, not a stroked circle
  g.addColorStop(0, hex(col, 0)); g.addColorStop(.86, hex(col, 0)); g.addColorStop(.95, hex(col, .9)); g.addColorStop(.975, hex(col, .25)); g.addColorStop(1, hex(col, 0)); x.fillStyle = g; x.fillRect(0, 0, 256, 256); });
const blit = (ctx, img, x, y, r, a, ry = r) => { if (a <= 0 || !(r > 0)) return; const g0 = ctx.globalAlpha; ctx.globalAlpha = g0 * Math.min(1, a); ctx.drawImage(img, x - r, y - ry, r * 2, ry * 2); ctx.globalAlpha = g0; };
function dot(ctx, x, y, r, col, a = 1) {
  if (a <= 0) return;
  blit(ctx, spark(col), x, y, r * 4, a);
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * .5, 0, 7); ctx.fill(); ctx.restore();
}
const cubic = (a, b, c, d, u) => { const v = 1 - u; return [0, 1].map(k => v * v * v * a[k] + 3 * v * v * u * b[k] + 3 * v * u * u * c[k] + u * u * u * d[k]); };
function path(ctx, P, u0, u1, col, o = {}) {
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
function travel(ctx, P, t, a, b, col, o = {}) {
  const u = (t - a) / (b - a); if (u < 0 || u > 1) return;
  const e = (o.ease || E.io)(u), tail = o.tail ?? .22, fa = Math.sin(Math.PI * Math.min(1, u * 1.2)) * (o.a ?? 1);
  path(ctx, P, Math.max(0, e - tail), e, hex(col, .8), {lw: o.lw || 3, glow: 1, a: fa});
  const [x, y] = cubic(...P, e); dot(ctx, x, y, o.r || 6, col, fa);
}
function stamp(ctx, s, x, y, p, col, rot = -.06) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const k = lerp(2.2, 1, E.back(clamp(p)));
  ctx.scale(k, k); ctx.globalAlpha *= clamp(p * 2.5);
  font(ctx, {mono: 1, w: 700, s: 20, ls: 3}); const w = ctx.measureText(s).width + 34;
  rr(ctx, -w / 2, -22, w, 44, 8); ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, 0, 1);
  ctx.restore();
}
let GRAIN;
function grain(ctx, t) {
  if (!GRAIN) { const g = document.createElement('canvas'); g.width = g.height = 180; const x = g.getContext('2d'), d = x.createImageData(180, 180), r = rnd(7);
    for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); GRAIN = ctx.createPattern(g, 'repeat'); }
  const f = Math.floor(t * 18); ctx.save(); ctx.globalAlpha = .04; ctx.globalCompositeOperation = 'overlay';
  ctx.translate((f * 37) % 180, (f * 61) % 180); ctx.fillStyle = GRAIN; ctx.fillRect(-180, -180, W + 360, H + 360); ctx.restore();
}

/* ---------- the night: cobalt, honeycomb, the accent haze ---------- */
// The honeycomb is a pointy-top hex grid drawn through a gentle warp (cells grow to the right, like the wallpaper's
// perspective), cached once. Vertices are shared, so the warp keeps the tiling.
const warp = (x, y) => { const u = clamp(x / W, -.2, 1.2); return [W * (.06 + .94 * Math.pow(Math.max(0, u + .06) / 1.06, 1.25)), H * .55 + (y - H * .55) * (.82 + .45 * u)]; };
let COMB = null;
function comb() {
  if (COMB) return COMB;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), R = 88, w = Math.sqrt(3) * R;
  x.strokeStyle = 'rgba(150,175,255,1)'; x.lineWidth = 2.2; x.lineJoin = 'round'; x.beginPath();
  for (let row = -2; row < 14; row++) for (let col = -2; col < 14; col++) {
    const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * R * 1.5;
    for (let k = 0; k <= 6; k++) { const an = Math.PI / 3 * k - Math.PI / 2, [px, py] = warp(cx + R * Math.cos(an), cy + R * Math.sin(an)); k ? x.lineTo(px, py) : x.moveTo(px, py); }
  }
  x.stroke();
  x.globalCompositeOperation = 'destination-in';                               // brighter toward the light on the right, fading left
  const g = x.createRadialGradient(W * .8, H * .38, 0, W * .8, H * .38, W * .95); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,.12)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return COMB = c;
}
let SKY = null;
function sky() {
  if (SKY) return SKY;
  const c = document.createElement('canvas'); c.width = 400; c.height = 250; const x = c.getContext('2d');
  const sk = C.sky || ['#080A55', '#1015A8', '#1A20CC'];
  let g = x.createLinearGradient(0, 250, 400, 0); g.addColorStop(0, sk[0]); g.addColorStop(.5, sk[1]); g.addColorStop(1, sk[2]);
  x.fillStyle = g; x.fillRect(0, 0, 400, 250);
  g = x.createRadialGradient(330, 90, 0, 330, 90, 300); g.addColorStop(0, 'rgba(70,90,190,.4)'); g.addColorStop(1, 'rgba(40,70,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 400, 250);
  g = x.createRadialGradient(40, 240, 0, 40, 240, 260); g.addColorStop(0, 'rgba(5,6,50,.75)'); g.addColorStop(1, 'rgba(5,6,50,0)'); x.fillStyle = g; x.fillRect(0, 0, 400, 250);
  return SKY = c;
}
function bg(ctx, t, sc) {
  ctx.drawImage(sky(), V.x0, V.y0, V.w, V.h);
  const night = sc.night ?? 0;                                                // a scene may sink deeper (space, the Akasha)
  if (night > 0) { ctx.save(); ctx.globalAlpha = night; ctx.fillStyle = '#05063A'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const ca = typeof sc.comb === 'function' ? sc.comb(t) : (sc.comb ?? .22);
  if (ca > 0) { ctx.save(); ctx.globalAlpha = ca; ctx.drawImage(comb(), 0, 0); ctx.restore(); }
  const [hx, hy] = sc.hot || [W * .8, H * .38], ha = typeof sc.haze === 'function' ? sc.haze(t) : (sc.haze ?? .22);
  if (ha > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3.2), hx + 20 * Math.sin(t * .3), hy, W * .42, .7 * ha * (.9 + .1 * Math.sin(t * .8))); ctx.restore(); }
}
function hud(ctx, t, label) {
  const m = 34, l = 24; ctx.save(); ctx.strokeStyle = 'rgba(207,224,255,.28)'; ctx.lineWidth = 2;
  [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(x, y + l * sy); ctx.lineTo(x, y); ctx.lineTo(x + l * sx, y); ctx.stroke(); });
  ctx.restore();
  T(ctx, label, m + 22, m + 34, {mono: 1, s: 15, c: C.steel, ls: 1});
  const s = t.toFixed(2).padStart(5, '0');
  dot(ctx, W - m - 250, m + 29, 3.2, C.orange, .5 + .5 * Math.sin(t * 5));
  T(ctx, `${CHAR === 'both' ? 'GORDO + KARPINCHO' : CHAR.toUpperCase()}  00:${s}`, W - m - 22, m + 34, {mono: 1, s: 15, c: C.steel, al: 'right', ls: 1});
}
let VMASK = null;
function vignette(ctx) {                                                      // only the outer margin dissolves into the page
  if (!VMASK) { VMASK = document.createElement('canvas'); VMASK.width = 400; VMASK.height = 250; const x = VMASK.getContext('2d');
    let g = x.createLinearGradient(0, 0, 400, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.09, 'rgba(0,0,0,1)'); g.addColorStop(.91, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 400, 250);
    x.globalCompositeOperation = 'destination-in'; g = x.createLinearGradient(0, 0, 0, 250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.11, 'rgba(0,0,0,1)'); g.addColorStop(.89, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 400, 250); }
  ctx.save(); ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(VMASK, 0, 0, W, H); ctx.restore();
}
/* caption: words land one by one (blur + rise); **x** is the accent word. Integrated: queued and drawn after the vignette. */
function cap(ctx, t, a, b, text, o = {}) {
  if (t < a || t > b || !flag('captions')) return;                          // the captions flag, per illustration
  if (INTEG && !FLUSH) { CAPQ.push([t, a, b, text, o]); return; }
  const s = legible(o.s || (STORY.caption || {}).size || 50, 20, 2.2), x0 = o.x ?? 800, y = o.y ?? 918;                 // the hero's voice: Cormorant, light; the accent in italic
  const capFont = it => { ctx.font = `${it ? 'italic 400' : '300'} ${s}px ${F.cap}`; if ('letterSpacing' in ctx) ctx.letterSpacing = '.2px'; };
  const al = o.al || 'center';
  const words = []; text.split('**').forEach((part, i) => part.split(/(?<= )/).forEach(w => w && words.push([w, i % 2])));
  ctx.save();
  const ws = words.map(([w, em]) => (capFont(em), ctx.measureText(w).width)), max = al === 'center' ? W - 200 : W - 2 * Math.min(x0, W - x0) - 20;
  const lines = [[]]; let lw = 0;
  ws.forEach((w, i) => { if (lw + w > max && lines.at(-1).length) { lines.push([]); lw = 0; } lines.at(-1).push(i); lw += w; });
  const out = pr(t, b - .5, b, E.io);
  lines.forEach((ln, L) => {
    const total = ln.reduce((p, i) => p + ws[i], 0), ly = y - (lines.length - 1 - L) * s * 1.22;
    let x = al === 'center' ? x0 - total / 2 : x0;
    ln.forEach(i => { const [w, em] = words[i], p = pr(t, a + i * .11, a + i * .11 + 1.1, E.out);      // unhurried, word after word
      ctx.save(); ctx.globalAlpha = p * (1 - out); blur(ctx, (1 - p) * 9 + out * 6);
      capFont(em); ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(4,5,40,.75)'; ctx.shadowBlur = 18;                // a breath of night under the words, so they read over light
      ctx.fillStyle = em ? '#A9F2DF' : (o.c || '#F1EEE6');
      ctx.fillText(w, x, ly + (1 - p) * 10 - out * 6); ctx.restore(); x += ws[i]; });
  });
  blur(ctx, 0); ctx.restore();
}
const fmt = n => Math.round(n).toLocaleString('es-AR');

const S = {};

/* ================= mounting ================= */
const FROZEN = (() => { try { const v = new URLSearchParams(location.search).get('kxt'); return v === null ? null : +v; } catch { return null; } })();
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
function mount(cv) {
  const sc = S[cv.dataset.kx]; if (!sc || cv.kx) return;
  const ctx = cv.getContext('2d'); let t = FROZEN ?? (REDUCED ? sc.poster : 0), last = 0, on = false, paused = false, looping = false;
  // sc.cover: the canvas takes its CSS box (any aspect) and the 1600×1000 space is cover-fitted into it, but never narrower than
  // sc.minW logical px (a phone then sees a tall strip: more space above and below). The scene reads KX.h.view() to lay itself out.
  const fit = () => { const w = cv.clientWidth || 800, d = Math.min(sc.maxDpr || 2, devicePixelRatio || 1);
    cv.width = Math.round(w * d); cv.height = Math.round((sc.cover ? cv.clientHeight || w * H / W : w * H / W) * d); paint(); };
  const paint = () => { if (!cv.width) return;
    if (sc.cover) { const k = Math.min(Math.max(cv.width / W, cv.height / H), cv.width / (sc.minW || 900)), vw = cv.width / k, vh = cv.height / k;
      V = {x0: (W - vw) / 2, y0: (H - vh) / 2, x1: (W + vw) / 2, y1: (H + vh) / 2, w: vw, h: vh};
      ctx.setTransform(k, 0, 0, k, -V.x0 * k, -V.y0 * k); VIEW = (cv.clientWidth || W) / vw; }
    else { V = {x0: 0, y0: 0, x1: W, y1: H, w: W, h: H}; ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); VIEW = (cv.clientWidth || W) / W; }
    const tt = ((t % sc.D) + sc.D) % sc.D; CUR = cv.dataset.kx; CHAR = cv.dataset.char || document.documentElement.dataset.char || 'karpincho';
    SEED = +(cv.dataset.seed || document.documentElement.dataset.seed || 4062); INTEG = cv.hasAttribute('data-kx-integrated'); CAPQ = []; FLUSH = false;
    const bare = cv.hasAttribute('data-kx-bare');
    try { ctx.clearRect(V.x0, V.y0, V.w, V.h); bg(ctx, tt, sc); sc.draw(ctx, tt);
      if (INTEG) { vignette(ctx); FLUSH = true; CAPQ.forEach(c => cap(ctx, ...c)); }
      else if (!bare) { hud(ctx, tt, sc.label); grain(ctx, tt); } }
    finally { INTEG = false; FLUSH = false; CAPQ = []; V = {x0: 0, y0: 0, x1: W, y1: H, w: W, h: H}; }
    cv.dispatchEvent(new CustomEvent('kx:frame', {detail: {t: tt, D: sc.D}})); };
  const loop = now => { if (!on || paused) { looping = false; return; } t += Math.min(.05, (now - last) / 1000); last = now; paint(); requestAnimationFrame(loop); };
  const play = () => { if (on && !paused && !looping) { looping = true; last = performance.now(); requestAnimationFrame(loop); } };
  cv.kx = {D: sc.D, paint, seek(x) { t = x; paint(); }, pause(v) { paused = v; play(); }, get paused() { return paused; }, restart() { t = 0; paint(); }};
  new ResizeObserver(fit).observe(cv);
  if (FROZEN !== null || REDUCED) return;
  new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting;
    if (on && !was) { if (!cv.hasAttribute('data-kx-keep')) t = 0; play(); } }, {threshold: .35}).observe(cv);
}
const all = () => document.querySelectorAll('canvas[data-kx]').forEach(mount);
const scene = (name, def) => { S[name] = def; document.querySelectorAll(`canvas[data-kx="${name}"]`).forEach(mount); };
const h = {flag, char: () => CHAR, seed: () => SEED, view: () => V, W, H, C, F, E, clamp, lerp, pr, env, rnd, hex, blur, grad, font, T, rr, card, dot, cubic, path, bez, travel, stamp, cap, fmt,
  halo, spark, ringS, blit, sprite, warp};
window.KX = {scenes: S, scene, mount, all, h};
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { all(); document.querySelectorAll('canvas[data-kx]').forEach(c => c.kx && c.kx.paint()); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
})();
