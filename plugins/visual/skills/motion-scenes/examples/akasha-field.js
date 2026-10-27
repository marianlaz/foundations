/* AkashaField: the Akasha as a living background. Born in the ignition's big bang, then a slow journey through it
   while the narrator talks, and a vortex that pours into the "akasha" scene (#s-keep). A fixed canvas behind the content.
   API (driven by the tour):
     AkashaField.bang({x, y} | element)   the universe is born at that point (default: screen centre)
     AkashaField.travel(speed)            0 = still · .5 cruise · 1 journey · 3 warp (streaks)
     AkashaField.focus(sectionId | el)    mood per section; 's-keep' pours the field into the akasha scene
     AkashaField.calm()                   quiet drift, dimmer
     AkashaField.bind({pulse: () => 0..1}) the voice envelope (e.g. () => narrator.pulse), makes it breathe
   Scrolling works without the tour too: when the akasha scene is on screen the field pours into it.
   Fades out on light sections (body.tone-light). Reduced motion: a still, faint field. */
(() => {
const PAL = ['#A78BFA', '#B0D1FF', '#8B5CF6', '#60A5FA', '#F0ABFC', '#FFFFFF'];
const WORDS = ['glossary', 'decision', 'incident', 'roadmap', 'postmortem', 'onboarding', 'pricing', 'a customer', 'a partner', 'a release',
  'Series A', 'offer', 'upside', 'runbook', 'a meeting', 'a thread', 'a commit', 'a fact', 'said by', 'who knows', 'certified'];
const MOODS = {                                   // alpha, cruise speed, how much it pours into the akasha scene
  hero: {alpha: 1, speed: .55, pour: 0}, 's-keep': {alpha: .85, speed: .7, pour: 1}, 's-library': {alpha: .6, speed: .35, pour: 0},
  's-mind': {alpha: .85, speed: .3, pour: 0}, calm: {alpha: .42, speed: .14, pour: 0}, other: {alpha: .5, speed: .22, pour: 0}};
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hex = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, p) => a + (b - a) * p;
const easeOut = p => 1 - Math.pow(1 - clamp(p), 3);

let cv, ctx, W = 0, H = 0, dpr = 1, born = null, bornAt = [0, 0], last = 0, running = false;
let speed = 0, alpha = 0, pour = 0, pulse = 0, autoPour = 0;
let target = {...MOODS.hero, alpha: 0}, speedOverride = null, pulseFn = () => 0, pourEl = null;
const P = [], LINKS = [], NEB = [], SPR = {};
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const sprite = col => SPR[col] || (SPR[col] = (() => { const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d');
  const g = x.createRadialGradient(24, 24, 0, 24, 24, 24); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, hex(col, .9)); g.addColorStop(.5, hex(col, .22)); g.addColorStop(1, hex(col, 0));
  x.fillStyle = g; x.fillRect(0, 0, 48, 48); return c; })());

function build() {
  for (let i = 0; i < 1500; i++) P.push({x: (rnd() * 2 - 1) * 1.6, y: (rnd() * 2 - 1) * 1.1, z: .04 + rnd() * .96, c: PAL[Math.floor(rnd() * PAL.length)], s: .5 + rnd() * 1.4, tw: rnd() * 7, sw: rnd()});
  WORDS.forEach(w => P.push({x: (rnd() * 2 - 1) * 1.3, y: (rnd() * 2 - 1) * .9, z: .15 + rnd() * .85, c: '#B0D1FF', s: 1, tw: rnd() * 7, sw: rnd(), w}));
  for (const c of ['#8B5CF6', '#FF00A1', '#2DD4BF', '#60A5FA', '#A78BFA']) NEB.push({x: (rnd() * 2 - 1) * 1.1, y: (rnd() * 2 - 1) * .7, z: .2 + rnd() * .8, c, s: .7 + rnd() * .8});
  const sub = P.slice(0, 260);                    // filaments: each of a few hundred to its nearest neighbour
  sub.forEach((a, i) => { let best = -1, bd = 1e9; sub.forEach((b, j) => { if (j === i) return; const d = Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 2); if (d < bd) { bd = d; best = j; } });
    if (bd < .5) LINKS.push([a, sub[best]]); });
}
function size() { dpr = Math.min(1.5, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
function mount() {
  if (cv) return;
  cv = document.createElement('canvas'); cv.id = 'akashaField'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;opacity:1';
  const stars = document.getElementById('stars');
  stars ? stars.after(cv) : document.body.prepend(cv);
  ctx = cv.getContext('2d'); build(); size(); addEventListener('resize', size);
  const scene = () => document.querySelector('canvas[data-kx="akasha"]');
  const watch = () => { const el = scene(); if (!el) return setTimeout(watch, 1000); pourEl = pourEl || el;
    new IntersectionObserver(([e]) => { autoPour = e.isIntersecting ? 1 : 0; }, {threshold: .3}).observe(el); };
  watch();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  start();
}
function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); }

function frame(now) {
  if (document.hidden) { running = false; return; }
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const age = born === null ? -1 : (now - born) / 1000;
  // follow the targets as slow envelopes (same feel as the orb: fast attack, slow release)
  const light = document.body.classList.contains('tone-light') ? 0 : 1;
  const want = {a: target.alpha * light * (born === null ? 0 : 1), s: speedOverride ?? target.speed, p: Math.max(target.pour, autoPour)};
  if (age >= 0 && age < 7) want.s = Math.max(want.s, lerp(2.2, want.s, easeOut(age / 7)));   // right after the bang: the rush of the expansion
  alpha += (want.a - alpha) * (1 - Math.exp(-dt * 1.2));
  speed += (want.s - speed) * (1 - Math.exp(-dt * 1.5));
  pour += (want.p - pour) * (1 - Math.exp(-dt * (want.p > pour ? .9 : 1.4)));
  const pv = clamp(+pulseFn() || 0); pulse += (pv - pulse) * (1 - Math.exp(-dt * (pv > pulse ? 5 : 1.6)));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  if (alpha > .003) draw(dt, age); else if (born === null) { requestAnimationFrame(frame); return; }
  requestAnimationFrame(frame);
}

function draw(dt, age) {
  const f = Math.min(W, H) * .62 * (1 + .035 * pulse), mv = REDUCED ? 0 : speed * dt * .09;
  const ex = age < 0 ? 1 : Math.pow(easeOut(age / 4.2), 1.6);     // expansion out of the bang point: slow start, then it unfolds
  const cx = lerp(bornAt[0], W / 2, easeOut(age / 3.2)), cy = lerp(bornAt[1], H / 2, easeOut(age / 3.2));
  let T = null;                                                      // where the field pours: the akasha scene
  if (pour > .01 && pourEl) { const r = pourEl.getBoundingClientRect(); T = [clamp(r.left + r.width / 2, -W * .2, W * 1.2), clamp(r.top + r.height / 2, -H * .3, H * 1.3)]; }
  const now = performance.now() / 1000;
  const proj = (p, z) => {
    let x = cx + (p.x / z) * f * ex, y = cy + (p.y / z) * f * ex;
    if (T) { const k = pour * (.55 + .35 * p.sw), a = pour * (1.3 - z) * 1.1, dx = (x - T[0]) * (1 - k), dy = (y - T[1]) * (1 - k);   // vortex into the scene
      x = T[0] + dx * Math.cos(a) - dy * Math.sin(a); y = T[1] + dx * Math.sin(a) + dy * Math.cos(a); }
    return [x, y];
  };
  const glow = alpha * (1 + .45 * pulse);
  // the shockwave of the birth
  if (age >= 0 && age < 2.2) {                                      // the singularity: a white point that bursts
    const q = age / 2.2, R = 30 + easeOut(q) * Math.min(W, H) * .7, g = ctx.createRadialGradient(bornAt[0], bornAt[1], 0, bornAt[0], bornAt[1], R);
    g.addColorStop(0, `rgba(255,255,255,${.95 * (1 - q)})`); g.addColorStop(.15, hex('#B0D1FF', .6 * (1 - q))); g.addColorStop(.5, hex('#8B5CF6', .25 * (1 - q))); g.addColorStop(1, hex('#8B5CF6', 0));
    ctx.fillStyle = g; ctx.fillRect(bornAt[0] - R, bornAt[1] - R, R * 2, R * 2); }
  for (const [d, w] of [[0, 1], [.28, .5]]) { const q = (age - d) / 2.6; if (q < 0 || q > 1) continue;   // two shockwaves
    ctx.save(); ctx.globalAlpha = (1 - q) * .85 * w; ctx.strokeStyle = '#B0D1FF'; ctx.lineWidth = (3 + 14 * (1 - q)) * w;
    ctx.shadowColor = '#8B5CF6'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(bornAt[0], bornAt[1], easeOut(q) * Math.hypot(W, H) * .55, 0, 7); ctx.stroke(); ctx.restore(); }
  ctx.globalCompositeOperation = 'lighter';
  for (const n of NEB) {                                            // nebulae: the body of the space, drifting past slowly
    n.z -= mv * .35; if (n.z < .12) n.z += .88; const [x, y] = proj(n, n.z), R = n.s * Math.min(W, H) * .32 / n.z * ex;
    const a = .07 * alpha * (1 + .5 * pulse) * clamp((1 - n.z) * 2.5) * clamp((n.z - .12) * 6) * (1 - .5 * pour);
    const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, hex(n.c, a)); g.addColorStop(1, hex(n.c, 0)); ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2); }
  // filaments
  ctx.lineWidth = 1;
  for (const [a, b] of LINKS) { if (Math.abs(a.z - b.z) > .35) continue; const A = proj(a, a.z), B = proj(b, b.z), fa = fade(a.z) * fade(b.z);
    ctx.strokeStyle = hex('#A78BFA', .1 * glow * fa * clamp((age - .8) / 2.5)); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
  // particles and words, flying past
  for (const p of P) {
    p.z -= mv * (p.w ? .8 : 1); if (p.z < .04) { p.z += .96; p.x = (rnd() * 2 - 1) * 1.6; p.y = (rnd() * 2 - 1) * 1.1; }
    const [x, y] = proj(p, p.z); if (x < -80 || x > W + 80 || y < -80 || y > H + 80) continue;
    const a = fade(p.z) * glow * (.62 + .3 * Math.sin(now * 1.4 + p.tw)), hot = age >= 0 && age < 3.2 && p.sw < 1 - age / 3.2;   // born white-hot, cooling into colour
    if (p.w) { if (age < 2) continue; ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * .5 * (1 - pour * .8) * clamp((age - 2) / 3);
      ctx.font = `500 ${clamp(11 / p.z * .5, 10, 30)}px "JetBrains Mono",ui-monospace,monospace`; ctx.fillStyle = p.c; ctx.textAlign = 'center';
      ctx.fillText(p.w, x, y); ctx.globalCompositeOperation = 'lighter'; continue; }
    const r = clamp(p.s * 2.2 / p.z, 1, 14) * (1 + .3 * pulse);
    if (speed > .9 && !REDUCED) { const [px, py] = proj(p, Math.min(1, p.z + speed * .012)); ctx.globalAlpha = a * clamp((speed - .9) / 1.5) * .8;
      ctx.strokeStyle = hex(p.c, 1); ctx.lineWidth = Math.max(1, r * .45); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.globalAlpha = a; ctx.drawImage(sprite(hot ? '#FFFFFF' : p.c), x - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // the core of the pour: a soft light where the field goes into the scene
  if (T && pour > .05) { const g = ctx.createRadialGradient(T[0], T[1], 0, T[0], T[1], Math.min(W, H) * .5);
    g.addColorStop(0, hex('#8B5CF6', .18 * pour * alpha)); g.addColorStop(1, hex('#8B5CF6', 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
}
const fade = z => clamp((1 - z) * 3) * clamp((z - .04) * 12);   // far points fade in, very close ones fade out

const at = v => { if (!v) return [W / 2, H / 2]; if (v.getBoundingClientRect) { const r = v.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; } return [v.x ?? W / 2, v.y ?? H / 2]; };
window.AkashaField = {
  bang(where) { mount(); bornAt = at(where); born = performance.now(); target = {...MOODS.hero}; speedOverride = null; alpha = 1; speed = 2.4; start(); },   // the birth is instant, not a fade
  travel(s) { mount(); speedOverride = s == null ? null : +s; },
  focus(id) { mount(); const key = typeof id === 'string' ? id.replace(/^#/, '') : id?.id; target = {...(MOODS[key] || MOODS.other)}; speedOverride = null;
    if (key === 's-keep') pourEl = document.querySelector('#s-keep canvas[data-kx="akasha"]') || pourEl; },
  calm() { mount(); target = {...MOODS.calm}; speedOverride = null; },
  bind({pulse} = {}) { if (typeof pulse === 'function') pulseFn = pulse; },
  get state() { return {born: born !== null, alpha: +alpha.toFixed(2), speed: +speed.toFixed(2), pour: +pour.toFixed(2), pulse: +pulse.toFixed(2)}; },
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
