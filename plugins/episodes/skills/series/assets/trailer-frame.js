
/* ---------- the trailer frame: world → orb → captions; at EP.titleAt the world goes dark and the title lands;
   the last line (the button) plays under the title. EP.big: ids shown as big words in the world, not as captions. ---------- */
const TITLE_AT = EP.titleAt, BIG = new Set(EP.big || []);
const orbState = t => { let i = 0; while (i + 1 < EP.states.length && t >= EP.states[i + 1][0]) i++;
  const [a, st, col] = EP.states[i], prev = EP.states[Math.max(0, i - 1)], m = i ? pr(t, a, a + (EP.xf || 1.4), E.io) : 1;
  return {state: st, from: i ? prev[1] : null, mix: m, tint: mixc(prev[2], col, m)}; };
const CAPS = LINES.filter(l => !BIG.has(l.id)).map(l => { const i = LINES.indexOf(l), nx = LINES[i + 1];
  return [l.start - .1, Math.min(nx ? nx.start - .1 : DUR, l.end + (EP.hold ?? 1.6), l.id === LAST.id ? DUR - .9 : 1e9), l.text]; });
function titleCard(ctx, t) {
  const a = pr(t, TITLE_AT, TITLE_AT + 1.4, E.out); if (a <= 0) return;
  const up = pr(t, LAST.start - .6, LAST.start + .6, E.io), y = lerp(H * .47, H * .4, up);
  label(ctx, 'UNA SERIE DE ' + CH.display_name.toUpperCase(), W / 2, y - 92, a * .9, {s: 16, ls: 10});
  const s = EP.titleSize || 92; blur(ctx, (1 - a) * 10);
  T(ctx, EP.title.toUpperCase(), W / 2, y, {s, w: 200, ls: s * .22, al: 'center', grad: 1, a});
  blur(ctx, 0);
  label(ctx, EP.when || 'PRÓXIMAMENTE', W / 2, y + 64, pr(t, TITLE_AT + 1, TITLE_AT + 2.2) * .85, {s: 15, ls: 8});
}
function draw(ctx, t) {
  const st = orbState(t), dark = pr(t, TITLE_AT - .2, TITLE_AT + .6, E.io);
  bg(ctx, t, st.tint);
  ctx.save(); ctx.globalAlpha = 1 - .92 * dark; EP.world(ctx, t, st.tint); ctx.restore();
  if (EP.over) EP.over(ctx, t, st.tint);
  const [x, y, r] = EP.orbAt(t);
  if (r > 0) ORB.draw(ctx, x, y, r, t, {...st, pulse: pulse(t), wake: pr(t, EP.wake ?? 0, (EP.wake ?? 0) + 1.6, E.out), dark: !LIGHT});
  CAPS.forEach(([a, b, s]) => cap(ctx, t, a, b, s, {x: W / 2, y: H * .875, s: 44, w: 500, ls: 0, al: 'center'}));
  titleCard(ctx, t);
  label(ctx, CH.display_name.toUpperCase(), 64, 78, .7, {al: 'left', s: 16, ls: 5});
  label(ctx, EP.corner || 'TRÁILER', W - 64, 78, .7, {al: 'right', s: 16, ls: 5});
  ctx.save(); ctx.globalAlpha = 1 - pr(t, 0, .9); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); ctx.globalAlpha = pr(t, DUR - .9, DUR); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
  grain(ctx, t);
}
window.EPISODE = {title: EP.title + ' · Tráiler', duration: DUR, poster: TITLE_AT + 2.6, draw};
})();
