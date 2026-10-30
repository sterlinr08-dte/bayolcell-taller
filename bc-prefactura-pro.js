/* BAYOL CELL · Prefactura «nivel pro» (dueño, 30-oct-2026). Estilos en bc-prefactura-pro.css.
   1) PC (≥ 1440 px): dos columnas; el resumen (totales + Guardar e imprimir / Guardar / Imprimir) queda fijo a la derecha
      y la barra de abajo entra al resumen (sin su total repetido). Se MUEVEN los mismos nodos, nada se duplica.
      En pantallas menores todo vuelve a su lugar (barra fija abajo, como siempre).
   2) Pulido: Nombre/WhatsApp/Cédula alineados, «Sin artículos» dice qué hacer, «Descuento RD$» → «Descuento».
   3) El engranaje de la Prefactura abre una ventana «Impresora» ENCIMA (no saca de la prefactura) con lo justo para
      arreglar una falla: conexión QZ Tray, impresora de tickets y de etiquetas, Imprimir prueba y el papel/copias de la
      prefactura. Usa los mismos paneles de «Config. Impresora» (se mueven a la ventana y vuelven al cerrar).
      Cualquier empleado con sesión puede (tienePermiso('config_impresora') ya lo permite, 23-oct-2026).
   Apagar: BC_PFPRO=false o localStorage bc_pfpro_off='1'. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  if (!root.classList.contains('bc-pfpro')) return;
  var MQ = window.matchMedia ? window.matchMedia('(min-width: 1440px)') : { matches: false, addListener: function () {} };
  function q(s, r) { return (r || doc).querySelector(s); }

  /* ---------- 1 · Dos columnas en PC ---------- */
  var aside = null, casa = {};
  function piezas() {
    var v = doc.getElementById('v-recepcion'); if (!v) return null;
    var d = q('.bcpf-doc', v), tot = q('.bcpf-tot', v), bar = q('.bcpf-bar', v);
    if (!d || !tot || !bar) return null;
    return { v: v, doc: d, tot: tot, bar: bar };
  }
  // Se mueve la BARRA entera (con sus botones) dentro del resumen: taller-prefactura.js la sigue encontrando en R.bar.
  function aplicar() {
    var p = piezas(); if (!p) return false;
    if (MQ.matches) {
      if (!aside) { aside = doc.createElement('aside'); aside.className = 'bcpro-res'; aside.setAttribute('aria-label', 'Resumen de la prefactura'); aside.innerHTML = '<h3>Resumen</h3>'; }
      if (aside.parentNode !== p.doc) p.doc.appendChild(aside);
      if (p.tot.parentNode !== aside) { casa.totPadre = p.tot.parentNode; casa.totSig = p.tot.nextSibling; aside.appendChild(p.tot); }
      if (p.bar.parentNode !== aside) aside.appendChild(p.bar);
      root.classList.add('bc-pfpro-2c');
    } else if (aside && aside.parentNode) {
      if (casa.totPadre) casa.totPadre.insertBefore(p.tot, casa.totSig && casa.totSig.parentNode === casa.totPadre ? casa.totSig : null);
      p.v.appendChild(p.bar);
      aside.parentNode.removeChild(aside);
      root.classList.remove('bc-pfpro-2c');
    }
    return true;
  }

  /* ---------- 2 · Pulido ---------- */
  function pulir() {
    var v = doc.getElementById('v-recepcion'); if (!v) return;
    var vacio = q('.bcpf-vacio', v);
    if (vacio && !vacio.dataset.bcpro) { vacio.dataset.bcpro = '1'; vacio.innerHTML = '<span class="bcpro-v1">Aún no hay artículos</span><span>Toque «Buscar artículo» o pulse <kbd>F2</kbd> · también puede escanear</span>'; }
    var lab = q('.bcpf-tot .tdm label > span:first-child', v);
    if (lab && !lab.dataset.bcpro && /RD\$\s*$/.test(lab.textContent)) { lab.dataset.bcpro = '1'; lab.innerHTML = 'Descuento <span class="bcpro-rd">RD$</span>'; }
  }

  /* ---------- 3 · Ventana «Impresora» ---------- */
  var velo = null, devolver = [];
  function cerrarImp() {
    if (!velo) return;
    devolver.forEach(function (d) { if (d.padre) d.padre.insertBefore(d.nodo, d.sig && d.sig.parentNode === d.padre ? d.sig : null); });
    devolver = []; velo.remove(); velo = null;
    doc.removeEventListener('keydown', escImp, true);
    var g = q('#v-recepcion .ibtn-imp'); if (g) g.focus();
  }
  function escImp(e) { if (e.key === 'Escape') { e.stopPropagation(); cerrarImp(); } }
  function mover(nodo, dest) { if (!nodo) return; devolver.push({ nodo: nodo, padre: nodo.parentNode, sig: nodo.nextSibling }); dest.appendChild(nodo); }
  function pruebaTicket() {
    try {
      if (typeof _qzConectado === 'undefined' || !_qzConectado) { toast('QZ Tray no está conectado. Toque «Reconectar».', 'error'); return; }
      if (typeof qzImpresoraTickets !== 'function' || !qzImpresoraTickets()) { toast('Elija primero la impresora de TICKETS.', 'error'); return; }
      var h = '<div style="font:14px/1.4 Arial;padding:6px;text-align:center"><b>BAYOL CELL</b><br>Prueba de impresión<br>' + new Date().toLocaleString('es-DO') + '<br>Si lee esto, la impresora de tickets funciona.</div>';
      Promise.resolve(qzImprimirHtml(h, 76, null, 1, 'tickets')).then(function (ok) { if (ok !== false) toast('Prueba enviada a ' + qzImpresoraTickets() + '.'); });
    } catch (e) { try { toast('No se pudo imprimir la prueba: ' + (e.message || e), 'error'); } catch (er) {} }
  }
  function abrirImp() {
    if (velo) return;
    velo = doc.createElement('div'); velo.className = 'bcpro-imp-velo';
    velo.innerHTML = '<div class="bcpro-imp" role="dialog" aria-modal="true" aria-labelledby="bcproImpT">' +
      '<div class="bcpro-imp-top"><h3 id="bcproImpT"><i class="ti ti-printer" aria-hidden="true"></i> Impresora de esta computadora</h3>' +
      '<button type="button" class="bcpro-imp-x" aria-label="Cerrar"><i class="ti ti-x" aria-hidden="true"></i></button></div>' +
      '<div class="bcpro-imp-cuerpo"><p class="bcpro-imp-nota">Si la prefactura no sale: revise que QZ Tray esté abierto, toque «Reconectar», elija la impresora de tickets y haga una prueba. Los cambios son solo de esta computadora.</p>' +
      '<div class="bcpro-imp-pie"><button type="button" class="btn btn-light bcpro-rec"><i class="ti ti-refresh" aria-hidden="true"></i> Reconectar</button>' +
      '<button type="button" class="btn btn-dark bcpro-pt"><i class="ti ti-receipt" aria-hidden="true"></i> Prueba de ticket</button></div></div></div>';
    var cuerpo = q('.bcpro-imp-cuerpo', velo);
    mover(doc.getElementById('qzPanelCard'), cuerpo);
    mover(doc.getElementById('bcPfFmtCard'), cuerpo);
    cuerpo.appendChild(q('.bcpro-imp-pie', velo));
    doc.body.appendChild(velo);
    q('.bcpro-imp-x', velo).addEventListener('click', cerrarImp);
    velo.addEventListener('click', function (e) { if (e.target === velo) cerrarImp(); });
    q('.bcpro-rec', velo).addEventListener('click', function () { try { qzVerificarConexion(); } catch (e) {} });
    q('.bcpro-pt', velo).addEventListener('click', pruebaTicket);
    doc.addEventListener('keydown', escImp, true);
    try { if (typeof inicializarConfigImpresora === 'function') inicializarConfigImpresora(); } catch (e) {}
    try { qzVerificarConexion(); } catch (e) {}
    setTimeout(function () { var x = q('.bcpro-imp-x', velo); if (x) x.focus(); }, 30);
  }
  // El engranaje de la Prefactura (taller-prefactura.js lo mandaba a la página «Config. Impresora»): ahora abre la ventana.
  doc.addEventListener('click', function (e) {
    var g = e.target.closest && e.target.closest('#v-recepcion .ibtn-imp'); if (!g) return;
    e.preventDefault(); e.stopImmediatePropagation(); abrirImp();
  }, true);
  window.bcImpresoraRapida = { abrir: abrirImp, cerrar: cerrarImp };

  /* ---------- arranque ---------- */
  var intentos = 0;
  function iniciar() {
    if (!aplicar()) { if (++intentos < 40) setTimeout(iniciar, 500); return; }
    pulir();
    var lista = doc.getElementById('rxArticulos');
    if (lista) new MutationObserver(pulir).observe(lista, { childList: true, subtree: false });
    if (MQ.addEventListener) MQ.addEventListener('change', aplicar); else MQ.addListener(aplicar);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
