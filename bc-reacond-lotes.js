/* BAYOL CELL · Reacondicionados: lista de lotes compacta (dueño, 30-oct-2026, opción B). Estilos en bc-reacond-lotes.css.
   Reordena cada tarjeta que pinta renderLotesReacondTab (taller-app.js) sin cambiar datos ni funciones:
   · el número de la etapa elegida (pestaña 01–06) sale en grande al lado del lote: «13 listos para venta»;
   · se esconden las etapas en 0, la elegida (ya está en grande) y «Total» (va como «de N»); proveedor junto al código;
   · fechas cortas (sin el año si es el año en curso); «% completado» → «%»;
   · toda la tarjeta abre el lote (mismo botón «Abrir lote», ahora «Abrir ›»; Enter/Espacio con el teclado).
   Apagar: BC_RLC=false o localStorage bc_rlc_off='1'. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  if (!root.classList.contains('bc-rlc')) return;
  var ETAPA = { recibidos: 0, evaluacion: 1, proceso: 2, control_calidad: 3, listo_venta: 4, despachados: 5 };
  var UNO = ['recibido', 'en diagnóstico', 'en reparación', 'en control de calidad', 'listo para venta', 'despachado'];
  var VAR = ['recibidos', 'en diagnóstico', 'en reparación', 'en control de calidad', 'listos para venta', 'despachados'];
  var ANIO = String(new Date().getFullYear());
  function tab() { try { return reacondTabActual; } catch (e) { return ''; } }
  function corta(txt) { return txt.replace(new RegExp('(\\d{1,2}/\\d{1,2})/' + ANIO, 'g'), '$1'); }

  function arreglar(card) {
    if (card.classList.contains('rlc')) return;
    var cab = card.firstElementChild, btn = card.querySelector('button[onclick^="abrirLoteReacond"]');
    var etapas = card.querySelectorAll('.reacond-lote-stage:not(.reacond-lote-total)');
    if (!cab || !btn || etapas.length < 6) return;
    var info = cab.firstElementChild; if (!info) return;
    card.classList.add('rlc'); cab.classList.add('rlc-cab'); info.classList.add('rlc-info'); btn.classList.add('rlc-btn');
    btn.innerHTML = '<i class="ti ti-folder-open" aria-hidden="true"></i>Abrir ›';
    var nombre = info.querySelector('.reacond-lote-name'), meta = info.querySelector('.reacond-lote-meta');
    btn.setAttribute('aria-label', 'Abrir el lote ' + (nombre ? nombre.textContent.trim() : ''));
    // proveedor junto al código; fechas cortas
    if (meta && nombre) {
      var txt = meta.innerHTML.split(/<br\s*\/?>/i);
      if (txt.length >= 2) {
        var prov = txt[0].replace(/<[^>]+>/g, '').trim();
        var p = doc.createElement('span'); p.className = 'rlc-prov'; p.textContent = ' · ' + prov;
        nombre.insertAdjacentElement('afterend', p);
        meta.innerHTML = corta(txt.slice(1).join(' '));
      }
    }
    // número de la etapa elegida en grande
    var i = ETAPA[tab()], dest = doc.createElement('div');
    var nums = Array.prototype.map.call(etapas, function (s) { var b = s.querySelector('b'); return b ? parseInt(b.textContent, 10) || 0 : 0; });
    Array.prototype.forEach.call(etapas, function (s, k) { s.classList.toggle('rlc-cero', nums[k] === 0); s.classList.toggle('rlc-elegida', k === i); });
    var totB = card.querySelector('.reacond-lote-total b'), total = totB ? totB.textContent.trim() : '';
    if (i != null) { dest.className = 'rlc-dest e' + i; dest.innerHTML = '<b>' + nums[i] + '</b><span>' + (nums[i] === 1 ? UNO[i] : VAR[i]) + '</span>' + (total ? '<em>de ' + total + '</em>' : ''); }
    else { dest.className = 'rlc-dest'; dest.innerHTML = '<b>' + total + '</b><span>equipos</span>'; }
    cab.insertBefore(dest, btn);
    var pct = card.querySelector('.reacond-lote-progress-label');
    if (pct) pct.textContent = pct.textContent.replace(/\s*completado\s*/i, '');
    // toda la tarjeta abre el lote
    card.tabIndex = 0; card.setAttribute('role', 'button');
    card.addEventListener('click', function (e) { if (e.target.closest('button, a, input, select')) return; btn.click(); });
    card.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); btn.click(); } });
  }
  function repasar() { var c = doc.getElementById('lotesReacondContainer'); if (c) Array.prototype.forEach.call(c.querySelectorAll('.reacond-lote-card'), arreglar); }
  var raf = 0; function pedir() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; repasar(); }); }
  function iniciar() {
    var c = doc.getElementById('lotesReacondContainer');
    if (!c) { setTimeout(iniciar, 600); return; }
    new MutationObserver(pedir).observe(c, { childList: true });
    pedir();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
