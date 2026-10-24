// BAYOL CELL · Ventanas accesibles (24-oct-2026, auditoría V03).
// Toda ventana `.modal-backdrop.active` recibe el foco al abrirse, Tab y Shift+Tab se quedan dentro, y al cerrarse el foco
// vuelve al botón que la abrió. No cambia cómo se abren ni se cierran (eso sigue en taller-app.js); solo observa la clase.
(function () {
  'use strict';
  var doc = document, anterior = new WeakMap();
  var FOC = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function visibles(raiz) { return Array.prototype.filter.call(raiz.querySelectorAll(FOC), function (x) { return x.offsetParent !== null && !x.closest('[hidden]'); }); }
  function activa() { var l = doc.querySelectorAll('.modal-backdrop.active'); return l.length ? l[l.length - 1] : null; }
  function alAbrir(m) {
    if (m.dataset.bcdFoco === '1') return; m.dataset.bcdFoco = '1';
    anterior.set(m, doc.activeElement);
    if (!m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1');
    setTimeout(function () {
      if (!m.classList.contains('active')) return;
      var f = visibles(m); var primero = f.find(function (x) { return !x.matches('.modal-close,[aria-label="Cerrar"],.btn-light'); }) || f[0];
      try { (primero || m).focus({ preventScroll: true }); } catch (e) {}
    }, 30);
  }
  function alCerrar(m) {
    if (m.dataset.bcdFoco !== '1') return; delete m.dataset.bcdFoco;
    var prev = anterior.get(m); anterior.delete(m);
    if (prev && doc.contains(prev) && !activa()) { try { prev.focus({ preventScroll: true }); } catch (e) {} }
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var m = activa(); if (!m) return;
    var f = visibles(m); if (!f.length) { e.preventDefault(); return; }
    var i = f.indexOf(doc.activeElement);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
  }, true);
  var mo = new MutationObserver(function (ms) {
    ms.forEach(function (x) {
      var m = x.target; if (!m.classList || !m.classList.contains('modal-backdrop')) return;
      if (m.classList.contains('active')) alAbrir(m); else alCerrar(m);
    });
  });
  function iniciar() { mo.observe(doc.body, { attributes: true, attributeFilter: ['class'], subtree: true }); doc.querySelectorAll('.modal-backdrop.active').forEach(alAbrir); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
