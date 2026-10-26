// Reacondicionados: candados del proceso (capa taller-reacond-proceso.js, 26-oct-2026).
// Uso: node scripts/pruebas/servidor.cjs &  y  node scripts/pruebas/reacond-proceso.cjs [carpeta-capturas]
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
const STUB = __dirname + '/supabase-stub.js'; const OUT = process.argv[2] ? process.argv[2].replace(/\/?$/, '/') : null; let fallos = 0;
(async () => { const b = await chromium.launch(); const res = {};
 for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(STUB, 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load|ERR_/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => {
    const out = {}; const U = '11111111-1111-4111-8111-111111111111', T = '22222222-2222-4222-8222-222222222222', L = '44444444-4444-4444-8444-444444444444';
    sessionUser = { id: U, nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    const mk = (i, est, extra) => Object.assign({ id: '3333333' + i + '-3333-4333-8333-33333333333' + i, lote_id: L, modelo: 'IPHONE 11 64GB', marca: 'APPLE', imei: '35000000000000' + i, articulo_codigo: '555', estado_evaluacion: est, costo_compra: 10000, costo_repuestos: 0, tecnico_asignado_id: T }, extra || {});
    cache.lotes = [{ id: L, codigo_lote: 'L-0099', proveedor_id: null, fecha_compra: '2026-10-20', estado: 'en_proceso', enviado_reacond: true }];
    cache.refurb = [mk(1, 'evaluado', { tecnico_asignado_id: null }), mk(2, 'en_proceso'), mk(3, 'listo_venta'), mk(4, 'vendido', { fecha_despacho: '2026-10-22T10:00:00Z' }), mk(5, 'vendido', { completado: true, fecha_despacho: '2026-10-21T10:00:00Z' })];
    cache.tecnicos = [{ id: T, nombre: 'Josiel', activo: true, tipo_empleado: 'tecnico' }];
    cache.tareas = [{ id: 't1', tipo: 'equipo', ref_id: cache.refurb[0].id, descripcion: 'Pantalla', estado: 'pendiente' }];
    cache.piezasReacond = [{ id: 'p1', equipo_id: cache.refurb[3].id, pieza_codigo: '100', pieza_nombre: 'Pantalla 11', cantidad: 1, costo_unitario: 1500, estado: 'aprobada', infoplus_desc_cant: 1 }];
    // Espía de confirmaciones y escrituras
    const conf = []; window.confirmar = async (m) => { conf.push(String(m)); return true; }; window.loadAll = async () => {};
    const escrit = []; const fromOrig = supabaseClient.from.bind(supabaseClient);
    supabaseClient.from = (t) => { const q = fromOrig(t); ['update', 'delete', 'insert'].forEach(k => { const o = q[k]; if (o) q[k] = function () { escrit.push(t + '.' + k); return o.apply(q, arguments); }; }); return q; };
    for (const e of cache.refurb) await fromOrig('equipos_refurbish').insert([e]);
    const toastTxt = () => (document.getElementById('toast') || {}).textContent || '';
    try { nav('refurb'); } catch (_) {}
    try { abrirLoteReacond(L); } catch (e) { out.abrirErr = e.message; }
    await new Promise(r => setTimeout(r, 900));
    out.capa = !!window.BayolReacondProceso;
    // A) Reabrir salida pide confirmación
    conf.length = 0; escrit.length = 0; _reacondSelCosto = new Set([cache.refurb[4].id]); await _reacondRegresarDespachado();
    out.A_reabrirPideConfirmar = conf.length > 0;
    // B) Cerrar salida de un equipo en Listo (sin despachar) => debe bloquear
    conf.length = 0; escrit.length = 0; await marcarEquipoCompletado(cache.refurb[2].id);
    out.B_cerrarDesdeListo = { escribio: escrit.filter(x => /equipos_refurbish/.test(x)).length, toast: toastTxt().slice(0, 140) };
    // C) Despachar un equipo ya despachado => debe bloquear
    conf.length = 0; escrit.length = 0; await marcarDespachado(cache.refurb[3].id);
    out.C_despacharDosVeces = { escribio: escrit.filter(x => /equipos_refurbish/.test(x)).length, toast: toastTxt().slice(0, 140) };
    // D) Pasar en bloque a Listo un evaluado con tareas abiertas => debe bloquear (o pedir justificación)
    conf.length = 0; escrit.length = 0; window.pedirTexto = async () => null; _reacondSel = new Set([cache.refurb[0].id]); await _reacondPasarA('listo_venta');
    out.D_bloqueListoConTareas = { escribio: escrit.filter(x => /equipos_refurbish/.test(x)).length, toast: toastTxt().slice(0, 160) };
    // E) Quitar un equipo despachado con piezas descontadas => la confirmación lo advierte
    conf.length = 0; window.confirmar = async (m) => { conf.push(String(m)); return false; }; await eliminarEquipoLote(cache.refurb[3].id);
    out.E_quitarAdvierte = conf[0] ? /Despachado|Info Plus/.test(conf[0]) : false; out.E_txt = (conf[0] || '').slice(0, 200);
    // F) Eliminar lote: confirmación con el detalle
    conf.length = 0; await eliminarLote(L); out.F_loteAdvierte = conf[0] ? /Despachado|Info Plus/.test(conf[0]) : false; out.F_txt = (conf[0] || '').slice(0, 260);
    window.confirmar = async (m) => { conf.push(String(m)); return true; };
    // G) Error largo: el aviso se queda más de 4 s
    toastError('Info Plus ya tiene el despacho Nº 123; 2 de 3 equipo(s) no se pudieron marcar como Despachado en el taller. IMEI/ID sin cerrar: 350000000000001, 350000000000002. Reintente desde el lote, NO repita el despacho en Info Plus.');
    await new Promise(r => setTimeout(r, 4600)); out.G_errorLargoVisible = getComputedStyle(document.getElementById('toast')).display !== 'none';
    out.G_role = document.getElementById('toast').getAttribute('role');
    document.getElementById('toast').style.display = 'none';
    // H) Despacho Info Plus con un equipo ya despachado => no llama a Info Plus
    const ipLl = []; window._ejecutarDespachoReal = async (x) => { ipLl.push(x); return { ok: false, error: 'simulado' }; }; window._despGuardarHistorial = async () => null;
    const g = (e) => ({ codigo: '555', modelo: e.modelo, total: 10000, imeis: [e.imei], equipos: [e] });
    ['despTelOrigen','despTelDestino'].forEach((id, i) => { if (!document.getElementById(id)) { const s = document.createElement('input'); s.id = id; document.body.appendChild(s); } document.getElementById(id).value = i ? '1' : '6'; });
    _despTelCtx = { sel: new Set(), lista: [g(cache.refurb[3])] }; conf.length = 0; const h1 = await _despTelConfirmar();
    out.H_yaDespachado = { llamadasIP: ipLl.length, res: h1 && h1.error, toast: toastTxt().slice(0, 120) };
    _despTelCtx = { sel: new Set(), lista: [g(cache.refurb[1])] }; conf.length = 0; ipLl.length = 0; await _despTelConfirmar();
    out.H_enReparacionPregunta = { pregunta: conf.some(c => /no están en Listo/.test(c)), llamadasIP: ipLl.length };
    // Medidas táctiles de la barra del lote
    const vis = [...document.querySelectorAll('#v-refurb button, #v-refurb select, #v-refurb input[type=checkbox]')].filter(x => x.offsetParent);
    out.tactil = { total: vis.length, menor44: vis.filter(x => { const q = x.getBoundingClientRect(); return q.height < 44; }).length };
    out.hscroll = document.documentElement.scrollWidth > window.innerWidth + 1;
    return out;
  });
  if (OUT) await p.screenshot({ path: OUT + 'reacond-proceso-' + W + '.png', fullPage: false });
  const ok = r.capa && r.A_reabrirPideConfirmar && r.B_cerrarDesdeListo.escribio === 0 && r.C_despacharDosVeces.escribio === 0 && r.D_bloqueListoConTareas.escribio === 0 && r.E_quitarAdvierte && r.F_loteAdvierte && r.G_errorLargoVisible && r.H_yaDespachado.llamadasIP === 0 && r.H_enReparacionPregunta.pregunta && r.tactil.menor44 === 0 && !r.hscroll && !errs.length;
  if (!ok) fallos++;
  res[W] = { r, errores: errs }; console.log(W, ok ? 'OK' : 'FALLO', JSON.stringify(r), 'errores', JSON.stringify(errs));
  await ctx.close(); }
 await b.close(); process.exit(fallos ? 1 : 0); })();
