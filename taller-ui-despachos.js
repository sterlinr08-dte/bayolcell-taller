/* BAYOL CELL · Capa de Despachos, Piezas solicitadas y Proveedores (26-oct-2026, agente 4 de 10).
   Solo presentación y accesibilidad; no cambia datos, cálculos ni llamadas a Info Plus o Supabase.
   - Tablas del despacho: pone data-label en cada celda (con el título de su columna) para que en el celular se lean
     como tarjetas «Etiqueta · dato» (estilo ya existente en taller-afinado.css).
   - Botones de solo ícono: aria-label con su título. Filtros de piezas: aria-pressed.
   - Ventanas de estas pantallas: role="dialog", aria-modal, nombre (aria-labelledby al título), foco al primer campo
     al abrir y regreso del foco al botón que la abrió al cerrar. Las ventanas que se crean ya abiertas (appendChild con
     la clase active) no las veía bc-dialogos.js, que solo observa cambios de clase.
   Apagar: localStorage bc_uid_off='1' o BC_UID=false (taller.html). */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-uid')) return;

  // Ventanas que reciben el estilo de la capa (barra de título clara) y la accesibilidad.
  var VENTANAS = ['modalAjusteRapido', 'modalDespRep', 'modalProveedor', 'modalNuevaCompra', 'modalImportCompra',
    'modalManif', 'modalSerialIP', 'modalRegCompraIP', 'modalHistLiq'];
  // Solo accesibilidad (su aspecto lo lleva otra pantalla: Despachar teléfonos se abre desde Reacondicionados).
  var SOLO_A11Y = ['modalDespTel', 'modalDespachoRapido'];

  function txt(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }

  // ── Etiquetas de columna en las tablas del despacho ──
  function etiquetar(cont) {
    if (!cont) return;
    cont.querySelectorAll('table').forEach(function (t) {
      var ths = Array.prototype.map.call(t.querySelectorAll('thead th'), function (th) { return txt(th); });
      if (!ths.length) return;
      t.querySelectorAll('tbody tr').forEach(function (tr) {
        Array.prototype.forEach.call(tr.children, function (td, i) {
          if (td.tagName !== 'TD' || td.hasAttribute('data-label')) return;
          // celda vacía (sin botones ni texto): sin etiqueta, la capa la esconde en el celular
          var vacia = !txt(td) && !td.querySelector('button,input,select,a');
          td.setAttribute('data-label', vacia ? '' : (ths[i] || 'Acciones')); // columna de botones sin título
        });
      });
    });
  }
  // ── Botones con solo ícono: nombre accesible desde su título ──
  function nombrar(raiz) {
    if (!raiz) return;
    raiz.querySelectorAll('button[title]:not([aria-label])').forEach(function (b) { if (!txt(b) || txt(b) === '✕') b.setAttribute('aria-label', b.getAttribute('title')); });
    raiz.querySelectorAll('button[onclick^="_despQuitar"]:not([aria-label])').forEach(function (b) { b.setAttribute('aria-label', 'Quitar artículo'); });
  }
  function filtrosPiezas() {
    ['activas', 'historial', 'todas'].forEach(function (k) {
      var b = doc.getElementById('psFlt_' + k); if (!b) return;
      b.setAttribute('aria-pressed', String(typeof _psFiltro !== 'undefined' && _psFiltro === k));
    });
    ['psTabOrden', 'psTabReacond'].forEach(function (id) {
      var b = doc.getElementById(id); if (b) b.setAttribute('aria-pressed', String(b.classList.contains('ps-tab-activa')));
    });
  }
  function vigilar(id, fn) {
    var el = doc.getElementById(id); if (!el) return;
    fn(el);
    new MutationObserver(function () { fn(el); }).observe(el, { childList: true, subtree: true });
  }

  // ── Arreglos fijos de las pantallas (una vez) ──
  function pantallas() {
    var vd = doc.getElementById('v-despachos');
    if (vd) {
      Array.prototype.forEach.call(vd.querySelectorAll('div'), function (d) {
        if (!d.children.length && txt(d) === '→') { d.classList.add('bcud-flecha'); d.setAttribute('aria-hidden', 'true'); }
      });
      nombrar(vd);
    }
    var pl = doc.querySelector('#v-proveedores #prov-lista .card');
    if (pl) {
      var acc = pl.querySelector('button[onclick="abrirModalNuevaCompra()"]');
      if (acc && acc.parentElement) acc.parentElement.classList.add('bcud-acciones');
      // Etiquetas cortas, sin Mayúscula Inicial en cada palabra (los títulos largos siguen en el title del botón)
      var NUEVO = { 'abrirModalNuevaCompra()': 'Nueva compra', 'abrirImportarManifiesto()': 'Importar manifiesto', 'abrirLiquidacionAduana()': 'Liquidación de aduana' };
      Object.keys(NUEVO).forEach(function (fn) {
        var b = pl.querySelector('button[onclick="' + fn + '"]'); if (!b) return;
        var nodos = Array.prototype.filter.call(b.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
        if (nodos.length) nodos[nodos.length - 1].textContent = ' ' + NUEVO[fn];
      });
    }
  }

  // ── Ventanas ──
  var abiertas = new Map(); // ventana → elemento que tenía el foco al abrir
  var FOC = 'input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea:not([disabled])';
  function abierta(m) { return m && m.classList.contains('modal-backdrop') && m.classList.contains('active') && doc.body.contains(m); }
  function alAbrir(m) {
    if (abiertas.has(m)) return;
    abiertas.set(m, doc.activeElement);
    if (VENTANAS.indexOf(m.id) >= 0) m.classList.add('bcud-dlg');
    if (!m.hasAttribute('role')) m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    var h = m.querySelector('.modal-header h3, h3');
    if (h) { if (!h.id) h.id = m.id + 'Titulo'; m.setAttribute('aria-labelledby', h.id); }
    setTimeout(function () {
      if (!abierta(m) || m.contains(doc.activeElement)) return;
      var f = Array.prototype.filter.call(m.querySelectorAll(FOC), function (x) { return x.offsetParent !== null; })[0]
        || Array.prototype.filter.call(m.querySelectorAll('button:not(.modal-close)'), function (x) { return x.offsetParent !== null; })[0];
      try { (f || m).focus({ preventScroll: true }); } catch (e) {}
    }, 60);
  }
  function alCerrar(m) {
    if (!abiertas.has(m)) return;
    var prev = abiertas.get(m); abiertas.delete(m);
    if (prev && prev !== doc.body && doc.body.contains(prev) && !doc.querySelector('.modal-backdrop.active')) {
      try { prev.focus({ preventScroll: true }); } catch (e) {}
    }
  }
  function esNuestra(m) { return m && m.id && (VENTANAS.indexOf(m.id) >= 0 || SOLO_A11Y.indexOf(m.id) >= 0); }
  function revisar(m) { if (!esNuestra(m)) return; if (abierta(m)) alAbrir(m); else alCerrar(m); }

  function iniciar() {
    pantallas();
    vigilar('despachoCart', function (el) { etiquetar(el); nombrar(el); });
    vigilar('despachosHistorial', function (el) { etiquetar(el); nombrar(el); });
    vigilar('piezasSolicitadasLista', function (el) { nombrar(el); filtrosPiezas(); });
    // Ventanas creadas por código: se agregan al <body>. Las fijas del HTML se abren cambiando su clase.
    var porClase = new MutationObserver(function (ms) { ms.forEach(function (x) { revisar(x.target); }); });
    function seguirClase(m) { if (esNuestra(m) && !m._bcudObs) { m._bcudObs = 1; porClase.observe(m, { attributes: true, attributeFilter: ['class'] }); } }
    new MutationObserver(function (ms) {
      ms.forEach(function (x) {
        Array.prototype.forEach.call(x.addedNodes, function (n) { if (n.nodeType === 1) { seguirClase(n); revisar(n); } });
        Array.prototype.forEach.call(x.removedNodes, function (n) { if (n.nodeType === 1 && abiertas.has(n)) alCerrar(n); });
      });
    }).observe(doc.body, { childList: true });
    VENTANAS.concat(SOLO_A11Y).forEach(function (id) { var m = doc.getElementById(id); seguirClase(m); revisar(m); });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
