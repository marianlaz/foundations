/* KXCards: micro-animations on the existing HTML cards. The text stays exactly as written; this only adds motion.
   Patterns, bound by structure or by data-kxc on the group:
     .plugins[data-kxc="flow"]   chips light up in sequence like a pulse through the flow, arrows between them, the last chip
                                 lands with the gradient; cards play one after another (Answer → Report → Correct), then glow together.
     .plugins (default)          roll-call: chips light up in turn, no arrows (a list, not a flow).
     .pair[data-kxc="morph"]     today → planned: a wire travels between the cards; each today row is struck through and its
                                 planned counterpart lights up. data-kxc-map="0>1,1>0,2>2,2>3,3>4" (today row > planned row).
     .pair (default)             compare: the first card sweeps, then the .hot one.
     .layers                     a spine builds the stack, layer by layer.
     .uses                       each request lights the skills (<b>) that answer it, in order.
   Plays when the group is half on screen (again after it has left), or on demand: KXCards.play(elOrSection), KXCards.reset(el).
   Uses the page's CSS variables (--accent, --grad, --fg, --rule, --steel), so it follows light and dark themes.
   Reduced motion: final state, no travel. */
(() => {
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = `
.kxc-card{position:relative}
.kxc-bar{position:absolute;left:0;top:0;height:2px;width:100%;border-radius:2px;background:var(--grad);transform:scaleX(0);transform-origin:left;transition:transform var(--kxc-d,1.6s) linear;pointer-events:none}
.kxc-card.kxc-run .kxc-bar{transform:scaleX(1)}
.kxc-card.kxc-done{box-shadow:inset 0 0 0 1px var(--accent),0 0 34px -16px rgba(139,92,246,.9);transition:box-shadow .6s}
.kxc-chip{transition:box-shadow .35s,background .35s,color .35s,transform .35s}
.kxc-chip.kxc-on{box-shadow:0 0 0 1px var(--accent),0 0 16px -3px rgba(139,92,246,.85)!important}   /* glow only: the chip keeps its own text colour in both themes */
.kxc-chip.kxc-land{background:var(--grad)!important;color:#fff!important;box-shadow:0 0 22px -4px rgba(255,62,96,.8)!important;transform:scale(1.07)}
.kxc-arrow{font:600 11px var(--mono);color:var(--steel);opacity:.3;align-self:center;transition:opacity .3s,color .3s,transform .3s}
.kxc-arrow.kxc-on{opacity:1;color:var(--accent);transform:translateX(2px)}
.kxc-row{display:block;border-radius:4px;padding:0 4px;margin:0 -4px;transition:background .5s,color .5s}
.kxc-row.kxc-scan{background:rgba(139,92,246,.12)}
.kxc-v{background-image:linear-gradient(currentColor,currentColor);background-size:0% 1.5px;background-position:0 58%;background-repeat:no-repeat;transition:background-size .7s ease,opacity .7s}
.kxc-row.kxc-old .kxc-v{background-size:100% 1.5px;opacity:.45}
.kxc-row.kxc-new{background:linear-gradient(90deg,rgba(255,62,96,.16),rgba(255,62,96,0) 85%)}
.kxc-row.kxc-new .kxc-v{color:var(--fg)}
.kxc-row.kxc-new::after{content:" ✓";color:#22C55E;font-weight:700}
.kxc-wire{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:3}
.kxc-wire path{fill:none;stroke:var(--accent);stroke-width:1.6;stroke-dasharray:4 5;opacity:.7}
.kxc-wire circle{fill:#fff;filter:drop-shadow(0 0 6px var(--accent)) drop-shadow(0 0 12px #FF3E60)}
.kxc-spine{position:absolute;left:-14px;top:0;width:2px;height:0;border-radius:2px;background:var(--grad);box-shadow:0 0 12px rgba(255,62,96,.6);transition:height .55s cubic-bezier(.16,.8,.2,1);pointer-events:none}
.kxc-layer{transition:box-shadow .5s}
.kxc-layer.kxc-on{box-shadow:inset 0 0 0 1px var(--accent),0 0 26px -14px rgba(139,92,246,.9)}
.kxc-use b{transition:color .35s,text-shadow .35s}
.kxc-use b.kxc-on{color:var(--fg);text-shadow:0 0 12px rgba(139,92,246,.9)}
.kxc-use .ask{transition:color .4s}
.kxc-use.kxc-on .ask{color:var(--fg)}
`;
const wait = ms => new Promise(r => setTimeout(r, REDUCED ? 0 : ms));
const $$ = (el, s) => [...el.querySelectorAll(s)];
const tokens = new WeakMap();                                          // one run at a time per group; a new play cancels the old
const alive = (g, tk) => tokens.get(g) === tk;

/* ---------- preparation (idempotent) ---------- */
function prepCard(card) {
  if (card.classList.contains('kxc-card')) return;
  card.classList.add('kxc-card'); const bar = document.createElement('i'); bar.className = 'kxc-bar'; bar.setAttribute('aria-hidden', 'true'); card.prepend(bar);
}
function prepChips(card, arrows) {
  const chips = $$(card, '.skills code'); chips.forEach(c => c.classList.add('kxc-chip'));
  if (arrows && !card.dataset.kxcArrows) { card.dataset.kxcArrows = 1;
    chips.slice(0, -1).forEach(c => { const a = document.createElement('span'); a.className = 'kxc-arrow'; a.textContent = '→'; a.setAttribute('aria-hidden', 'true'); c.after(a); }); }
  return chips;
}
function prepRows(pre) {                                               // split a .kv <pre> into rows, value wrapped for the strike
  if (pre.dataset.kxcRows) return $$(pre, '.kxc-row');
  pre.dataset.kxcRows = 1;
  const lines = pre.innerHTML.split('\n');
  pre.innerHTML = lines.map(l => { const m = l.match(/^(<span class="k">[^<]*<\/span>)(\s*)([\s\S]*)$/);
    return `<span class="kxc-row">${m ? `${m[1]}${m[2]}<span class="kxc-v">${m[3]}</span>` : `<span class="kxc-v">${l}</span>`}</span>`; }).join('');
  return $$(pre, '.kxc-row');
}

/* ---------- patterns ---------- */
async function flowCard(card, g, tk, step = 420) {
  prepCard(card); const chips = prepChips(card, true), arrows = $$(card, '.kxc-arrow');
  card.style.setProperty('--kxc-d', `${(chips.length * step) / 1000}s`); card.classList.add('kxc-run');
  for (let i = 0; i < chips.length; i++) {
    if (!alive(g, tk)) return;
    chips[i].classList.add('kxc-on'); if (i === chips.length - 1) { await wait(160); chips[i].classList.add('kxc-land'); }
    await wait(step * .55); if (arrows[i]) arrows[i].classList.add('kxc-on'); await wait(step * .45);
  }
  card.classList.add('kxc-done');
}
async function flow(g, tk) {
  const cards = $$(g, '.plugin');
  for (const c of cards) { await flowCard(c, g, tk); if (!alive(g, tk)) return; await wait(260); }
  cards.forEach(c => c.classList.add('kxc-done'));                     // one loop: they glow together
}
async function rollcall(g, tk) {
  const cards = $$(g, '.plugin');
  cards.forEach((c, i) => { prepCard(c); c.style.setProperty('--kxc-d', '.9s'); setTimeout(() => alive(g, tk) && c.classList.add('kxc-run'), REDUCED ? 0 : i * 140); });
  const chips = cards.map(c => prepChips(c, false));
  const n = Math.max(...chips.map(c => c.length));
  for (let i = 0; i < n; i++) { if (!alive(g, tk)) return; chips.forEach(cs => cs[i] && cs[i].classList.add('kxc-on')); await wait(170); }
  await wait(250); chips.forEach(cs => { const ag = cs.find(c => c.classList.contains('ag')); if (ag) ag.classList.add('kxc-land'); });
}
function wire(pair) {
  let svg = pair.querySelector(':scope > .kxc-wire');
  if (!svg) { svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'kxc-wire'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<path/><circle r="4" cx="-99" cy="-99"/>'; pair.style.position = pair.style.position || 'relative'; pair.append(svg); }
  return svg;
}
async function shoot(pair, from, to, g, tk, ms = 650) {                 // a pulse along a curve from one row to another
  const svg = wire(pair), P = pair.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const x1 = a.right - P.left - 6, y1 = a.top + a.height / 2 - P.top, x2 = b.left - P.left + 4, y2 = b.top + b.height / 2 - P.top;
  const vertical = Math.abs(x2 - x1) < 60;                              // stacked on narrow screens: go down the left side
  const d = vertical ? `M${a.left - P.left + 4},${y1} C${a.left - P.left - 40},${y1} ${b.left - P.left - 40},${y2} ${x2},${y2}` : `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
  const path = svg.querySelector('path'), dot = svg.querySelector('circle'); path.setAttribute('d', d);
  const L = path.getTotalLength(); path.style.strokeDashoffset = 0;
  if (REDUCED) return;
  const t0 = performance.now();
  await new Promise(res => { const f = now => { if (!alive(g, tk)) return res(); const u = Math.min(1, (now - t0) / ms), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, pt = path.getPointAtLength(L * e);
    dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); u < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
  dot.setAttribute('cx', -99); dot.setAttribute('cy', -99);
}
async function morph(pair, tk) {
  const [A, B] = [...pair.children].filter(c => c.querySelector('.kv')); if (!A || !B) return;
  [A, B].forEach(prepCard);
  const ra = prepRows(A.querySelector('.kv')), rb = prepRows(B.querySelector('.kv'));
  const map = (pair.dataset.kxcMap || ra.map((_, i) => `${i}>${Math.min(i, rb.length - 1)}`).join(',')).split(',').map(s => s.split('>').map(Number));
  A.style.setProperty('--kxc-d', '1s'); A.classList.add('kxc-run');
  for (const r of ra) { if (!alive(pair, tk)) return; r.classList.add('kxc-scan'); await wait(180); r.classList.remove('kxc-scan'); }
  const h1 = A.querySelector('h3'), h2 = B.querySelector('h3');             // "Repo → GCP" travels from today to planned
  if (h1 && h2) await shoot(pair, h1, h2, pair, tk, 800);
  B.style.setProperty('--kxc-d', `${map.length * .75}s`); B.classList.add('kxc-run');
  let lastA = -1;
  for (const [i, j] of map) {
    if (!alive(pair, tk)) return; if (!ra[i] || !rb[j]) continue;
    if (i !== lastA) { ra[i].classList.add('kxc-scan'); await wait(160); }
    await shoot(pair, ra[i], rb[j], pair, tk, 560);
    ra[i].classList.remove('kxc-scan'); ra[i].classList.add('kxc-old'); rb[j].classList.add('kxc-new'); lastA = i; await wait(200);
  }
  rb.forEach(r => r.classList.add('kxc-new')); B.classList.add('kxc-done');
}
async function compare(pair, tk) {
  const cards = [...pair.children]; cards.forEach(prepCard);
  for (const c of cards) { if (!alive(pair, tk)) return; c.style.setProperty('--kxc-d', '1.1s'); c.classList.add('kxc-run'); await wait(900); }
  // no glow box here: many .pair columns are open text, not cards
}
async function layers(g, tk) {
  let sp = g.querySelector(':scope > .kxc-spine'); if (!sp) { sp = document.createElement('i'); sp.className = 'kxc-spine'; sp.setAttribute('aria-hidden', 'true'); g.style.position = g.style.position || 'relative'; g.prepend(sp); }
  const ls = $$(g, ':scope > .layer'), G = g.getBoundingClientRect();
  for (const l of ls) { if (!alive(g, tk)) return; l.classList.add('kxc-layer', 'kxc-on'); sp.style.height = `${l.getBoundingClientRect().bottom - G.top}px`; await wait(380); }
}
async function uses(g, tk) {
  for (const u of $$(g, ':scope > .use')) { if (!alive(g, tk)) return; u.classList.add('kxc-use', 'kxc-on');
    for (const b of $$(u, '.how b')) { b.classList.add('kxc-on'); await wait(220); } await wait(120); }
}

/* ---------- binding ---------- */
const kindOf = g => g.dataset.kxc || (g.matches('.plugins') ? 'rollcall' : g.matches('.pair') ? 'compare' : g.matches('.layers') ? 'layers' : g.matches('.uses') ? 'uses' : null);
const RUN = {flow, rollcall, morph, compare, layers, uses};
function reset(g) {
  tokens.set(g, {});
  $$(g, '.kxc-on,.kxc-land,.kxc-run,.kxc-done,.kxc-old,.kxc-new,.kxc-scan').forEach(e => e.classList.remove('kxc-on', 'kxc-land', 'kxc-run', 'kxc-done', 'kxc-old', 'kxc-new', 'kxc-scan'));
  const sp = g.querySelector(':scope > .kxc-spine'); if (sp) sp.style.height = 0;
}
function playGroup(g) { const k = kindOf(g); if (!RUN[k]) return; reset(g); const tk = {}; tokens.set(g, tk); g.dataset.kxcPlayed = 1; return RUN[k](g, tk); }
const GROUPS = '.plugins,.pair,.layers,.uses,[data-kxc]';
function groupsIn(el) { if (!el) return []; if (el.matches && el.matches(GROUPS)) return [el]; return $$(el, GROUPS).filter(g => !g.parentElement.closest(GROUPS)); }
function bind() {
  if (!document.getElementById('kxc-style')) { const s = document.createElement('style'); s.id = 'kxc-style'; s.textContent = css; document.head.append(s); }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && e.intersectionRatio >= .45 && !e.target.dataset.kxcInView) { e.target.dataset.kxcInView = 1; playGroup(e.target); }
    else if (!e.isIntersecting) delete e.target.dataset.kxcInView;           // it plays again next time it comes into view
  }), {threshold: [0, .45]});
  groupsIn(document.body).forEach(g => { if (g.dataset.kxcBound) return; g.dataset.kxcBound = 1; io.observe(g); });
}
window.KXCards = {
  play: el => Promise.all(groupsIn(typeof el === 'string' ? document.querySelector(el) : el).map(playGroup)),
  reset: el => groupsIn(typeof el === 'string' ? document.querySelector(el) : el).forEach(reset),
  bind,
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
