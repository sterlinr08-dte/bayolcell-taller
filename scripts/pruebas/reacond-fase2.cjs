const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs'); const S = __dirname, B = S;
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 440, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => {
    const out = {}; const U = '11111111-1111-4111-8111-111111111111', T = '22222222-2222-4222-8222-222222222222', E = '33333333-3333-4333-8333-333333333333';
    sessionUser = { id: U, nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    // Espías: RPC y tablas tocadas con from()
    const rpcs = []; let rpcModo = 'ok'; const tablas = [];
    const fromOrig = supabaseClient.from.bind(supabaseClient); supabaseClient.from = (t) => { tablas.push(t); return fromOrig(t); };
    supabaseClient.rpc = async (n, a) => { rpcs.push({ n, a });
      if (rpcModo === 'nulo') return { data: null, error: null };
      if (rpcModo === 'error') return { data: null, error: { message: 'No tiene permiso para despachar equipos (permiso «Marcar como Despachado»).' } };
      if (n === 'reacond_guardar_evaluacion') return { data: { ok: true, costo_repuestos: 1500, tareas_nuevas: 2, tareas_quitadas: 0, estado: 'evaluado' }, error: null };
      if (n === 'reacond_registrar_devolucion') return { data: { ok: true, devolucion_id: 'd1', veces_devuelto: 1, ciclo: 2 }, error: null };
      if (n === 'reacond_crear_lote') return { data: { ok: true, lote_id: 'L1', equipos: (a.p_equipos || []).length }, error: null };
      if (n === 'reacond_ip_reservar') return { data: { ok: true, ganada: true, ref: a.p_ref }, error: null };
      if (n === 'reacond_ip_liberar') return { data: { ok: true, liberada: true }, error: null };
      return { data: null, error: null }; };
    window.confirmar = async () => true; window.loadAll = async () => {}; window.renderDetalleLoteReacond = () => {}; window.cerrarModalEvaluacion = () => {}; window.cerrarModalDevolucion = () => {}; window.cargarDevoluciones = () => {}; window.resaltarItemNuevo = () => {};
    window.smartSelectGetValue = () => T; window.nav = () => {}; window.abrirLoteReacond = () => {};
    cache.refurb = [{ id: E, modelo: 'iPhone 11', estado_evaluacion: 'vendido', tecnico_asignado_id: T, ciclo_actual: 1, veces_devuelto: 0 }];
    cache.tecnicos = [{ id: T, nombre: 'Josiel', activo: true }];
    cache.fallas = [{ id: 'f1', nombre: 'Pantalla rota', nombre_corto: 'Pantalla', categoria_id: 'c1' }, { id: 'f2', nombre: 'Batería', nombre_corto: 'Batería', categoria_id: 'c1' }];
    cache.fallaCategorias = [{ id: 'c1', nombre: 'Hardware' }];
    cache.piezasReacond = [{ id: 'p1', equipo_id: E, pieza_nombre: 'Pantalla 11', cantidad: 1, estado: 'entregada', agregada_por_tecnico: true }];
    const toastTxt = () => (document.getElementById('toast') || {}).textContent || '';
    // 1) Evaluación → RPC con piezas filtradas
    const ta = document.getElementById('eval_notas'); if (ta) ta.value = 'Nota prueba';
    _evalState.equipoId = E; _evalState.fallasSeleccionadas = new Set(['f1', 'f2']); _evalState.fallasNotas = { f1: 'rajada' };
    _evalState.piezasSeleccionadas = [{ pieza_codigo: '100', pieza_nombre: 'Pantalla', cantidad: 1, costo_unitario: 1500, infoplus_desc_cant: 0 }, { pieza_codigo: '200', pieza_nombre: 'Batería', cantidad: 1, costo_unitario: 800, infoplus_desc_cant: 1 }];
    tablas.length = 0; await guardarEvaluacion(true);
    const ev = rpcs.find(x => x.n === 'reacond_guardar_evaluacion');
    out.eval = ev ? { piezas: ev.a.p_piezas.length, fallas: ev.a.p_fallas.length, tareas: ev.a.p_tareas, marcar: ev.a.p_marcar_evaluado, catalogo: ev.a.p_catalogo.length, creado: ev.a.p_creado_por, nota: ev.a.p_fallas[0].nota, toast: toastTxt(), tablasEscritas: tablas.filter(t => /equipo_fallas|equipo_piezas|tareas_trabajo|equipos_refurbish/.test(t)) } : 'SIN RPC';
    // 2) Devolución → RPC
    document.getElementById('dev_equipo_id').value = E; document.getElementById('dev_motivo').value = 'No enciende'; document.getElementById('dev_cliente').value = 'Juan'; document.getElementById('dev_diagnostico').value = '';
    tablas.length = 0; await guardarDevolucion();
    const dv = rpcs.find(x => x.n === 'reacond_registrar_devolucion');
    out.dev = dv ? { motivo: dv.a.p_motivo, tecnico: dv.a.p_tecnico, usuario: dv.a.p_usuario, toast: toastTxt(), tablasEscritas: tablas.filter(t => /equipo_devoluciones|equipos_refurbish|equipo_historial/.test(t)) } : 'SIN RPC';
    // 3) Lote desde manifiesto → RPC
    _manifData = { tasa: 58, phones: [{ modelo: 'iPhone 11', imei: '1111', marca: 'Apple', memoria: '64GB', color: 'Negro', rd: 10000, usd: 172 }, { modelo: 'iPhone 11', imei: '2222', marca: 'Apple', memoria: '64GB', color: 'Rojo', rd: 10000, usd: 172 }], modelos: { 'IPHONE 11': { codigo: '555' } } };
    ['manifProv', 'manifLote', 'manifFecha', 'manifFlete'].forEach(id => { if (!document.getElementById(id)) { const i = document.createElement('input'); i.id = id; document.body.appendChild(i); } });
    document.getElementById('manifLote').value = 'MAN-TEST'; tablas.length = 0; await crearLoteDesdeManifiesto();
    const lt = rpcs.find(x => x.n === 'reacond_crear_lote');
    out.lote = lt ? { codigo: lt.a.p_lote.codigo_lote, equipos: lt.a.p_equipos.length, imei2: lt.a.p_equipos[1].imei, creado: lt.a.p_lote.creado_por, toast: toastTxt(), tablasEscritas: tablas.filter(t => /refurb_lotes|equipos_refurbish/.test(t)) } : 'SIN RPC';
    // 4) Error del servidor → se muestra tal cual
    rpcModo = 'error'; await guardarDevolucion(); out.errorServidor = toastTxt();
    // 5) Base sin actualizar (RPC devuelve null)
    rpcModo = 'nulo'; await guardarEvaluacion(false); out.sinMigracion = toastTxt(); rpcModo = 'ok';
    // 6) Alerta «por conciliar» después de la lista (V05)
    const html = construirPanelPedidosPiezas(null, 'solicitudes'); out.v05 = { tablaAntesDeAlerta: html.indexOf('<table') > -1 && html.indexOf('<table') < html.indexOf('<details'), tieneDetails: html.includes('por conciliar') };
    // 7) Botones Descontar/Liberar ≥ 44 px
    const d = document.createElement('div'); d.innerHTML = _piezasDescuentoHTML([{ id: 'x1', equipo_id: E, pieza_codigo: '100', pieza_nombre: 'Pantalla', infoplus_desc_cant: 0 }, { id: 'x2', equipo_id: E, pieza_codigo: '200', pieza_nombre: 'Batería', infoplus_desc_cant: -1, infoplus_ref: 'PZ-TEST' }]); document.body.appendChild(d);
    out.botones = [...d.querySelectorAll('button')].map(b => [b.textContent.trim().slice(0, 12), Math.round(b.getBoundingClientRect().height), parseFloat(getComputedStyle(b).fontSize)]);
    // 8) Reserva con referencia en el descuento automático
    cache.piezasReacond = []; const ipLlam = []; window._infoplusAjustePieza = async (c, cant, pu, ent, com, alm) => { ipLlam.push(com); return { ok: true, codajuste: 'AJ-77' }; };
    window._findInfoplusArt = () => ({ existencias: { '6': 5 } });
    // la tabla simulada devuelve una pieza pendiente
    await fromOrig('equipo_piezas_pedidas').insert([{ id: 'pz9', equipo_id: E, pieza_codigo: '100', pieza_nombre: 'Pantalla', cantidad: 1, costo_unitario: 1500, estado: 'pendiente', infoplus_desc_cant: 0 }]);
    const anot = []; const upOrig = supabaseClient.from; supabaseClient.from = (t) => { const b = upOrig(t); if (t === 'equipo_piezas_pedidas') { const u = b.update; b.update = (c) => { anot.push(c); return u.call(b, c); }; } return b; };
    out.refOk = null; const r8 = await _descontarPiezasAlCompletar(E); out.descuento = r8; out.ipComentarios = ipLlam; out.anotado = anot; out.rpcReserva = rpcs.filter(x => x.n === 'reacond_ip_reservar').map(x => x.a.p_ref);
    return out;
  });
  const ok = r.eval && r.eval.piezas === 1 && r.eval.fallas === 2 && r.eval.tablasEscritas.length === 0 && r.dev && r.dev.tablasEscritas.length === 0 && r.lote && r.lote.equipos === 2 && r.lote.tablasEscritas.length === 0 && /permiso/.test(r.errorServidor) && /actualización de la base/.test(r.sinMigracion) && r.v05.tablaAntesDeAlerta && r.botones.every(x => x[1] >= 44 && x[2] >= 12) && r.descuento.n === 1 && /\[PZ-/.test(r.ipComentarios[0] || '') && r.rpcReserva.length === 1 && r.anotado.some(a => a.infoplus_codajuste === 'AJ-77');
  if (!ok) fallos++;
  console.log(W, ok ? 'OK' : 'FALLO', JSON.stringify(r), 'errores', errs.filter(e => !/net::|Failed/.test(e)));
  await ctx.close(); }
 await b.close(); process.exit(fallos ? 1 : 0); })();
