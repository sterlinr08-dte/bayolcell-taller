// 3-nov-2026 · Guardar rápido: tras guardar, loadAll() recarga solo las tablas que se escribieron (datos inventados).
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/guardar-rapido.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname;
(async () => { const b = await chromium.launch(); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    toast = () => {}; renderAll = () => {}; // aquí solo se mide qué se carga
    window.__BD.tablas.ordenes_reparacion = [{ id: 'o1', estado: 'recibido', creado_en: '2026-11-01' }, { id: 'o2', estado: 'recibido', creado_en: '2026-11-02' }];
    window.__BD.tablas.tareas_trabajo = [{ id: 't1', creado_en: '2026-11-01' }];
    window.__BD.tablas.orden_notas = [];
    const ult = () => (window.BayolPerformance.ultimaCarga || {});
    _bcSucio.tablas.clear(); _bcSucio.todo = false; _bcSucio.ultimaCompleta = 0;
    await loadAll(); out.primera = ult();
    const tareasAntes = cache.tareas;
    await supabaseClient.from('ordenes_reparacion').update({ estado: 'listo' }).eq('id', 'o1');
    await loadAll(); out.trasGuardar = ult(); out.ordenNueva = (cache.ordenes.find(o => o.id === 'o1') || {}).estado; out.tareasIgual = cache.tareas === tareasAntes;
    await supabaseClient.from('ordenes_reparacion').delete().eq('id', 'o2');
    await loadAll(); out.trasBorrar = cache.ordenes.map(o => o.id);
    await loadAll(); out.sinNada = ult();
    await supabaseClient.from('tareas_trabajo').insert({ id: 't2', creado_en: '2026-11-03' });
    await supabaseClient.from('equipos').update({ x: 1 }).eq('id', 'e');
    await loadAll(); out.dos = ult(); out.tareasN = cache.tareas.length;
    supabaseClient.rpc = supabaseClient.rpc; // (la envoltura ya está puesta)
    try { await supabaseClient.rpc('reacond_ip_reservar', {}); } catch (e) {}
    await supabaseClient.from('tareas_trabajo').update({ y: 1 }).eq('id', 't1');
    await loadAll(); out.trasRpc = ult();
    try { await supabaseClient.rpc('stats_ventas', {}); } catch (e) {}
    await supabaseClient.from('tareas_trabajo').update({ y: 2 }).eq('id', 't1');
    await loadAll(); out.trasRpcLectura = ult();
    localStorage.setItem('bc_guardar_rapido_off', '1');
    await supabaseClient.from('tareas_trabajo').update({ y: 3 }).eq('id', 't1');
    await loadAll(); out.apagado = ult(); localStorage.removeItem('bc_guardar_rapido_off');
    _bcSucio.ultimaCompleta = Date.now() - 6 * 60 * 1000;
    await supabaseClient.from('tareas_trabajo').update({ y: 4 }).eq('id', 't1');
    await loadAll(); out.viejo = ult();
    window.__BD.tablas.orden_notas.push({ id: 'n1', orden_id: 'o1', creado_en: '2026-11-03' });
    onCambioRealtime({ table: 'orden_notas' }); await w(700); out.tiempoReal = ult(); out.notas = cache.ordenNotas.length;
    return out;
  });
  const t = x => (x.tablas || []).join(',');
  c('primera carga: completa (17 tablas)', r.primera.completa && r.primera.tablas.length === 17, r.primera.tablas.length);
  c('guardar una orden: recarga solo órdenes', !r.trasGuardar.completa && t(r.trasGuardar) === 'ordenes_reparacion', t(r.trasGuardar));
  c('el cambio se ve en pantalla', r.ordenNueva === 'listo', r.ordenNueva);
  c('lo que no cambió no se toca', r.tareasIgual);
  c('borrar: la orden desaparece', JSON.stringify(r.trasBorrar) === '["o1"]', r.trasBorrar);
  c('sin nada anotado: carga completa (respaldo)', r.sinNada.completa, t(r.sinNada));
  c('dos tablas tocadas: recarga esas dos', !r.dos.completa && t(r.dos) === 'equipos,tareas_trabajo' && r.tareasN === 2, t(r.dos));
  c('RPC que escribe: carga completa', r.trasRpc.completa, t(r.trasRpc));
  c('RPC de solo lectura: sigue parcial', !r.trasRpcLectura.completa && t(r.trasRpcLectura) === 'tareas_trabajo', t(r.trasRpcLectura));
  c('apagado con bc_guardar_rapido_off: completa', r.apagado.completa);
  c('última completa > 5 min: completa', r.viejo.completa);
  c('nota nueva por tiempo real: solo orden_notas', !r.tiempoReal.completa && t(r.tiempoReal) === 'orden_notas' && r.notas === 1, t(r.tiempoReal));
  c('sin errores de JS', errs.length === 0, errs);
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
