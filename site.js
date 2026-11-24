/* The Modus Studio — site behaviour (no tracking, no third-party scripts) */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* header + mobile menu */
  const hdr = document.querySelector('.hdr'), menuBtn = document.getElementById('menuBtn');
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const closeMenu = () => { body.classList.remove('menu-open'); menuBtn && menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn && menuBtn.addEventListener('click', () => { const o = body.classList.toggle('menu-open'); menuBtn.setAttribute('aria-expanded', String(o)); menuBtn.textContent = o ? 'Close' : 'Menu'; });
  document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => { closeMenu(); menuBtn.textContent = 'Menu'; }));
  addEventListener('keydown', e => { if (e.key === 'Escape' && body.classList.contains('menu-open')) { closeMenu(); menuBtn.textContent = 'Menu'; menuBtn.focus(); } });

  /* headings slide up word by word */
  function wrap(node) { const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('span'); i.appendChild(node); w.appendChild(i); return w; }
  document.querySelectorAll('.split').forEach(el => {
    const out = [];
    el.childNodes.forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(p => { if (p) out.push(/^\s+$/.test(p) ? document.createTextNode(' ') : wrap(document.createTextNode(p))); });
      else if (n.nodeName === 'EM') { const em = document.createElement('em'); n.textContent.split(/(\s+)/).forEach(p => { if (p) em.appendChild(/^\s+$/.test(p) ? document.createTextNode(' ') : wrap(document.createTextNode(p))); }); out.push(em); }
      else out.push(wrap(n.cloneNode(true)));
    });
    el.textContent = ''; out.forEach(o => el.appendChild(o));
    let k = 0; el.querySelectorAll('.w > span').forEach(s => s.style.transitionDelay = (k++ * .04) + 's');
  });

  /* reveal on scroll (hero immediately) */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.split, .rv').forEach(el => {
    if (el.closest('.hero, .page-hero')) setTimeout(() => el.classList.add('in'), 80); else io.observe(el);
  });

  /* hero process map: steps light up once, in order, then stay still */
  const nodes = [...document.querySelectorAll('.pmap .node')];
  if (nodes.length) nodes.forEach((n, i) => setTimeout(() => n.classList.add('on'), reduce ? 0 : 500 + i * 380));

  /* demo tabs */
  document.querySelectorAll('[role="tablist"]').forEach(list => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const select = t => tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus(); } });
    });
  });

  /* FAQ */
  document.querySelectorAll('.faq-q').forEach(q => q.addEventListener('click', () => {
    const item = q.closest('.faq-item'), was = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); });
    if (!was) { item.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
  }));

  /* enquiry form → Netlify Forms */
  document.querySelectorAll('form[data-netlify]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const err = form.querySelector('.form-err'), btn = form.querySelector('button[type=submit]');
    err.style.display = 'none'; btn.disabled = true;
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
      .then(r => { if (!r.ok) throw 0; form.classList.add('sent'); const d = form.querySelector('.form-done'); d.setAttribute('tabindex', '-1'); d.focus(); })
      .catch(() => { err.style.display = 'block'; })
      .finally(() => { btn.disabled = false; });
  }));
})();
