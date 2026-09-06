(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- MENU MOBILE ---------- */
  var nav = $('#mainNav'), toggle = $('#navToggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- SCROLL: HEADER + BOTÃO TOPO ---------- */
  var header = $('#siteHeader'), toTop = $('#toTop'), ticking = false;

  function onScroll() {
    var y = window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 50);
    if (toTop) toTop.classList.toggle('show', y > 600);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- HERO SLIDER ---------- */
  (function heroSlider() {
    var bg = $('#heroBg');
    if (!bg) return;

    var raw = bg.getAttribute('data-hero-images') || '';
    var imgs = raw.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    var dotsBox = $('#heroDots');

    if (imgs.length < 2) {
      if (dotsBox) dotsBox.remove();
      bg.classList.add('is-visible');
      return;
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var idx = 0, timer = null;

    function paint(i) {
      idx = (i + imgs.length) % imgs.length;
      bg.classList.remove('is-visible');
      var img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = function () {
        bg.style.backgroundImage = 'url("' + imgs[idx] + '")';
        requestAnimationFrame(function () { bg.classList.add('is-visible'); });
      };
      img.src = imgs[idx];
      if (dotsBox) {
        $$('button', dotsBox).forEach(function (b, n) {
          b.setAttribute('aria-selected', String(n === idx));
        });
      }
    }

    function restart() {
      clearInterval(timer);
      if (!reduced) timer = setInterval(function () { paint(idx + 1); }, 7000); // Aumentado para curtir a animação css
    }

    if (dotsBox) {
      dotsBox.innerHTML = '';
      imgs.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Slide ' + (i + 1));
        b.setAttribute('aria-selected', String(i === 0));
        b.addEventListener('click', function () { paint(i); restart(); });
        dotsBox.appendChild(b);
      });
    }

    paint(0);
    restart();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearInterval(timer); else restart();
    });
  })();

  /* ---------- STAGGER NOS GRIDS ---------- */
  $$('.features-grid, .plans-grid, .testimonials-grid, .stats-grid, .veja-tambem-grid').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) {
      c.style.transitionDelay = Math.min(i * 100, 500) + 'ms'; // Suavizado para o novo CSS
    });
  });

  /* ---------- FALLBACK SEM INTERSECTIONOBSERVER ---------- */
  if (!('IntersectionObserver' in window)) {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
    $$('img[data-src]').forEach(function (el) { el.src = el.dataset.src; });
    $$('[data-lazy-map]').forEach(function (el) {
      el.innerHTML = el.getAttribute('data-lazy-map');
      el.removeAttribute('data-lazy-map');
    });
    $$('[data-count]').forEach(function (el) {
      el.textContent = (+el.dataset.count).toLocaleString('pt-BR');
    });
    return;
  }

  /* ---------- LAZY: REVEAL, IMAGENS E MAPA ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;

      if (el.dataset.src) {
        el.src = el.dataset.src;
        delete el.dataset.src;
      }
      if (el.hasAttribute('data-lazy-map')) {
        el.innerHTML = el.getAttribute('data-lazy-map');
        el.removeAttribute('data-lazy-map');
      }
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { rootMargin: '100px 0px', threshold: 0.1 }); // Margem otimizada

  $$('.reveal, [data-lazy-map], img[data-src]').forEach(function (el) { io.observe(el); });

  /* ---------- CONTADOR ---------- */
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, end = parseFloat(el.dataset.count) || 0;
      cio.unobserve(el);

      if (reducedMotion) { el.textContent = end.toLocaleString('pt-BR'); return; }

      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1800, 1); // Desacelerado levemente (1400 -> 1800) para visual premium
        // Easing out cubic
        el.textContent = Math.floor(end * (1 - Math.pow(1 - p, 3))).toLocaleString('pt-BR');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.3 }); // Threshold ajustado para disparar na hora certa

  $$('[data-count]').forEach(function (el) { cio.observe(el); });
})();
