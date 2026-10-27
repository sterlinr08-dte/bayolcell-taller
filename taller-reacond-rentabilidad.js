/* BAYOL CELL · Reacondicionados → pestaña «Rentabilidad»: costo final y margen por teléfono y por lote (26-oct-2026).
   Idea del dueño (PENDIENTES #7): ver por cada teléfono del lote el costo final (compra + flete + piezas) frente al precio
   de venta y el margen en RD$ y %, con totales por lote.
   · El costo final se muestra SIEMPRE (eso sí está en el taller). Piezas con la regla única R10: no suman las devueltas
     ni las rechazadas (misma regla que _recalcularCostoRepuestos).
   · El precio de venta casi nunca está (Info Plus no trae el IMEI en la factura). Nunca se inventa: si falta, el teléfono
     dice «Sin precio de venta» y el administrador puede anotarlo con «Anotar» (guarda equipos_refurbish.precio_venta_real
     y deja nota en equipo_historial). El margen solo se calcula con precio anotado.
   · R15: «Despachado» no es «Vendido». Aquí nunca se dice «vendido».
   · Sustituye solo la función que pinta la pestaña (renderRentabilidadReacond); la original queda en
     window._bcrrOriginal. Capa reversible: sin html.bc-rr no hace nada. Apagar: BC_RR=false o localStorage bc_rr_off='1'. */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-rr')) return;

  var abiertos = {};            // lotes desplegados (se recuerdan al repintar)
  var filtro = { q: '', sinPrecio: false };
  var ESTADOS = { pendiente: 'Pendiente', en_evaluacion: 'En evaluación', evaluado: 'Evaluado', en_proceso: 'En reparación',
    tecnico_recibio: 'En reparación', espera_pieza: 'Espera pieza', reparacion_externa: 'Taller externo', reasignado: 'En reparación',
    listo_revision: 'En revisión', listo_venta: 'Listo para venta' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { try { return money(n); } catch (e) { return 'RD$ ' + Number(n || 0).toFixed(2); } }
  function pct(n) { return (isFinite(n) ? n : 0).toLocaleString('es-DO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function c(name) { try { return (typeof cache !== 'undefined' && cache[name]) || []; } catch (e) { return []; } }
  function flete(e) { try { return Number(calcularFleteEquipo(e)) || 0; } catch (x) { return 0; } }
  function esAdmin() { try { return !!isAdminUser(); } catch (e) { return false; } }
  function periodo() { try { return _repFiltroFechas || { label: 'Todo' }; } catch (e) { return { label: 'Todo' }; } }

  // ── Reglas de cálculo (una sola fuente para toda la pestaña) ──
  // R10: piezas = cantidad × costo de las filas que no estén devueltas ni rechazadas. Si el equipo no tiene filas
  // cargadas, se usa el costo guardado (costo_repuestos).
  function piezas(e) {
    var guardado = Number(e.costo_repuestos) || 0;
    var filas = c('piezasReacond').filter(function (p) { return p.equipo_id === e.id; });
    if (!filas.length) return { v: guardado, guardado: guardado, distinto: false };
    var v = filas.filter(function (p) { return p.estado !== 'devuelta' && p.estado !== 'rechazada'; })
      .reduce(function (s, p) { return s + (Number(p.cantidad) || 1) * (Number(p.costo_unitario) || 0); }, 0);
    return { v: v, guardado: guardado, distinto: Math.abs(v - guardado) >= 0.01 };
  }
  function despachado(e) { return e.estado_evaluacion === 'vendido' || !!e.completado; }
  function precio(e) { var n = Number(e.precio_venta_real); return despachado(e) && n > 0 ? n : null; }
  function salida(e) { return e.fecha_despacho || e.fecha_completado || null; }
  function enPeriodo(e) {
    var p = periodo();
    if (!p.desde && !p.hasta) return true;            // «Todo»: también los despachados sin fecha
    try { return fechaEnRango(salida(e)); } catch (x) { return false; }
  }
  function costeo(e) {
    var compra = Number(e.costo_compra) || 0, fl = flete(e), pz = piezas(e);
    var fin = compra + fl + pz.v, pv = precio(e);
    return { e: e, compra: compra, flete: fl, piezas: pz.v, pzGuardado: pz.guardado, pzDistinto: pz.distinto, fin: fin,
      desp: despachado(e), pv: pv, margen: pv != null ? pv - fin : null, pct: pv ? (pv - fin) / pv * 100 : null };
  }
  function modelo(e) {
    var m = String(e.modelo || 'Equipo').trim(), cap = String(e.capacidad || '').trim();
    if (cap && m.toUpperCase().indexOf(cap.toUpperCase()) < 0) m += ' ' + cap;
    return m;
  }

  // ── Piezas de pantalla ──
  function info(txt) {
    return '<button type="button" class="bcrr-i bcInfoI" aria-label="Más información" aria-expanded="false" data-info="' + esc(txt) + '"><span aria-hidden="true">i</span></button>';
  }
  function kpi(l, v, sub, tono) {
    return '<div class="bcrr-kpi' + (tono ? ' ' + tono : '') + '"><span class="l">' + l + '</span><strong>' + v + '</strong>' + (sub ? '<span class="s">' + sub + '</span>' : '') + '</div>';
  }
  function estadoPill(k) {
    var e = k.e;
    if (k.desp) return '<span class="bcrr-pill desp"><i></i>Despachado</span>';
    return '<span class="bcrr-pill inv"><i></i>' + esc(ESTADOS[e.estado_evaluacion] || 'En inventario') + '</span>';
  }
  function celda(l, v, cls) { return '<div class="c' + (cls ? ' ' + cls : '') + '"><span class="l">' + l + '</span><span class="v">' + v + '</span></div>'; }
  function ventaHTML(k) {
    if (!k.desp) return '<span class="bcrr-nada" aria-label="No aplica">—</span>';
    if (k.pv != null) return '<button type="button" class="bcrr-pv" data-precio="' + esc(k.e.id) + '" aria-label="Cambiar precio de venta">' + plata(k.pv) + '</button>';
    return '<span class="bcrr-pill sin"><i></i>Sin precio de venta</span><button type="button" class="bcrr-anotar" data-precio="' + esc(k.e.id) + '">Anotar</button>';
  }
  function margenHTML(m, p) {
    if (m == null) return '<span class="bcrr-nada">—</span>';
    return '<span class="' + (m < 0 ? 'neg' : 'pos') + '">' + plata(m) + '</span>';
  }
  function pctHTML(m, p) { return p == null ? '<span class="bcrr-nada">—</span>' : '<span class="' + (m < 0 ? 'neg' : 'pos') + '">' + pct(p) + '</span>'; }

  function filaEquipo(k) {
    var e = k.e;
    var pzV = plata(k.piezas) + (k.pzDistinto ? '<i class="bcrr-dif" title="Costo guardado: ' + esc(plata(k.pzGuardado)) + '. Aquí no suman piezas devueltas ni rechazadas." aria-label="Distinto del costo guardado"></i>' : '');
    return '<div class="bcrr-eq' + (k.margen == null ? ' sinm' : '') + '" role="row">' +
      '<div class="id" role="cell"><b>' + esc(modelo(e)) + '</b><span>' + esc(e.imei || e.serial || 'Sin IMEI') + '</span></div>' +
      '<div class="est" role="cell">' + estadoPill(k) + '</div>' +
      celda('Compra', plata(k.compra), 'sec') + celda('Flete', plata(k.flete), 'sec') + celda('Piezas', pzV, 'sec') +
      celda('Costo final', plata(k.fin), 'fin') +
      '<div class="c venta" role="cell"><span class="l">Venta</span><span class="v">' + ventaHTML(k) + '</span></div>' +
      celda('Margen', margenHTML(k.margen), 'mg') + celda('%', pctHTML(k.margen, k.pct), 'pc') +
      '</div>';
  }

  function datosLotes() {
    var lotes = {};
    c('refurb').forEach(function (e) {
      var id = e.lote_id || '_sin';
      (lotes[id] = lotes[id] || []).push(costeo(e));
    });
    return Object.keys(lotes).map(function (id) {
      var L = id === '_sin' ? null : c('lotes').find(function (l) { return l.id === id; });
      var prov = L ? c('proveedores').find(function (p) { return p.id === L.proveedor_id; }) : null;
      var eq = lotes[id], t = { compra: 0, flete: 0, piezas: 0, fin: 0, finPv: 0, venta: 0, nDesp: 0, nPv: 0, nSin: 0 };
      eq.forEach(function (k) {
        t.compra += k.compra; t.flete += k.flete; t.piezas += k.piezas; t.fin += k.fin;
        if (k.desp) t.nDesp++;
        if (k.pv != null) { t.nPv++; t.venta += k.pv; t.finPv += k.fin; } else if (k.desp) t.nSin++;
      });
      t.margen = t.nPv ? t.venta - t.finPv : null;
      t.pct = t.venta > 0 ? t.margen / t.venta * 100 : null;
      return { id: id, codigo: L ? (L.codigo_lote || 'Lote') : 'Sin lote', prov: prov ? prov.nombre : '',
        fecha: L ? (L.fecha_compra || L.creado_en || '') : '', eq: eq, t: t };
    }).sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  }

  function coincide(k, q) {
    if (!q) return true;
    var e = k.e;
    return [e.modelo, e.capacidad, e.imei, e.serial].join(' ').toLowerCase().indexOf(q) >= 0;
  }

  function loteHTML(L, i) {
    var q = filtro.q, loteCoincide = !q || (L.codigo + ' ' + L.prov).toLowerCase().indexOf(q) >= 0;
    var eq = L.eq.filter(function (k) { return (loteCoincide || coincide(k, q)) && (!filtro.sinPrecio || (k.desp && k.pv == null)); });
    if (!eq.length) return '';
    eq.sort(function (a, b) { return (b.desp - a.desp) || String(a.e.modelo || '').localeCompare(String(b.e.modelo || '')); });
    var t = L.t, abierto = (abiertos[L.id] === undefined ? i === 0 : abiertos[L.id]) || !!q || filtro.sinPrecio;
    var fecha = L.fecha ? new Date(String(L.fecha).length <= 10 ? L.fecha + 'T12:00:00' : L.fecha).toLocaleDateString('es-DO') : '';
    return '<details class="bcrr-lote" data-lote="' + esc(L.id) + '"' + (abierto ? ' open' : '') + '>' +
      '<summary><span class="tit"><b>' + esc(L.codigo) + '</b><span>' + esc([L.prov, fecha].filter(Boolean).join(' · ')) + '</span></span>' +
      '<span class="res">' +
        '<span class="m"><span class="l">Costo final</span><span class="v">' + plata(t.fin) + '</span></span>' +
        '<span class="m"><span class="l">Margen</span><span class="v">' + (t.margen == null ? '<span class="bcrr-nada">Sin precio</span>' : margenHTML(t.margen) + ' <small>' + pctHTML(t.margen, t.pct) + '</small>') + '</span></span>' +
        '<span class="cnt">' + L.eq.length + ' equipos · ' + t.nDesp + ' despachados · ' + t.nPv + ' con precio</span>' +
      '</span><i class="ti ti-chevron-down chev" aria-hidden="true"></i></summary>' +
      '<div class="bcrr-tabla" role="table">' +
        '<div class="bcrr-eq cab" role="row"><div class="id">Equipo</div><div class="est">Estado</div><div class="c sec">Compra</div><div class="c sec">Flete</div><div class="c sec">Piezas</div><div class="c fin">Costo final</div><div class="c venta">Venta</div><div class="c mg">Margen</div><div class="c pc">%</div></div>' +
        eq.map(filaEquipo).join('') +
        '<div class="bcrr-eq tot" role="row"><div class="id"><b>Total del lote</b><span>' + L.eq.length + ' equipos</span></div><div class="est"></div>' +
          celda('Compra', plata(t.compra), 'sec') + celda('Flete', plata(t.flete), 'sec') + celda('Piezas', plata(t.piezas), 'sec') +
          celda('Costo final', plata(t.fin), 'fin') +
          celda('Venta', t.nPv ? plata(t.venta) + ' <small>' + t.nPv + ' de ' + t.nDesp + '</small>' : '<span class="bcrr-nada">Sin precio</span>', 'venta') +
          celda('Margen', margenHTML(t.margen), 'mg') + celda('%', pctHTML(t.margen, t.pct), 'pc') +
        '</div>' +
      '</div></details>';
  }

  function pintar() {
    var cont = doc.getElementById('rentabilidadReacondCont');
    if (!cont) return;
    if (!esAdmin()) {
      cont.innerHTML = '<div class="bcrr"><div class="bcrr-card bcrr-vacio"><i class="ti ti-lock" aria-hidden="true"></i><p>Solo para administradores.</p></div></div>';
      return;
    }
    var todos = c('refurb').map(costeo);
    // KPI del período (por fecha de salida)
    var desp = todos.filter(function (k) { return k.desp && enPeriodo(k.e); });
    var conP = desp.filter(function (k) { return k.pv != null; });
    var costoDesp = desp.reduce(function (s, k) { return s + k.fin; }, 0);
    var venta = conP.reduce(function (s, k) { return s + k.pv; }, 0);
    var costoConP = conP.reduce(function (s, k) { return s + k.fin; }, 0);
    var margen = venta - costoConP, mPct = venta > 0 ? margen / venta * 100 : 0;
    var inv = todos.filter(function (k) { return !k.desp; });
    var capital = inv.reduce(function (s, k) { return s + k.fin; }, 0);
    var p = periodo();

    var lotes = datosLotes();
    var lotesHTML = lotes.map(loteHTML).join('');

    // Más tiempo en inventario (5) y margen por técnico (solo con precio)
    var viejos = inv.map(function (k) { return { k: k, d: (function () { try { return diasDesde(k.e.fecha_compra || k.e.creado_en); } catch (x) { return 0; } })() }; })
      .sort(function (a, b) { return b.d - a.d; }).slice(0, 5);
    var porTec = {};
    conP.forEach(function (k) { var t = k.e.tecnico_asignado_id || '_sin'; porTec[t] = porTec[t] || { m: 0, n: 0 }; porTec[t].m += k.margen; porTec[t].n++; });
    var tecs = Object.keys(porTec).map(function (id) {
      var t = id === '_sin' ? null : c('tecnicos').find(function (x) { return x.id === id; });
      return { nombre: t ? t.nombre : 'Sin técnico', m: porTec[id].m, n: porTec[id].n };
    }).sort(function (a, b) { return b.m - a.m; });

    var per = function (dias, txt) {
      var on = p.label === txt;
      return '<button type="button" class="bcrr-seg' + (on ? ' on' : '') + '" aria-pressed="' + on + '" onclick="setPeriodoRentabilidad(' + (dias === 'todo' ? "'todo'" : dias) + ",'" + txt + "')\">" + txt + '</button>';
    };

    cont.innerHTML = '<div class="bcrr">' +
      '<section class="bcrr-card bcrr-cab">' +
        '<div class="bcrr-top"><h3>Rentabilidad ' + info('Costo final = compra + flete + piezas. No suman las piezas devueltas ni rechazadas.\n\nDespachado no quiere decir vendido: la venta real está en Info Plus. El margen solo se calcula con los equipos que tienen precio de venta anotado; los demás dicen «Sin precio de venta».\n\nMargen % = margen ÷ precio de venta.') + '</h3>' +
        '<button type="button" class="bcrr-btn" onclick="refrescarVista(renderRentabilidadReacond, this)"><i class="ti ti-refresh" aria-hidden="true"></i> Actualizar</button></div>' +
        '<div class="bcrr-segs" role="group" aria-label="Período de despachos">' + per(1, 'Hoy') + per(15, '15 días') + per(30, '1 mes') + per(90, '3 meses') + per('todo', 'Todo') + '</div>' +
        '<div class="bcrr-kpis">' +
          kpi('Despachados', String(desp.length), conP.length + ' con precio · ' + (desp.length - conP.length) + ' sin precio') +
          kpi('Costo despachado', plata(costoDesp), esc(p.label || '')) +
          kpi('Venta anotada', conP.length ? plata(venta) : '—', conP.length ? conP.length + ' equipos' : 'Sin precios') +
          kpi('Margen', conP.length ? plata(margen) : '—', conP.length ? pct(mPct) + ' · solo con precio' : 'Sin precios', conP.length ? (margen < 0 ? 'neg' : 'pos') : '') +
          kpi('En inventario', plata(capital), inv.length + ' equipos') +
        '</div>' +
      '</section>' +
      '<section class="bcrr-card">' +
        '<div class="bcrr-top"><h4>Por lote ' + info('Cada teléfono con su costo final. Toque «Anotar» para registrar el precio al que se vendió un equipo despachado; el margen sale solo con ese dato.') + '</h4></div>' +
        '<div class="bcrr-filtros"><label class="bcrr-buscar"><i class="ti ti-search" aria-hidden="true"></i><input type="search" id="bcrrBuscar" placeholder="Lote, modelo o IMEI" aria-label="Buscar lote, modelo o IMEI" value="' + esc(filtro.q) + '" autocomplete="off"></label>' +
        '<button type="button" class="bcrr-seg' + (filtro.sinPrecio ? ' on' : '') + '" aria-pressed="' + filtro.sinPrecio + '" data-accion="sinprecio">Sin precio</button></div>' +
        (lotesHTML || '<p class="bcrr-vacio-l">' + (lotes.length ? 'Nada coincide.' : 'Aún no hay lotes.') + '</p>') +
      '</section>' +
      '<div class="bcrr-dos">' +
        '<section class="bcrr-card"><h4>Más tiempo en inventario</h4>' +
          (viejos.length ? viejos.map(function (x) { return '<div class="bcrr-li"><span>' + esc(modelo(x.k.e)) + ' <small>' + plata(x.k.fin) + '</small></span><b class="' + (x.d >= 30 ? 'neg' : 'avi') + '">' + x.d + ' día' + (x.d === 1 ? '' : 's') + '</b></div>'; }).join('') : '<p class="bcrr-vacio-l">Sin equipos en inventario.</p>') +
        '</section>' +
        '<section class="bcrr-card"><h4>Margen por técnico <small>' + esc(p.label || '') + '</small></h4>' +
          (tecs.length ? tecs.map(function (t) { return '<div class="bcrr-li"><span>' + esc(t.nombre) + ' <small>' + t.n + ' con precio</small></span><b class="' + (t.m < 0 ? 'neg' : 'pos') + '">' + plata(t.m) + '</b></div>'; }).join('') : '<p class="bcrr-vacio-l">Sin precios anotados en el período.</p>') +
        '</section>' +
      '</div>' +
    '</div>';
  }

  // ── Ventana «Precio de venta» ──
  function cerrarDlg() { var d = doc.getElementById('bcrrDlg'); if (d) { var v = d._volver; d.remove(); if (v && v.focus) try { v.focus(); } catch (e) {} } }
  function abrirPrecio(id, desde) {
    if (!esAdmin()) { try { toast('Solo el administrador.', 'error'); } catch (e) {} return; }
    var e = c('refurb').find(function (x) { return x.id === id; });
    if (!e) return;
    var k = costeo(e), actual = Number(e.precio_venta_real) > 0 ? Number(e.precio_venta_real) : null;
    cerrarDlg();
    var bg = doc.createElement('div');
    bg.id = 'bcrrDlg'; bg.className = 'bcrr-fondo';
    bg.innerHTML = '<div class="bcrr-dlg" role="dialog" aria-modal="true" aria-labelledby="bcrrDlgT">' +
      '<div class="bar"><i class="ti ti-cash" aria-hidden="true"></i><h3 id="bcrrDlgT">Precio de venta</h3><button type="button" class="x" data-cerrar aria-label="Cerrar"><i class="ti ti-x" aria-hidden="true"></i></button></div>' +
      '<div class="cuerpo">' +
        '<div class="eqd"><b>' + esc(modelo(e)) + '</b><span>' + esc(e.imei || e.serial || 'Sin IMEI') + '</span></div>' +
        '<div class="fila"><span>Costo final</span><b>' + plata(k.fin) + '</b></div>' +
        '<label for="bcrrPv">Precio de venta</label>' +
        '<input id="bcrrPv" type="text" inputmode="decimal" autocomplete="off" placeholder="RD$ 0.00" value="' + (actual != null ? actual.toFixed(2) : '') + '">' +
        '<div class="fila prev" id="bcrrPrev"><span>Margen</span><b>—</b></div>' +
        '<p class="err" id="bcrrErr" role="alert"></p>' +
      '</div>' +
      '<div class="pie">' + (actual != null ? '<button type="button" class="bcrr-btn sec" data-quitar>Quitar precio</button>' : '') +
        '<button type="button" class="bcrr-guardar" data-guardar>Guardar</button></div>' +
    '</div>';
    bg._volver = desde || null;
    doc.body.appendChild(bg);
    var inp = bg.querySelector('#bcrrPv'), prev = bg.querySelector('#bcrrPrev b'), err = bg.querySelector('#bcrrErr');
    function leer() { var s = String(inp.value || '').replace(/[^0-9.]/g, ''); return s ? parseFloat(s) : NaN; }
    function vista() {
      var n = leer();
      if (!(n > 0)) { prev.textContent = '—'; prev.className = ''; return; }
      var m = n - k.fin; prev.textContent = plata(m) + ' · ' + pct(m / n * 100); prev.className = m < 0 ? 'neg' : 'pos';
    }
    inp.addEventListener('input', function () { err.textContent = ''; vista(); });
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); guardar(leer()); } });
    bg.addEventListener('click', function (ev) {
      if (ev.target === bg || ev.target.closest('[data-cerrar]')) return cerrarDlg();
      if (ev.target.closest('[data-guardar]')) return guardar(leer());
      if (ev.target.closest('[data-quitar]')) return guardar(null);
    });
    bg.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { ev.stopPropagation(); cerrarDlg(); } });
    vista(); setTimeout(function () { try { inp.focus(); inp.select(); } catch (x) {} }, 40);

    var enCurso = false;
    async function guardar(n) {
      if (enCurso) return;
      if (n !== null && !(n > 0)) { err.textContent = 'Escriba un precio mayor que cero.'; inp.focus(); return; }
      if (n !== null) n = Math.round(n * 100) / 100;
      enCurso = true; bg.querySelectorAll('.pie button').forEach(function (b) { b.disabled = true; });
      try {
        // 27-oct-2026: queda guardado de dónde salió el precio, quién lo anotó y cuándo (columnas de 20261026020000).
        var quien = (typeof sessionUser !== 'undefined' && sessionUser && sessionUser.nombre) || 'Admin';
        var r = await supabaseClient.from('equipos_refurbish').update(n === null
          ? { precio_venta_real: null, precio_venta_fuente: null, precio_venta_por: null, precio_venta_en: null }
          : { precio_venta_real: n, precio_venta_fuente: 'manual', precio_venta_por: quien, precio_venta_en: new Date().toISOString() }).eq('id', id);
        if (r && r.error) throw r.error;
        e.precio_venta_real = n;
        try {
          await _histInsert([{ equipo_id: id, estado_anterior: e.estado_evaluacion || null, estado_nuevo: e.estado_evaluacion || null,
            accion: n === null ? 'Precio de venta quitado (antes ' + plata(actual) + ')' : 'Precio de venta anotado: ' + plata(n) + (actual != null ? ' (antes ' + plata(actual) + ')' : ''),
            usuario: (typeof sessionUser !== 'undefined' && sessionUser && sessionUser.nombre) || 'Admin' }]);
        } catch (x) {}
        cerrarDlg();
        try { toast(n === null ? 'Precio quitado.' : 'Precio guardado: ' + plata(n)); } catch (x) {}
        pintar();
      } catch (x) {
        enCurso = false; bg.querySelectorAll('.pie button').forEach(function (b) { b.disabled = false; });
        var msg; try { msg = getFriendlyError(x); } catch (y) { msg = (x && x.message) || 'Error'; }
        err.textContent = 'No se pudo guardar: ' + msg;
        try { logError('Rentabilidad: precio de venta', x); } catch (y) {}
      }
    }
  }

  // ── ⓘ propia (misma burbuja #bcInfoTip que taller-info.js) ──
  function cerrarTip() { var t = doc.getElementById('bcInfoTip'); if (t) { if (t._b) t._b.setAttribute('aria-expanded', 'false'); t.remove(); } }
  function abrirTip(b) {
    var ya = doc.getElementById('bcInfoTip'); if (ya && ya._b === b) { cerrarTip(); return; } cerrarTip();
    var t = doc.createElement('div'); t.id = 'bcInfoTip'; t.setAttribute('role', 'tooltip'); t.textContent = b.getAttribute('data-info'); t._b = b;
    doc.body.appendChild(t); b.setAttribute('aria-expanded', 'true');
    var br = b.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
    var x = Math.max(16, Math.min(innerWidth - w - 16, br.left + br.width / 2 - w / 2)), y = br.bottom + 4;
    if (y + h > innerHeight - 12 && br.top - h - 4 > 12) { y = br.top - h - 4; t.classList.add('arriba'); }
    t.style.left = x + 'px'; t.style.top = y + 'px'; t.style.setProperty('--fx', (br.left + br.width / 2 - x) + 'px');
  }

  // ── Eventos (delegados en el contenedor; sobreviven a cada repintado) ──
  function enganchar() {
    var cont = doc.getElementById('rentabilidadReacondCont');
    if (!cont || cont._bcrr) return;
    cont._bcrr = true;
    cont.addEventListener('click', function (ev) {
      var b = ev.target.closest('.bcrr-i'); if (b) { ev.preventDefault(); ev.stopPropagation(); abrirTip(b); return; }
      var pv = ev.target.closest('[data-precio]'); if (pv) { abrirPrecio(pv.getAttribute('data-precio'), pv); return; }
      if (ev.target.closest('[data-accion="sinprecio"]')) { filtro.sinPrecio = !filtro.sinPrecio; pintar(); }
    });
    cont.addEventListener('toggle', function (ev) {
      var d = ev.target; if (d && d.matches && d.matches('details.bcrr-lote')) abiertos[d.getAttribute('data-lote')] = d.open;
    }, true);
    var tm = null;
    cont.addEventListener('input', function (ev) {
      if (ev.target.id !== 'bcrrBuscar') return;
      filtro.q = String(ev.target.value || '').trim().toLowerCase();
      clearTimeout(tm); tm = setTimeout(function () {
        var pos = ev.target.selectionStart; pintar();
        var i = doc.getElementById('bcrrBuscar'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {} }
      }, 180);
    });
  }

  function instalar() {
    if (typeof renderRentabilidadReacond !== 'function') return false;
    if (window._bcrrOriginal) return true;
    window._bcrrOriginal = renderRentabilidadReacond;
    window.renderRentabilidadReacond = function () { enganchar(); return pintar(); };
    window.bcrrPintar = pintar;
    enganchar();
    var rc = doc.getElementById('reacondMainContentRentabilidad');
    if (rc && rc.style.display === 'block') window.renderRentabilidadReacond();
    return true;
  }
  if (!instalar()) {
    var n = 0, t = setInterval(function () { if (instalar() || ++n > 50) clearInterval(t); }, 100);
  }
})();
