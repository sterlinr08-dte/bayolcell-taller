/* BAYOL CELL · Inicio (v-dashboard) y Mi trabajo (v-miTrabajo) — capa de comportamiento (26-oct-2026).
   Acompaña a taller-ui-inicio.css. No cambia datos, ids, onclick ni textos guardados; solo:
   1) marca los estados vacíos («No hay…», «No tiene…», «Sin alertas…») con .bcui-vacio para darles una tarjeta con ícono;
   2) hace que las tarjetas KPI que abren otra pantalla se puedan usar con el teclado (Tab + Enter/Espacio).
   Apagar: localStorage bc_ui_inicio_off='1' (o BC_UI_INICIO=false en taller.html). */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-ui-inicio')) return;

  var RAICES = ['miTrabajoContenido', 'dashboardSmart', 'dashboardDemoras', 'productividadEmpleados', 'resultadoBusquedaGlobal'];
  var RE_VACIO = /^(No hay |No tiene |No ha |No has |Aún no hay |Sin alertas|Sin resultados)/;
  var RE_OK = /^(Sin alertas|No hay equipos demorados)/;

  function marcarVacios(raiz) {
    if (!raiz) return;
    var cand = raiz.querySelectorAll('div:not(.bcui-vacio)');
    for (var i = 0; i < cand.length; i++) {
      var d = cand[i];
      // solo los avisos de la sección (hasta 2 niveles bajo la raíz), no los de dentro de cada tarjeta de orden
      if (d.parentElement !== raiz && d.parentElement.parentElement !== raiz) continue;
      // solo textos sueltos: sin tarjetas, tablas, botones ni campos dentro
      if (d.querySelector('div,table,button,input,select,a')) continue;
      var t = (d.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > 120 || !RE_VACIO.test(t)) continue;
      d.classList.add('bcui-vacio');
      if (RE_OK.test(t)) d.classList.add('ok');
      var ya = d.querySelector(':scope > i.ti');
      if (ya) { ya.classList.add('bcui-vacio-ico'); continue; }
      var ico = doc.createElement('i');
      ico.className = 'ti ' + (RE_OK.test(t) ? 'ti-circle-check' : 'ti-inbox') + ' bcui-vacio-ico';
      ico.setAttribute('aria-hidden', 'true');
      d.insertBefore(ico, d.firstChild);
    }
  }

  function teclado(raiz) {
    if (!raiz) return;
    var ks = raiz.querySelectorAll('.kpi-box[onclick]:not([data-bcui])');
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i]; k.setAttribute('data-bcui', '1');
      if (!k.hasAttribute('tabindex')) k.tabIndex = 0;
      if (!k.hasAttribute('role')) k.setAttribute('role', 'button');
      // sin aria-label fijo: el nombre accesible sale del rótulo y del número actuales
      k.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); }
      });
    }
  }

  function aplicar() {
    RAICES.forEach(function (id) { marcarVacios(doc.getElementById(id)); });
    teclado(doc.getElementById('v-dashboard'));
    teclado(doc.getElementById('miTrabajoResumen'));
  }

  var pend = false;
  function programar() { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; try { aplicar(); } catch (e) {} }); }
  function iniciar() {
    aplicar();
    var mo = new MutationObserver(programar);
    ['v-dashboard', 'v-miTrabajo'].forEach(function (id) { var v = doc.getElementById(id); if (v) mo.observe(v, { childList: true, subtree: true }); });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.bcUiInicioAplicar = aplicar;
})();
