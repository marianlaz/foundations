
/* Trailer cards (intro / outro; a folder named …outro… is the outro). Fill __OVER__, __EPISODES__, __WHEN__ (or empty them): the orb, the voice lines as captions, and for the outro the series title. */
const OUTRO = /outro/.test(location.pathname);
function draw(ctx, t) {
  const tint = OUTRO ? mixc(DUSK, NIGHT, pr(t, 0, DUR, E.io)) : mixc(DAY, DUSK, pr(t, 0, DUR, E.io));
  bg(ctx, t, tint);
  if (OUTRO) sky(ctx, t, pr(t, .5, 3) * .8, 9, 170);
  ORB.draw(ctx, W / 2, OUTRO ? 330 : 400, OUTRO ? 64 : 84, t, {state: 'breathing', tint, pulse: pulse(t), wake: pr(t, 0, 1.6, E.out), dark: !LIGHT});
  LINES.forEach((l, i) => cap(ctx, t, l.start - .1, (LINES[i + 1]?.start ?? (OUTRO ? LAST.end + .9 : DUR + 1)) - .1, l.text, {x: W / 2, y: H * .875, s: 42, w: 500, ls: 0, al: 'center'}));
  if (OUTRO) {
    const a0 = LAST.end + 1;
    label(ctx, '__OVER__', W / 2, H * .6, pr(t, a0, a0 + 1), {s: 17, ls: 9});
    const s = 78; T(ctx, SERIES, W / 2, H * .71, {s, w: 200, ls: s * .26, al: 'center', grad: 1, a: pr(t, a0 + .3, a0 + 1.6)});
    label(ctx, '__EPISODES__', W / 2, H * .79, pr(t, a0 + .8, a0 + 2), {s: 15, ls: 5});
    label(ctx, '__WHEN__', W / 2, H * .85, pr(t, a0 + 1.2, a0 + 2.4), {s: 15, ls: 6, c: INK});
  }
  label(ctx, NAME, 64, 78, .8, {al: 'left', s: 16, ls: 5});
  label(ctx, 'TRÁILER', W - 64, 78, .8, {al: 'right', s: 16, ls: 5});
  ctx.save(); ctx.globalAlpha = 1 - pr(t, 0, 1); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (OUTRO) { ctx.save(); ctx.globalAlpha = pr(t, DUR - .9, DUR); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  grain(ctx, t);
}
window.EPISODE = {title: OUTRO ? 'Tráiler · cierre' : 'Tráiler · apertura', duration: OUTRO ? DUR : LAST.end + 1.2, poster: OUTRO ? DUR - 1.2 : LAST.end, draw};
})();
