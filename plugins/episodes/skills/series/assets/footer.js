
/* ---------- the frame: sky, world, orb, captions, closing card ---------- */
const orbState = t => { let i = 0; while (i + 1 < EP.states.length && t >= EP.states[i + 1][0]) i++;
  const [a, st, col] = EP.states[i], prev = EP.states[Math.max(0, i - 1)], m = i ? pr(t, a, a + 1.6, E.io) : 1;
  return {state: st, from: i ? prev[1] : null, mix: m, tint: mixc(prev[2], col, m)}; };
const CAPS = LINES.map((l, i) => [l.start - .1, (LINES[i + 1]?.start ?? LAST.end + 1.2) - .1, l.text]);
function hudline(ctx, t) {
  label(ctx, NAME, 64, 78, .8, {al: 'left', s: 16, ls: 5});
  label(ctx, `${SERIES} · ${EP.n}/${COUNT}`, W - 64, 78, .8, {al: 'right', s: 16, ls: 5});
  const blink = .55 + .45 * Math.sin(t * 3.2);
  dot(ctx, W / 2 - 52, 72, 3, EP.states[0][2], blink * .8);
  label(ctx, clockAt(t, EP.clock), W / 2 + 6, 78, .85, {s: 17, ls: 4});
}
function closing(ctx, t) {
  const a = pr(t, CLOSE, CLOSE + 1.2);
  label(ctx, SERIES, W / 2, H * .7, a, {s: 17, ls: 9});
  const s = 60; T(ctx, EP.title.toUpperCase(), W / 2, H * .79, {s, w: 200, ls: s * .28, al: 'center', grad: 1, a: pr(t, CLOSE + .3, CLOSE + 1.6)});
  label(ctx, `${EP.n} / ${COUNT}`, W / 2, H * .855, pr(t, CLOSE + .6, CLOSE + 1.8), {s: 15, ls: 6});
}
function draw(ctx, t) {
  const st = orbState(t);
  bg(ctx, t, st.tint);
  ctx.save(); ctx.globalAlpha = lerp(1, .32, pr(t, LAST.end + .8, CLOSE + .8)); EP.world(ctx, t, st.tint); ctx.restore();
  const [x, y, r] = EP.orbAt(t);
  ORB.draw(ctx, x, y, r, t, {...st, pulse: pulse(t), wake: pr(t, 0, 1.6, E.out), dark: !LIGHT});
  CAPS.forEach(([a, b, s]) => cap(ctx, t, a, b, s, {x: W / 2, y: H * .875, s: 42, w: 500, ls: 0, al: 'center'}));
  closing(ctx, t);
  hudline(ctx, t);
  ctx.save(); ctx.globalAlpha = 1 - pr(t, 0, 1.2); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();          // fade in
  ctx.save(); ctx.globalAlpha = pr(t, DUR - .9, DUR); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();    // fade out
  grain(ctx, t);
}
window.EPISODE = {title: EP.title, duration: DUR, poster: CLOSE + 2.2, draw};
})();
