/* BAYOL CELL · Selección en lote arrastrando (dueño, 06-nov-2026: «en el taller primero»; referencia Moxen «filas de golpe»).
   En Reacondicionados › lote abierto › «Equipos del Lote»: se pone el dedo (o el mouse) en la casilla de un equipo y se arrastra
   sobre las demás. Si la primera casilla estaba vacía, marca todo lo que toca; si estaba marcada, lo desmarca. Si el dedo salta
   tarjetas, se rellenan las del medio. Con algo marcado aparece abajo una barra con el conteo y las acciones que YA existían
   (Asignar a técnico, Pasar a, Listo para venta, Despachar): mismas reglas, mismos bloqueos y mismas confirmaciones.
   El arrastre solo empieza sobre la casilla; tocar el resto de la tarjeta sigue abriendo el equipo.
   No toca datos por sí sola. Apagar en un equipo: localStorage.bc_lote_arrastrar_off = '1'. */
(function () {
  'use strict';
  if (window.BayolLoteArrastrar) return;
  try { if (localStorage.getItem('bc_lote_arrastrar_off') === '1') return; } catch (e) {}

  var LISTA = 'reacondEquiposLista';
  function sel() { try { return _reacondSel; } catch (e) { return null; } } // `let` global de taller-app.js
  function idDe(chk) {
    var m = /_reacondToggleSel\('([^']+)'/.exec(chk.getAttribute('onclick') || '');
    return m ? m[1] : null;
  }
  function cajas() {
    var l = document.getElementById(LISTA);
    return l ? Array.prototype.slice.call(l.querySelectorAll('input.bcf-chk')) : [];
  }
  function poner(chk, valor) {
    if (!chk || chk.checked === valor) return;
    var id = idDe(chk), s = sel(); if (!id || !s) return;
    chk.checked = valor;
    if (valor) s.add(id); else s.delete(id);
    var card = chk.closest('.bcf-card'); if (card) card.classList.toggle('bcf-sel', valor);
    try { if (navigator.vibrate) navigator.vibrate(6); } catch (e) {}
  }

  // ── Arrastre ──
  var g = null, tragarClic = false;
  function chkEn(x, y) {
    var el = document.elementFromPoint(x, y);
    var card = el && el.closest ? el.closest('#' + LISTA + ' .bcf-card') : null;
    return card ? card.querySelector('input.bcf-chk') : null;
  }
  function tocar(chk) {
    if (!chk || !g) return;
    var todas = cajas(), i = todas.indexOf(chk);
    if (i < 0) return;
    if (g.ultimo != null && Math.abs(i - g.ultimo) > 1) {          // el dedo saltó tarjetas: rellenar las del medio
      var a = Math.min(i, g.ultimo), b = Math.max(i, g.ultimo);
      for (var k = a + 1; k < b; k++) poner(todas[k], g.modo);
    }
    poner(chk, g.modo); g.ultimo = i; g.movidas++;
  }
  function autoScroll() {
    if (!g) return;
    var h = window.innerHeight, y = g.y, v = 0;
    if (y < 70) v = -Math.ceil((70 - y) / 5); else if (y > h - 90) v = Math.ceil((y - (h - 90)) / 5);
    if (v) { window.scrollBy(0, v); tocar(chkEn(g.x, g.y)); }
    g.raf = requestAnimationFrame(autoScroll);
  }
  document.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    var wrap = e.target.closest && e.target.closest('#' + LISTA + ' .bcf-chk-wrap');
    if (!wrap) return;
    var chk = wrap.querySelector('input.bcf-chk'); if (!chk || !idDe(chk)) return;
    e.preventDefault();
    g = { modo: !chk.checked, ultimo: null, movidas: 0, x: e.clientX, y: e.clientY, raf: 0 };
    tocar(chk); tragarClic = true;
    document.documentElement.classList.add('bc-lote-arrastrando');
    g.raf = requestAnimationFrame(autoScroll);
  }, true);
  document.addEventListener('pointermove', function (e) {
    if (!g) return;
    g.x = e.clientX; g.y = e.clientY;
    tocar(chkEn(e.clientX, e.clientY));
  }, true);
  function soltar() {
    if (!g) return;
    cancelAnimationFrame(g.raf); g = null;
    document.documentElement.classList.remove('bc-lote-arrastrando');
    try { _reacondActualizarSelUI(); } catch (e) { pintarBarra(); }
    setTimeout(function () { tragarClic = false; }, 350);
  }
  document.addEventListener('pointerup', soltar, true);
  document.addEventListener('pointercancel', soltar, true);
  // El clic que el navegador manda al soltar ya quedó aplicado en pointerdown: no se repite.
  document.addEventListener('click', function (e) {
    if (!tragarClic) return;
    if (e.target.closest && e.target.closest('#' + LISTA + ' .bcf-chk-wrap')) { e.preventDefault(); e.stopImmediatePropagation(); tragarClic = false; }
  }, true);

  // ── Barra de abajo ──
  var PASOS = [['evaluado', 'ti-clipboard-check', 'Diagnóstico listo'], ['en_proceso', 'ti-tool', 'En reparación'],
    ['listo_venta', 'ti-shopping-cart', 'Listo para venta'], ['vendido', 'ti-truck-delivery', 'Despachado'], ['completado', 'ti-lock-check', 'Cerrar salida']];
  function esAdmin() { try { return !!isAdminUser(); } catch (e) { return false; } }
  function barra() {
    var b = document.getElementById('bcLoteBar');
    if (b) return b;
    var det = document.getElementById('reacondDetalleLote'); if (!det) return null;
    b = document.createElement('div'); b.id = 'bcLoteBar'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Acciones para los equipos marcados');
    b.innerHTML = '<span class="bclb-n" aria-live="polite"><b id="bclbN">0</b> <span id="bclbTxt">seleccionados</span><small id="bclbOtros" hidden></small></span>'
      + '<button type="button" class="bclb-q" data-a="quitar"><i class="ti ti-x"></i>Quitar</button>'
      + '<span class="bclb-sp"></span>'
      + '<button type="button" data-a="asignar"><i class="ti ti-users"></i>Asignar técnico</button>'
      + '<span class="bclb-pw"><button type="button" data-a="pasar" aria-haspopup="menu" aria-expanded="false"><i class="ti ti-arrows-exchange"></i>Pasar a ▾</button>'
      + '<div class="bclb-menu" role="menu" hidden>' + PASOS.map(function (p) { return '<button type="button" role="menuitem" data-d="' + p[0] + '"><i class="ti ' + p[1] + '"></i>' + p[2] + '</button>'; }).join('') + '</div></span>'
      + '<button type="button" data-a="listo"><i class="ti ti-shopping-cart"></i>Listo para venta</button>'
      + '<button type="button" class="bclb-p" data-a="despachar" data-admin><i class="ti ti-truck-delivery"></i>Despachar</button>';
    var pag = document.getElementById('reacondEquiposPagination');
    (pag && pag.parentNode ? pag.parentNode : det).appendChild(b);
    b.addEventListener('click', function (e) {
      var d = e.target.closest('[data-d]'), a = e.target.closest('[data-a]'), menu = b.querySelector('.bclb-menu');
      if (d) { menu.hidden = true; try { _reacondPasarA(d.getAttribute('data-d')); } catch (x) {} return; }
      if (!a) return;
      var acc = a.getAttribute('data-a');
      if (acc !== 'pasar') menu.hidden = true;
      try {
        if (acc === 'quitar') { var s = sel(); if (s) s.clear(); renderDetalleLoteReacond(); }
        else if (acc === 'asignar') abrirModalAsignarLote();
        else if (acc === 'listo') pasarSeleccionListoVenta();
        else if (acc === 'despachar') despacharTelefonosSeleccionados();
        else if (acc === 'pasar') { menu.hidden = !menu.hidden; a.setAttribute('aria-expanded', String(!menu.hidden)); }
      } catch (x) { try { console.warn('[Lote arrastrar]', x); } catch (_) {} }
    });
    document.addEventListener('click', function (e) { var m = b.querySelector('.bclb-menu'); if (m && !m.hidden && !b.contains(e.target)) m.hidden = true; });
    return b;
  }
  function pintarBarra() {
    var s = sel(), n = s ? s.size : 0, b = barra(); if (!b) return;
    var det = document.getElementById('reacondDetalleLote');
    var visible = n > 0 && det && det.style.display !== 'none';
    b.classList.toggle('bclb-on', !!visible);
    b.setAttribute('aria-hidden', visible ? 'false' : 'true');
    document.getElementById('bclbN').textContent = n;
    document.getElementById('bclbTxt').textContent = n === 1 ? 'seleccionado' : 'seleccionados';
    var otros = deOtrosLotes().length, ot = document.getElementById('bclbOtros');
    ot.hidden = !otros;
    ot.textContent = otros ? (n - otros) + ' de este lote · ' + otros + ' de otro' + (otros === 1 ? '' : 's') + ' lote' + (otros === 1 ? '' : 's') : '';
    var adm = esAdmin();
    Array.prototype.forEach.call(b.querySelectorAll('[data-admin]'), function (x) { x.hidden = !adm; });
    if (!visible) { var m = b.querySelector('.bclb-menu'); if (m) m.hidden = true; }
  }

  // ── Varios lotes (dueño, 06-nov-2026, mejora 5: «no borrar lo marcado al cambiar de lote») ──
  // Lo marcado se conserva al abrir otro lote, para juntar en UN despacho equipos de lotes distintos.
  // Asignar técnico, «Pasar a» y «Listo para venta» siguen actuando SOLO sobre los del lote abierto (sus reglas son
  // por lote); los de otros lotes quedan marcados. «Despachar» toma todos. «Quitar» limpia todo.
  function loteAbierto() { try { return reacondLoteAbiertoId; } catch (e) { return null; } }
  function loteDe(id) { try { var r = (cache.refurb || []).find(function (x) { return x.id === id; }); return r ? r.lote_id : null; } catch (e) { return null; } }
  function deOtrosLotes() {
    var s = sel(), la = loteAbierto(); if (!s || !la) return [];
    return Array.prototype.filter.call(Array.from(s), function (id) { var l = loteDe(id); return l != null && l !== la; });
  }
  function ponerSel(set) { try { _reacondSel = set; } catch (e) {} }
  // Envuelve una acción por lote: durante la acción solo ve los del lote abierto; al terminar, los de otros lotes vuelven.
  function soloEsteLote(nombre) {
    var f = window[nombre]; if (typeof f !== 'function' || f.__bcLoteSolo) return;
    var w = async function () {
      var otros = deOtrosLotes();
      if (!otros.length) return f.apply(this, arguments);
      var s = sel(), esteLote = new Set(Array.from(s).filter(function (id) { return otros.indexOf(id) < 0; }));
      if (!esteLote.size) { aviso('Marque equipos de este lote. Los ' + otros.length + ' de otros lotes solo se pueden despachar.', 'error'); return; }
      ponerSel(esteLote);
      try { return await f.apply(this, arguments); }
      finally {
        var ahora = sel() || new Set(); otros.forEach(function (id) { ahora.add(id); }); ponerSel(ahora);
        try { renderDetalleLoteReacond(); } catch (e) { pintarBarra(); }
      }
    };
    w.__bcLoteSolo = true; window[nombre] = w;
  }
  function aviso(t, k) { try { if (typeof toast === 'function') toast(t, k); } catch (e) {} }
  function conservarAlAbrir() {
    var f = window.abrirLoteReacond; if (typeof f !== 'function' || f.__bcLoteKeep) return;
    var w = function () {
      var antes = sel(); var guardar = antes && antes.size ? new Set(antes) : null;
      var r = f.apply(this, arguments);
      if (guardar) { ponerSel(guardar); try { renderDetalleLoteReacond(); } catch (e) {} }
      return r;
    };
    w.__bcLoteKeep = true; window.abrirLoteReacond = w;
  }
  // Tras despachar, los que salieron dejan de estar marcados.
  function limpiarDespachados() {
    var f = window._despTelConfirmar; if (typeof f !== 'function' || f.__bcLoteDesp) return;
    var w = async function () {
      var r = await f.apply(this, arguments);
      try { if (r && r.ok && Array.isArray(r.ids)) { var s = sel(); if (s) r.ids.forEach(function (id) { s.delete(id); }); pintarBarra(); } } catch (e) {}
      return r;
    };
    w.__bcLoteDesp = true; window._despTelConfirmar = w;
  }

  // Se engancha a las funciones de la selección que ya existen (no cambia lo que hacen).
  function envolver(nombre) {
    var f = window[nombre]; if (typeof f !== 'function' || f.__bcLote) return false;
    var w = function () { var r = f.apply(this, arguments); try { pintarBarra(); } catch (e) {} return r; };
    w.__bcLote = true; window[nombre] = w; return true;
  }
  function enganchar() {
    var ok = envolver('_reacondActualizarSelUI');
    envolver('renderDetalleLoteReacond');
    if (ok) { conservarAlAbrir(); soloEsteLote('_reacondPasarA'); soloEsteLote('confirmarAsignarLote'); soloEsteLote('pasarSeleccionListoVenta'); limpiarDespachados(); }
    return ok;
  }
  if (!enganchar()) {
    var n = 0, t = setInterval(function () { if (enganchar() || ++n > 80) clearInterval(t); }, 250);
  }

  window.BayolLoteArrastrar = { pintarBarra: pintarBarra };
})();
