/* BAYOL CELL · web pública — capa de animaciones con Motion (motion.dev), al estilo del video de motion graphics:
   títulos que entran letra por letra, etiquetas que se escriben, líneas guía que se dibujan, números que cuentan,
   portada que se mueve al bajar y cambio de equipo con resorte. Solo presentación: no cambia enlaces, precios ni
   pedido. Si Motion no carga o la persona pidió «reducir movimiento», la página queda con las animaciones simples
   del CSS (no se rompe nada). */
(function () {
  'use strict';
  var M = window.Motion;
  if (!M || !M.animate || window.__bcMotion) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.__bcMotion = true;
  var animate = M.animate, inView = M.inView, stagger = M.stagger, scroll = M.scroll, press = M.press;
  var EASE = [0.2, 0.8, 0.2, 1];
  var RESORTE = { type: 'spring', stiffness: 260, damping: 22 };
  document.documentElement.classList.add('bc-motion');

  // ── Utilidades ──
  // Parte un título en letras sin perder <em>/<br> ni el nombre accesible.
  function partirLetras(el) {
    if (!el || el.dataset.mSplit) return [];
    el.dataset.mSplit = '1';
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var letras = [];
    (function recorrer(nodo) {
      [].slice.call(nodo.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            var pal = document.createElement('span'); pal.className = 'mpal'; pal.setAttribute('aria-hidden', 'true');
            w.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'mch'; s.textContent = c; pal.appendChild(s); letras.push(s); });
            frag.appendChild(pal);
          });
          nodo.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') recorrer(n);
      });
    })(el);
    return letras;
  }
  function ocultar(els) { els.forEach(function (e) { e.style.opacity = '0'; }); }
  // Quita la aparición simple del CSS para que la maneje Motion.
  function tomar(el) { if (!el) return el; el.classList.remove('aparece'); el.classList.add('si'); return el; }

  // ── 1. Título de portada: letras que suben con desenfoque y la palabra roja brilla (como en el video) ──
  (function () {
    var h = document.getElementById('h1'); if (!h) return;
    if (h.classList.contains('go')) return; // ya se mostró con el CSS
    var letras = [].slice.call(h.querySelectorAll('.ch'));
    letras.forEach(function (c) { c.style.transition = 'none'; c.style.opacity = '0'; });
    h.classList.add('go');
    animate(letras, { opacity: [0, 1], y: ['0.55em', '0em'], filter: ['blur(10px)', 'blur(0px)'] }, { duration: 0.75, delay: stagger(0.03, { startDelay: 0.15 }), ease: EASE })
      .then(function () {
        var em = h.querySelector('em');
        if (em) animate(em, { textShadow: ['0 0 0 rgba(255,90,79,0)', '0 0 34px rgba(255,90,79,.75)', '0 0 14px rgba(255,90,79,.25)'] }, { duration: 1.4, ease: 'easeOut' });
      });
  })();

  // ── 2. Líneas guía punteadas que se dibujan a lo ancho, arriba y abajo del título (del video) ──
  (function () {
    var hero = document.querySelector('.hero'), h = document.getElementById('h1'); if (!hero || !h) return;
    var g1 = document.createElement('span'), g2 = document.createElement('span');
    g1.className = g2.className = 'guia'; g1.setAttribute('aria-hidden', 'true'); g2.setAttribute('aria-hidden', 'true');
    hero.appendChild(g1); hero.appendChild(g2);
    function ubicar() {
      var rh = hero.getBoundingClientRect(), r = h.getBoundingClientRect();
      g1.style.top = (r.top - rh.top - 6) + 'px';
      g2.style.top = (r.bottom - rh.top + 4) + 'px';
    }
    ubicar(); addEventListener('resize', ubicar);
    animate([g1, g2], { scaleX: [0, 1], opacity: [0, 1] }, { duration: 1.1, delay: stagger(0.15, { startDelay: 0.1 }), ease: EASE });
  })();

  // ── 3. Portada al bajar: el equipo sube y se aleja, el nombre de fondo va en contra (parallax) ──
  (function () {
    var hero = document.querySelector('.hero'); if (!hero || !scroll) return;
    var escena = document.querySelector('.hero-escena'), letra = document.getElementById('hero-letra'), detalle = document.querySelector('.hero-detalle');
    var opts = { target: hero, offset: ['start start', 'end start'] };
    if (escena) scroll(animate(escena, { y: [0, 90], scale: [1, 0.92] }, { ease: 'linear' }), opts);
    if (letra) scroll(animate(letra, { y: [0, -70], opacity: [1, 0.3] }, { ease: 'linear' }), opts);
    if (detalle) scroll(animate(detalle, { y: [0, 40], opacity: [1, 0.35] }, { ease: 'linear' }), opts);
  })();

  // ── 4. Cambio de equipo en la portada: sale girando hacia un lado y entra con resorte desde el otro ──
  window.bcMotionHero = function (foto, letra, dir, aplicar) {
    Promise.all([
      animate(foto, { x: [0, -50 * dir], opacity: [1, 0], rotateY: [0, 18 * dir], scale: [1, 0.94] }, { duration: 0.22, ease: 'easeIn' }),
      animate(letra, { x: [0, -30 * dir], opacity: [1, 0] }, { duration: 0.2, ease: 'easeIn' })
    ]).then(function () {
      aplicar();
      animate(foto, { x: [70 * dir, 0], opacity: [0, 1], rotateY: [-14 * dir, 0], scale: [0.94, 1] }, RESORTE);
      animate(letra, { x: [40 * dir, 0], opacity: [0, 1] }, { duration: 0.5, ease: EASE });
    });
  };

  // ── 5. Títulos de sección letra por letra y etiquetas que se escriben, al llegar a cada sección ──
  document.querySelectorAll('main h2:not(#hero-modelo)').forEach(function (h2) {
    var letras = partirLetras(h2); if (!letras.length) return;
    var cab = h2.closest('.aparece'); if (cab) tomar(cab);
    ocultar(letras);
    var eb = h2.parentElement && h2.parentElement.querySelector('.eyebrow');
    if (eb) eb.style.clipPath = 'inset(0 100% 0 0)';
    var lead0 = h2.parentElement && h2.parentElement.querySelector('.lead');
    if (lead0) lead0.style.opacity = '0';
    inView(h2, function () {
      if (eb) animate(eb, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { duration: 0.6, ease: 'linear' });
      animate(letras, { opacity: [0, 1], y: ['0.5em', '0em'], filter: ['blur(8px)', 'blur(0px)'] }, { duration: 0.6, delay: stagger(0.018, { startDelay: 0.12 }), ease: EASE });
      var lead = h2.parentElement && h2.parentElement.querySelector('.lead');
      if (lead) animate(lead, { opacity: [0, 1], y: [14, 0] }, { duration: 0.6, delay: 0.35, ease: EASE });
    }, { amount: 0.6 });
  });

  // ── 6. Pasos (financiamiento y canje): la línea se dibuja y cada paso cae en cascada ──
  document.querySelectorAll('.pasos').forEach(function (p) {
    tomar(p);
    var linea = document.createElement('span'); linea.className = 'pasos-linea'; linea.setAttribute('aria-hidden', 'true'); p.prepend(linea);
    var pasos = [].slice.call(p.querySelectorAll('.paso')); ocultar(pasos); linea.style.transform = 'scaleX(0)';
    inView(p, function () {
      animate(linea, { scaleX: [0, 1] }, { duration: 0.9, ease: EASE });
      animate(pasos, { opacity: [0, 1], y: [22, 0] }, { duration: 0.55, delay: stagger(0.14, { startDelay: 0.25 }), ease: EASE });
    }, { amount: 0.4 });
  });

  // ── 7. Grupos de tarjetas en cascada ──
  [['.confianza .wrap', '> div'], ['.servicios', '> .servicio'], ['.ofertas', '> .oferta'], ['.datos-c', '> *'], ['.dos', '> .tarjeta'], ['.para', '> .chip']].forEach(function (par) {
    document.querySelectorAll(par[0]).forEach(function (cont) {
      tomar(cont);
      var hijos = [].slice.call(cont.querySelectorAll(':scope ' + par[1]));
      hijos.forEach(tomar); ocultar(hijos);
      inView(cont, function () {
        animate(hijos, { opacity: [0, 1], y: [28, 0], scale: [0.97, 1] }, { duration: 0.6, delay: stagger(0.08), ease: EASE });
        var iconos = [].slice.call(cont.querySelectorAll(':scope > div > i, .servicio > i'));
        if (iconos.length) animate(iconos, { rotate: [-90, 0], scale: [0.4, 1] }, Object.assign({ delay: stagger(0.08, { startDelay: 0.1 }) }, RESORTE));
      }, { amount: 0.25 });
    });
  });

  // ── 8. Video: se abre como una ventana desde el centro ──
  (function () {
    var marco = document.querySelector('.comercial-marco'); if (!marco) return;
    tomar(marco); marco.style.clipPath = 'inset(12% 12% 12% 12% round 22px)';
    inView(marco, function () { animate(marco, { clipPath: ['inset(12% 12% 12% 12% round 22px)', 'inset(0% 0% 0% 0% round 22px)'], scale: [0.96, 1] }, { duration: 0.9, ease: EASE }); }, { amount: 0.3 });
  })();

  // ── 9. Imagen de plan canje: entra con un leve giro ──
  (function () {
    var img = document.querySelector('.canje-foto'); if (!img) return;
    tomar(img); img.style.opacity = '0';
    inView(img, function () { animate(img, { opacity: [0, 1], rotate: [4, 0], y: [40, 0] }, RESORTE); }, { amount: 0.25 });
  })();

  // ── 10. Tarjetas de equipos: los números cuentan y la foto entra al llegar a cada una ──
  function contar(b) {
    var t = b.firstChild; if (!t || t.nodeType !== 3) return;
    var n = parseFloat(t.textContent); if (!(n > 0)) return;
    animate(0, n, { duration: 0.9, ease: EASE, onUpdate: function (v) { t.textContent = Math.round(v); } });
  }
  function enlazarTarjetas(root) {
    (root || document).querySelectorAll('.vt:not([data-m-bind])').forEach(function (card) {
      card.dataset.mBind = '1';
      inView(card, function () {
        card.querySelectorAll('.vt-dato b').forEach(contar);
        var img = card.querySelector('.pieza img');
        if (img) animate(img, { y: [30, 0], opacity: [0.2, 1] }, RESORTE);
        var chips = [].slice.call(card.querySelectorAll('.vt-info .vt-rasgos span, .variantes button'));
        if (chips.length) animate(chips, { opacity: [0, 1], y: [10, 0] }, { duration: 0.4, delay: stagger(0.035, { startDelay: 0.15 }), ease: EASE });
      }, { amount: 0.55 });
    });
  }
  window.bcMotionBind = enlazarTarjetas;
  enlazarTarjetas();

  // ── 11. Botones: se hunden al tocarlos y rebotan al soltar ──
  if (press) press('.btn, .hero-flecha, .vt-flechas button, .cat-tabs button, .variantes button, .pd-bolsa, .bm-pedido, .menu-btn', function (el) {
    animate(el, { scale: 0.95 }, { type: 'spring', stiffness: 700, damping: 35 });
    return function () { animate(el, { scale: 1 }, { type: 'spring', stiffness: 500, damping: 14 }); };
  });

  // ── 12. Cinta de la bolsa del pedido: rebote con resorte cuando cambia el número ──
  (function () {
    var ins = document.getElementById('pd-ins'), bm = document.getElementById('bm-pedido-n');
    [ins, bm].forEach(function (el) {
      if (!el || !window.MutationObserver) return;
      new MutationObserver(function () { animate(el, { scale: [1.6, 1] }, { type: 'spring', stiffness: 500, damping: 12 }); }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  })();
})();
