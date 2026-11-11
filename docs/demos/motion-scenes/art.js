/* Carpincho y el Akasha · shared art: the hero and the motifs every scene reuses.
   carpincho(ctx, x, y, s, t, o)   the capybara, feet at (x, y), facing right (o.dir = -1 faces left).
                                   o.point 0..1 raises the front paw toward o.aim (radians); o.walk = phase for a trot;
                                   o.rim = mint rim light from the glow; o.look = head tilt.
   vista(ctx, t, o)                the wallpaper's composition: the great curve bottom-left and the ledge.
   glowHex(ctx, x, y, R, t, o)     the glowing hexagon (pointy-top), with halo and bevel.
   ripple(...)                     resonance rings, a pure function of t.
   stars(...)                      a starfield with depth, drifting toward the camera.
   glyph(...)                      the user's `——/}}}}——` flash, typed. */
(() => {
const {W, H, C, E, clamp, lerp, pr, rnd, hex, T, cubic, halo, spark, ringS, blit} = KX.h;

function hexPath(ctx, x, y, R, rot = 0) {
  ctx.beginPath();
  for (let k = 0; k < 6; k++) { const an = rot - Math.PI / 2 + Math.PI / 3 * k; const px = x + R * Math.cos(an), py = y + R * Math.sin(an); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath();
}
function glowHex(ctx, x, y, R, t, o = {}) {
  const a = o.a ?? 1; if (a <= 0) return; const br = 1 + (o.pulse ?? 1) * .04 * Math.sin(t * 1.7), RR = R * br, fill = o.fill ?? 1;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.globalCompositeOperation = 'lighter';
  blit(ctx, halo(C.mint, 2.4), x, y, RR * 3.6, .32 * (o.glow ?? 1));
  blit(ctx, halo(C.mint, 5), x, y, RR * 1.8, .3 * (o.glow ?? 1));
  ctx.globalCompositeOperation = 'source-over';
  if (fill > 0) {
    ctx.save(); ctx.globalAlpha *= fill; hexPath(ctx, x, y, RR, o.rot || 0);
    const g = ctx.createRadialGradient(x - RR * .15, y - RR * .2, 0, x, y, RR * 1.05); const gl = C.glow || ['#B8FFF0', '#6CF0D6', '#3FCFC0']; g.addColorStop(0, gl[0]); g.addColorStop(.55, gl[1]); g.addColorStop(1, gl[2]);
    ctx.fillStyle = g; ctx.fill();
    hexPath(ctx, x, y, RR * .8, o.rot || 0); ctx.lineWidth = RR * .055; ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.stroke();   // the bevel
    ctx.restore();
  }
  hexPath(ctx, x, y, RR, o.rot || 0); ctx.lineWidth = Math.max(2, RR * .05); ctx.strokeStyle = hex(C.glow ? C.glow[0] : '#A8FFF2', .85); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
function hexOutline(ctx, x, y, R, col, a, lw = 2, rot = 0) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; hexPath(ctx, x, y, R, rot); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); }

/* ---------- the hero ---------- */
const FUR = ['#FFB067', '#FF7A3D', '#C9472B'];
function limb(ctx, px, py, ang, len, w, col, paw) {
  ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
  ctx.beginPath(); ctx.roundRect(-w / 2, -w / 2, len + w / 2, w, w / 2); ctx.fillStyle = col; ctx.fill();
  if (paw) { ctx.fillStyle = paw; ctx.beginPath(); ctx.ellipse(len - 2, 0, w * .42, w * .5, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}
function karpincho(ctx, x, y, s, t, o = {}) {
  const a = o.a ?? 1; if (a <= 0 || s <= 0) return;
  const dir = o.dir || 1, point = clamp(o.point ?? 0), aim = clamp(o.aim ?? -.5, -.56, -.3), rim = o.rim ?? 1, walk = o.walk;
  const breathe = 1 + .014 * Math.sin(t * 2.1), sw = walk === undefined ? 0 : Math.sin(walk), bob = walk === undefined ? 0 : Math.abs(Math.cos(walk)) * 4;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.globalAlpha *= a;
  const tip = -.15 * E.out(point); ctx.translate(-70, 0); ctx.rotate(tip); ctx.translate(70, 0);   // rears up a little to point
  if (!o.noShadow) { ctx.fillStyle = 'rgba(3,4,40,.42)'; ctx.beginPath(); ctx.ellipse(-8, 3, 118, 11, 0, 0, 7); ctx.fill(); }   // shadow
  ctx.translate(0, -bob);
  // far legs, in shade
  limb(ctx, -66, -46, Math.PI / 2 + sw * .35, 42, 24, '#A53A2A', '#8C2F25');
  limb(ctx, 30, -46, Math.PI / 2 - sw * .35, 42, 24, '#A53A2A', '#8C2F25');
  ctx.save(); ctx.translate(-20, -70); ctx.scale(1, breathe); ctx.translate(20, 70);
  // the tuft: a nod to the spiky one in the wallpaper, sunk into the back
  const tuftBase = [[-92, -112], [-66, -140], [-6, -140], [32, -120]];
  for (let i = 0; i < 9; i++) {
    const u = .08 + i * .062, [bx, by] = cubic(...tuftBase, u), [nx, ny] = cubic(...tuftBase, u + .01);
    const ang = Math.atan2(ny - by, nx - bx) - Math.PI / 2 - .55 + .05 * Math.sin(t * 1.3 + i), L = 26 + 12 * Math.sin(i * 2.1 + 1) ** 2;
    const tx = bx + Math.cos(ang) * L, ty = by + Math.sin(ang) * L, pa = ang + Math.PI / 2;
    const g = ctx.createLinearGradient(bx, by, tx, ty); g.addColorStop(0, '#6E2463'); g.addColorStop(.7, '#B8406E'); g.addColorStop(1, '#FF9A7A');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx + Math.cos(pa) * 8, by + Math.sin(pa) * 8 + 10); ctx.lineTo(tx, ty); ctx.lineTo(bx - Math.cos(pa) * 8, by - Math.sin(pa) * 8 + 10); ctx.closePath(); ctx.fill();
  }
  // the barrel
  ctx.beginPath(); ctx.moveTo(-104, -40);
  ctx.bezierCurveTo(-124, -66, -118, -112, -92, -120);
  ctx.bezierCurveTo(-60, -142, 0, -140, 32, -124);
  ctx.bezierCurveTo(64, -110, 80, -82, 72, -52);
  ctx.bezierCurveTo(52, -26, -60, -22, -104, -40); ctx.closePath();
  let g = ctx.createLinearGradient(0, -140, 0, -24); g.addColorStop(0, FUR[0]); g.addColorStop(.5, FUR[1]); g.addColorStop(1, FUR[2]);
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();                                                      // rim light from the glow, and a soft belly shade
  ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3), 90, -120, 120, .38 * rim);
  ctx.globalCompositeOperation = 'source-over'; blit(ctx, halo('#5A1A3A', 2.5), -40, -10, 120, .35);
  ctx.strokeStyle = 'rgba(120,30,30,.18)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';   // a few strokes of fur
  [[-80, -86, -66, -80], [-50, -100, -36, -94], [-20, -82, -6, -76], [-64, -60, -50, -56]].forEach(([x1, y1, x2, y2]) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
  ctx.restore();
  ctx.restore();
  // near hind leg
  limb(ctx, -54, -44, Math.PI / 2 - sw * .35, 44, 27, '#D0552F', '#B4442A');
  // the head: boxy, blunt square snout, tipped a little down
  ctx.save(); ctx.translate(58, -110); ctx.rotate(.2 + (o.look ?? 0) - point * .45);
  ctx.beginPath(); ctx.roundRect(-30, -40, 108, 72, [30, 22, 18, 30]);
  g = ctx.createLinearGradient(0, -40, 0, 32); g.addColorStop(0, FUR[0]); g.addColorStop(.6, FUR[1]); g.addColorStop(1, '#D35A33');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3), 84, -36, 70, .42 * rim); ctx.restore();
  ctx.fillStyle = 'rgba(120,30,30,.16)'; ctx.beginPath(); ctx.roundRect(50, -8, 28, 40, [0, 14, 16, 0]); ctx.fill();   // the muzzle's front plane
  ctx.fillStyle = '#B4442A'; ctx.beginPath(); ctx.ellipse(-6, -42, 11, 9, -.3, 0, 7); ctx.fill();     // ear
  ctx.fillStyle = '#7A2A3A'; ctx.beginPath(); ctx.ellipse(-5, -41, 5, 4, -.3, 0, 7); ctx.fill();
  const blink = (t % 4.3) > 4.12 ? .15 : 1;                                    // eye, with a blink
  ctx.fillStyle = '#1B0F2E'; ctx.beginPath(); ctx.ellipse(26, -14, 5.5, 6 * blink, 0, 0, 7); ctx.fill();
  if (blink > .5) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(28, -16.5, 1.8, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#3A1424'; ctx.beginPath(); ctx.ellipse(70, -10, 4, 2.6, .3, 0, 7); ctx.fill();    // nostril
  ctx.strokeStyle = '#7A2A3A'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(58, 22); ctx.quadraticCurveTo(66, 26, 74, 20); ctx.stroke();
  ctx.restore();
  // near front leg: stands, or rises to point. It leaves the chest low and behind the head and passes under the jaw,
  // so the snout and the raised paw always keep a gap (the head tips up toward what it points at).
  const stand = Math.PI / 2 + sw * .35, ang = lerp(stand, aim - tip, E.out(point)), len = lerp(46, 128, point), SX = 44, SY = -40;
  if (point > .02) { ctx.save(); ctx.translate(SX, SY); ctx.rotate(ang); ctx.beginPath(); ctx.roundRect(-13, -13, len + 13, 26, 13);   // a dark rim so the leg reads over the fur
    ctx.strokeStyle = 'rgba(90,20,40,.6)'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); }
  limb(ctx, SX, SY, ang, len, 24, '#F0703A', '#FFB067');
  if (point > .5) { ctx.save(); ctx.translate(SX + Math.cos(ang) * len, SY + Math.sin(ang) * len); ctx.rotate(ang);   // three toes on the pointing paw
    ctx.strokeStyle = 'rgba(150,50,40,.55)'; ctx.lineWidth = 2; [-5, 0, 5].forEach(d => { ctx.beginPath(); ctx.moveTo(4, d); ctx.lineTo(10, d * 1.2); ctx.stroke(); }); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';                                   // the paw catches the glow it points at
    blit(ctx, halo(C.mint, 4), SX + Math.cos(ang) * len, SY + Math.sin(ang) * len, 26, (point - .5) * .9 * rim); ctx.restore(); }
  ctx.restore();
  const lx = SX + Math.cos(ang) * (len + 10) - 70, ly = SY + Math.sin(ang) * (len + 10) - bob;   // the paw tip, in the caller's space
  return [x + dir * s * (70 + lx * Math.cos(tip) - ly * Math.sin(tip)), y + s * (lx * Math.sin(tip) + ly * Math.cos(tip))];   // the paw tip, in the caller's space
}
/* the Gordo: white, shaggy, wise and eternal. Long ears that hang, heavy brows, a beard, pale blue eyes half-lidded,
   a big brown nose. Same contract as the old hero: feet at (x, y), facing right; o.point raises the front paw toward o.aim;
   returns the paw tip in the caller's space. */
const GW = {hi: '#FBF8F2', mid: '#E9E3D9', lo: '#C9C0B3', shade: '#B3AA9D', far: '#BDB4A8', farPaw: '#A79E92', nose: '#5A3333', eye: '#A9C9DB'};
function fringe(ctx, x0, x1, y, n, len, t, ph = 0) {                          // a row of soft hanging locks, from x0 to x1 at y
  for (let i = 0; i < n; i++) { const xa = lerp(x0, x1, i / n), xb = lerp(x0, x1, (i + 1) / n), xm = (xa + xb) / 2 + 2 * Math.sin(t * 1.2 + i + ph);
    ctx.lineTo(xa, y); ctx.quadraticCurveTo(xm - (xb - xa) * .2, y + len * (.7 + .3 * Math.sin(i * 2.3 + ph) ** 2), xb, y); }
}
/* hair: fine wiry strands along a cubic edge P, pointing out (side ±1) and falling (fall 0..1 toward the ground). Seeded, so it holds still; it only sways. */
function hair(ctx, P, t, o = {}) {
  const r = rnd(o.seed || 1), n = o.n || 24, L = o.len || 12, fall = o.fall ?? .3, side = o.side ?? 1, cols = o.cols || [GW.hi, GW.mid];
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const u = (i + r()) / n, [x, y] = cubic(...P, u), [qx, qy] = cubic(...P, Math.min(1, u + .01));
    let nx = -(qy - y) * side, ny = (qx - x) * side; const nl = Math.hypot(nx, ny) || 1; nx = nx / nl * (1 - fall); ny = ny / nl * (1 - fall) + fall;
    const k = Math.hypot(nx, ny) || 1, l = L * (.55 + .9 * r()), sw = (o.sway ?? 1.5) * Math.sin(t * 1.1 + i * 1.7 + (o.seed || 0)), bend = (r() - .5) * l * .5;
    const ex = x + nx / k * l + sw, ey = y + ny / k * l, cx = x + nx / k * l * .5 - ny / k * bend, cy = y + ny / k * l * .5 + nx / k * bend;
    ctx.strokeStyle = hex(cols[i % cols.length], o.a ?? .55); ctx.lineWidth = (o.lw || 1.1) * (.7 + .6 * r());
    ctx.beginPath(); ctx.moveTo(x - nx / k * 4, y - ny / k * 4); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke(); }
  ctx.restore();
}
function lobes(ctx, x0, x1, y, n, d, t, ph = 0) {                          // rounded locks from x0 to x1 hanging d[i] below y
  for (let i = 0; i < n; i++) { const xa = lerp(x0, x1, i / n), xb = lerp(x0, x1, (i + 1) / n), dd = d[i] + 1.5 * Math.sin(t * 1.1 + i + ph);
    ctx.lineTo(xa, y); ctx.bezierCurveTo(xa, y + dd * 1.25, xb, y + dd * 1.25, xb, y); }
}
function gordo(ctx, x, y, s, t, o = {}) {
  const a = o.a ?? 1; if (a <= 0 || s <= 0) return;
  const dir = o.dir || 1, point = clamp(o.point ?? 0), aim = clamp(o.aim ?? -.5, -.56, -.3), rim = o.rim ?? 1, walk = o.walk;
  const breathe = 1 + .012 * Math.sin(t * 1.6), sw = walk === undefined ? 0 : Math.sin(walk), bob = walk === undefined ? 0 : Math.abs(Math.cos(walk)) * 4;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.globalAlpha *= a;
  const tip = -.12 * E.out(point); ctx.translate(-70, 0); ctx.rotate(tip); ctx.translate(70, 0);
  if (!o.noShadow) { ctx.fillStyle = 'rgba(3,4,40,.42)'; ctx.beginPath(); ctx.ellipse(-8, 3, 118, 11, 0, 0, 7); ctx.fill(); }
  ctx.translate(0, -bob);
  // far legs, in shade
  limb(ctx, -66, -46, Math.PI / 2 + sw * .35, 42, 24, GW.far, GW.farPaw);
  limb(ctx, 30, -46, Math.PI / 2 - sw * .35, 42, 24, GW.far, GW.farPaw);
  // the tail: a soft plume, wagging slowly, forever
  const wag = 8 * Math.sin(t * 1.9);
  ctx.save(); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-100, -98); ctx.quadraticCurveTo(-138, -110, -136, -148 + wag); ctx.lineWidth = 17; ctx.strokeStyle = GW.mid; ctx.stroke();
  ctx.lineWidth = 11; ctx.strokeStyle = GW.hi; ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.translate(-20, -70); ctx.scale(1, breathe); ctx.translate(20, 70);
  // the body: rounder than the capybara, the belly a fringe of hanging locks
  ctx.beginPath(); ctx.moveTo(72, -50);
  ctx.bezierCurveTo(80, -82, 66, -108, 36, -120);
  ctx.bezierCurveTo(4, -134, -58, -136, -90, -120);
  ctx.bezierCurveTo(-120, -112, -128, -72, -108, -46);
  lobes(ctx, -108, 72, -42, 9, [7, 9, 8, 10, 9, 10, 8, 9, 6], t); ctx.closePath();
  let g = ctx.createLinearGradient(0, -136, 0, -24); g.addColorStop(0, GW.hi); g.addColorStop(.55, GW.mid); g.addColorStop(1, GW.lo);
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3), 90, -120, 120, .22 * rim);
  ctx.globalCompositeOperation = 'source-over'; blit(ctx, halo('#6E6478', 2.5), -40, -14, 120, .28);
  ctx.strokeStyle = 'rgba(120,110,100,.12)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';        // a breath of texture inside the coat
  [[-80, -100], [-46, -110], [-14, -96], [-64, -76], [-30, -72]].forEach(([x1, y1]) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x1 + 4, y1 + 8, x1 + 1, y1 + 16); ctx.stroke(); });
  ctx.restore();
  hair(ctx, [[-90, -120], [-58, -136], [4, -134], [36, -120]], t, {n: 18, len: 7, fall: .7, side: -1, seed: 11});     // the back
  hair(ctx, [[-108, -46], [-128, -72], [-120, -112], [-90, -120]], t, {n: 8, len: 7, fall: .75, side: -1, seed: 12});  // the rump
  hair(ctx, [[-108, -42], [-40, -38], [20, -38], [72, -44]], t, {n: 22, len: 10, fall: .95, side: 1, seed: 13, cols: [GW.mid, GW.hi, GW.lo]});   // the belly fringe
  ctx.restore();
  // near hind leg
  limb(ctx, -54, -44, Math.PI / 2 - sw * .35, 44, 27, GW.mid, GW.hi);
  hair(ctx, [[-68, -24], [-68, -12], [-66, -6], [-64, -2]], t, {n: 4, len: 5, fall: .9, side: -1, seed: 21, a: .45});
  // the head: a big round skull, a broad muzzle; everything soft and hanging: ear, brows, beard. Kind, a little sad, wise.
  ctx.save(); ctx.translate(62, -116); ctx.rotate(.1 + (o.look ?? 0) - point * .38);
  g = ctx.createLinearGradient(0, -54, 0, 44); g.addColorStop(0, GW.hi); g.addColorStop(.7, GW.mid); g.addColorStop(1, GW.lo);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, -6, 50, 46, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.roundRect(14, -14, 84, 44, [22, 22, 22, 16]); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, -6, 50, 46, 0, 0, 7); ctx.roundRect(14, -14, 84, 44, [22, 22, 22, 16]); ctx.clip();
  ctx.globalCompositeOperation = 'lighter'; blit(ctx, halo(C.mint, 3), 90, -40, 70, .24 * rim); ctx.restore();
  hair(ctx, [[-46, -10], [-46, -58], [22, -66], [44, -30]], t, {n: 20, len: 8, fall: .45, side: 1, seed: 31, lw: 1.3});   // the tousled crown
  // the beard and the moustache: rounded locks, longer at the chin
  ctx.beginPath(); ctx.moveTo(12, 14); ctx.lineTo(96, 20); lobes(ctx, 96, 8, 22, 4, [10, 17, 19, 12], t, 1.7); ctx.closePath();
  g = ctx.createLinearGradient(0, 14, 0, 60); g.addColorStop(0, GW.mid); g.addColorStop(1, GW.hi); ctx.fillStyle = g; ctx.fill();
  hair(ctx, [[14, 26], [40, 34], [70, 34], [96, 26]], t, {n: 20, len: 11, fall: .97, side: 1, seed: 41, sway: 1.6, a: .45, lw: 1.1, cols: [GW.hi, GW.mid, '#F4EFE7']});   // the long beard
  hair(ctx, [[64, 10], [76, 14], [88, 14], [100, 10]], t, {n: 10, len: 11, fall: .9, side: 1, seed: 42, sway: 1.4, a: .7});   // the moustache
  // the nose: big, brown, a little shine
  g = ctx.createRadialGradient(92, -7, 2, 95, -1, 18); g.addColorStop(0, '#8E5A5A'); g.addColorStop(1, GW.nose);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(96, -1, 17, 14, .1, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(235,205,205,.5)'; ctx.beginPath(); ctx.ellipse(91, -8, 5, 2.8, -.3, 0, 7); ctx.fill();
  // the eye: big, pale blue, the lid heavy and sloping down to the back: gentle, a little sad
  const ex = 33, ey = -13, bl = (t % 6.2) > 5.9 ? 1 : 0, rx = 12.5, ry = 10;
  const l0 = lerp(ey + 1.5, ey + ry, bl), l1 = lerp(ey - 6.5, ey + ry, bl);         // lid line: back corner lower
  ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, 7); ctx.clip();
  ctx.fillStyle = '#F1F6F7'; ctx.fillRect(ex - rx, ey - ry, rx * 2, ry * 2);
  ctx.fillStyle = '#8FB3C9'; ctx.beginPath(); ctx.arc(ex + 2, ey + 1.5, 7.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#BFD9E8'; ctx.beginPath(); ctx.arc(ex + 2, ey + 1.5, 6, 0, 7); ctx.fill();
  ctx.fillStyle = '#1E2230'; ctx.beginPath(); ctx.arc(ex + 2.5, ey + 1.5, 3, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + 4.5, ey - 1, 1.6, 0, 7); ctx.fill();
  ctx.fillStyle = '#DCD3C6'; ctx.beginPath(); ctx.moveTo(ex - rx, ey - ry - 2); ctx.lineTo(ex + rx, ey - ry - 2); ctx.lineTo(ex + rx, l1); ctx.lineTo(ex - rx, l0); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(105,92,88,.45)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ex - rx + 1, l0); ctx.lineTo(ex + rx - 1, l1); ctx.stroke();
  ctx.strokeStyle = 'rgba(140,125,115,.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(ex, ey + 4, rx * .9, ry * .9, 0, Math.PI * .2, Math.PI * .8); ctx.stroke();   // the soft bag of years under it
  // the brow: a bushy cloud over the eye, lifted at the inner end
  ctx.fillStyle = '#F8F4EE'; ctx.beginPath(); ctx.moveTo(16, -26);
  ctx.quadraticCurveTo(24, -42, 40, -42); ctx.quadraticCurveTo(52, -42, 54, -34);
  lobes(ctx, 54, 16, -30, 4, [6, 8, 7, 5], t, 2.4); ctx.closePath(); ctx.fill();
  hair(ctx, [[16, -30], [28, -40], [44, -40], [56, -32]], t, {n: 12, len: 9, fall: .6, side: 1, seed: 51, lw: 1.2, a: .75, cols: ['#FBF8F3', GW.mid]});   // the brow, hanging over the eye
  // the ear: long, wide, hanging from high on the skull, swaying with the breath
  ctx.save(); ctx.translate(-8, -40); ctx.rotate(.04 * Math.sin(t * 1.3) + point * .12);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-34, -2, -50, 44, -42, 88); lobes(ctx, -42, 14, 88, 3, [12, 14, 10], t, .6); ctx.bezierCurveTo(22, 52, 22, 12, 0, 0); ctx.closePath();
  g = ctx.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, '#E4DCD0'); g.addColorStop(1, '#CFC5B7'); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(115,104,96,.16)'; ctx.lineWidth = 1.2; ctx.stroke();
  hair(ctx, [[-2, 2], [-34, 2], [-50, 44], [-42, 88]], t, {n: 10, len: 6, fall: .8, side: 1, seed: 61, cols: ['#E4DCD0', '#D3CABD']});
  hair(ctx, [[-42, 92], [-30, 102], [0, 102], [14, 90]], t, {n: 9, len: 8, fall: .95, side: -1, seed: 62, cols: ['#DCD3C6', '#E8E1D6']});
  ctx.restore();
  ctx.restore();
  // near front leg: stands, or rises to point
  const stand = Math.PI / 2 + sw * .35, ang = lerp(stand, aim - tip, E.out(point)), len = lerp(46, 128, point), SX = 44, SY = -40;
  if (point > .02) { ctx.save(); ctx.translate(SX, SY); ctx.rotate(ang); ctx.beginPath(); ctx.roundRect(-13, -13, len + 13, 26, 13);
    ctx.strokeStyle = 'rgba(70,64,84,.22)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
  limb(ctx, SX, SY, ang, len, 24, '#ECE6DC', GW.hi);
  if (point > .5) { ctx.save(); ctx.translate(SX + Math.cos(ang) * len, SY + Math.sin(ang) * len); ctx.rotate(ang);
    ctx.strokeStyle = 'rgba(120,110,100,.5)'; ctx.lineWidth = 2; [-5, 0, 5].forEach(d => { ctx.beginPath(); ctx.moveTo(4, d); ctx.lineTo(10, d * 1.2); ctx.stroke(); }); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    blit(ctx, halo(C.mint, 4), SX + Math.cos(ang) * len, SY + Math.sin(ang) * len, 26, (point - .5) * .7 * rim); ctx.restore(); }
  ctx.restore();
  const lx = SX + Math.cos(ang) * (len + 10) - 70, ly = SY + Math.sin(ang) * (len + 10) - bob;
  return [x + dir * s * (70 + lx * Math.cos(tip) - ly * Math.sin(tip)), y + s * (lx * Math.sin(tip) + ly * Math.cos(tip))];
}
/* ---------- the cast ----------
   Every scene asks for "the character" (ART.carpincho, its old name); which one is drawn is the canvas's data-char
   (or the page's): 'karpincho', 'gordo' or 'both' (the Gordo a step behind, the Karpincho pointing). New characters register here. */
const CAST = {
  karpincho: {name: 'Karpincho', draw: (...a) => karpincho(...a), lit: {tone: 'saturate(.55) brightness(.78)', rimK: 1, rimW: 3}},
  gordo:     {name: 'Gordo',     draw: (...a) => gordo(...a),     lit: {tone: 'saturate(.8) brightness(.95)',  rimK: .4, rimW: 1.6}},
};
const PAIR = [-170, 110];                                                     // in 'both': where the Gordo and the Karpincho stand around the spot (character units)
function carpincho(ctx, x, y, s, t, o = {}) {
  const c = KX.h.char();
  if (c === 'both') { gordo(ctx, x + PAIR[0] * s, y, s * .96, t, {...o, point: 0, look: .05}); return karpincho(ctx, x + PAIR[1] * s, y, s, t, o); }
  return (CAST[c] || CAST.karpincho).draw(ctx, x, y, s, t, o);
}
/* the big shot: the same Carpincho as a silhouette against the light, with a hard mint rim on the side facing the glow */
let SIL = null;
function litOne(ctx, x, y, s, t, o, draw) {
  const m = ctx.getTransform(), k = Math.hypot(m.a, m.b), bx = -150, by = -260, bw = 420, bh = 290;
  const cw = Math.ceil(bw * s * k), ch = Math.ceil(bh * s * k);
  if (!SIL) SIL = [document.createElement('canvas'), document.createElement('canvas')];
  const [A, R] = SIL; A.width = R.width = cw; A.height = R.height = ch;
  const a = A.getContext('2d'), r = R.getContext('2d');
  a.setTransform(k, 0, 0, k, -bx * s * k, -by * s * k); const paw = draw(a, 0, 0, s, t, {...o, a: 1, rim: 0, noShadow: 1});
  r.drawImage(A, 0, 0); r.globalCompositeOperation = 'source-in'; r.fillStyle = o.rimCol || '#B9FFF0'; r.fillRect(0, 0, cw, ch);    // the rim: the shape, minus itself shifted away from the light
  r.globalCompositeOperation = 'destination-out'; const off = (o.rimW || 5) * s * k; r.drawImage(A, -off * (o.lx ?? 1), off * (o.ly ?? .6));
  a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-atop';                // the shadowed side
  const g = a.createLinearGradient(0, 0, cw, 0); g.addColorStop(0, 'rgba(18,10,70,.5)'); g.addColorStop(.7, 'rgba(18,10,70,.2)'); g.addColorStop(1, 'rgba(18,10,70,.05)');
  a.fillStyle = g; a.fillRect(0, 0, cw, ch);
  ctx.save(); ctx.globalAlpha *= o.a ?? 1; ctx.fillStyle = 'rgba(3,4,40,.5)'; ctx.beginPath(); ctx.ellipse(x - 8 * s, y + 3 * s, 118 * s, 11 * s, 0, 0, 7); ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const px = m.a * (x + bx * s) + m.c * (y + by * s) + m.e, py = m.b * (x + bx * s) + m.d * (y + by * s) + m.f;
  if (o.tone && typeof ctx.filter === 'string') ctx.filter = o.tone; ctx.drawImage(A, px, py); if (o.tone) ctx.filter = 'none'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= o.rim ?? 1; ctx.drawImage(R, px, py); ctx.drawImage(R, px, py);
  if (typeof ctx.filter === 'string') { ctx.filter = `blur(${(8 * k * s).toFixed(1)}px)`; ctx.drawImage(R, px, py); ctx.drawImage(R, px, py); ctx.filter = 'none'; }
  ctx.restore();
  return [x + paw[0], y + paw[1]];
}

function carpinchoLit(ctx, x, y, s, t, o = {}) {
  const c = KX.h.char(), as = (C1, oo) => ({...oo, tone: C1.lit.tone, rimW: C1.lit.rimW, rim: (oo.rim ?? 1) * C1.lit.rimK});
  if (c === 'both') { litOne(ctx, x + PAIR[0] * s, y, s * .96, t, as(CAST.gordo, {...o, point: 0}), gordo); return litOne(ctx, x + PAIR[1] * s, y, s, t, as(CAST.karpincho, o), karpincho); }
  const C1 = CAST[c] || CAST.karpincho; return litOne(ctx, x, y, s, t, as(C1, o), C1.draw);
}

/* ---------- the place ---------- */
function vista(ctx, t, o = {}) {                                              // the great curve and the ledge, as in the wallpaper
  const a = o.a ?? 1; if (a <= 0) return; const L = o.ledge || [70, 560, 620];
  ctx.save(); ctx.globalAlpha *= a;
  ctx.beginPath(); ctx.arc(-760, 1720, 1500, 0, 7);
  let g = ctx.createLinearGradient(0, 300, 0, H); g.addColorStop(0, 'rgba(70,85,180,.2)'); g.addColorStop(1, 'rgba(40,50,140,0)');
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(170,180,225,.14)'; ctx.lineWidth = 1.5; ctx.stroke();
  const [x0, x1, y] = L;                                                       // the ledge: a slab jutting out, its top catching the light
  ctx.beginPath(); ctx.moveTo(x0 - 400, y - 4); ctx.lineTo(x1 + 22, y - 4); ctx.lineTo(x1 + 4, y + 14); ctx.lineTo(x0 - 400, y + 14); ctx.closePath();
  g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, C.royal); g.addColorStop(1, '#5B64AE'); ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x0 - 400, y + 14); ctx.lineTo(x1 + 4, y + 14); ctx.lineTo(x1 - 6, y + 52); ctx.quadraticCurveTo(x1 - 60, y + 120, x1 - 180, y + 150); ctx.lineTo(x0 - 400, H + 50); ctx.closePath();
  g = ctx.createLinearGradient(0, y, 0, H); g.addColorStop(0, C.cobalt); g.addColorStop(1, C.deep); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(205,214,238,.4)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x0 - 400, y - 4); ctx.lineTo(x1 + 22, y - 4); ctx.stroke();
  ctx.restore();
}

/* ---------- waves and particles ---------- */
function ripple(ctx, x, y, t, o = {}) {                                       // rings that leave the source and fade
  const n = o.n || 3, per = o.per || 2.4, R = o.R || 240, a = o.a ?? 1, col = o.col || C.mint; if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < n; k++) { const q = (((t - (o.t0 || 0)) / per + k / n) % 1 + 1) % 1; blit(ctx, ringS(col), x, y, (o.r0 || 0) + R * E.out(q), a * Math.pow(1 - q, 1.4) * .9, ((o.r0 || 0) + R * E.out(q)) * (o.sq || 1)); }
  ctx.restore();
}
function stars(ctx, t, o = {}) {                                              // depth: points that drift toward us
  const n = o.n || 260, r = rnd(o.seed || 11), cx = o.cx ?? W / 2, cy = o.cy ?? H / 2, sp = o.speed ?? .03, a = o.a ?? 1; if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const X = (r() * 2 - 1) * 1.4, Y = (r() * 2 - 1) * .9, z0 = r(), tw = r() * 7, col = r() < .14 ? C.mint : r() < .5 ? C.ice : C.lav;
    const z = 1 - ((z0 + t * sp) % 1), k = .35 / (.12 + z), px = cx + X * W * .5 * k, py = cy + Y * H * .5 * k;
    if (px < -20 || px > W + 20 || py < -20 || py > H + 20) continue;
    const al = a * clamp((1 - z) * 1.6) * clamp(z * 6) * (.55 + .45 * Math.sin(t * 1.7 + tw)), rad = clamp(1.4 * k, .8, 4.5);
    blit(ctx, spark(col), px, py, rad * 3, al);
  }
  ctx.restore();
}
function wave(ctx, x0, x1, y, amp, freq, phase, col, a, lw = 2, env) {    // a sine strand; env(u) shapes its amplitude
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.beginPath();
  for (let i = 0; i <= 120; i++) { const u = i / 120, px = lerp(x0, x1, u), e = env ? env(u) : 1; const py = y + Math.sin(u * freq + phase) * amp * e; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
}
/* a vector's tip with flow: a slender point whose barbs sweep back in curves, no hard triangle */
function vtip(ctx, x, y, an, s = 1, col = C.mint) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(an); ctx.scale(s, s); ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(16, 0);
  ctx.bezierCurveTo(6, -1.5, -6, -6, -16, -14); ctx.quadraticCurveTo(-8, -4, -6, 0);
  ctx.quadraticCurveTo(-8, 4, -16, 14); ctx.bezierCurveTo(-6, 6, 6, 1.5, 16, 0); ctx.closePath(); ctx.fill(); ctx.restore();
}
/* the flash: `——/}}}}——`. p 0..1 types it; the }}}} glows mint. */
function glyph(ctx, s, x, y, p, o = {}) {
  const n = Math.round(s.length * clamp(p)); if (n <= 0) return; const sz = o.s || 34;
  KX.h.font(ctx, {mono: 1, s: sz, w: 500});
  let cx = x; const head = s.indexOf('/');
  for (let i = 0; i < n; i++) { const ch = s[i], hot = i >= head && s[i] !== '—';
    T(ctx, ch, cx, y, {mono: 1, s: sz, w: hot ? 700 : 400, c: hot ? C.mint : hex(C.ice, .75), a: o.a ?? 1, glow: hot ? hex(C.mint, .9) : null});
    KX.h.font(ctx, {mono: 1, s: sz, w: 500}); cx += ctx.measureText(ch).width; }
  return cx;
}
/* a knot of energy: particles orbiting a soft core */
function energy(ctx, x, y, r, t, a = 1, seed = 1, col = C.mint) {
  if (a <= 0) return; const R = rnd(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  blit(ctx, halo(col, 3), x, y, r * 2.6, .55 * a); blit(ctx, halo('#FFFFFF', 7), x, y, r * .9, .7 * a);
  for (let k = 0; k < 46; k++) { const rad = r * (.25 + R() * .95), sp = (.6 + R() * 1.4) * (R() < .5 ? -1 : 1), ph = R() * 7, tilt = .35 + R() * .6;
    const an = ph + t * sp, px = x + Math.cos(an) * rad, py = y + Math.sin(an) * rad * tilt;
    blit(ctx, spark(k % 4 ? col : C.aqua), px, py, 2.2 + R() * 3, a * (.5 + .5 * Math.sin(t * 3 + ph))); }
  ctx.restore();
}
/* a tiny perspective camera: yaw, pitch, distance; returns P([x,y,z]) → [sx, sy, k, depth] | null */
function camera(yaw, pitch, d, cx = W / 2, cy = H / 2, f = 900, tg = [0, 0, 0]) {
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return p0 => { const p = [p0[0] - tg[0], p0[1] - tg[1], p0[2] - tg[2]], x = p[0] * cyw - p[2] * syw, z1 = p[0] * syw + p[2] * cyw, y = p[1] * cp - z1 * sp, z = p[1] * sp + z1 * cp, zz = z + d;
    if (zz < 60) return null; const k = f / zz; return [cx + x * k, cy + y * k, k, zz]; };
}
/* the vector cloud shared by the Akasha and the resonance: clusters of meaning, deterministic */
let CLOUD = null;
function cloud() {
  if (CLOUD) return CLOUD;
  const r = rnd(42), gs = () => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const dir = () => { const u = r() * 2 - 1, a = r() * Math.PI * 2, q = Math.sqrt(1 - u * u); return [q * Math.cos(a), u, q * Math.sin(a)]; };
  const centers = Array.from({length: 9}, (_, k) => { const y = 1 - (k + .5) / 9 * 2, q = Math.sqrt(1 - y * y), th = k * 2.39996; return [Math.cos(th) * q * 330, y * 220, Math.sin(th) * q * 330]; });
  const pts = [];
  centers.forEach((c, k) => { for (let i = 0; i < 70; i++) pts.push({f: c.map(v => v + gs() * 62), g: k, s: dir().map(v => v * (1600 + r() * 1800)), d: r(), z: .6 + r() * .9, tw: r() * 7}); });
  for (let i = 0; i < 260; i++) pts.push({f: dir().map(v => v * (120 + r() * 420)), g: -1, s: dir().map(v => v * (1600 + r() * 1800)), d: r(), z: .5 + r() * .7, tw: r() * 7});
  const q = centers[2].map((v, i) => v + [40, -30, 30][i]);                 // the question lands near cluster 2
  const near = pts.map((p, i) => [Math.hypot(p.f[0] - q[0], p.f[1] - q[1], p.f[2] - q[2]), i]).sort((a, b) => a[0] - b[0]).slice(0, 6).map(x => x[1]);
  near.forEach((i, k) => { const an = k / 6 * Math.PI * 2 + .4, rr = 95 + k * 14;            // spread around q, so each one can be seen resonating
    pts[i].f = [q[0] + Math.cos(an) * rr, q[1] + Math.sin(an * 2) * 40 + (k % 2 ? -50 : 50), q[2] + Math.sin(an) * rr]; });
  const nearSet = new Set(near); pts.forEach((p, i) => { if (nearSet.has(i)) return; const d = Math.hypot(p.f[0] - q[0], p.f[1] - q[1], p.f[2] - q[2]);
    if (d < 190) p.f = p.f.map((v, k) => q[k] + (v - q[k]) * 190 / Math.max(d, 1)); });   // a little room around the question
  return CLOUD = {centers, pts, q, near};
}

window.ART = {CAST, vtip, hexPath, glowHex, hexOutline, carpincho, carpinchoLit, vista, ripple, stars, wave, glyph, energy, camera, cloud};
})();
