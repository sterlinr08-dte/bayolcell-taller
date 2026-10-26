/* BAYOL CELL · Inventario, Artículos e Inventario físico (26-oct-2026). Va con taller-ui-inventario.css.
   Solo actúa con html.bc-inv. Apagar: BC_INV=false o localStorage bc_inv_off='1'.
   No lee ni cambia datos: después de que taller-app.js pinta una tabla, le pone a cada celda su rótulo
   (data-label, tomado del encabezado de la tabla) para que en el celular se vea como tarjeta, y marca
   las píldoras de existencia por almacén. Las tablas que repinta _pintarSiCambio (#partsTable, #assetsTable)
   ya traen sus rótulos y no se tocan, para no hacer que se repinten. */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-inv')) return;

  function limpio(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  var NOMBRE = { 'En otros almacenes': 'Otros almacenes' };

  // Pone data-label a las celdas de una tabla según su <thead>. Devuelve true si cambió algo.
  function rotular(tabla) {
    if (!tabla || !tabla.tHead) return;
    var ths = Array.prototype.map.call(tabla.tHead.rows[0] ? tabla.tHead.rows[0].cells : [], function (th) {
      var t = limpio(th.textContent); return NOMBRE[t] || t;
    });
    if (!ths.length) return;
    Array.prototype.forEach.call(tabla.tBodies, function (tb) {
      Array.prototype.forEach.call(tb.rows, function (tr) {
        if (tr.cells.length !== ths.length) return; // filas de «Cargando…» o «Sin resultados» (colspan)
        Array.prototype.forEach.call(tr.cells, function (td, i) {
          if (!td.hasAttribute('data-label') && ths[i]) td.setAttribute('data-label', ths[i]);
          var vacio = !limpio(td.textContent) && !td.querySelector('input, select, button');
          if (vacio !== td.classList.contains('bci-vacio')) td.classList.toggle('bci-vacio', vacio);
        });
      });
    });
  }

  // Artículos (Info Plus): existencia del Taller y de los otros almacenes como píldoras.
  function articulos() {
    var tb = doc.getElementById('infoplusTable'); if (!tb) return;
    rotular(tb.closest('table'));
    Array.prototype.forEach.call(tb.rows, function (tr) {
      if (tr.cells.length !== 8 || tr.dataset.bci === '1') return;
      tr.dataset.bci = '1';
      var taller = tr.cells[6], otros = tr.cells[7];
      var n = taller.querySelector('b, span');
      if (n) { n.classList.add('bci-taller', Number(limpio(n.textContent)) > 0 ? 'hay' : 'cero'); n.removeAttribute('style'); }
      var pills = otros.querySelectorAll('.badge');
      if (pills.length) {
        var caja = doc.createElement('span'); caja.className = 'bci-alms';
        Array.prototype.forEach.call(pills, function (p) { p.classList.add('bci-alm'); p.removeAttribute('style'); caja.appendChild(p); });
        otros.textContent = ''; otros.appendChild(caja);
      }
    });
  }

  // Inventario físico: la tabla del conteo se vuelve a pintar entera en cada cambio de categoría o búsqueda.
  function invFisico() {
    var cont = doc.getElementById('invFisicoCont'); if (!cont) return;
    Array.prototype.forEach.call(cont.querySelectorAll('.table-wrap table'), rotular);
  }

  function observar(id, fn) {
    var el = doc.getElementById(id); if (!el) return;
    fn();
    new MutationObserver(function () { fn(); }).observe(el, { childList: true, subtree: id === 'invFisicoCont' });
  }

  function iniciar() {
    observar('infoplusTable', articulos);
    observar('invFisicoCont', invFisico);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
