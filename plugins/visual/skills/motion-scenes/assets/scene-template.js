/* Scenes for <project>. Load after engine.js. Each scene: KX.scene(name, {D, poster, label, col, draw(ctx, t)}).
   draw() paints one frame at time t (seconds, 0..D) in a 1600×1000 space. The engine paints the background,
   the HUD and the grain around it. Keep captions ≤ 9 words, one **accent** each. */
(() => {
const {W, H, C, E, clamp, lerp, pr, env, rnd, hex, T, rr, card, dot, cubic, path, bez, travel, orb, stamp, kv, cap, fmt} = KX.h;

// Optional brand: KX.theme({name: 'ACME', colors: {violet: '#6D28D9', red: '#E11D48'}, sans: '"Inter",sans-serif'});

KX.scene('example', {D: 10, poster: 8.5, label: '// 01 · example', col: C.violet, draw(ctx, t) {
  const fade = 1 - pr(t, 9.5, 10); ctx.save(); ctx.globalAlpha = fade;       // every scene fades out before looping
  const O = [800, 430], A = [260, 430], B = [1340, 430];
  orb(ctx, ...O, 70, t, C.violet, {a: pr(t, 0, 1)});                         // the hero
  card(ctx, A[0] - 150, A[1] - 40, 300, 80, {a: pr(t, .3, 1, E.expo), r: 40, fill: C.card2});
  T(ctx, 'source', A[0], A[1] + 8, {s: 24, w: 600, al: 'center', a: pr(t, .3, 1)});
  const P = bez([A[0] + 150, A[1]], [O[0] - 80, O[1]], .5);
  path(ctx, P, 0, pr(t, .8, 1.8, E.io), hex(C.ice, .2));                      // the line draws on
  for (let k = 0; k < 8; k++) travel(ctx, P, t, 1.5 + k * .5, 2.5 + k * .5, C.ice);  // pulses flow in
  const n = pr(t, 3, 6, E.io);
  T(ctx, `${fmt(1285 * n)} documents`, B[0], B[1] + 10, {s: 40, w: 600, al: 'center', a: pr(t, 2.8, 3.2)});  // counter
  stamp(ctx, 'DONE', B[0], B[1] + 90, pr(t, 6.2, 6.7, E.lin), C.green);      // payoff
  cap(ctx, t, .3, 4, 'Everything flows into **one place**.');
  cap(ctx, t, 4.1, 9.4, 'And it adds up, **every day**.');
  ctx.restore();
}});
})();
