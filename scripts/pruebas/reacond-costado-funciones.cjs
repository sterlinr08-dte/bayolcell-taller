// 12-nov-2026 · Reacondicionados «Costado»: las nueve funciones desde el panel (siguiente paso, tareas, asignar, color,
// copiar IMEI, label, historial, editar evaluación, seguir de corrido).
// Correr: PUERTO=8788 node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/reacond-costado-funciones.cjs   (SHOTS=carpeta guarda capturas)
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const PUERTO = process.env.PUERTO || 8788; const SHOTS = process.env.SHOTS || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
 for (const W of [390, 1280]) {
  const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, deviceScaleFactor: SHOTS ? 2 : 1 });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1')) return r.continue(); if (SHOTS && /tabler/.test(u)) return r.continue(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  await p.evaluate(() => {
    sessionUser = { id: 'u', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; const al = document.getElementById('appLoader'); if (al) al.style.display = 'none';
    const hace = d => new Date(Date.now() - d * 86400000).toISOString(); const T = window.__BD.tablas;
    const est = ['pendiente', 'evaluado', 'evaluado', 'en_proceso', 'tecnico_recibio', 'listo_revision', 'listo_venta', 'listo_venta', 'vendido', 'evaluado'];
    const mod = ['IPHONE 12 PRO MAX', 'IPHONE 13', 'IPHONE 11', 'IPHONE 12 PRO', 'IPHONE XR', 'IPHONE 14', 'IPHONE 13 PRO', 'IPHONE 12', 'IPHONE 11 PRO', 'IPHONE XS'];
    T.equipos_refurbish = est.map((e, i) => ({ id: 'L' + i, lote_id: 'L', modelo: 'CELULAR ' + mod[i], capacidad: '128GB', color: 'Negro', imei: '35301309520100' + i, estado_evaluacion: e, tecnico_asignado_id: i > 2 && i < 9 ? 't1' : null, fecha_asignacion: hace(3), creado_en: hace(8), costo_compra: 9000 + i * 100 }));
    T.tareas_trabajo = [{ id: 'k1', tipo: 'equipo', ref_id: 'L3', descripcion: 'Cambiar pantalla', estado: 'hecha' }, { id: 'k2', tipo: 'equipo', ref_id: 'L3', descripcion: 'Cambiar batería', estado: 'pendiente' }, { id: 'k3', tipo: 'equipo', ref_id: 'L6', descripcion: 'Limpieza', estado: 'hecha' }];
    T.equipo_historial = []; T.equipo_fallas = [];
    cache.tecnicos = [{ id: 't1', nombre: 'LUIS MIGUEL BRETON', activo: true, tipo_empleado: 'tecnico' }, { id: 't2', nombre: 'JOSE RAMON', activo: true, tipo_empleado: 'tecnico' }];
    cache.lotes = [{ id: 'L', codigo_lote: 'C00002071', enviado_reacond: true, fecha_compra: hace(9) }]; cache.piezasReacond = [];
    loadAll = async () => { cache.refurb = T.equipos_refurbish.map(x => ({ ...x })); cache.tareas = T.tareas_trabajo.map(x => ({ ...x })); };
    window.__av = []; window.__ll = []; toast = m => window.__av.push(String(m)); toastError = m => window.__av.push('ERR ' + m); confirmar = async () => true; asignarFallasSinDueno = async () => {};
    ['abrirColoresLote', 'imprimirLabelEquipo', 'verHistorialEquipoReacond', 'continuarEvaluacion', 'empezarEvaluacion'].forEach(n => { window[n] = id => window.__ll.push(n + ':' + id); });
    try { localStorage.removeItem('bc_reacond_costado_seguir'); } catch (e) {}
    cache.refurb = T.equipos_refurbish.map(x => ({ ...x })); cache.tareas = T.tareas_trabajo.map(x => ({ ...x }));
    nav('refurb'); try { cambiarMainTabReacond('lotes'); } catch (e) {}
  });
  await p.waitForTimeout(1000); await p.evaluate(() => { reacondTabActual = 'todos'; abrirLoteReacond('L'); }); await p.waitForTimeout(1000);
  const t = `[${W}]`;
  const abrir = async i => { await p.evaluate(() => BayolReacondCostado.cerrar(true)); await p.locator('#reacondEquiposLista .bcf-card').nth(i).locator('.bcf-tit').click(); await p.waitForTimeout(350); };
  const ver = () => p.evaluate(() => { const P = document.getElementById('rcsPanel'), B = document.getElementById('rcsPaso'), T = window.__BD.tablas, o = {};
    o.id = BayolReacondCostado.abierto(); o.paso = B.hidden ? null : B.innerText.trim(); o.pasoH = B.hidden ? 0 : Math.round(B.getBoundingClientRect().height);
    o.acs = [...P.querySelectorAll('#rcsAcs .rcs-ac')].map(x => x.innerText.trim()); o.tecs = [...P.querySelectorAll('[data-tec].rcs-ac')].map(x => x.innerText.trim());
    o.chicos = [...P.querySelectorAll('.rcs-ac, button.rcs-tag, .rcs-abrir, .rcs-seg')].filter(x => x.offsetParent).map(x => Math.round(x.getBoundingClientRect().height));
    o.aviso = document.getElementById('rcsAviso').hidden ? '' : document.getElementById('rcsAviso').textContent;
    o.est = Object.fromEntries(T.equipos_refurbish.map(x => [x.id, x.estado_evaluacion])); o.tec = Object.fromEntries(T.equipos_refurbish.map(x => [x.id, x.tecnico_asignado_id]));
    o.tareas = Object.fromEntries(T.tareas_trabajo.map(x => [x.id, x.estado])); o.hist = T.equipo_historial.map(x => x.accion);
    o.modales = [...document.querySelectorAll('.modal-backdrop.active')].map(x => x.id); o.av = window.__av.slice(-2); o.ll = window.__ll.slice(-1)[0] || '';
    const d = document.documentElement; o.sw = d.scrollWidth - d.clientWidth; o.cortado = P.scrollWidth > P.clientWidth + 1; return o; });
  const paso = async () => { await p.locator('#rcsPaso').click(); await p.waitForTimeout(500); };

  await abrir(1); let r = await ver();
  c(`${t} diagnosticado: «Asignar a» el sugerido, los demás técnicos y «Editar evaluación»`, /^Asignar a /.test(r.paso || '') && r.tecs.length === 1 && r.acs.includes('Editar evaluación') && r.acs.includes('Copiar IMEI') && r.acs.includes('Color'), [r.paso, r.tecs, r.acs]);
  c(`${t} tamaños: principal 54 px, lo demás 44 px o más, nada cortado`, r.pasoH >= 54 && r.chicos.every(h => h >= 44) && !r.cortado && r.sw <= 0, [r.pasoH, Math.min(...r.chicos), r.cortado, r.sw]);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/f-asignar-${W}.png` });
  await paso(); r = await ver();
  c(`${t} asignar con un toque: pasa a reparación, con historial, y sigue con el próximo`, r.est.L1 === 'en_proceso' && !!r.tec.L1 && r.hist.some(x => /^Asignado a /.test(x)) && r.id === 'L2' && r.modales.length === 0, [r.est.L1, r.tec.L1, r.hist, r.id, r.modales]);
  await p.locator('#rcsPanel [data-tec]').first().click(); await p.waitForTimeout(500); r = await ver();
  c(`${t} asignar a otro técnico de la lista`, r.est.L2 === 'en_proceso' && r.tec.L2 === (await p.evaluate(() => cache.tecnicos.find(x => x.id !== window.__BD.tablas.equipos_refurbish[1].tecnico_asignado_id) && window.__BD.tablas.equipos_refurbish[2].tecnico_asignado_id)), [r.est.L2, r.tec.L1, r.tec.L2]);

  await abrir(3); r = await ver();
  c(`${t} en reparación: «Técnico recibió»`, r.paso === 'Técnico recibió', r.paso);
  await p.locator('#rcsTareas [data-tarea="k2"]').click(); await p.waitForTimeout(450); const a1 = await ver();
  await p.locator('#rcsTareas [data-tarea="k2"]').click(); await p.waitForTimeout(450); const a2 = await ver();
  c(`${t} tarea: un toque la marca hecha y otro la deshace, sin moverse de equipo`, a1.tareas.k2 === 'hecha' && a2.tareas.k2 === 'pendiente' && a1.id === 'L3' && a2.id === 'L3' && a1.av.includes('Tarea hecha') && a2.av.includes('Tarea reabierta'), [a1.tareas.k2, a2.tareas.k2, a2.id, a2.av]);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/f-tareas-${W}.png` });
  await paso(); r = await ver();
  c(`${t} «Técnico recibió»: cambia el estado, no abre la ventana del proceso y sigue con el próximo`, r.est.L3 === 'tecnico_recibio' && r.modales.length === 0 && r.id === 'L4', [r.est.L3, r.modales, r.id]);

  await p.locator('#rcsSeguir').uncheck(); await abrir(3); r = await ver();
  c(`${t} con tarea pendiente avisa «Falta 1 tarea»`, r.paso === 'Enviar a calidad' && r.aviso === 'Falta 1 tarea', [r.paso, r.aviso]);
  await abrir(4); await paso(); r = await ver();
  c(`${t} «Seguir» apagado: envía a calidad y se queda en el mismo, ya con «Aprobar calidad»`, r.est.L4 === 'listo_revision' && r.id === 'L4' && r.paso === 'Aprobar calidad', [r.est.L4, r.id, r.paso]);
  await paso(); r = await ver();
  c(`${t} «Aprobar calidad» → Listo, y ofrece «Registrar salida» y «Label»`, r.est.L4 === 'listo_venta' && r.paso === 'Registrar salida' && r.acs.includes('Label'), [r.est.L4, r.paso, r.acs]);
  await paso(); r = await ver();
  c(`${t} «Registrar salida» → Despachado, sin más pasos`, r.est.L4 === 'vendido' && r.paso === null, [r.est.L4, r.paso]);
  await p.locator('#rcsSeguir').check();

  await abrir(6); r = await ver();
  const fijas = await p.evaluate(() => document.querySelectorAll('#rcsTareas button').length);
  c(`${t} equipo listo: las tareas ya no se tocan`, fijas === 0 && r.paso === 'Registrar salida', [fijas, r.paso]);
  for (const [k, fn] of [['color', 'abrirColoresLote'], ['label', 'imprimirLabelEquipo'], ['historial', 'verHistorialEquipoReacond']]) { await p.locator(`#rcsPanel [data-ac="${k}"]`).click(); await p.waitForTimeout(120); r = await ver(); c(`${t} botón ${k} abre lo de siempre`, r.ll === fn + ':L6', r.ll); }
  await p.locator('#rcsPanel [data-ac="imei"]').click(); await p.waitForTimeout(250); r = await ver();
  c(`${t} copiar IMEI avisa «IMEI copiado»`, r.av.includes('IMEI copiado'), r.av);
  await abrir(9); await p.locator('#rcsPanel [data-ac="evaluacion"]').click(); await p.waitForTimeout(120); r = await ver();
  c(`${t} «Editar evaluación» abre la evaluación`, r.ll === 'continuarEvaluacion:L9', r.ll);
  await abrir(0); r = await ver(); const p0 = r.paso; await paso(); r = await ver();
  c(`${t} recibido: «Empezar diagnóstico» abre el diagnóstico y cierra el panel`, p0 === 'Empezar diagnóstico' && r.ll === 'empezarEvaluacion:L0' && r.id === null, [p0, r.ll, r.id]);
  // ── Candados (revisión del 12-nov): quien no es administrador ──
  await p.evaluate(() => { const T = window.__BD.tablas; BayolReacondCostado.cerrar(true);
    isAdminUser = () => false; tienePermiso = () => false; sessionUser = { id: 't1', nombre: 'LUIS MIGUEL', _tipo: 'tecnico' };
    T.equipos_refurbish[3].estado_evaluacion = 'tecnico_recibio'; T.equipos_refurbish[5].estado_evaluacion = 'listo_revision'; T.equipos_refurbish[6].estado_evaluacion = 'listo_venta';
    T.equipos_refurbish[7].estado_evaluacion = 'reasignado'; T.equipos_refurbish[8].estado_evaluacion = 'reparacion_externa';
    T.tareas_trabajo = [{ id: 'm1', tipo: 'equipo', ref_id: 'L3', descripcion: 'Mía', estado: 'pendiente', tecnico_id: 't1' }, { id: 'm2', tipo: 'equipo', ref_id: 'L3', descripcion: 'De otro', estado: 'pendiente', tecnico_id: 't2' }, { id: 'm3', tipo: 'equipo', ref_id: 'L3', descripcion: 'Sin dueño', estado: 'pendiente' }];
    return loadAll().then(() => renderDetalleLoteReacond()); });
  await p.waitForTimeout(500); await abrir(3);
  const tk = await p.evaluate(() => [...document.querySelectorAll('#rcsTareas [data-tarea]')].map(x => x.getAttribute('data-tarea')));
  await p.evaluate(() => BayolReacondCostado.tarea('L3', 'm2')); await p.waitForTimeout(400); r = await ver();
  c(`${t} técnico: solo puede tocar SU tarea; la de otro no cambia ni por fuera del botón`, tk.join() === 'm1' && r.tareas.m2 === 'pendiente' && r.av.some(x => /Solo su técnico/.test(x)), [tk, r.tareas.m2, r.av]);
  await abrir(5); const q5 = (await ver()).paso; await abrir(6); const q6 = (await ver()).paso; await abrir(7); const q7 = (await ver()).paso; await abrir(8); const q8 = (await ver()).paso;
  c(`${t} sin permiso no sale «Aprobar» ni «Registrar salida»; reasignado no tiene atajo; externa dice «Volvió»`, q5 === null && q6 === null && q7 === null && q8 === 'Volvió de reparación externa', [q5, q6, q7, q8]);
  // El equipo cambia por fuera: el botón no ejecuta un paso distinto al que decía
  await abrir(3); const antesTxt = (await ver()).paso;
  await p.evaluate(() => { const T = window.__BD.tablas; T.equipos_refurbish[3].estado_evaluacion = 'en_proceso'; cache.refurb.find(x => x.id === 'L3').estado_evaluacion = 'en_proceso'; BayolReacondCostado.paso('L3'); });
  await p.waitForTimeout(300); r = await ver();
  c(`${t} si el equipo cambió por fuera, no ejecuta y avisa`, antesTxt === 'Enviar a calidad' && r.est.L3 === 'en_proceso' && r.av.some(x => /El equipo cambió/.test(x)), [antesTxt, r.est.L3, r.av]);
  // Con una pregunta abierta, las flechas no cambian de teléfono
  if (W >= 1100) { await p.evaluate(() => { const d = document.createElement('div'); d.id = 'modalConfirm'; document.body.appendChild(d); }); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(150); const k1 = (await ver()).id; await p.evaluate(() => document.getElementById('modalConfirm').remove());
    c(`${t} con una confirmación abierta, ↓ no cambia de teléfono`, k1 === 'L3', k1); }
  const a11y = await p.evaluate(() => { const P = document.getElementById('rcsPanel'); const sin = [...P.querySelectorAll('i.ti')].filter(x => x.getAttribute('aria-hidden') !== 'true').length; BayolReacondCostado.cerrar(true); return new Promise(r => setTimeout(() => r({ sin, vis: P.inert ? 'hidden' : 'visible', vivo: document.getElementById('rcsAviso').getAttribute('aria-live') }), 400)); });
  c(`${t} accesibilidad: iconos ocultos al lector, aviso vivo, panel cerrado sin foco`, a11y.sin === 0 && a11y.vis === 'hidden' && a11y.vivo === 'polite', a11y);
  c(`${t} sin errores de JS`, errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
