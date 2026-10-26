/* BAYOL CELL · Finanzas: Contabilidad, Cuentas por pagar, Nómina (RRHH), Liquidación, Incentivos, Mis incentivos y
   Financiamientos (26-oct-2026). Va con taller-ui-finanzas.css.
   Solo interfaz, no cambia ningún cálculo, texto guardado ni dato:
   · pone a cada celda de las tablas el nombre de su columna (data-label), para que en el celular la fila se lea como
     tarjeta («Monto · RD$ 125,000.00», «Saldo · RD$ 100,000.00») en vez de cifras sueltas sin nombre;
   · marca como «bcfin-cards» las tablas de solo lectura (sin campos para escribir) que no estaban en .table-wrap,
     para que también se vuelvan tarjetas en el celular; las tablas con campos (nómina por generar, liquidación)
     quedan con su desplazamiento horizontal;
   · marca las filas de totales («Total…», «Utilidad…», pie de tabla) para destacarlas.
   Capa reversible: sin html.bc-fin no hace nada. Apagar en un equipo: localStorage bc_finanzas_off='1'. */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-fin')) return;

  var VISTAS = ['contabilidad', 'cuentasPorPagar', 'nomina', 'liquidacion', 'incentivos', 'misIncentivos', 'financiamientos'];
  // Ventanas de estos módulos (se crean al abrirlas o ya están en la página)
  var VENTANAS = /^(modalCxp|modalRrhh|modalNomEmp|modalAsiento|modalAutoIP|modalApertura|modalRegGasto|modalGastoSimple|modalMovEf|modalCuenta|modalPago|modalContrato|modalRevTickets|modalValTickets)/;
  var TOTAL = /^(=\s*)?(total|totales|utilidad|resultado neto|saldo final|gran total|neto a pagar|total a pagar)\b/i;

  function limpio(t) { return (t || '').replace(/\s+/g, ' ').trim(); }

  // Encabezados de una tabla, respetando colspan: devuelve un arreglo por columna
  function columnas(tabla) {
    var fila = tabla.tHead && tabla.tHead.rows[tabla.tHead.rows.length - 1];
    if (!fila) return null;
    var cols = [];
    Array.prototype.forEach.call(fila.cells, function (th) {
      var n = th.colSpan || 1, t = limpio(th.textContent).replace(/\s*\*$/, '');
      for (var i = 0; i < n; i++) cols.push(t);
    });
    return cols.some(Boolean) ? cols : null;
  }

  function preparar(tabla) {
    var cols = columnas(tabla);
    Array.prototype.forEach.call(tabla.tBodies, function (tb) {
      Array.prototype.forEach.call(tb.rows, function (tr) {
        var celdas = tr.cells;
        // fila de totales
        var primera = celdas[0] ? limpio(celdas[0].textContent) : '';
        if (TOTAL.test(primera)) tr.classList.add('bcfin-total');
        if (!cols || celdas.length < 2) return; // filas de «sin datos» (una celda con colspan)
        var c = 0;
        Array.prototype.forEach.call(celdas, function (td) {
          var nombre = cols[c] || '';
          if (nombre && !td.hasAttribute('data-label')) td.setAttribute('data-label', nombre);
          c += td.colSpan || 1;
        });
      });
    });
    if (tabla.tFoot) Array.prototype.forEach.call(tabla.tFoot.rows, function (tr) { tr.classList.add('bcfin-total'); });
    // Tabla de solo lectura fuera de .table-wrap → tarjetas en el celular
    var filas = Array.prototype.reduce.call(tabla.tBodies, function (n, tb) { return n + tb.rows.length; }, 0);
    if (cols && cols.length >= 3 && filas > 0 && tabla.id !== 'aduanaTabla' && !tabla.closest('.table-wrap') && !tabla.querySelector('tbody input, tbody select, tbody textarea')) {
      tabla.classList.add('bcfin-cards');
    } else {
      tabla.classList.remove('bcfin-cards');
    }
  }

  function repasar(raiz) {
    if (!raiz) return;
    Array.prototype.forEach.call(raiz.querySelectorAll('table'), function (t) { try { preparar(t); } catch (e) {} });
  }

  // Repaso agrupado: cuando una pantalla se repinta muchas veces seguidas, se hace una sola vez por cuadro
  var pendientes = new Set(), programado = false;
  function pedir(raiz) {
    pendientes.add(raiz);
    if (programado) return;
    programado = true;
    requestAnimationFrame(function () {
      programado = false;
      var lista = Array.from(pendientes); pendientes.clear();
      lista.forEach(repasar);
    });
  }

  function vigilar(raiz) {
    if (!raiz || raiz._bcfinObs) return;
    raiz._bcfinObs = new MutationObserver(function (muts) {
      // solo interesa cuando entran tablas o filas nuevas
      for (var i = 0; i < muts.length; i++) { if (muts[i].addedNodes.length) { pedir(raiz); return; } }
    });
    raiz._bcfinObs.observe(raiz, { childList: true, subtree: true });
    pedir(raiz);
  }

  function esVentana(n) { return n && n.nodeType === 1 && n.id && VENTANAS.test(n.id); }

  function iniciar() {
    VISTAS.forEach(function (v) { vigilar(doc.getElementById('v-' + v)); });
    Array.prototype.forEach.call(doc.querySelectorAll('.modal-backdrop[id]'), function (m) { if (esVentana(m)) vigilar(m); });
    // Ventanas que se crean al abrirlas (se agregan directo al body)
    new MutationObserver(function (muts) {
      muts.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (esVentana(n)) vigilar(n); }); });
    }).observe(doc.body, { childList: true });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.bcFinRepasar = function () { VISTAS.forEach(function (v) { repasar(doc.getElementById('v-' + v)); }); };
})();
