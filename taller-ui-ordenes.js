/* taller-ui-ordenes.js — Órdenes y Atención (26-oct-2026). Acompaña a taller-ui-ordenes.css.
 * - Atención: marca el filtro elegido («Todas / Activas / Entregadas» y la fecha) con aria-pressed, para que se
 *   vea cuál está puesto (antes los botones no cambiaban).
 * Capa aislada: no cambia datos, onclick ni permisos. Se apaga con localStorage.bc_uiord_off = '1'
 * (o BC_UIORD = false): sin la clase html.bc-uiord no hace nada.
 */
(function () {
  'use strict';
  if (window.BayolUiOrdenes) return;
  window.BayolUiOrdenes = { version: '20261026-o1' };
  function activa() { return document.documentElement.classList.contains('bc-uiord'); }

  function marcarFiltros() {
    if (!activa()) return;
    var raiz = document.getElementById('v-atencion'); if (!raiz) return;
    var f = (typeof _atencionFiltro !== 'undefined') ? String(_atencionFiltro) : '';
    var d = (typeof _atencionFechaFiltro !== 'undefined') ? String(_atencionFechaFiltro) : '';
    raiz.querySelectorAll('.bco-fil[data-af]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-af') === f ? 'true' : 'false'); });
    raiz.querySelectorAll('.bco-fil[data-afd]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-afd') === d ? 'true' : 'false'); });
  }

  function envolver() {
    if (typeof window.renderAtencionListaOrdenes !== 'function' || window.renderAtencionListaOrdenes._bcoUi) return false;
    var orig = window.renderAtencionListaOrdenes;
    var nuevo = function () { var r = orig.apply(this, arguments); try { marcarFiltros(); } catch (e) {} return r; };
    nuevo._bcoUi = true;
    window.renderAtencionListaOrdenes = nuevo;
    return true;
  }

  function iniciar() {
    if (!envolver()) {
      var n = 0, t = setInterval(function () { if (envolver() || ++n > 40) clearInterval(t); }, 250);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.BayolUiOrdenes.marcarFiltros = marcarFiltros;
})();
