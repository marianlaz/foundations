/* The storyteller: builds the page from a story in HISTORIAS (stories.js) and wires its parts.
   Routing is the hash: #ia, #humana, #dos, #gordo. Changing it re-tells the page in place (the engine mounts the new canvases).
   Load after config.js and stories.js, before engine.js. */
(() => {
const LIST = (window.HISTORIAS || []).slice().sort((a, b) => a.order - b.order);
const DEFAULT = 'dos';
const BASE = JSON.parse(JSON.stringify((window.STORY || {}).scenes || {}));    // the dials before any story touches them
const WAVE = '<svg class="br-wave" viewBox="0 0 60 12" aria-hidden="true"><path class="fn-carrier" d="M-20 6 Q -15 0 -10 6 T 0 6 T 10 6 T 20 6 T 30 6 T 40 6 T 50 6 T 60 6 T 70 6 T 80 6"/><path class="fn-pulse" d="M-20 6 Q -15 0 -10 6 T 0 6 T 10 6 T 20 6 T 30 6 T 40 6 T 50 6 T 60 6 T 70 6 T 80 6" pathLength="100"/></svg>';
const byId = id => LIST.find(s => s.id === id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
const plain = html => html.replace(/<[^>]+>/g, '');

function note(n, i) {                                                         // a flownote that folds; it may hold a door to another story
  const to = n.to && byId(n.to);
  return `<div class="fn" data-fn>
    <button class="fn-fold" type="button" aria-expanded="false" aria-controls="fn-${i}"><span class="fn-line"></span><span class="fn-tag">flownote</span>${WAVE.replace('br-wave', 'fn-wave')}<span class="fn-line"></span></button>
    <div class="fn-body" id="fn-${i}"><div class="fn-inner"><div class="mirage">
      <span>${n.text}</span>${n.q ? `<span class="q">${n.q}</span>` : ''}
      ${to ? `<a class="door" href="#${to.id}">entrar · ${plain(to.title)} →</a>` : ''}
    </div></div></div></div>`;
}
function station(st, i, story) {
  const ch = st.char || story.char, names = story.duoNames || ['Mente humana', 'Mente artificial'];
  const body = st.duo
    ? `<div class="duo"><div><span class="duo-who">${names[0]}</span><p>${st.duo.a}</p></div><div><span class="duo-who">${names[1]}</span><p>${st.duo.b}</p></div></div>`
    : (st.text || []).map(t => `<p>${t}</p>`).join('\n');
  return `<section>
  <div class="col prose">
    <div class="scene-label">${st.label}</div>
    ${body}
    ${st.note ? note(st.note, i) : ''}
  </div>
  <figure class="kx-fig"><canvas class="kx" data-kx="${st.scene}" data-char="${ch}" data-kx-integrated role="img" aria-label="${esc(plain(st.label))}"></canvas></figure>
  ${st.bridge ? `<p class="bridge col">${WAVE}<span>${st.bridge}</span></p>` : ''}
</section>`;
}
function shelf(cur) {
  return `<nav class="shelf col" aria-label="Otras historias"><span class="kicker">Otras historias</span><ul>${LIST.filter(s => s.id !== cur.id).map(s =>
    `<li><a href="#${s.id}"><span class="sh-t">${plain(s.title)}</span><span class="sh-s">${s.sub}</span><span class="sh-c">${(window.ART && ART.CAST[s.char] || {}).name || (s.char === 'both' ? 'Gordo + Karpincho' : s.char)}</span></a></li>`).join('')}</ul></nav>`;
}
function tell(story) {
  const root = document.documentElement; root.dataset.char = story.char; root.dataset.seed = story.seed; root.dataset.story = story.id;
  document.title = plain(story.title);
  const sc = (window.STORY = window.STORY || {}).scenes = window.STORY.scenes || {};   // this story's dials over the base ones (same object: the engine reads it live)
  Object.keys(sc).forEach(k => delete sc[k]); Object.assign(sc, JSON.parse(JSON.stringify(BASE)));
  Object.entries(story.scenes || {}).forEach(([k, v]) => { sc[k] = {...(sc[k] || {}), ...v}; });
  document.getElementById('story').innerHTML = `
<header class="hero" id="hero">
  <canvas class="kx hero-cv" data-kx="hero" data-char="${story.char}" data-kx-bare data-kx-keep role="img" aria-label="${esc(plain(story.title))}"></canvas>
  <div class="hero-copy">
    <h1>${story.title}</h1>
    ${story.sub ? `<p class="sub">${story.sub}</p>` : ''}
    <p class="follow">${story.follow || 'Seguime en este viaje'} <span aria-hidden="true">↓</span></p>
  </div>
</header>
${story.stations.map((st, i) => station(st, i, story)).join('\n')}
${story.close ? `<p class="close col">${story.close}</p>` : ''}
${shelf(story)}
<footer class="col"><small class="firma">${WAVE.replace('br-wave', 'onda')}<span>${story.signature || ''}</span>${WAVE.replace('br-wave', 'onda')}</small></footer>`;
  scrollTo(0, 0);
  wire();
  if (window.KX) KX.all();
}

/* the parts: folds, mirages, the hero's entrance */
const playMirage = m => { if (m.classList.contains('open')) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { m.classList.add('open', 'still'); return; }
  const disp = document.querySelector('#haze feDisplacementMap'), turb = document.querySelector('#haze feTurbulence'); m.classList.add('open');
  const t0 = performance.now(), D = 3200;
  const step = now => { const u = Math.min(1, (now - t0) / D), k = Math.pow(1 - u, 2.2);
    disp.setAttribute('scale', (38 * k).toFixed(2)); turb.setAttribute('baseFrequency', `${(.012 + .004 * Math.sin(now / 500)).toFixed(4)} ${(.05 + .01 * Math.sin(now / 700)).toFixed(4)}`);
    if (u < 1) requestAnimationFrame(step); else m.classList.add('still'); };
  requestAnimationFrame(step); };
function wire() {
  document.documentElement.classList.add('js-mirage');
  document.querySelectorAll('[data-fn]').forEach(fn => { const b = fn.querySelector('.fn-fold'), body = fn.querySelector('.fn-body'); body.inert = true;
    b.addEventListener('click', () => { const on = !fn.classList.contains('open'); fn.classList.toggle('open', on); b.setAttribute('aria-expanded', on); body.inert = !on;
      if (on) fn.querySelectorAll('.mirage').forEach(m => setTimeout(() => playMirage(m), 250)); }); });
  const h = document.getElementById('hero'), cv = h && h.querySelector('canvas');
  if (cv && !matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]kxt=/.test(location.search))
    cv.addEventListener('kx:frame', e => { if (e.detail.t < 1) h.classList.add('intro'); }, {once: true});
}

const route = () => tell(byId(location.hash.slice(1)) || byId(DEFAULT) || LIST[0]);
addEventListener('hashchange', route);
window.STORYTELLER = {tell: id => { location.hash = id; }, list: LIST};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route); else route();
})();
