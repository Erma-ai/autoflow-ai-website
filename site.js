/* Modus Studio — shared site behaviour */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* ── Loader: only on the first page of a visit ── */
  const loader = document.getElementById('loader');
  let seen = false;
  try { seen = sessionStorage.getItem('modus-seen') === '1'; sessionStorage.setItem('modus-seen', '1'); } catch (e) {}
  function revealHero() {
    document.querySelectorAll('.hero .split, .hero .rv').forEach((el, i) => setTimeout(() => el.classList.add('in'), 120 + i * 90));
  }
  if (loader && !seen && !reduce) {
    document.documentElement.classList.add('show-loader'); body.classList.add('locked');
    const pct = document.getElementById('loaderPct'), fill = document.getElementById('loaderFill');
    let shown = 0, ready = false; const t0 = performance.now();
    addEventListener('load', () => ready = true); setTimeout(() => ready = true, 3500);
    (function tick() {
      const target = ready ? 100 : Math.min(90, (performance.now() - t0) / 14);
      shown += (target - shown) * .12; if (shown > 99.5 && ready) shown = 100;
      const v = Math.round(shown); pct.textContent = v + '%'; fill.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      if (v < 100) return requestAnimationFrame(tick);
      setTimeout(() => { loader.classList.add('done'); body.classList.remove('locked'); revealHero(); setTimeout(() => loader.remove(), 1200); }, 250);
    })();
  } else { if (loader) loader.remove(); revealHero(); }

  /* ── Headings slide up word by word ── */
  function wrap(node) { const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('span'); i.appendChild(node); w.appendChild(i); return w; }
  document.querySelectorAll('.split').forEach(el => {
    const out = [];
    el.childNodes.forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(p => { if (p) out.push(/^\s+$/.test(p) ? document.createTextNode(' ') : wrap(document.createTextNode(p))); });
      else out.push(wrap(n.cloneNode(true)));
    });
    el.textContent = ''; out.forEach(o => el.appendChild(o));
    let k = 0; el.querySelectorAll('.w > span').forEach(s => s.style.transitionDelay = (k++ * .045) + 's');
  });

  /* ── Reveal on scroll ── */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.split, .rv, .flow li').forEach(el => { if (!el.closest('.hero')) io.observe(el); });
  document.querySelectorAll('.flow li').forEach((li, i) => li.style.transitionDelay = (i * .12) + 's');

  /* ── Words light up as you scroll ── */
  const scrubs = [...document.querySelectorAll('.scrub')].map(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => '<span class="wd">' + w + '</span>').join(' ');
    return { el, words: [...el.querySelectorAll('.wd')] };
  });

  /* ── Header + menu ── */
  const hdr = document.querySelector('.hdr'), menuBtn = document.getElementById('menuBtn');
  window.closeMenu = () => { body.classList.remove('menu-open'); menuBtn && menuBtn.setAttribute('aria-expanded', false); };
  menuBtn && menuBtn.addEventListener('click', () => { const o = body.classList.toggle('menu-open'); menuBtn.setAttribute('aria-expanded', o); });
  document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  window.__scroll = 0;
  function onScroll() {
    const vh = innerHeight;
    hdr && hdr.classList.toggle('scrolled', scrollY > 30);
    window.__scroll = Math.min(1, Math.max(0, scrollY / (vh * .9)));
    scrubs.forEach(({ el, words }) => {
      const b = el.getBoundingClientRect(), p = Math.min(1, Math.max(0, (vh * .85 - b.top) / (b.height + vh * .35)));
      const lit = Math.round(p * words.length); words.forEach((w, i) => w.classList.toggle('lit', i < lit));
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  /* ── FAQ ── */
  document.querySelectorAll('.faq-q').forEach(q => q.addEventListener('click', () => {
    const item = q.closest('.faq-item'), was = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-q').setAttribute('aria-expanded', false); });
    if (!was) { item.classList.add('open'); q.setAttribute('aria-expanded', true); }
  }));

  /* ── Contact form → Netlify Forms ── */
  const form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const err = document.getElementById('formErr'), btn = form.querySelector('button[type=submit]');
    err.style.display = 'none'; btn.disabled = true;
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
      .then(r => { if (!r.ok) throw 0; form.classList.add('sent'); form.scrollIntoView({ behavior: 'smooth', block: 'center' }); })
      .catch(() => { err.style.display = 'block'; })
      .finally(() => { btn.disabled = false; });
  });

  /* ── Our Approach: cards on a 3D wheel that turns with the scroll ── */
  const sec = document.getElementById('wheelSec');
  if (sec) {
    const wheel = document.getElementById('wheel'), cards = [...wheel.querySelectorAll('.step')], n = cards.length, step = 360 / n;
    const dotsEl = document.getElementById('dots'), prev = document.getElementById('prev'), next = document.getElementById('next');
    let rot = 0, target = 0, idx = 0, R = 600;
    const dots = cards.map((c, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Go to step ' + (i + 1)); b.onclick = () => goTo(i); dotsEl.appendChild(b); return b; });
    const range = () => ({ top: sec.getBoundingClientRect().top + scrollY, len: sec.offsetHeight - innerHeight });
    function goTo(i) { const r = range(); scrollTo({ top: r.top + r.len * (i / (n - 1)) + 2, behavior: reduce ? 'auto' : 'smooth' }); }
    prev.onclick = () => goTo(Math.max(0, idx - 1)); next.onclick = () => goTo(Math.min(n - 1, idx + 1));
    function measure() { const w = cards[0].offsetWidth; R = Math.max(w * .95, Math.min(innerWidth * .6, w * 1.25)); }
    function update() {
      const r = range(), p = Math.min(1, Math.max(0, (scrollY - r.top) / r.len));
      const raw = p * (n - 1), k = Math.min(n - 2, Math.floor(raw)), f = raw - k;
      const e = Math.min(1, Math.max(0, (f - .22) / .56)), sm = e * e * (3 - 2 * e);
      target = (p >= 1 ? n - 1 : k + sm) * step;
      idx = Math.round(target / step);
      dots.forEach((d, i) => d.classList.toggle('on', i === idx)); prev.disabled = idx === 0; next.disabled = idx === n - 1;
    }
    (function render() {
      rot += (target - rot) * (reduce ? 1 : .09);
      const w = cards[0].offsetWidth, h = Math.max(...cards.map(c => c.offsetHeight));
      cards.forEach((c, i) => {
        const deg = i * step - rot, a = deg * Math.PI / 180, facing = (Math.cos(a) + 1) / 2;
        c.style.transform = `translate3d(${Math.sin(a) * R - w / 2}px, ${-h / 2}px, ${(Math.cos(a) - 1) * R}px) rotateY(${deg}deg)`;
        c.style.opacity = (.08 + .92 * Math.pow(facing, 2.4)).toFixed(3);
        c.style.zIndex = Math.round(facing * 100);
        c.style.pointerEvents = facing > .9 ? 'auto' : 'none';
      });
      requestAnimationFrame(render);
    })();
    addEventListener('scroll', update, { passive: true }); addEventListener('resize', () => { measure(); update(); });
    measure(); update(); rot = target;
  }

  /* ── 3D cubes: a short intro when the page opens, then they rest ──
     Each page has its own shape. The canvas sits in the top section and scrolls away with it. */
  const canvas = document.getElementById('stage');
  if (!canvas || !window.THREE) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, .1, 200); camera.position.set(0, 0, 30);
  scene.add(new THREE.AmbientLight(0xffffff, .6));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(6, 10, 12); scene.add(key);
  const brandTheme = body.classList.contains('theme-brand');
  const lightAuto = body.classList.contains('theme-auto-light');
  const navyAuto = body.classList.contains('theme-auto-navy');
  const rim = new THREE.PointLight(brandTheme || navyAuto ? 0x74A3D1 : 0xDAF9FF, 1.2, 60); rim.position.set(-10, -6, 10); scene.add(rim);

  const shape = body.dataset.shape || 'sphere';
  const mobile = innerWidth < 760, N = mobile ? 90 : 150;
  const mat = new THREE.MeshStandardMaterial({ roughness: .4, metalness: .1, transparent: true, opacity: mobile ? .55 : 1 });
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, N);
  // automation pages sit on #4C80AF, so the cubes use the navy shades; branding pages use the light blues on navy
  const palette = (brandTheme || navyAuto ? [0x4C80AF, 0x74A3D1, 0x32668E] : lightAuto ? [0x32668E, 0x4C80AF, 0x0A3957] : [0x04243D, 0x0A3957, 0x32668E]).map(c => new THREE.Color(c));

  function formation(i) {
    const t = i / (N - 1);
    if (shape === 'cube') { const s = Math.ceil(Math.cbrt(N)), x = i % s, y = Math.floor(i / s) % s, z = Math.floor(i / (s * s)), g = 1.45, o = (s - 1) / 2; return new THREE.Vector3((x - o) * g, (y - o) * g, (z - o) * g); }
    if (shape === 'helix') { const a = t * Math.PI * 6, r = 4.2; return new THREE.Vector3(Math.cos(a) * r, (t - .5) * 15, Math.sin(a) * r); }
    if (shape === 'ring') { const a = t * Math.PI * 2, r = 6.8 + (Math.random() - .5) * 1.4; return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, (Math.random() - .5) * 1.6); }
    const y = 1 - t * 2, rr = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i, R = 6.2;
    return new THREE.Vector3(Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R);
  }
  const cubes = [];
  for (let i = 0; i < N; i++) {
    const side = Math.random() < .5 ? -1 : 1;
    // utility pages (contact, FAQ, privacy): cubes settle softly at the screen edges, away from the text
    const A = shape === 'scatter' ? new THREE.Vector3(side * ((mobile ? 10 : 17) + Math.random() * 10), (Math.random() - .5) * 24, -8 - Math.random() * 16) : formation(i);
    const B = new THREE.Vector3(side * (12 + Math.random() * 14), (Math.random() - .5) * 26, -6 - Math.random() * 18);   // start scattered
    const r0 = new THREE.Euler(Math.random() * 6, Math.random() * 6, 0);
    cubes.push({ A, B, r0, r1: new THREE.Euler(r0.x + (Math.random() - .5) * 3, r0.y + (Math.random() - .5) * 3, 0), s: shape === 'cube' ? .55 + Math.random() * .35 : .35 + Math.random() * .5, d: Math.random() * .35 });
    mesh.setColorAt(i, palette[i % 3]);
  }
  const pairs = [];
  for (let i = 0; i < N; i++) cubes.map((c, j) => [j, c.A.distanceToSquared(cubes[i].A)]).filter(x => x[0] > i).sort((a, b) => a[1] - b[1]).slice(0, shape === 'cube' ? 1 : 2).forEach(([j]) => pairs.push(i, j));
  const linePos = new Float32Array(pairs.length * 3), lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: brandTheme || navyAuto ? 0x4C80AF : lightAuto ? 0x32668E : 0x04243D, transparent: true, opacity: 0 });
  const group = new THREE.Group(); group.add(mesh); group.add(new THREE.LineSegments(lineGeo, lineMat)); scene.add(group);

  const dummy = new THREE.Object3D(), pos = cubes.map(c => c.B.clone());
  // where each cube drifts to while you scroll: out towards the screen edges, so text stays readable
  cubes.forEach(c => { const side = c.A.x >= 0 ? 1 : -1; c.E = new THREE.Vector3(side * ((mobile ? 9 : 15) + Math.random() * 12), (Math.random() - .5) * 30, -8 - Math.random() * 22); });
  let W = 0, H = 0, desk = true;
  const ease = x => 1 - Math.pow(1 - x, 3), smooth = x => x * x * (3 - 2 * x);
  const DUR = reduce ? 0 : 2.4;          // short intro when the page opens
  let t0 = null, sc = 0;                 // sc = smoothed scroll progress (0 at top, 1 after ~1 screen)
  const target = () => shape === 'scatter' ? 0 : Math.min(1, scrollY / (innerHeight * .9));
  function draw() {
    const t = t0 === null ? 0 : (performance.now() - t0) / 1000;
    const k = DUR ? Math.min(1, t / DUR) : 1;
    sc += (target() - sc) * (reduce ? 1 : .1);
    const h = smooth(Math.min(1, Math.max(0, sc)));
    const spin = scrollY * .0012;        // turns only when the page scrolls
    if (shape === 'scatter') { group.position.set(0, -scrollY * .004, 0); group.scale.setScalar(1); group.rotation.set(0, 0, 0); }
    else {
      const hx = desk ? 13.2 : 5.2, hy = desk ? -.5 : 7.6, hs = desk ? .82 : .5;
      group.position.set(hx * (1 - h), hy * (1 - h), 0);
      group.scale.setScalar(hs + (1 - hs) * h);
      group.rotation.y = -1.1 * (1 - ease(k)) + .35 + spin;
      group.rotation.x = .18 + spin * .3;
    }
    for (let i = 0; i < N; i++) {
      const c = cubes[i], e = ease(Math.min(1, Math.max(0, (k - c.d * .5) / (1 - c.d * .5))));
      pos[i].copy(c.B).lerp(c.A, e);
      if (shape !== 'scatter') pos[i].lerp(c.E, h);
      dummy.position.copy(pos[i]);
      dummy.rotation.set(c.r1.x + (c.r0.x - c.r1.x) * e + spin * 2, c.r1.y + (c.r0.y - c.r1.y) * e + spin * 1.5, 0);
      dummy.scale.setScalar(c.s * (1 + h * .5)); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    for (let p = 0; p < pairs.length; p++) { const v = pos[pairs[p]]; linePos[p * 3] = v.x; linePos[p * 3 + 1] = v.y; linePos[p * 3 + 2] = v.z; }
    lineGeo.attributes.position.needsUpdate = true;
    lineMat.opacity = shape === 'scatter' ? 0 : .45 * Math.max(0, (k - .75) / .25) * (1 - h);
    const base = shape === 'scatter' ? .45 : (desk ? 1 : .6);
    mat.opacity = base + (.3 - base) * h;
    renderer.render(scene, camera);
    return k < 1 || Math.abs(target() - sc) > .001;   // keep animating only while something is changing
  }
  let running = false;
  function kick() { if (running) return; running = true; (function f() { if (draw()) requestAnimationFrame(f); else running = false; })(); }
  function resize() { W = innerWidth; H = innerHeight; desk = W > 960; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); draw(); }
  addEventListener('resize', resize);
  addEventListener('scroll', kick, { passive: true });
  resize();
  const begin = () => { t0 = performance.now(); kick(); };
  if (document.getElementById('loader')) { const wait = setInterval(() => { if (!document.getElementById('loader') || document.querySelector('.loader.done')) { clearInterval(wait); begin(); } }, 100); }
  else begin();
})();

