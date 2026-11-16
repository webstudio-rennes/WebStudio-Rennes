'use strict';
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Ciel de particules (hero) ---------- */
  (function stars() {
    const c = $('.stars'), hero = $('.hero');
    if (!c || !c.getContext) return;
    const ctx = c.getContext('2d');
    let w = 0, h = 0, dpr = 1, pts = [], mx = -999, my = -999, raf = 0, visible = true;
    const rnd = (a, b) => a + Math.random() * (b - a);
    function resize() {
      const r = c.getBoundingClientRect();
      w = r.width; h = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = clamp(Math.round(w * h / 15000), 30, 120);
      pts = Array.from({ length: n }, () => ({ x: rnd(0, w), y: rnd(0, h * .75), vx: rnd(-.12, .12), vy: rnd(-.08, .08), r: rnd(.6, 1.7), a: rnd(.25, .9) }));
      draw(true);
    }
    function draw(still) {
      ctx.clearRect(0, 0, w, h);
      const r = c.getBoundingClientRect(), px = mx - r.left, py = my - r.top;
      for (const p of pts) {
        if (!still) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h * .75; if (p.y > h * .75) p.y = 0;
          const dx = p.x - px, dy = p.y - py, d = Math.hypot(dx, dy);
          if (d < 140 && d > 0) { p.x += dx / d * (140 - d) * .02; p.y += dy / d * (140 - d) * .02; }
        }
        ctx.fillStyle = 'rgba(150,196,255,' + p.a + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      ctx.lineWidth = .6;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 115) { ctx.strokeStyle = 'rgba(100,160,255,' + (.2 * (1 - d / 115)) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      // lien lumineux vers le pointeur
      if (!still) for (const p of pts) { const d = Math.hypot(p.x - px, p.y - py); if (d < 170) { ctx.strokeStyle = 'rgba(160,206,255,' + (.45 * (1 - d / 170)) + ')'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(px, py); ctx.stroke(); } }
    }
    function loop() { if (visible && !document.hidden) draw(false); raf = requestAnimationFrame(loop); }
    resize(); addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
    if (reduce.matches) return;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(hero);
    loop();
  })();

  /* ---------- Mot qui change dans le titre ---------- */
  (function rotator() {
    const el = $('.rot'); if (!el || reduce.matches || !el.animate) return;
    const words = el.dataset.words.split('|'); let i = 0;
    setInterval(async () => {
      if (document.hidden) return;
      const out = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-.3em)' }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
      await out.finished.catch(() => {});
      i = (i + 1) % words.length; el.textContent = words[i];
      out.cancel();
      el.animate([{ opacity: 0, transform: 'translateY(.3em)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.22,.7,.18,1)' });
    }, 2600);
  })();

  /* ---------- Parallaxe hero + méthode liée au défilement ---------- */
  const hero = $('.hero'), steps = $$('.approach-steps article'), stepsBox = $('.approach-steps'), stepNum = $('.step-count b');
  let ticking = false;
  function onScrollWow() {
    ticking = false;
    if (hero && !reduce.matches) hero.style.setProperty('--sy', clamp(scrollY / (innerHeight * .9), 0, 1).toFixed(3));
    if (stepsBox) {
      const r = stepsBox.getBoundingClientRect();
      stepsBox.style.setProperty('--p', clamp((innerHeight * .6 - r.top) / r.height, 0, 1).toFixed(3));
      let cur = -1; steps.forEach((s, k) => { if (s.getBoundingClientRect().top < innerHeight * .62) cur = k; });
      steps.forEach((s, k) => s.classList.toggle('active', k <= cur && k === cur));
      if (stepNum && cur >= 0) { const t = '0' + (cur + 1); if (stepNum.textContent !== t) stepNum.textContent = t; }
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScrollWow); } }, { passive: true });
  onScrollWow();

  /* ---------- Titres : révélation ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } }), { threshold: .3 });
    $$('main h2').forEach(h => { h.classList.add('reveal-h'); io.observe(h); });
  }

  /* ---------- Curseur halo + boutons magnétiques ---------- */
  if (finePointer && !reduce.matches) {
    const cur = document.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true'); document.body.appendChild(cur);
    let tx = 0, ty = 0, x = 0, y = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); cur.classList.toggle('hot', !!e.target.closest('a,button,summary,label,.ba-range,select')); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    (function f() { x += (tx - x) * .18; y += (ty - y) * .18; cur.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; requestAnimationFrame(f); })();
    $$('.button.primary,.nav-contact,.studio-cta').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.translate = ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }

  /* ---------- Navigation : atterrissage précis sur les sections ---------- */
  const header = $('.header');
  function goTo(sel) {
    const sec = $(sel); if (!sec) return;
    const t = sec.querySelector('.section-heading,.approach-heading,.contact-intro') || sec;
    const y = () => Math.max(0, t.getBoundingClientRect().top + scrollY - (header && getComputedStyle(header).position === 'sticky' ? header.offsetHeight : 0) - 28);
    scrollTo({ top: y(), behavior: reduce.matches ? 'auto' : 'smooth' });
    clearTimeout(goTo.t);
    goTo.t = setTimeout(() => { if (Math.abs(y() - scrollY) > 6) scrollTo({ top: y(), behavior: 'auto' }); }, reduce.matches ? 60 : 1200);
    try { history.replaceState(null, '', sel); } catch (e) { /* ignore */ }
  }
  window.goToSection = goTo;
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented && !a.hasAttribute('data-offer')) return;
    const h = a.getAttribute('href'); if (h.length < 2 || !$(h)) return;
    e.preventDefault(); goTo(h);
  });

  /* ---------- Avant / Après ---------- */
  (function beforeAfter() {
    const stage = $('.ba-stage'); if (!stage) return;
    const range = $('.ba-range', stage);
    const set = v => stage.style.setProperty('--pos', v + '%');
    range.addEventListener('input', () => set(range.value));
    if ('IntersectionObserver' in window && !reduce.matches && stage.animate) {
      const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect();
        const t0 = performance.now(), seq = [50, 82, 22, 50];
        (function step(now) {
          const t = clamp((now - t0) / 2600, 0, 1), seg = t * 3, k = Math.min(2, Math.floor(seg)), f = seg - k, e = f * f * (3 - 2 * f);
          const v = seq[k] + (seq[k + 1] - seq[k]) * e; range.value = v; set(v);
          if (t < 1 && document.activeElement !== range) requestAnimationFrame(step);
        })(t0);
      }, { threshold: .55 });
      io.observe(stage);
    }
  })();
})();
