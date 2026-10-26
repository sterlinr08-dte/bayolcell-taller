/* BAYOL CELL · Reacondicionados: capa visual (26-oct-2026). Va con taller-ui-reacond.css.
   Pedido: rediseño visual de Reacondicionados sin cambiar la lógica (auditoría V01–V05).
   · Lote: el tablero de etapas queda como píldoras (punto + texto + número) y es el único filtro por etapa;
     las acciones del lote se agrupan por paso (Selección · Salida · Lote ▸ Info Plus / Reportes);
     «Marcar todos» en tarjeta de 48 px; búsqueda y fechas en una fila.
   · Tarjeta del teléfono: resumen legible de fallas y costo (el costo solo lo ve administración, como en el panel).
   · Mis reacondicionados (técnico): tarjeta con estado en píldora, fallas, piezas y botón «Trabajar».
   · Panel de reparación: acciones sueltas juntas en un solo bloque.
   Solo MUEVE los mismos botones (mismos id y onclick) y pinta encima de las funciones de siempre; no escribe en la base.
   Capa reversible: sin html.bc-rcu no hace nada. Apagar: BC_RCU=false o localStorage bc_reacond_ui_off='1'. */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-rcu') || window.BayolReacondUI) return;
  var VERSION = '20261026-rcu1';

  function q(s, r) { return (r || doc).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { try { return money(n); } catch (e) { return 'RD$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } }
  function C() { try { return cache; } catch (e) { return {}; } }
  function admin() { try { return isAdminUser(); } catch (e) { return false; } }
  function visible(b) { return b && b.style.display !== 'none'; }

  /* ---------- Estados (mismo color que las tarjetas de la capa «flota») ---------- */
  var ESTADOS = {
    pendiente: ['Recibido', 'gris'], en_evaluacion: ['En diagnóstico', 'azul'], evaluado: ['Diagnosticado', 'azul'],
    en_proceso: ['En reparación', 'naranja'], tecnico_recibio: ['Técnico recibió', 'naranja'], espera_pieza: ['Espera pieza', 'rojo'],
    reasignado: ['Reasignado', 'amarillo'], reparacion_externa: ['Reparación externa', 'azul'], listo_revision: ['Control de calidad', 'morado'],
    listo_venta: ['Listo', 'verde'], vendido: ['Despachado', 'teal']
  };
  var PIEZA = { pendiente: ['Pedida', 'esp'], extra_pendiente: ['Por aprobar', 'esp'], entregada: ['Por recibir', 'esp'], aprobada: ['Por recibir', 'esp'], recibida: ['Recibida', 'ok'], devolucion_pendiente: ['Devolución', 'esp'] };
  function tareasDe(id) { return (C().tareas || []).filter(function (t) { return t.tipo === 'equipo' && t.ref_id === id; }); }
  function piezasDe(id) { return (C().piezasReacond || []).filter(function (p) { return p.equipo_id === id && p.estado !== 'rechazada' && p.estado !== 'devuelta'; }); }
  // Mismo cálculo que Rentabilidad: compra + repuestos guardados + envío proporcional.
  function costoDe(eq) { var f = 0; try { f = calcularFleteEquipo(eq); } catch (e) {} return (Number(eq.costo_compra) || 0) + (Number(eq.costo_repuestos) || 0) + (Number(f) || 0); }

  function resumenHTML(eq) {
    var t = tareasDe(eq.id), pend = t.filter(function (x) { return x.estado !== 'hecha'; }).length, celdas = [];
    if (t.length) celdas.push('<div class="' + (pend ? 'rcu-pend' : 'rcu-ok') + '"><small>Fallas</small><b>' + (pend ? pend + ' de ' + t.length + ' pendiente' + (pend > 1 ? 's' : '') : 'Todas hechas') + '</b></div>');
    if (admin()) celdas.push('<div><small>Costo</small><b>' + esc(plata(costoDe(eq))) + '</b></div>');
    return celdas.length ? '<div class="rcu-res">' + celdas.join('') + '</div>' : '';
  }

  /* ---------- 1. Tarjeta del teléfono (lote) ---------- */
  function envolverTarjeta() {
    var o = window.renderEquipoReacondCard; if (typeof o !== 'function' || o.__rcu) return;
    var w = function (eq, num) {
      var h = o.apply(this, arguments);
      try { var r = resumenHTML(eq); if (r) h = h.replace('<div class="bcf-per">', r + '<div class="bcf-per">'); } catch (e) {}
      return h;
    };
    w.__rcu = true; window.renderEquipoReacondCard = w;
  }

  /* ---------- 2. Acciones del lote agrupadas por paso ---------- */
  var KPI = { kpiCardPendiente: 'Recibidos', kpiCardDiagnostico: 'Diagnóstico', kpiCardProceso: 'En reparación', kpiCardCalidad: 'Control de calidad', kpiCardListoV: 'Listo', kpiCardDespachado: 'Despachados' };
  function grupo(titulo) { var g = el('div', 'rcu-grupo'); if (titulo) g.appendChild(el('span', 'rcu-grupo-t', esc(titulo))); return g; }
  function menu(titulo, ico) { var d = el('details', 'rcu-menu'); d.appendChild(el('summary', '', '<i class="ti ' + ico + '" aria-hidden="true"></i>' + esc(titulo))); d.appendChild(el('div', 'rcu-menu-p')); return d; }
  function porId(id) { return doc.getElementById(id); }
  function porClic(raiz, prefijo) { return qa('button', raiz).filter(function (b) { return (b.getAttribute('onclick') || '').indexOf(prefijo) === 0; })[0]; }

  function organizarLote() {
    var det = porId('reacondDetalleLote'); if (!det) return false;
    if (det.dataset.rcu === '1') return true;
    var todos = porId('reacondSelTodos'); if (!todos) return false;
    var lbl = todos.closest('label'), acciones = lbl && lbl.parentElement, fila = acciones && acciones.parentElement;
    if (!fila || !det.contains(fila)) return false;
    det.dataset.rcu = '1'; fila.classList.add('rcu-cab'); fila.removeAttribute('style');

    // Tablero: textos en minúscula normal y accesible con el teclado (sigue siendo el mismo onclick)
    Object.keys(KPI).forEach(function (id) {
      var k = porId(id); if (!k) return;
      var et = k.children[1]; if (et) et.textContent = KPI[id];
      k.setAttribute('role', 'button'); k.setAttribute('tabindex', '0');
      k.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); k.click(); } });
    });

    var barra = el('div', 'rcu-barra'); barra.setAttribute('role', 'toolbar'); barra.setAttribute('aria-label', 'Acciones del lote');
    // Paso 1 · Selección: marcar, asignar y pasar a otra etapa
    var g1 = grupo('Selección');
    lbl.classList.add('rcu-chk-card'); lbl.removeAttribute('style');
    var txt = Array.prototype.slice.call(lbl.childNodes).filter(function (n) { return n.nodeType === 3 && n.textContent.trim(); })[0];
    if (txt) txt.textContent = ' Marcar todos';
    g1.appendChild(lbl);
    var cnt = porId('reacondSelCount'); if (cnt) g1.appendChild(cnt);
    var asig = porClic(acciones, 'abrirModalAsignarLote'); if (asig) g1.appendChild(asig);
    var pasar = porId('reacondPasarMenu'); if (pasar && pasar.parentElement) g1.appendChild(pasar.parentElement);
    // Paso 2 · Salida: colores y despacho
    var g2 = grupo('Salida');
    var col = porClic(acciones, 'abrirColoresLote'); if (col) g2.appendChild(col);
    var desp = porId('btnDespacharTel'); if (desp) g2.appendChild(desp);
    // Paso 3 · Documentos del lote: Info Plus y reportes en menús
    var g3 = grupo('Lote');
    var mIP = menu('Info Plus', 'ti-building-warehouse'), mRep = menu('Reportes', 'ti-file-text');
    ['btnRegistrarCompraIP', 'btnRegManualIP', 'btnFormatoIP', 'btnFormatoIPExcel'].forEach(function (id) { var b = porId(id); if (b) mIP.lastChild.appendChild(b); });
    ['btnReporteCostosLote', 'btnPdfCostosLote', 'btnExcelCostosLote'].forEach(function (id) { var b = porId(id); if (b) mRep.lastChild.appendChild(b); });
    g3.appendChild(mIP); g3.appendChild(mRep);
    barra.appendChild(g1); barra.appendChild(g2); barra.appendChild(g3);
    // Lo que quede en la fila vieja (si alguna versión agrega otro botón) pasa al grupo Lote: nada se pierde
    qa(':scope > *', acciones).forEach(function (n) { if (n.id !== 'reacondFechaDesde' && !n.querySelector('#reacondFechaDesde')) g3.appendChild(n); });
    fila.parentNode.insertBefore(barra, fila.nextSibling);

    // Fechas junto a la búsqueda
    var sel = porId('reacondFiltroEstado'), fd = porId('reacondFechaDesde');
    var fechas = fd && fd.parentElement;
    if (sel && fechas) {
      var filtros = sel.parentElement; filtros.classList.add('rcu-filtros');
      fechas.classList.add('rcu-fechas'); fechas.removeAttribute('style'); filtros.appendChild(fechas);
      var x = fechas.querySelector('button'); if (x) { x.setAttribute('aria-label', 'Quitar fechas'); x.removeAttribute('style'); x.classList.add('btn', 'btn-light'); }
      qa('input[type="date"]', fechas).forEach(function (i) { i.removeAttribute('style'); i.setAttribute('aria-label', i.title || 'Fecha'); });
    }
    if (acciones.parentElement && !acciones.children.length) acciones.remove();

    // Menús: se cierra uno al abrir otro, al elegir una opción o al tocar fuera
    barra.addEventListener('toggle', function (e) { if (e.target.open) qa('details.rcu-menu[open]', barra).forEach(function (d) { if (d !== e.target) d.open = false; }); }, true);
    barra.addEventListener('click', function (e) { var b = e.target.closest('.rcu-menu-p .btn'); if (b) { var d = b.closest('details'); setTimeout(function () { d.open = false; }, 0); } });
    doc.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.rcu-menu')) qa('details.rcu-menu[open]').forEach(function (d) { d.open = false; }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') qa('details.rcu-menu[open]').forEach(function (d) { d.open = false; d.querySelector('summary').focus(); }); });
    return true;
  }

  // Después de cada repintado: grupos sin botones visibles se esconden; tablero marca etapas en cero y la elegida
  function ajustarLote() {
    if (!organizarLote()) return;
    qa('#reacondDetalleLote .rcu-menu').forEach(function (d) { d.style.display = qa('.rcu-menu-p .btn', d).some(visible) ? '' : 'none'; });
    qa('#reacondDetalleLote .rcu-grupo').forEach(function (g) {
      var hay = qa(':scope > button, :scope > div, :scope > label, :scope > details', g).some(function (n) { return n.style.display !== 'none'; });
      g.style.display = hay ? '' : 'none';
    });
    Object.keys(KPI).forEach(function (id) {
      var k = porId(id); if (!k) return; var n = parseInt((k.children[0] || {}).textContent, 10) || 0;
      k.classList.toggle('rcu-cero', n === 0); k.setAttribute('aria-pressed', k.classList.contains('is-filtered') ? 'true' : 'false');
      k.setAttribute('aria-label', KPI[id] + ': ' + n);
    });
  }
  function envolverDetalle() {
    var o = window.renderDetalleLoteReacond; if (typeof o !== 'function' || o.__rcu) return;
    var w = function () { var r = o.apply(this, arguments); try { ajustarLote(); } catch (e) { console.warn('[reacond-ui] lote', e); } return r; };
    w.__rcu = true; w.__bcf = o.__bcf; window.renderDetalleLoteReacond = w;
  }

  /* ---------- 3. Lista de lotes: etapas en cero más suaves ---------- */
  function envolverLotes() {
    var o = window.renderLotesReacondTab; if (typeof o !== 'function' || o.__rcu) return;
    var w = function () {
      var r = o.apply(this, arguments);
      try { qa('#lotesReacondContainer .reacond-lote-stage:not(.reacond-lote-total)').forEach(function (s) { var b = s.querySelector('b'); s.classList.toggle('rcu-cero', !!b && b.textContent.trim() === '0'); }); } catch (e) {}
      return r;
    };
    w.__rcu = true; window.renderLotesReacondTab = w;
  }

  /* ---------- 4. Mis reacondicionados (técnico) ---------- */
  function tarjetaMia(eq) {
    var est = ESTADOS[eq.estado_evaluacion || 'en_proceso'] || [String(eq.estado_evaluacion || '').replace(/_/g, ' '), 'gris'];
    var t = tareasDe(eq.id), pz = piezasDe(eq.id);
    var nombre = ((eq.marca || '') + ' ' + (eq.modelo || '')).trim() || 'Equipo';
    var sub = [eq.capacidad, eq.imei ? 'IMEI ' + eq.imei : ''].filter(Boolean).join(' · ');
    var falla = t.length ? '<div><div class="rcu-lista-t">Fallas</div><ul class="rcu-items">' + t.map(function (x) {
      var h = x.estado === 'hecha';
      return '<li class="' + (h ? 'hecha' : '') + '"><i class="rcu-dot"></i><span>' + esc(x.descripcion || 'Falla') + '</span>' + (h ? '<em class="ok">Hecha</em>' : '') + '</li>';
    }).join('') + '</ul></div>' : '';
    var piezas = pz.length ? '<div><div class="rcu-lista-t">Piezas</div><ul class="rcu-items">' + pz.map(function (p) {
      var e = PIEZA[p.estado] || [p.estado || '', ''];
      return '<li><span>' + esc(p.pieza_nombre || 'Pieza') + ((Number(p.cantidad) || 1) > 1 ? ' ×' + p.cantidad : '') + '</span>' + (e[0] ? '<em class="' + e[1] + '">' + esc(e[0]) + '</em>' : '') + '</li>';
    }).join('') + '</ul></div>' : '';
    var tomado = ''; try { if (eq.fecha_asignacion) tomado = 'Tomado ' + tiempoDesde(eq.fecha_asignacion); } catch (e) {}
    var costo = admin() ? '<div class="rcu-res"><div><small>Costo</small><b>' + esc(plata(costoDe(eq))) + '</b></div></div>' : '';
    return '<article class="rcu-mis-card">' +
      '<div class="rcu-mis-h"><div><b>' + esc(nombre) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div><span class="rcu-pill" data-tono="' + est[1] + '">' + esc(est[0]) + '</span></div>' +
      falla + piezas + costo +
      '<div class="rcu-mis-pie"><small>' + esc(tomado) + '</small><button class="btn btn-dark" type="button" onclick="abrirPanelProceso(\'' + esc(eq.id) + '\')"><i class="ti ti-tool" aria-hidden="true"></i> Trabajar</button></div>' +
      '</article>';
  }
  function pintarMis() {
    var cont = porId('misReacondContenido'); if (!cont) return;
    var hs = qa(':scope > h4', cont); if (hs.length < 2) return;
    var yo; try { yo = sessionUser && sessionUser.id; } catch (e) { yo = null; }
    var mios = (C().refurb || []).filter(function (e) { return e.tecnico_asignado_id === yo && e.estado_evaluacion !== 'vendido'; });
    // Quitar lo que pintó la función original entre «Mis equipos» y «Mis pedidos de piezas»
    for (var n = hs[0].nextSibling; n && n !== hs[1];) { var s = n.nextSibling; n.remove(); n = s; }
    var lista = el('div', mios.length ? 'rcu-mis-lista' : 'rcu-vacio', mios.length ? mios.map(tarjetaMia).join('') : 'No tiene equipos reacondicionados asignados.');
    cont.insertBefore(lista, hs[1]);
    hs[0].lastChild && hs[0].lastChild.nodeType === 3 && (hs[0].lastChild.textContent = ' Mis equipos');
    hs[1].lastChild && hs[1].lastChild.nodeType === 3 && (hs[1].lastChild.textContent = ' Mis pedidos de piezas');
    if (hs[2] && hs[2].lastChild && hs[2].lastChild.nodeType === 3) hs[2].lastChild.textContent = ' Mi historial';
  }
  function envolverMis() {
    var o = window.renderMisReacond; if (typeof o !== 'function' || o.__rcu) return;
    var w = function () { var r = o.apply(this, arguments); try { pintarMis(); } catch (e) { console.warn('[reacond-ui] mis', e); } return r; };
    w.__rcu = true; window.renderMisReacond = w;
  }

  /* ---------- 5. Panel de reparación: acciones juntas ---------- */
  var ACC_PANEL = ['agregarPiezaExtra(', 'enviarRefurbExterno(', 'abrirModalReasignar(', 'marcarListoVentaDirecto('];
  function agruparPanel() {
    var m = porId('modalPanelProceso'); if (!m || q('.rcu-acc-panel', m)) return;
    var bs = ACC_PANEL.map(function (p) { return porClic(m, p); }).filter(Boolean);
    if (bs.length < 2) return;
    var g = el('div', 'rcu-acc-panel'); g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Acciones del equipo');
    g.appendChild(el('span', 'rcu-grupo-t', 'Acciones'));
    bs[0].parentNode.insertBefore(g, bs[0]);
    bs.forEach(function (b) { b.removeAttribute('style'); b.classList.add('btn-light'); g.appendChild(b); });
  }
  function envolverPanel() {
    var o = window.abrirPanelProceso; if (typeof o !== 'function' || o.__rcu) return;
    var w = function () {
      var r = o.apply(this, arguments);
      Promise.resolve(r).then(function () { try { agruparPanel(); } catch (e) {} });
      return r;
    };
    w.__rcu = true; window.abrirPanelProceso = w;
  }

  function enganchar() { envolverTarjeta(); envolverDetalle(); envolverLotes(); envolverMis(); envolverPanel(); }
  function iniciar() {
    enganchar();
    // La capa «flota» envuelve renderDetalleLoteReacond más tarde: se vuelve a enganchar encima sin perder la suya.
    var veces = 0, t = setInterval(function () { enganchar(); if (++veces > 20) clearInterval(t); }, 500);
    try { if (typeof reacondLoteAbiertoId !== 'undefined' && reacondLoteAbiertoId) window.renderDetalleLoteReacond(); } catch (e) {}
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.BayolReacondUI = { version: VERSION, ajustarLote: ajustarLote, pintarMis: pintarMis };
})();
