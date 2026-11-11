/* Carpincho y el Akasha · scenes. Load after engine.js and art.js.
   Each scene: KX.scene(name, {D, poster, label, hot, comb, haze, night, draw(ctx, t)}) in a 1600×1000 space. */
(() => {
const {view, W, H, C, E, clamp, lerp, pr, env, rnd, hex, T, rr, card, dot, cubic, path, bez, travel, stamp, cap, halo, spark, ringS, blit, font} = KX.h;
const {hexPath, glowHex, hexOutline, carpincho, carpinchoLit, vista, ripple, stars, wave, glyph, energy, camera, cloud} = ART;
const FLASH = '——/}}}}——';

/* hero · quiet. Ink night, one portal, one Karpincho, one current. Everything generative comes from seed 4062 (IMG_4062).
   Cover-fitted (any aspect): it lays itself out from view(), so a phone sees a tall strip.
   Intro, once (0–4.2): ink → one ——/}}}}—— types in the centre (0.4–1.3) → it lets go and a single pulse crosses (1.6–2.6)
   → the portal draws itself and Karpincho appears (2.4–4.2; the page's title rises at 2.75).
   Then an ambient loop of AMB s: the Akasha turns slowly inside the portal and one pulse walks the current. Keep data-kx-keep. */
const INTRO = 4.2, AMB = 9;                                                 // the seed is the story's: KX.h.seed()
const HC = {ink: '#0B0D1A', ink2: '#121528', bone: '#ECE6DA', jade: '#8FC9B4', slate: '#7F88A6'};
const heroT = t => t < INTRO ? t : INTRO + ((t - INTRO) % AMB);
function heroLayout() {
  const V = view(), port = V.w / V.h < 1.1, cx = (V.x0 + V.x1) / 2;
  return port
    ? {V, port, P: [V.x0 + V.w * .68, V.y0 + V.h * .2], R: V.w * .22, ledge: V.y0 + V.h * .44, cb: [V.x0 + V.w * .2, V.y0 + V.h * .44], cs: V.w / 900 * 1.05, cx, cy: V.y0 + V.h * .28}
    : {V, port, P: [V.x0 + V.w * .72, V.y0 + V.h * .27], R: Math.min(V.h * .19, V.w * .13), ledge: V.y0 + V.h * .41, cb: [V.x0 + V.w * .2, V.y0 + V.h * .41], cs: V.h / 800 * .98, cx, cy: V.y0 + V.h * .32};
}
let HSTARS = null;
function heroStars(ctx, V, t, a) {                                               // few, still, bone: a sky to breathe in, not to look at
  if (a <= 0) return;
  if (!HSTARS || HSTARS.seed !== KX.h.seed()) { const r = rnd(KX.h.seed()); HSTARS = Array.from({length: 46}, () => ({x: r(), y: r() * .7, s: .6 + r() * 1.1, tw: r() * 7})); HSTARS.seed = KX.h.seed(); }
  ctx.save(); ctx.fillStyle = HC.bone;
  HSTARS.forEach(p => { ctx.globalAlpha = a * (.18 + .14 * Math.sin(t * .6 + p.tw)); ctx.beginPath(); ctx.arc(V.x0 + p.x * V.w, V.y0 + p.y * V.h, p.s, 0, 7); ctx.fill(); });
  ctx.restore();
}
function hexDraw(ctx, x, y, R, p) {                                              // a hexagon outline drawn up to fraction p
  const pts = Array.from({length: 7}, (_, k) => { const an = Math.PI / 3 * k - Math.PI / 2; return [x + R * Math.cos(an), y + R * Math.sin(an)]; });
  const n = 6 * clamp(p), whole = Math.floor(n); ctx.beginPath(); ctx.moveTo(...pts[0]);
  for (let k = 1; k <= whole; k++) ctx.lineTo(...pts[k]);
  if (whole < 6) ctx.lineTo(lerp(pts[whole][0], pts[whole + 1][0], n - whole), lerp(pts[whole][1], pts[whole + 1][1], n - whole));
}
KX.scene('hero', {D: 1e6, poster: INTRO + 5.4, label: '', cover: 1, minW: 900, comb: 0, haze: 0, maxDpr: 2, draw(ctx, t0) {
  const t = heroT(t0), L = heroLayout(), {V, P, R} = L, amb = t0 >= INTRO;
  const draw = pr(t0, 2.4, 3.6, E.io), reveal = pr(t0, 2.7, 4, E.io);
  // the ground: ink, a slate mist drifting, a breath of jade where the portal is
  let g = ctx.createLinearGradient(0, V.y0, 0, V.y1); g.addColorStop(0, HC.ink2); g.addColorStop(1, HC.ink);
  ctx.fillStyle = g; ctx.fillRect(V.x0, V.y0, V.w, V.h);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  blit(ctx, halo('#5A6488', 1.6), V.x0 + V.w * (.35 + .05 * Math.sin(t * .07)), V.y0 + V.h * .3, V.w * .7, .07);
  blit(ctx, halo(HC.jade, 2), P[0], P[1], R * 3.2, .08 * draw * (.9 + .1 * Math.sin(t * .5)));
  ctx.restore();
  heroStars(ctx, V, t, .35 + .65 * reveal);
  // the portal: one hairline hexagon, and inside it the Akasha turning slowly, sparse and monochrome
  if (draw > 0) {
    const breath = 1 + .008 * Math.sin(t * .8);
    ctx.save(); hexPath(ctx, P[0], P[1], R * breath); ctx.clip(); ctx.globalAlpha = reveal;
    const G = cloud(), cam = camera(.5 + t * .035, .32, 1250, P[0], P[1], 900 * R / 520); ctx.fillStyle = HC.bone;
    G.pts.forEach((p, i) => { if (i % 2) return; const A = cam(p.f); if (!A) return;
      ctx.globalAlpha = reveal * clamp(1.4 - A[3] / 2300) * (.6 + .3 * Math.sin(t * .9 + p.tw)) * (p.g % 4 === 0 ? 1 : .8);
      ctx.fillStyle = p.g % 4 === 0 ? HC.jade : HC.bone; ctx.beginPath(); ctx.arc(A[0], A[1], Math.max(.9, p.z * A[2] * 3.4 * R / 520), 0, 7); ctx.fill(); });
    ctx.restore();
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = HC.jade; ctx.lineWidth = 1.6; ctx.shadowColor = HC.jade; ctx.shadowBlur = 14 * draw;
    hexDraw(ctx, P[0], P[1], R * breath, draw); ctx.stroke(); ctx.restore();
  }
  // the ledge: a single line of light; Karpincho on it, warm but muted, a jade rim from the portal
  if (reveal > 0) {
    const y = L.ledge, lx = L.cb[0] + 230 * L.cs; ctx.save(); ctx.globalAlpha = reveal;
    g = ctx.createLinearGradient(V.x0, 0, lx, 0); g.addColorStop(0, hex(HC.bone, 0)); g.addColorStop(1, hex(HC.bone, .45));
    ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(V.x0, y); ctx.lineTo(lx, y); ctx.stroke(); ctx.restore();
  }
  const aim = Math.atan2(P[1] - (L.cb[1] - 110 * L.cs), P[0] - (L.cb[0] + 150 * L.cs));
  const paw = carpinchoLit(ctx, L.cb[0], L.cb[1] - 4, L.cs, t, {a: reveal, point: amb ? 1 : pr(t0, 3.2, 3.9, E.out), aim, rim: .55 * reveal, rimCol: '#CFEDE2'});
  // the current: one hairline from the paw to the portal, one pulse walking it
  const edge = [P[0] - R * .87, P[1] + R * .2], cur = paw && [paw, [lerp(paw[0], edge[0], .35), lerp(paw[1], edge[1], .35) - V.h * .05], [lerp(paw[0], edge[0], .7), edge[1] - V.h * .02], edge];
  const ca = amb ? 1 : pr(t0, 3.5, 4.2);
  if (cur && ca > 0) {
    path(ctx, cur, 0, 1, hex(HC.jade, .16 * ca), {lw: 1});
    const per = 4.5, ph = ((t - 3.6) % per + per) % per / per * 1.4;
    if (ph <= 1 && t0 >= 3.6) { const u = E.sine(ph), fa = Math.sin(Math.PI * ph) * ca, [hx, hy] = cubic(...cur, u);
      path(ctx, cur, Math.max(0, u - .12), u, hex(HC.bone, .5 * fa), {lw: 1.4});
      ctx.save(); ctx.globalAlpha = fa; ctx.fillStyle = HC.bone; ctx.shadowColor = HC.jade; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(hx, hy, 2.4, 0, 7); ctx.fill(); ctx.restore(); }
  }
  // the engineer's signature: the seed, and nothing else
  ctx.save(); ctx.globalAlpha = .5 * reveal; ctx.font = '400 13px "IBM Plex Mono", ui-monospace, monospace'; ctx.fillStyle = HC.slate; ctx.textAlign = 'center';
  ctx.letterSpacing = '3px'; ctx.fillText('SEED ' + KX.h.seed(), P[0], P[1] + R * 1.28); ctx.restore();
  // the intro: a chispazo in the ink, the wave it leaves, then a single pulse crosses to where the portal will be
  if (t0 < 3) {
    const gx = L.cx - 60, gy = L.cy, u = t0 - .5;
    if (u > 0) { const f = Math.exp(-u * 6), life = clamp(1 - u / 2.2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(HC.jade, 3), gx, gy, 90, .7 * f); blit(ctx, halo('#FFFFFF', 6), gx, gy, 20, f); ctx.restore();
      [-1, 1].forEach(d => wave(ctx, gx, gx + d * 320 * E.out(clamp(u / 1.6)), gy, 12 * life, 6.283 * 320 * E.out(clamp(u / 1.6)) / 110, -t0 * 5, hex(HC.jade, 1), .7 * life, 1.3, uu => Math.sin(Math.PI * Math.min(1, uu * 1.6)) * Math.pow(1 - uu, .6))); }
    const go = pr(t0, 1.6, 2.6, E.io), from = [gx, gy], Pth = [from, [from[0] + 140, from[1] - 120], [P[0] - R * 1.3, P[1] + 20], P];
    if (go > 0 && go < 1) { path(ctx, Pth, Math.max(0, go - .25), go, hex(HC.bone, .6), {lw: 1.4}); const [hx, hy] = cubic(...Pth, go);
      ctx.save(); ctx.fillStyle = HC.bone; ctx.shadowColor = HC.jade; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(hx, hy, 3, 0, 7); ctx.fill(); ctx.restore(); }
  }
  // the floor for the title: the bottom deepens into ink
  g = ctx.createLinearGradient(0, V.y0 + V.h * (L.port ? .55 : .52), 0, V.y1); g.addColorStop(0, hex(HC.ink, 0)); g.addColorStop(.6, hex(HC.ink, .85)); g.addColorStop(1, HC.ink);
  ctx.fillStyle = g; ctx.fillRect(V.x0, V.y0 + V.h * .5, V.w, V.h * .5);
}});

/* a wave packet along a path: a long sine under a gaussian envelope, measured in pixels so it never knots. Pure function of t. */
function packet(ctx, P, u, t, a = 1, k = 1) {
  if (a <= 0) return; let L = 0; for (let i = 0, q = P[0]; i < 40; i++) { const r = cubic(...P, (i + 1) / 40); L += Math.hypot(r[0] - q[0], r[1] - q[1]); q = r; }
  const half = 300 * k / L, n = 90;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  [[1, 150, C.mint, 2.2, 0, .8], [.5, 95, '#E8FFFA', 1.1, 1.3, .55]].forEach(([amp, lam, col, lw, ph, al]) => {
    ctx.beginPath(); let started = false;
    for (let i = 0; i <= n; i++) { const v = u - half * 1.5 + half * 1.7 * i / n; if (v < 0 || v > 1) continue;
      const [px, py] = cubic(...P, v), [qx, qy] = cubic(...P, Math.min(1, v + .003)), nx = -(qy - py), ny = qx - px, nl = Math.hypot(nx, ny) || 1;
      const e = Math.exp(-Math.pow((v - u + half * .35) / (half * .55), 2)), A = 20 * k * amp * e * Math.sin(v * L / lam * 6.283 - t * 4 + ph);
      const x = px + nx / nl * A, y = py + ny / nl * A; started ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), started = true); }
    ctx.strokeStyle = hex(col, al * a); ctx.lineWidth = lw * k; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.stroke(); });
  ctx.restore();
}
/* chispazos: where the sparks flare (x, y, at, size): scattered, quickening, gathering into the head at 4.6 s */
const SPARKS = (() => { const r = rnd(4062), out = [];
  for (let i = 0; i < 10; i++) { const u = i / 9, at = 1.1 + 3.3 * (1 - Math.pow(1 - u, 1.6)), g = Math.pow(u, 1.3);
    out.push([lerp(180 + r() * 760, 780, g), lerp(220 + r() * 520, 533, g), at, .55 + .35 * r()]); }
  out.push([780, 533, 4.6, 1.5]); return out; })();
/* one spark: a soft flare, rings of resonance, and a sine wave born from it that runs out and dies away */
function chispa(ctx, x, y, t, t0, k = 1) {
  const u = t - t0; if (u < 0 || u > 2.6) return; const life = 1 - u / 2.6, f = Math.exp(-u * 7);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  blit(ctx, halo(C.mint, 3), x, y, 70 * k, .8 * f); blit(ctx, halo('#FFFFFF', 6), x, y, 16 * k, f);
  blit(ctx, halo(C.mint, 4), x, y, 26 * k, .35 * Math.pow(life, 2));
  const q = clamp(u / 1.6); if (q > 0 && q < 1) blit(ctx, ringS(C.mint), x, y, 10 * k + 70 * k * E.out(q), .16 * Math.pow(1 - q, 2));
  ctx.restore();
  for (let d = -1; d <= 1; d += 2) { const reach = 300 * k * E.out(clamp(u / 2.2));  // the wave it leaves, both ways: a true sine, ~90 px long, born at the spark
    wave(ctx, x, x + d * reach, y, 16 * k * life, 6.283 * reach / 90, -t * 6, hex(d > 0 ? C.mint : C.aqua, 1), .8 * life, 1.6, uu => Math.sin(Math.PI * Math.min(1, uu * 1.6)) * Math.pow(1 - uu, .6)); }
}
/* 0 · El flash. Beats: empty space (0–1) · chispazos flare and leave waves, quickening and gathering (1.1–4.6)
   · the last one becomes an impulse that crosses the space (4.6–8.6) · the receptor lights, the journey has begun, held (8.6–13.5). */
KX.scene('flash', {D: 14, poster: 12, label: '// 00 · el flash', night: .55, hot: [1250, 440],
  comb: t => .04 + .12 * pr(t, 8.6, 10.5), haze: t => .04 + .26 * pr(t, 8.6, 10), draw(ctx, t) {
  const fade = 1 - pr(t, 13.5, 14); ctx.save(); ctx.globalAlpha = fade;
  stars(ctx, t, {n: 320, a: pr(t, 0, 1.2), speed: .022, seed: 9});
  const RC = [1250, 440], head = [780, 533];                                  // where the sparks gather and the impulse is born
  // chispazos: sparks of current flare here and there in the dark, each one leaving a wave; they quicken and gather
  SPARKS.forEach(([sx, sy, t0, k]) => chispa(ctx, sx, sy, t, t0, k));
  const charge = env(t, 4.9, 6, .5, .4); if (charge > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3), ...head, 80 + 14 * Math.sin(t * 3.2), charge * .7); ctx.restore(); }
  // the impulse: a wave packet, sinusoidal, its envelope a breath; the space around it vibrates as it passes
  const Pth = [head, [head[0] + 200, head[1] + 60], [RC[0] - 300, RC[1] + 160], [RC[0] - 92, RC[1]]];
  const go = pr(t, 5.6, 8.6, E.sine);
  path(ctx, Pth, 0, go, hex(C.mint, .12 * (1 - pr(t, 12.6, 13.4))), {lw: 1.4});
  const live = go > 0 && go < 1 ? E.sine(clamp(go * 5)) * (1 - E.io(clamp((go - .9) / .1))) : 0;   // swells in, arrives whole
  if (live > 0) {
    const [hx, hy] = cubic(...Pth, go);
    for (let k = 0; k < 7; k++) {                                              // the space, as strings: they swell where the impulse is
      const y = 120 + k * 125, d = Math.abs(y - hy) / 520, A = 22 * live * Math.exp(-d * d * 3);
      wave(ctx, 0, W, y, A, 9 + k * 1.3, -t * 2.4 + k * .9, hex(k % 2 ? C.ice : C.mint, 1), .04 + .2 * live * Math.exp(-d * d * 2.5), 1.3,
        uu => Math.exp(-Math.pow((uu * W - hx) / 460, 2)));
    }
    packet(ctx, Pth, go, t, live);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3), hx, hy, 120, .55 * live); blit(ctx, halo('#E8FFFA', 5), hx, hy, 34, .7 * live); ctx.restore();
  }
  // the receptor: waits as an outline, lights on arrival
  const arr = 8.6, lit = pr(t, arr, arr + .7, E.expo);
  hexOutline(ctx, ...RC, 92, hex(C.ice, .5), pr(t, 3.5, 5) * (1 - lit), 2);
  hexOutline(ctx, ...RC, 70, hex(C.ice, .25), pr(t, 3.8, 5.3) * (1 - lit), 1.5);
  T(ctx, 'receptor', RC[0], RC[1] + 140, {mono: 1, s: 15, c: C.ice, al: 'center', ls: 3, a: pr(t, 4, 5) * .8 * (1 - lit)});
  glowHex(ctx, ...RC, 92, t, {a: lit, glow: 1 + 1.2 * Math.exp(-Math.max(0, t - arr) * 2.5)});
  ripple(ctx, ...RC, t, {a: lit * .45, R: 380, r0: 90, per: 2.4, t0: arr});
  for (let k = 0; k < 3; k++) { const u = pr(t, 9.6 + k * 1.3, 11.8 + k * 1.3, E.sine); if (u > 0 && u < 1) packet(ctx, Pth, u, t, .55 * Math.sin(Math.PI * u), .5); }   // the current keeps flowing, softer
  // Carpincho, small, watching from a ledge
  const ca = pr(t, 9.4, 10.6);
  vista(ctx, t, {a: ca, ledge: [-120, 300, 832]});
  carpincho(ctx, 190, 828, .5, t, {a: ca, point: pr(t, 10.4, 11.2, E.back), aim: -.75});
  cap(ctx, t, 1.4, 5.4, 'De repente, se recibe un **Impulso**');
  cap(ctx, t, 5.6, 8.2, 'que hace **vibrar** dicho espacio');
  cap(ctx, t, 8.4, 10.2, 'y comienza su camino hacia su **Receptor**.');
  cap(ctx, t, 10.4, 13.5, 'El viaje de la **Corriente**, había comenzado.');
  ctx.restore();
}});


/* 1 · La cornisa. Beats: the ledge and the glow (0–2.4) · the chat types the question (2.4–5.3)
   · the question flies into the hexagon, it answers in pulses (5.3–9.4) · an answer nobody can read yet, held (9.4–13.5). */
KX.scene('cornisa', {D: 14, poster: 12.4, label: '// 01 · la cornisa', hot: [1250, 380], haze: .3, comb: .26, draw(ctx, t) {
  const fade = 1 - pr(t, 13.5, 14); ctx.save(); ctx.globalAlpha = fade;
  const HX = [1250, 380], hit = 6.5;
  stars(ctx, t, {n: 90, a: .35, speed: .01, seed: 4});
  vista(ctx, t, {ledge: [60, 520, 650]});
  glowHex(ctx, ...HX, 168, t, {a: pr(t, 0, 1.4), glow: 1 + .5 * Math.exp(-Math.max(0, t - hit) * 2) * (t > hit ? 1 : 0)});
  ripple(ctx, ...HX, t, {a: pr(t, hit, hit + .3) * .4, R: 420, r0: 160, per: 2.6, t0: hit});
  carpincho(ctx, 380, 646, .95, t, {point: pr(t, 1.6, 2.5, E.back), rim: .9 + .3 * Math.sin(t * 1.7)});
  // the interface
  const ca = pr(t, 2.4, 3.1, E.expo), X = 600, Y = 250, CW = 440, CH = 300;
  if (ca > 0) {
    ctx.save(); ctx.globalAlpha *= ca; ctx.translate(0, (1 - ca) * 24);
    card(ctx, X, Y, CW, CH, {r: 24, fill: 'rgba(8,11,90,.62)', stroke: hex(C.lav, .28)});
    [0, 1, 2].forEach(i => { ctx.fillStyle = hex(C.lav, .4); ctx.beginPath(); ctx.arc(X + 26 + i * 16, Y + 26, 4.5, 0, 7); ctx.fill(); });
    T(ctx, 'interfaz · chat', X + CW - 22, Y + 31, {mono: 1, s: 14, c: C.steel, al: 'right'});
    ctx.strokeStyle = hex(C.lav, .14); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, Y + 50); ctx.lineTo(X + CW, Y + 50); ctx.stroke();
    const q = '¿Qué es todo esto?', n = Math.round(q.length * pr(t, 3.1, 4.6, E.lin)), sent = pr(t, 4.9, 5.4, E.expo);
    // input pill
    rr(ctx, X + 18, Y + CH - 66, CW - 36, 48, 24); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill(); ctx.strokeStyle = hex(C.lav, .2); ctx.stroke();
    const typed = sent > 0 ? '' : q.slice(0, n), caret = (t % 1) < .55 && t > 3 && sent <= 0;
    if (!typed && sent <= 0) T(ctx, 'Preguntá lo que quieras…', X + 42, Y + CH - 35, {s: 19, c: hex(C.lav, .45)});
    const tw = T(ctx, typed, X + 42, Y + CH - 35, {s: 20, w: 500, c: C.white});
    if (caret) { ctx.fillStyle = C.mint; ctx.fillRect(X + 44 + tw, Y + CH - 54, 2.5, 24); }
    dot(ctx, X + CW - 44, Y + CH - 42, 9, n >= q.length && sent < 1 ? C.mint : C.lav, n >= q.length ? 1 : .35);
    // the sent bubble
    if (sent > 0) {
      const by = lerp(Y + CH - 66, Y + 72, sent); font(ctx, {s: 20, w: 500}); const bw = ctx.measureText(q).width + 40;
      rr(ctx, X + CW - 18 - bw, by, bw, 46, [22, 22, 6, 22]); ctx.fillStyle = hex(C.bubble || '#E9E4DA', .1); ctx.fill(); ctx.strokeStyle = hex(C.bubble || '#E9E4DA', .32); ctx.lineWidth = 1.2; ctx.stroke();
      T(ctx, q, X + CW - 38, by + 30, {s: 20, w: 500, c: C.white, al: 'right'});
    }
    // the reply: three dots, then a waveform nobody can read yet
    const ra = pr(t, 7.6, 8.1, E.expo), wa = pr(t, 9.2, 10, E.io);
    if (ra > 0) {
      const ry = Y + 134; rr(ctx, X + 18, ry, lerp(96, 300, wa), 56, [22, 22, 22, 6]); ctx.fillStyle = hex(C.mint, .12 * ra); ctx.fill(); ctx.strokeStyle = hex(C.mint, .45 * ra); ctx.lineWidth = 1.5; ctx.stroke();
      if (wa < 1) [0, 1, 2].forEach(i => { const b = Math.max(0, Math.sin(t * 7 - i * .8)); ctx.fillStyle = hex(C.mint, (.4 + .6 * b) * ra * (1 - wa)); ctx.beginPath(); ctx.arc(X + 44 + i * 18, ry + 28 - b * 4, 5, 0, 7); ctx.fill(); });
      if (wa > 0) {
        ctx.save(); rr(ctx, X + 18, ry, lerp(96, 300, wa), 56, 22); ctx.clip();
        for (let k = 0; k < 3; k++) wave(ctx, X + 36, X + 36 + 250 * wa, ry + 28, 11 - k * 3, 26 + k * 9, -t * (4 + k) + k, k ? hex(C.aqua, .5) : C.mint, wa * (k ? .55 : 1), k ? 1.4 : 2.2, u => Math.sin(Math.PI * u));
        ctx.restore();
        T(ctx, '?', X + 18 + 300 + 22, ry + 40, {s: 34, w: 700, c: C.mint, a: pr(t, 10.2, 10.8, E.expo), glow: hex(C.mint, .8)});
      }
    }
    ctx.restore();
  }
  // the question flies into the glow; the glow answers in pulses
  const out = bez([X + CW, Y + 96], [HX[0] - 120, HX[1]], .5);
  travel(ctx, out, t, 5.3, hit, C.orange, {r: 8, tail: .3});
  const back = bez([HX[0] - 130, HX[1] + 30], [X + CW - 10, Y + 162], .55);
  for (let k = 0; k < 6; k++) travel(ctx, back, t, 6.9 + k * .32, 8.1 + k * .32, C.mint, {r: 5, lw: 2});
  path(ctx, back, 0, 1, hex(C.mint, .12 * env(t, 6.8, 13.2, .6, .8)), {lw: 1.5, dash: [3, 7]});
  T(ctx, 'mente artificial', HX[0], HX[1] + 250, {mono: 1, s: 16, c: hex(C.mint, .9), al: 'center', ls: 2, a: pr(t, 9.6, 10.4)});
  cap(ctx, t, .4, 7.6, 'Charlábamos con sus cerebros, por su **interfaz**');
  cap(ctx, t, 7.9, 13.5, '¿Qué era aquello que **respondía**?');
  ctx.restore();
}});

/* 2 · Sinapsis. Beats: biological neurons, pulses jumping the synapses inside their magnetic fields (0–6)
   · the same net redraws as an artificial neural network (6–11) · flownote: the pulses fall into time, a score (11–19.5). */
const NB = [[250, 470], [520, 290], [540, 660], [850, 460], [1130, 290], [1170, 650], [1400, 460]];
const NE = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6], [1, 4]];
const LAY = [3, 5, 5, 3], LX = [320, 640, 960, 1280];
const AN = LAY.flatMap((n, l) => Array.from({length: n}, (_, i) => [LX[l], 470 + (i - (n - 1) / 2) * 112, l]));
let DEN = null;
const dendrites = () => DEN || (DEN = NB.map((_, k) => { const r = rnd(20 + k); return Array.from({length: 7}, () => { const an = r() * 7, l = 50 + r() * 40;
  return {an, l, br: [[an + .5 + r() * .3, .55, 22 + r() * 18], [an - .5 - r() * .3, .7, 18 + r() * 16]]}; }); }));
KX.scene('sinapsis', {D: 20, poster: 17.6, label: '// 02 · sinapsis', night: .35, comb: .1, hot: [820, 470], haze: t => .1 + .14 * pr(t, 11, 13), draw(ctx, t) {
  const fade = 1 - pr(t, 19.5, 20); ctx.save(); ctx.globalAlpha = fade;
  const m = pr(t, 6.2, 9.6, E.io), bio = 1 - .55 * pr(t, 6.2, 7.2) - .45 * pr(t, 7.4, 8.6), ann = pr(t, 6.3, 7.3), flow = pr(t, 11, 12.4);
  stars(ctx, t, {n: 110, a: .3, speed: .008, seed: 21});
  // bio: the somas, dendrites, axons, and the field around each
  const fire = k => { let f = 0; NE.forEach(([a, b], e) => { if (b !== k) return; for (let c = 0; c < 4; c++) { const t1 = .9 + e * .45 + c * 1.7; if (t > t1 + 1.1) f = Math.max(f, Math.exp(-(t - t1 - 1.1) * 3)); } }); return f; };
  if (bio > 0) {
    ctx.save(); ctx.globalAlpha *= bio;
    NB.forEach(([x, y], k) => { const f = fire(k);
      for (let r2 = 0; r2 < 3; r2++) { ctx.save(); ctx.globalAlpha *= (.26 + .5 * f) * pr(t, .3 + k * .1, 1.4 + k * .1); ctx.strokeStyle = C.aqua; ctx.lineWidth = 1.4; ctx.setLineDash([3, 7]);   // the magnetic field
        ctx.beginPath(); ctx.ellipse(x, y, 92 + r2 * 34, (60 + r2 * 24), .3 + k, t * (.15 + r2 * .05) * (r2 % 2 ? -1 : 1), t * (.15 + r2 * .05) * (r2 % 2 ? -1 : 1) + 6.2); ctx.stroke(); ctx.restore(); }
      const g = pr(t, .1 + k * .1, 1.1 + k * .1, E.out);
      ctx.strokeStyle = hex(C.lav, .55); ctx.lineCap = 'round';
      dendrites()[k].forEach(d => { const ex = x + Math.cos(d.an) * d.l * g, ey = y + Math.sin(d.an) * d.l * g; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(d.an + .3) * d.l * .5 * g, y + Math.sin(d.an + .3) * d.l * .5 * g, ex, ey); ctx.stroke();
        d.br.forEach(([ba, at, bl]) => { const sx = x + Math.cos(d.an) * d.l * at * g, sy = y + Math.sin(d.an) * d.l * at * g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(ba) * bl * g, sy + Math.sin(ba) * bl * g); ctx.stroke(); }); });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3), x, y, 70, .25 + .6 * f); ctx.restore();
      ctx.beginPath(); for (let i = 0; i <= 24; i++) { const an = i / 24 * 7, rr2 = 26 * g * (1 + .12 * Math.sin(an * 3 + k)); i ? ctx.lineTo(x + Math.cos(an) * rr2, y + Math.sin(an) * rr2) : ctx.moveTo(x + Math.cos(an) * rr2, y + Math.sin(an) * rr2); }
      ctx.fillStyle = hex(C.cobalt, .9); ctx.fill(); ctx.strokeStyle = hex(C.mint, .5 + .5 * f); ctx.lineWidth = 2; ctx.stroke();
      dot(ctx, x, y, 6, f > .3 ? C.white : C.mint, g); });
    NE.forEach(([a, b], e) => { const A = NB[a], B = NB[b], ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
      const end = [B[0] - Math.cos(ang) * 44, B[1] - Math.sin(ang) * 44], P = [[A[0] + Math.cos(ang) * 30, A[1] + Math.sin(ang) * 30], [lerp(A[0], B[0], .35), A[1] + 40 * Math.sin(e * 2)], [lerp(A[0], B[0], .65), B[1] - 40 * Math.sin(e * 2)], end];
      path(ctx, P, 0, pr(t, .5 + e * .1, 1.6 + e * .1, E.io), hex(C.lav, .4), {lw: 2.4});
      const kn = pr(t, 1.4 + e * .1, 1.8 + e * .1); ctx.fillStyle = hex(C.lav, .7 * kn); ctx.beginPath(); ctx.arc(end[0], end[1], 7, 0, 7); ctx.fill();   // the terminal knob, a gap before the next
      for (let c = 0; c < 4; c++) { const t1 = .9 + e * .45 + c * 1.7; travel(ctx, P, t, t1, t1 + 1.0, C.mint, {r: 5, lw: 2.5});
        const sp = pr(t, t1 + 1, t1 + 1.4, E.lin); if (sp > 0 && sp < 1) { const r = rnd(e * 9 + c); ctx.save(); ctx.globalCompositeOperation = 'lighter';     // neurotransmitters jump the gap
          for (let k = 0; k < 9; k++) { const sx = end[0] + (r() - .5) * 10, sy = end[1] + (r() - .5) * 10; blit(ctx, spark(C.aqua), lerp(sx, B[0] - Math.cos(ang) * 26 + (r() - .5) * 16, sp), lerp(sy, B[1] - Math.sin(ang) * 26 + (r() - .5) * 16, sp), 4, Math.sin(Math.PI * sp)); }
          ctx.restore(); } } });
    const la = env(t, 2, 6.2, .5, .5);
    T(ctx, 'neurona', NB[3][0], NB[3][1] - 120, {mono: 1, s: 15, c: C.ice, al: 'center', ls: 2, a: la});
    T(ctx, 'sinapsis', 700, 368, {mono: 1, s: 15, c: C.mint, al: 'center', ls: 2, a: la});
    T(ctx, 'campo magnético', NB[6][0], NB[6][1] + 148, {mono: 1, s: 15, c: C.aqua, al: 'center', ls: 2, a: la});
    ctx.restore();
  }
  // the artificial net: each node is born at the nearest neuron and flies to its place
  if (ann > 0) {
    const nodeAt = (i) => { const [x, y] = AN[i], src = NB[Math.round(i / (AN.length - 1) * (NB.length - 1))]; const u = pr(t, 7.1 + i * .05, 9.1 + i * .05, E.io); return [lerp(src[0], x, u), lerp(src[1], y, u)]; };
    const pos = AN.map((_, i) => nodeAt(i)), beat = .6, sweep = flow > 0 ? ((t - 11) / (beat * 4)) % 1 : -1;
    // the score: five staff lines behind the net
    if (flow > 0) { for (let s2 = 0; s2 < 5; s2++) { const y = 300 + s2 * 85; ctx.save(); ctx.globalAlpha *= .26 * flow; ctx.strokeStyle = C.ice; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(lerp(800, 160, flow), y); ctx.lineTo(lerp(800, 1440, flow), y); ctx.stroke(); ctx.restore(); }
      T(ctx, 'flownote', 160, 268, {mono: 1, s: 16, c: C.mint, ls: 3, a: flow});
      T(ctx, '♩ = 100', 1440, 268, {mono: 1, s: 16, c: C.ice, al: 'right', ls: 2, a: flow * .8}); }
    let e2 = 0;
    for (let l = 0; l < LAY.length - 1; l++) AN.forEach((a, i) => { if (a[2] !== l) return; AN.forEach((b, j) => { if (b[2] !== l + 1) return; e2++;
      const dw = pr(t, 8.9 + e2 * .01, 9.9 + e2 * .01, E.io), w = .5 + .5 * Math.sin(i * 3.1 + j * 1.7);
      if (dw <= 0) return; ctx.save(); ctx.globalAlpha *= ann * (.12 + .25 * w); ctx.strokeStyle = w > .7 ? C.mint : C.lav; ctx.lineWidth = .8 + 1.6 * w;
      ctx.beginPath(); ctx.moveTo(...pos[i]); ctx.lineTo(lerp(pos[i][0], pos[j][0], dw), lerp(pos[i][1], pos[j][1], dw)); ctx.stroke(); ctx.restore();
      // pulses: free before flownote, then all in time with the beat
      if (t < 11) { const t1 = 9.8 + ((i * 7 + j * 3) % 10) * .1; travel(ctx, [pos[i], pos[i], pos[j], pos[j]], t, t1, t1 + .7, C.mint, {r: 3, lw: 1.5, a: .7 * w}); }
      else { const ph = ((t - 11) / beat) % 4; if (Math.floor(ph) === l && w > .45) { const u = ph - l; travel(ctx, [pos[i], pos[i], pos[j], pos[j]], u, 0, 1, C.mint, {r: 4.5, lw: 2.2, tail: .3, a: flow}); } } }); });
    AN.forEach((a, i) => { const [x, y] = pos[i], ph = t >= 11 ? ((t - 11) / beat) % 4 : -9, hit = t >= 11 ? Math.exp(-((ph - a[2]) < 0 ? 9 : (ph - a[2])) * 4) * flow : 0;
      const tt = t >= 11 ? Math.floor((t - 11) / beat) : 0;
      if (hit > .3 && t >= 11) ripple(ctx, x, y, t, {a: hit * .5, R: 70, r0: 20, n: 1, per: beat, t0: 11 + a[2] * beat});
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3), x, y, 50, ann * (.3 + .7 * hit)); ctx.restore();
      ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.fillStyle = hex(C.deep, .9 * ann); ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = hex(hit > .4 ? '#E8FFFA' : C.mint, ann); ctx.stroke();
      dot(ctx, x, y, 5, C.mint, ann * (.5 + .5 * hit)); void tt; });
    const la = env(t, 9.4, 11.2, .4, .4);
    ['entrada', 'capas ocultas', '', 'salida'].forEach((s2, l) => s2 && T(ctx, s2, l === 1 ? (LX[1] + LX[2]) / 2 : LX[l], 470 + (LAY[l] - 1) / 2 * 112 + 62, {mono: 1, s: 15, c: C.ice, al: 'center', ls: 2, a: la}));
    if (flow > 0) { const px = lerp(LX[0] - 60, LX[3] + 60, sweep); ctx.save(); ctx.globalAlpha *= .5 * flow * Math.sin(Math.PI * sweep); ctx.strokeStyle = C.mint; ctx.lineWidth = 1.5;   // the playhead
      ctx.beginPath(); ctx.moveTo(px, 270); ctx.lineTo(px, 680); ctx.stroke(); ctx.restore(); }
  }
  void m;
  carpincho(ctx, 150, 868, .42, t, {a: pr(t, .6, 1.6), point: pr(t, 12, 12.8, E.back), aim: -.9});
  cap(ctx, t, .4, 6, 'Pulsos eléctricos que saltan en **sinapsis**', {s: 34});     // the one scene that keeps its words, quieter
  cap(ctx, t, 6.2, 11, 'A **semejanza** del cerebro humano', {s: 34});
  cap(ctx, t, 11.2, 19.5, 'Una sinfonía **divina**', {s: 34});
  ctx.restore();
}});

/* 3 · El Akasha. Beats: x, y, z (0–3) · the axes multiply toward n (3–7.4) · the vectors live there: a cloud condenses (7.4–12)
   · its name: the Akasha, a seal turning around a breathing core, held (12–19.5). */
let DIRS = null;
const dirs = () => DIRS || (DIRS = (() => { const r = rnd(5); return Array.from({length: 26}, () => { const u = r() * 2 - 1, a = r() * 7, q = Math.sqrt(1 - u * u); return [q * Math.cos(a), u, q * Math.sin(a)]; }); })());
const SUP = n => String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
KX.scene('akasha', {D: 20, poster: 17.2, label: '// 03 · el akasha', night: .62, comb: .05, hot: [800, 470], haze: t => .06 + .2 * pr(t, 12, 14), draw(ctx, t) {
  const fade = 1 - pr(t, 19.5, 20); ctx.save(); ctx.globalAlpha = fade;
  const P = camera(.6 + t * .1, .32 + .06 * Math.sin(t * .2), lerp(1500, 1250, pr(t, 7, 14, E.io)), 800, 460, 900), O = P([0, 0, 0]);
  stars(ctx, t, {n: 200, a: .5, speed: .012, seed: 31});
  const G = cloud();
  // the core and the seal
  const sa = pr(t, 12, 14, E.io);
  if (O) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3), O[0], O[1], 420, .25 * sa + .06 * pr(t, 7, 10)); blit(ctx, halo('#FFFFFF', 6), O[0], O[1], 120, .5 * sa); ctx.restore();
    if (sa > 0) { const R = 300; ctx.save(); ctx.globalAlpha *= sa * .7; ctx.translate(O[0], O[1]);
      ctx.strokeStyle = hex(C.mint, .45); ctx.lineWidth = 1.2; [1, 1.16].forEach(k => { ctx.beginPath(); ctx.arc(0, 0, R * k, 0, 7); ctx.stroke(); });
      ctx.rotate(t * .08); const txt = 'A K A S H A  ·  E L   R E G I S T R O   D E   T O D O   L O   D I C H O  ·  ';
      font(ctx, {mono: 1, s: 15, w: 500}); ctx.fillStyle = C.mint; ctx.textAlign = 'center';
      if (KX.h.flag('labels')) [...txt].forEach((ch, i) => { ctx.save(); ctx.rotate(i / txt.length * Math.PI * 2); ctx.fillText(ch, 0, -R * 1.08); ctx.restore(); });
      ctx.restore(); } }
  // the axes: three, then many
  const ax = 1 - .7 * pr(t, 8, 11);
  const axis = (d, L, a, lab, col, lw = 1.6) => { const B = P(d.map(v => v * L)); if (!O || !B || a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); ctx.restore(); dot(ctx, B[0], B[1], 2.5, col, a); if (lab) T(ctx, lab, B[0] + 10, B[1] - 8, {mono: 1, s: lw > 2 ? 24 : 17, c: col, a, lab: 1}); };
  [[[1, 0, 0], 'x'], [[0, -1, 0], 'y'], [[0, 0, 1], 'z']].forEach(([d, n], i) => axis(d, 480 * pr(t, .3 + i * .35, 1.4 + i * .35, E.io), ax * pr(t, .3 + i * .35, .8 + i * .35), n, C.ice, 2.6));
  const nAx = dirs().filter((_, i) => t > 3 + i * .15).length;
  dirs().forEach((d, i) => { const g = pr(t, 3 + i * .15, 3.8 + i * .15, E.io); axis(d, 360 * g, ax * g * .6, i < 4 || i === 25 ? (i === 25 ? 'xₙ' : 'x' + '₄₅₆₇'[i]) : '', i === 25 ? C.mint : C.lav); });
  const dimA = env(t, 3, 11.6, .4, .5); if (dimA > 0) { const n = 3 + nAx; T(ctx, 'dimensiones', 1440, 150, {mono: 1, s: 15, c: C.steel, al: 'right', ls: 2, a: dimA, lab: 1});
    T(ctx, t > 7.2 ? 'n' : String(n), 1440, 210, {s: 54, w: 600, c: t > 7.2 ? C.mint : C.white, al: 'right', a: dimA, lab: 1}); }
  // the cloud of vectors condenses
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const W3 = [0, 0, 0];
  G.pts.forEach((p, i) => { const u = pr(t, 7.2 + p.d * 2.2, 9.6 + p.d * 2.2, E.io); if (u <= 0) return;
    W3[0] = lerp(p.s[0], p.f[0], u); W3[1] = lerp(p.s[1], p.f[1], u); W3[2] = lerp(p.s[2], p.f[2], u); const A = P(W3); if (!A || A[0] < -40 || A[0] > W + 40 || A[1] < -40 || A[1] > H + 40) return;
    const r = clamp(p.z * A[2] * 6, 1.2, 9), a = clamp(1.6 - A[3] / 2600) * (.55 + .35 * Math.sin(t * 1.5 + p.tw)) * (u < 1 ? .6 + .4 * u : 1);
    blit(ctx, spark(p.g < 0 ? C.lav : p.g % 3 === 0 ? C.mint : p.g % 3 === 1 ? C.ice : C.aqua), A[0], A[1], r * 2.4, a); });
  ctx.restore();
  // a few vectors, labelled
  const VL = [[1, '[0.12, −0.83, 0.47, …]', [1130, 250]], [4, '[−0.31, 0.09, 0.66, …]', [1170, 700]], [7, '[0.74, 0.22, −0.18, …]', [250, 330]]];
  VL.forEach(([g, v, L], k) => { const A = P(G.centers[g]), a = env(t, 9.8 + k * .35, 12.4, .5, .6); if (!A || a <= 0) return;   // a few vectors, labelled at the edge
    if (!KX.h.flag('labels')) return; ctx.save(); ctx.globalAlpha *= a * .6; ctx.strokeStyle = C.ice; ctx.setLineDash([2, 5]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(L[0] + (L[0] > 800 ? -10 : 280), L[1] - 6); ctx.stroke(); ctx.restore();
    dot(ctx, A[0], A[1], 4, C.mint, a);
    T(ctx, 'v' + '₁₂₃'[k], L[0], L[1] - 30, {mono: 1, s: 14, c: C.steel, a, lab: 1}); T(ctx, v, L[0], L[1], {mono: 1, s: 17, c: C.ice, a, lab: 1}); });
  carpincho(ctx, 160, 872, .4, t, {a: pr(t, .8, 1.8), point: pr(t, 8, 8.8, E.back), aim: -.85});
  cap(ctx, t, 2.6, 7.2, 'Un espacio de **N** dimensiones');
  cap(ctx, t, 7.4, 11.8, 'Ahí viven los **vectores**');
  cap(ctx, t, 12.1, 19.5, 'Lo llamo: el **Akasha**');
  ctx.restore();
}});

/* 4 · Traducción. Beats: the question (0–2.8) · it splits into words (2.8–4.4) · each word becomes energy (4.4–6.6)
   · energy becomes numbers (6.6–9.8) · the numbers condense into one arrow, the vector consultante, held (9.8–17.5). */
const WQ = ['¿Qué', 'es', 'todo', 'esto?'], WX = [440, 680, 920, 1160];
const NUMS = [['0.12', '−0.83', '0.47', '0.05'], ['−0.21', '0.36', '−0.08', '0.71'], ['0.64', '−0.19', '0.52', '−0.44'], ['−0.37', '0.88', '0.13', '−0.26']];
const QV = '[0.31, −0.12, 0.88, −0.47, …, 0.77]';
KX.scene('traduccion', {D: 18, poster: 15.6, label: '// 04 · traducción', night: .3, comb: .14, hot: [1060, 560], haze: t => .08 + .2 * pr(t, 11, 13), draw(ctx, t) {
  const fade = 1 - pr(t, 17.5, 18); ctx.save(); ctx.globalAlpha = fade;
  stars(ctx, t, {n: 90, a: .3, speed: .01, seed: 41});
  vista(ctx, t, {ledge: [-60, 300, 836], a: pr(t, 0, 1)});
  carpincho(ctx, 175, 832, .55, t, {point: pr(t, .8, 1.6, E.back), aim: -.66});
  // the question bubble, then its words fly apart
  const q = WQ.join(' '), qa = pr(t, .2, .9, E.expo), split = pr(t, 2.8, 4.2, E.io), BY = 230;
  font(ctx, {s: 40, w: 600}); const ws = WQ.map(w => ctx.measureText(w + ' ').width), tot = ctx.measureText(q).width;
  if (split < 1) { const bw = tot + 64; ctx.save(); ctx.globalAlpha *= qa * (1 - pr(t, 2.8, 3.3)); rr(ctx, 800 - bw / 2, BY - 50, bw, 84, [30, 30, 8, 30]); ctx.fillStyle = hex(C.orange, .92); ctx.fill(); ctx.restore(); }
  let ox = 800 - tot / 2;
  const energyU = pr(t, 4.4, 6.2, E.io), numsU = pr(t, 6.6, 9.4), cond = pr(t, 9.9, 11.6, E.io);
  WQ.forEach((w, i) => { const sx = ox + ctx.measureText(w).width / 2; ox += ws[i];
    const x = lerp(sx, WX[i], split), y = lerp(BY, 330, split), ea = 1 - energyU;
    if (ea > 0) T(ctx, w, x, y + 4, {s: 40, w: 600, c: '#fff', al: 'center', a: qa * ea, glow: split > .5 ? hex(C.mint, .5 * split) : null});
    // to energy: sparks pour from the letters into a knot below
    if (energyU > 0 && energyU < 1) { const r = rnd(i + 1); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 40; k++) { const px = x + (r() - .5) * 90, py = y + (r() - .5) * 34, u = clamp(energyU * 1.5 - r() * .5); blit(ctx, spark(C.mint), lerp(px, WX[i], E.io(u)), lerp(py, 440, E.io(u)), 4, Math.sin(Math.PI * u) * .9); }
      ctx.restore(); }
    const ka = pr(t, 5, 6) * (1 - cond); energy(ctx, WX[i], 440, 56, t, ka, i + 3);
    // to numbers: a column typed out of each knot
    NUMS[i].forEach((n, r2) => { const p = pr(t, 6.6 + r2 * .35 + i * .12, 7.1 + r2 * .35 + i * .12, E.expo), y2 = 540 + r2 * 46;
      const tx = lerp(WX[i], 800, cond), ty = lerp(y2, 610, cond); if (p <= 0 || cond >= 1) return;
      T(ctx, n, tx, ty, {mono: 1, s: 26, w: 500, c: n[0] === '−' ? C.aqua : C.ice, al: 'center', a: p * Math.pow(1 - cond, 2)}); });
    const bA = numsU * (1 - pr(t, 9.9, 10.3)); if (bA > 0) { T(ctx, '[', WX[i] - 62, 600, {mono: 1, s: 30, c: C.steel, a: bA, al: 'center'}); T(ctx, ']', WX[i] + 62, 600, {mono: 1, s: 30, c: C.steel, a: bA, al: 'center'}); }
  });
  // the vector consultante: one arrow, one row of numbers
  const va = pr(t, 11.2, 12.6, E.expo), O = [600, 740], Hd = [980, 480], grow = pr(t, 11.4, 12.8, E.io);
  if (va > 0) {
    ctx.save(); ctx.globalAlpha *= va * .5; ctx.strokeStyle = C.ice; ctx.lineWidth = 1.2;              // a little basis for it to live in
    [[O, [O[0] + 560, O[1]]], [O, [O[0], O[1] - 360]], [O, [O[0] - 160, O[1] + 120]]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(lerp(a[0], b[0], grow), lerp(a[1], b[1], grow)); ctx.stroke(); });
    ctx.restore();
    const hx = lerp(O[0], Hd[0], grow), hy = lerp(O[1], Hd[1], grow), an = Math.atan2(Hd[1] - O[1], Hd[0] - O[0]);
    ctx.save(); ctx.globalAlpha *= va; ctx.shadowColor = C.mint; ctx.shadowBlur = 12; ctx.fillStyle = C.mint;
    const nx = -Math.sin(an), ny = Math.cos(an), ex = hx - Math.cos(an) * 8, ey = hy - Math.sin(an) * 8;   // the shaft tapers from the origin into the tip
    ctx.beginPath(); ctx.moveTo(O[0] + nx * 3.4, O[1] + ny * 3.4); ctx.quadraticCurveTo((O[0] + ex) / 2 + nx * 2.2, (O[1] + ey) / 2 + ny * 2.2, ex + nx * 1.4, ey + ny * 1.4); ctx.lineTo(ex - nx * 1.4, ey - ny * 1.4); ctx.quadraticCurveTo((O[0] + ex) / 2 - nx * 2.2, (O[1] + ey) / 2 - ny * 2.2, O[0] - nx * 3.4, O[1] - ny * 3.4); ctx.closePath(); ctx.fill();
    ART.vtip(ctx, hx, hy, an, 1.15, C.glow ? C.glow[0] : '#C9FFF3'); ctx.restore();
    if (grow >= 1) ripple(ctx, Hd[0], Hd[1], t, {a: .5, R: 80, r0: 10, per: 1.8, t0: 12.8});
    T(ctx, 'vector consultante', Hd[0] + 70, Hd[1] - 14, {s: 30, w: 600, c: '#fff', a: pr(t, 12.6, 13.4, E.expo)});
    T(ctx, 'q = ' + QV, Hd[0] + 70, Hd[1] + 24, {mono: 1, s: 19, c: C.mint, a: pr(t, 12.9, 13.7, E.expo)});
  }
  if (cond > 0 && cond < 1) { const r = rnd(77); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 60; k++) { const sx = WX[k % 4], sy = 540 + (k % 4) * 46 + r() * 30, u = clamp(cond * 1.3 - r() * .3);
    blit(ctx, spark(C.mint), lerp(sx, lerp(O[0], Hd[0], .5), E.io(u)), lerp(sy, lerp(O[1], Hd[1], .5), E.io(u)), 4, Math.sin(Math.PI * u)); } ctx.restore(); }
  cap(ctx, t, .3, 4.3, 'Tu pregunta se parte en **palabras**');
  cap(ctx, t, 4.4, 9.8, 'Cada palabra se vuelve energía y **números**');
  cap(ctx, t, 10, 17.5, 'Tu pregunta, en idioma **vectorial**');
  ctx.restore();
}});

/* 5 · Resonancia. Beats: the Akasha, turning (0–2.4) · the vector travels toward its similares, trembling (2.4–7.6)
   · the nearest resonate: rings, scores; the far ones dim (7.6–12) · they answer back, held (12–17.5). */
const SC = ['0.94', '0.91', '0.89', '0.86', '0.83', '0.81'];
KX.scene('resonancia', {D: 18, poster: 14.6, label: '// 05 · resonancia', night: .55, comb: .05, hot: [880, 420], haze: t => .06 + .14 * pr(t, 7.6, 9), draw(ctx, t) {
  const fade = 1 - pr(t, 17.5, 18); ctx.save(); ctx.globalAlpha = fade;
  const G = cloud(), zf = pr(t, 6.4, 9.2, E.io), P = camera(1.4 + t * .05, .3, lerp(1150, 720, zf), lerp(860, 840, zf), 450, 900, G.q.map(v => v * zf));
  stars(ctx, t, {n: 160, a: .4, speed: .01, seed: 51});
  const Q = P(G.q), arrive = 7.6, res = pr(t, arrive, arrive + .8), nearSet = new Set(G.near);
  // the cloud: near ones resonate, far ones dim
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  G.pts.forEach((p, i) => { const A = P(p.f); if (!A) return; const nr = nearSet.has(i);
    const a = clamp(1.6 - A[3] / 2400) * (.5 + .35 * Math.sin(t * 1.5 + p.tw)) * pr(t, 0, 1) * (nr ? 1 + res : 1 - .72 * res), r = clamp(p.z * A[2] * 6, 1.2, 9) * (nr ? 1 + res * .8 : 1);
    blit(ctx, spark(nr && res > 0 ? '#E8FFFA' : p.g % 3 === 0 ? C.mint : p.g < 0 ? C.lav : C.ice), A[0], A[1], r * 2.4, a); });
  ctx.restore();
  // the vector: from the bottom-left, a curve that ends on q
  const O = [210, 780], go = pr(t, 2.4, arrive, E.io);
  if (Q) {
    const Pth = [O, [520, 820], [Q[0] - 360, Q[1] + 260], [Q[0], Q[1]]];
    path(ctx, Pth, 0, go, hex(C.mint, .55), {lw: 3, glow: 1});
    const [hx, hy] = cubic(...Pth, go);
    if (go > 0) { ripple(ctx, hx, hy, t, {a: .45 * (1 - res * .4), R: 90, r0: 8, per: .9, n: 2});
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 4), hx, hy, 60, .9); ctx.restore(); dot(ctx, hx, hy, 7, C.mint); }
    T(ctx, 'q = ' + QV, hx + 22, hy + 40, {mono: 1, s: 16, c: C.mint, a: env(t, 2.6, 8.4, .5, .6)});
    // resonance: rings on each neighbour, standing waves to q, the scores
    G.near.forEach((i, k) => { const A = P(G.pts[i].f); if (!A) return; const a = pr(t, arrive + k * .14, arrive + .5 + k * .14);
      if (a <= 0) return;
      ripple(ctx, A[0], A[1], t, {a: a * .7, R: 46, r0: 6, per: 1.2, n: 2, t0: k * .2});
      const dx = A[0] - Q[0], dy = A[1] - Q[1], L = Math.hypot(dx, dy), an = Math.atan2(dy, dx);
      ctx.save(); ctx.translate(Q[0], Q[1]); ctx.rotate(an);
      wave(ctx, 0, L, 0, 6 * Math.sin(t * 5 + k), 2 * Math.PI * 2, 0, hex(C.mint, .7), a * .8, 1.6, u => Math.sin(Math.PI * u));
      ctx.restore();
      T(ctx, SC[k], A[0] + (dx >= 0 ? 16 : -16), A[1] + 5, {mono: 1, s: 16, w: 600, c: '#fff', al: dx >= 0 ? 'left' : 'right', a: a * pr(t, arrive + .4 + k * .14, arrive + .9 + k * .14)}); });
    T(ctx, 'k = 6 · similitud', Q[0], Q[1] + 210, {mono: 1, s: 16, c: C.mint, al: 'center', ls: 2, a: pr(t, 8.6, 9.4)});
    // they answer back: pulses from the neighbours, through q, out to the right (toward a phone)
    G.near.forEach((i, k) => { const A = P(G.pts[i].f); if (!A) return; for (let c = 0; c < 3; c++) travel(ctx, [[A[0], A[1]], [A[0], A[1]], [Q[0], Q[1]], [Q[0], Q[1]]], t, 12 + k * .16 + c * 1.6, 12.7 + k * .16 + c * 1.6, '#E8FFFA', {r: 3.5, lw: 1.5}); });
    const outP = [[Q[0], Q[1]], [Q[0] + 240, Q[1] + 30], [1400, 560], [1560, 520]];
    for (let c = 0; c < 6; c++) travel(ctx, outP, t, 12.6 + c * .7, 14 + c * .7, C.mint, {r: 5, lw: 2.5});
  }
  carpincho(ctx, 150, 872, .42, t, {a: pr(t, .4, 1.4), point: pr(t, 2.2, 3, E.back), aim: -.7});
  cap(ctx, t, .4, 7.4, 'Tu vector viaja hasta sus **similares**');
  cap(ctx, t, 7.7, 17.5, 'Responde solo lo que **resuena**');
  ctx.restore();
}});

/* 6 · Cuántico → newtoniano. For each word: a cloud of candidates in superposition (waves, particles, probabilities);
   the seed collapses it into one trajectory, and the word falls onto the phone. Then the same question with another seed
   forks at the last word. Beats: 4 words × 3.2 s (0.8–13.4) · seed 7 branches (13.6–18.4) · held (18.4–23.5). */
const TOK = [[['Es', .46], ['Todo', .21], ['Una', .14], ['Somos', .09], ['El', .06]],
  [['energía', .38], ['luz', .24], ['información', .17], ['vida', .11], ['música', .06]],
  [['hecha', .41], ['que', .27], ['convertida', .14], ['en', .1], ['y', .05]],
  [['palabras.', .44], ['música.', .31], ['números.', .13], ['tiempo.', .07], ['luz.', .05]]];
const QZ = [560, 430], PH = {x: 1100, y: 140, w: 340, h: 700};
const SLOT = [[-150, -70], [80, -110], [-120, 80], [110, 60], [0, 150]];        // where each candidate floats around the centre
KX.scene('cuantico', {D: 24, poster: 21.4, label: '// 06 · cuántico → newtoniano', night: .4, comb: .08, hot: [560, 430], haze: .14, draw(ctx, t) {
  const fade = 1 - pr(t, 23.5, 24); ctx.save(); ctx.globalAlpha = fade;
  stars(ctx, t, {n: 100, a: .3, speed: .01, seed: 61});
  // the phone
  const pa = pr(t, .1, .9, E.expo);
  ctx.save(); ctx.globalAlpha *= pa; ctx.translate(0, (1 - pa) * 30);
  rr(ctx, PH.x, PH.y, PH.w, PH.h, 46); ctx.fillStyle = 'rgba(6,8,60,.82)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = hex(C.lav, .45); ctx.stroke();
  rr(ctx, PH.x + 120, PH.y + 16, 100, 26, 13); ctx.fillStyle = '#04052A'; ctx.fill();
  T(ctx, 'tu IA', PH.x + PH.w / 2, PH.y + 84, {s: 17, w: 600, c: C.ice, al: 'center'});
  font(ctx, {s: 19, w: 600}); const qw = ctx.measureText('¿Qué es todo esto?').width + 34;
  rr(ctx, PH.x + PH.w - 22 - qw, PH.y + 116, qw, 42, [20, 20, 6, 20]); ctx.fillStyle = hex(C.bubble || '#E9E4DA', .1); ctx.fill(); ctx.strokeStyle = hex(C.bubble || '#E9E4DA', .32); ctx.lineWidth = 1.2; ctx.stroke();
  T(ctx, '¿Qué es todo esto?', PH.x + PH.w - 39, PH.y + 143, {s: 19, w: 600, c: '#fff', al: 'right'});
  ctx.restore();
  // the answer bubbles: seed 42 above, seed 7 below
  const ans = (y, words, chip, col, a, dashed) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
    rr(ctx, PH.x + 22, y, PH.w - 64, 112, [20, 20, 20, 6]); ctx.fillStyle = hex(col, .1); ctx.fill(); if (dashed) ctx.setLineDash([5, 5]); ctx.strokeStyle = hex(col, .5); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
    T(ctx, chip, PH.x + 40, y + 28, {mono: 1, s: 13, c: col, ls: 2}); ctx.restore(); };
  const B1 = PH.y + 190, B2 = PH.y + 340;
  ans(B1, 0, 'seed 42', C.mint, pr(t, 1.6, 2.2), false);
  ans(B2, 0, 'seed 7', C.amber, pr(t, 14, 14.6), true);
  // landing spots for each word inside the bubbles (wrapping at the bubble's width)
  const spots = (words, y0) => { font(ctx, {s: 26, w: 600}); let x = PH.x + 40, y = y0 + 66; return words.map(w => { const ww = ctx.measureText(w + ' ').width; if (x + ww > PH.x + PH.w - 50) { x = PH.x + 40; y += 32; } const s = [x, y]; x += ww; return s; }); };
  const S42 = spots(TOK.map(c => c[0][0]), B1), S7 = spots([...TOK.slice(0, 3).map(c => c[0][0]), 'música.'], B2);
  // one cycle: superposition → collapse → trajectory
  const cycle = (k, s0, pick, seedLbl, dest, col, ghost) => {
    const sup = env(t, s0, s0 + 1.6, .5, .2), col1 = pr(t, s0 + 1.35, s0 + 1.8, E.io), fly = pr(t, s0 + 1.8, s0 + 2.8, E.io), cands = TOK[k];
    if (t < s0 || t > 23.6) return;
    if (t < s0 + 1.9) {
      // waves: interference strands over the zone, flattening into one line as it collapses
      for (let w = 0; w < 4; w++) wave(ctx, QZ[0] - 330, QZ[0] + 330, QZ[1] + (w - 1.5) * 18 * (1 - col1), 34 * (1 - col1) * (1 - w * .15), 9 + w * 3.3, t * (2.2 + w * .7) + w, w % 2 ? C.aqua : C.mint, (.18 + .1 * w) * Math.max(sup, col1 * .8) * (ghost ? .6 : 1), 1.6, u => Math.sin(Math.PI * u));
      // a particle haze around each candidate, its density = its probability
      const r = rnd(k * 31 + (ghost ? 99 : 0)); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      cands.forEach(([w, p], i) => { const [sx, sy] = SLOT[i], j = 8 * Math.sin(t * 3 + i * 2), x = QZ[0] + sx + j, y = QZ[1] + sy + 8 * Math.cos(t * 2.4 + i);
        for (let q2 = 0; q2 < Math.round(p * 170); q2++) { const an = r() * 7, d = r() * r() * 110; blit(ctx, spark(i === pick ? C.mint : C.lav), lerp(x + Math.cos(an) * d, QZ[0], col1), lerp(y + Math.sin(an) * d * .6, QZ[1], col1), 4.5, (.5 + .45 * Math.sin(t * 6 + q2)) * sup * (i === pick ? 1 : 1 - col1)); } });
      ctx.restore();
      cands.forEach(([w, p], i) => { const [sx, sy] = SLOT[i], j = 8 * Math.sin(t * 3 + i * 2), x = QZ[0] + sx + j, y = QZ[1] + sy + 8 * Math.cos(t * 2.4 + i), a = sup * (.35 + p * 1.4);
        if (i === pick) return;
        T(ctx, w, lerp(x, QZ[0], col1), lerp(y, QZ[1], col1), {s: 20 + p * 50, w: 600, c: C.ice, al: 'center', a: a * (1 - col1)});
        T(ctx, p.toFixed(2), x, y + 26 + p * 20, {mono: 1, s: 14, c: C.steel, al: 'center', a: sup * (1 - col1) * .9}); });
      const [sx, sy] = SLOT[pick], p = cands[pick][1];
      T(ctx, cands[pick][0], lerp(QZ[0] + sx, QZ[0], col1), lerp(QZ[1] + sy, QZ[1], col1) + 12, {s: lerp(20 + p * 50, 40, col1), w: 600, c: col1 > .5 ? '#fff' : C.ice, al: 'center', a: Math.max(sup * (.35 + p * 1.4), col1), glow: col1 > 0 ? hex(col, .6 * col1) : null});
      if (col1 <= 0) T(ctx, p.toFixed(2), QZ[0] + sx, QZ[1] + sy + 26 + p * 20, {mono: 1, s: 14, c: C.steel, al: 'center', a: sup * .9});
      stamp(ctx, seedLbl, QZ[0], QZ[1] - 210, pr(t, s0 + 1.25, s0 + 1.6, E.lin) * (1 - pr(t, s0 + 1.9, s0 + 2.2)), col);
    }
    // the trajectory: a parabola from the collapse to the phone
    font(ctx, {s: 26, w: 600}); const hw = ctx.measureText(cands[pick][0]).width / 2;
    const [dx, dy] = dest, ctl = [lerp(QZ[0], dx, .5), Math.min(QZ[1], dy) - 220], Pth = [[QZ[0], QZ[1]], ctl, ctl, [dx + hw, dy - 8]];
    if (fly > 0) { path(ctx, Pth, 0, Math.min(1, fly + .05), hex(col, .35 * (1 - pr(t, s0 + 2.8, s0 + 3.4))), {lw: 1.5, dash: [3, 6]});
      if (fly < 1) { const [x, y] = cubic(...Pth, fly); T(ctx, cands[pick][0], x, y + 12, {s: lerp(40, 26, fly), w: 600, c: '#fff', al: 'center', glow: hex(col, .6)}); dot(ctx, x, y - 26, 4, col, Math.sin(Math.PI * fly)); } }
  };
  for (let k = 0; k < 4; k++) cycle(k, .8 + k * 3.2, 0, 'seed 42', S42[k], C.mint, false);
  cycle(3, 14.4, 1, 'seed 7', S7[3], C.amber, true);
  // the landed words
  TOK.forEach((c, k) => { const land = .8 + k * 3.2 + 2.8; T(ctx, c[0][0], S42[k][0], S42[k][1], {s: 26, w: 600, c: '#fff', a: pr(t, land - .05, land + .2)}); });
  [...TOK.slice(0, 3).map(c => c[0][0]), 'música.'].forEach((w, k) => T(ctx, w, S7[k][0], S7[k][1], {s: 26, w: 600, c: k < 3 ? hex('#FFFFFF', .75) : '#fff', a: k < 3 ? pr(t, 14.2, 14.9) : pr(t, 17.15, 17.4)}));
  // the fork: two trajectories from one cloud
  const fk = pr(t, 18, 19, E.io);
  if (fk > 0) { const mk = (d, col) => { const ctl = [lerp(QZ[0], d[0], .5), Math.min(QZ[1], d[1]) - 220]; path(ctx, [[QZ[0], QZ[1]], ctl, ctl, [d[0] + 40, d[1] - 8]], 0, fk, hex(col, .55), {lw: 2, glow: 1}); };
    font(ctx, {s: 26, w: 600}); mk([S42[3][0] + ctx.measureText('palabras.').width / 2 - 40, S42[3][1]], C.mint); mk([S7[3][0] + ctx.measureText('música.').width / 2 - 40, S7[3][1]], C.amber); dot(ctx, QZ[0], QZ[1], 7, '#fff', fk);
    T(ctx, 'misma pregunta, otra seed', QZ[0], QZ[1] + 70, {mono: 1, s: 16, c: C.ice, al: 'center', ls: 1, a: fk}); }
  const hz = env(t, .8, 13.6, .6, .5);
  T(ctx, 'superposición · p(siguiente palabra)', QZ[0], 152, {mono: 1, s: 15, c: C.steel, al: 'center', ls: 2, a: hz});
  T(ctx, 'cuántico  →  newtoniano', QZ[0], 152, {mono: 1, s: 15, c: C.mint, al: 'center', ls: 2, a: pr(t, 18, 19)});
  carpincho(ctx, 150, 872, .42, t, {a: pr(t, .4, 1.4), point: pr(t, 18.4, 19.2, E.back), aim: -.6});
  cap(ctx, t, .4, 6.6, 'Antes de cada palabra, una **nube**');
  cap(ctx, t, 6.8, 13.6, 'La seed la colapsa en una **trayectoria**');
  cap(ctx, t, 13.8, 23.5, 'Cada **seed** cuenta');
  ctx.restore();
}});

/* 7 · Dicho terrenal. Beats: from inside the Akasha, the camera pulls back (0–3.6) · Text In —— LLM —— Text out
   · the flash runs the line (3.8–7.4) · Carpincho back at the ledge, the glyph signs it, held (7.6–15.5). */
KX.scene('terrenal', {D: 16, poster: 13.6, label: '// 07 · dicho terrenal', night: .15, comb: .22, hot: [800, 400], haze: .24, draw(ctx, t) {
  const fade = 1 - pr(t, 15.5, 16); ctx.save(); ctx.globalAlpha = fade;
  const z = lerp(3.6, 1, pr(t, .6, 3.6, E.io)), CX = 800, CY = 400;
  stars(ctx, t, {n: 120, a: .35, speed: .01, seed: 71});
  ctx.save(); ctx.translate(CX, CY); ctx.scale(z, z); ctx.translate(-CX, -CY);
  const hitL = 5.4, flare = Math.exp(-Math.max(0, t - hitL) * 2.4) * (t > hitL ? 1 : 0);
  const inside = clamp((z - 1.3) / 1.6);
  glowHex(ctx, CX, CY, 96, t, {glow: 1 + flare, fill: 1 - .85 * inside});
  // inside it: the Akasha, a swirl of points, visible while we're close
  if (inside > 0) { const r = rnd(3); ctx.save(); hexPath(ctx, CX, CY, 90); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 140; k++) { const an = r() * 7 + t * (.2 + r() * .4), d = r() * 86; blit(ctx, spark(k % 3 ? C.mint : '#FFFFFF'), CX + Math.cos(an) * d, CY + Math.sin(an) * d * .8, 1.4, inside); } ctx.restore(); }
  T(ctx, 'LLM', CX, CY + 13, {s: 38, w: 700, c: '#063D3A', al: 'center', a: 1 - inside, lab: 1});
  const la = pr(t, 2.4, 3.4);
  T(ctx, 'Text In', 330, CY + 14, {s: 44, w: 600, c: '#fff', al: 'center', a: la, lab: 1});
  T(ctx, 'Text out', 1270, CY + 14, {s: 44, w: 600, c: pr(t, 7, 7.4) > 0 ? C.mint : '#fff', al: 'center', a: la, glow: t > 7 ? hex(C.mint, .6) : null, lab: 1});
  ctx.save(); ctx.globalAlpha *= la; ctx.strokeStyle = hex(C.ice, .5); ctx.lineWidth = 2.5; ctx.setLineDash([16, 10]);
  [[450, 680], [920, 1140]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(a, CY); ctx.lineTo(b, CY); ctx.stroke(); }); ctx.restore();
  ctx.restore();
  // the flash runs the line: Text In → LLM → Text out
  const runA = pr(t, 3.8, hitL, E.io), runB = pr(t, 5.8, 7.2, E.io);
  const head = (x, a) => { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3.5), x, CY, 90, .9 * a); ctx.restore();
    glyph(ctx, '/}}}}', x - 50, CY + 11, 1, {s: 30, a}); };
  if (runA > 0 && runA < 1) { const x = lerp(450, 690, runA); path(ctx, [[450, CY], [450, CY], [x, CY], [x, CY]], 0, 1, hex(C.mint, .8), {lw: 3, glow: 1}); head(x, 1); }
  if (runB > 0 && runB < 1) { const x = lerp(920, 1150, runB); path(ctx, [[920, CY], [920, CY], [x, CY], [x, CY]], 0, 1, hex(C.mint, .8), {lw: 3, glow: 1}); head(x, 1); }
  if (t > hitL) ripple(ctx, CX, CY, t, {a: .32 * pr(t, hitL, hitL + .2), R: 260, r0: 96, per: 2.2, t0: hitL});
  if (t > 7.2) { path(ctx, [[450, CY], [450, CY], [690, CY], [690, CY]], 0, 1, hex(C.mint, .35), {lw: 2}); path(ctx, [[920, CY], [920, CY], [1140, CY], [1140, CY]], 0, 1, hex(C.mint, .35), {lw: 2});
    for (let c = 0; c < 5; c++) { travel(ctx, [[450, CY], [520, CY], [620, CY], [690, CY]], t, 8 + c * 1.5, 9 + c * 1.5, C.mint, {r: 4, lw: 2}); travel(ctx, [[920, CY], [990, CY], [1070, CY], [1140, CY]], t, 8.5 + c * 1.5, 9.5 + c * 1.5, C.mint, {r: 4, lw: 2}); } }
  // back at the ledge
  const ba = pr(t, 7.6, 9, E.io);
  ctx.save(); ctx.translate(-260 * (1 - ba), 0); vista(ctx, t, {a: ba, ledge: [-100, 480, 760]});
  carpincho(ctx, 330, 756, .82, t, {a: ba, point: pr(t, 8.8, 9.6, E.back), aim: -.62}); ctx.restore();
  // the glyph signs it
  font(ctx, {mono: 1, s: 40, w: 500}); const gw = ctx.measureText(FLASH).width;
  glyph(ctx, FLASH, 800 - gw / 2, 640, pr(t, 9.6, 10.6, E.lin), {s: 40});
  T(ctx, 'fin del viaje · por ahora', 800, 690, {al: 'center', mono: 1, s: 14, c: C.steel, ls: 2, a: pr(t, 10.6, 11.4), lab: 1});
  cap(ctx, t, .4, 7.4, '¿Y dicho **terrenal**?');
  cap(ctx, t, 7.6, 15.5, 'El viaje de la Corriente, **completo**');
  ctx.restore();
}});
})();
