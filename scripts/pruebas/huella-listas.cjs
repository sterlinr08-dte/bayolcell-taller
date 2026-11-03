// 3-nov-2026 · Rapidez 2: el respaldo pregunta la huella de cada lista y baja solo las que cambiaron (datos inventados).
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/huella-listas.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname;
(async () => { const b = await chromium.launch(); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => {
    const out = {};
    sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    toast = () => {}; let pintadas = 0; renderAll = () => { pintadas++; };
    const T = window.__BD.tablas;
    T.ordenes_reparacion = [{ id: 'o1', estado: 'recibido', creado_en: '1' }, { id: 'o2', estado: 'recibido', creado_en: '2' }];
    T.tareas_trabajo = [{ id: 't1', creado_en: '1' }];
    let huellaFalla = false, pidio = 0;
    supabaseClient.rpc = async (n) => { if (n !== 'taller_huella') return { data: null, error: null }; pidio++;
      if (huellaFalla) return { data: null, error: { message: 'x' } };
      const d = {}; _BC_CARGAS.forEach(x => { d[x.t] = JSON.stringify(T[x.t] || []); }); return { data: d, error: null }; };
    const ult = () => window.BayolPerformance.ultimaCarga || {};
    _bcSucio.tablas.clear(); _bcSucio.todo = false; _bcSucio.ultimaCompleta = 0; _bcSucio.huellas = null;
    await loadAll(); out.primera = ult(); out.guardoHuella = !!_bcSucio.huellas;
    pintadas = 0; await loadAll(); out.nada = ult(); out.pintoNada = pintadas;
    T.tareas_trabajo.push({ id: 't2', creado_en: '2' }); // otro empleado agrega una tarea
    await loadAll(); out.otro = ult(); out.tareasN = cache.tareas.length;
    T.ordenes_reparacion = T.ordenes_reparacion.filter(o => o.id !== 'o2'); // otro empleado borra una orden
    await loadAll(); out.borrado = ult(); out.ordenes = cache.ordenes.map(o => o.id);
    huellaFalla = true; await loadAll(); out.falla = ult(); huellaFalla = false;
    _bcSucio.ultimaCompleta = Date.now() - 31 * 60 * 1000; await loadAll(); out.vieja = ult();
    localStorage.setItem('bc_huella_off', '1'); await loadAll(); out.apagada = ult(); localStorage.removeItem('bc_huella_off');
    await supabaseClient.from('equipos').update({ x: 1 }).eq('id', 'e'); await loadAll(); out.guardar = ult();
    out.pidio = pidio; return out;
  });
  const t = x => (x.tablas || []).join(',');
  c('primera: completa y guarda la huella', r.primera.completa && r.guardoHuella, r.primera);
  c('nada cambió: no baja nada ni redibuja', r.nada.huella && r.nada.tablas.length === 0 && r.pintoNada === 0, r.nada);
  c('otro empleado agrega una tarea: baja solo tareas', r.otro.huella && t(r.otro) === 'tareas_trabajo' && r.tareasN === 2, t(r.otro));
  c('otro empleado borra una orden: baja órdenes y desaparece', t(r.borrado) === 'ordenes_reparacion' && JSON.stringify(r.ordenes) === '["o1"]', r);
  c('si la huella falla: carga completa como antes', r.falla.completa, t(r.falla));
  c('cada 30 min: carga completa de seguridad', r.vieja.completa);
  c('apagada con bc_huella_off: completa', r.apagada.completa);
  c('guardar sigue bajando solo lo guardado', !r.guardar.completa && t(r.guardar) === 'equipos', t(r.guardar));
  c('sin errores de JS', errs.length === 0, errs);
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
