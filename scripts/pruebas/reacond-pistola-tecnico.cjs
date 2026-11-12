// 12-nov-2026 · «Pasar con pistola»: primero se elige el técnico del grupo y todos los «Entregar a técnico» van a él.
// Correr: PUERTO=8788 node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/reacond-pistola-tecnico.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
 for (const [W, H] of [[390, 844], [1280, 800]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: W < 500, isMobile: W < 500 });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1') || (SHOTS && /tabler|fonts\.g/.test(u))) return r.continue(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const t = `[${W}]`;
  await p.evaluate(() => {
    sessionUser = { id: 'a1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true; tienePermiso = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    loadAll = async () => {}; asignarFallasSinDueno = async () => {}; window.__avisos = []; toast = m => window.__avisos.push(m); toastError = m => window.__avisos.push('ERR ' + m);
    const eq = (id, imei, est, extra) => Object.assign({ id, imei, modelo: 'CELULAR IPHONE 12 PRO MAX', capacidad: '128GB', lote_id: 'L1', estado_evaluacion: est, articulo_codigo: '2060', creado_en: '2026-11-01T10:00:00Z' }, extra || {});
    const E = [eq('e1', '353776390128674', 'evaluado'), eq('e2', '358497891713485', 'evaluado'), eq('e3', '354506124750025', 'evaluado'), eq('e4', '353011095998944', 'en_proceso', { tecnico_asignado_id: 't1' }), eq('e5', '353011095998945', 'evaluado')];
    cache.refurb = E; cache.lotes = [{ id: 'L1', codigo_lote: 'C00002071', enviado_reacond: true }];
    cache.tecnicos = [{ id: 't1', nombre: 'LUIS MIGUEL BRETON', activo: true, tipo_empleado: 'tecnico' }, { id: 't2', nombre: 'FRANCIS PEREZ', activo: true, tipo_empleado: 'tecnico' }, { id: 't3', nombre: 'JOSE RAMON', activo: true, tipo_empleado: 'tecnico' }];
    __BD.tablas.equipos_refurbish = E; __BD.tablas.equipo_historial = []; __BD.tablas.equipo_piezas_pedidas = []; __BD.tablas.tareas_trabajo = [];
    window.BC_REACOND_PISTOLA_MODO = '';
    BayolReacondPistola.abrir();
  });
  await p.waitForTimeout(200);
  const scan = async imei => { await p.locator('#rpkIn').fill(imei); await p.locator('#rpkIn').press('Enter'); await p.waitForTimeout(80); };
  const ver = () => p.evaluate(() => ({ chips: [...document.querySelectorAll('#rpkGrupo [data-grupo]')].map(b => ({ t: b.innerText.replace(/\s+/g, ' ').trim(), on: b.classList.contains('on'), h: Math.round(b.getBoundingClientRect().height) })),
    sel: [...document.querySelectorAll('#rpkLista .rpk-tec')].map(s => s.value), vacio: (document.querySelector('#rpkLista .rpk-vacio') || {}).textContent || '', foco: document.activeElement && document.activeElement.id,
    sw: document.documentElement.scrollWidth - document.documentElement.clientWidth, chipsArriba: (() => { const g = document.getElementById('rpkGrupo').getBoundingClientRect(), i = document.getElementById('rpkIn').getBoundingClientRect(); return g.bottom <= i.top + 1; })() }));
  let r = await ver();
  c(`${t} arriba, antes del campo: los 3 técnicos con su carga, ninguno elegido`, r.chips.length === 3 && r.chipsArriba && r.chips.every(x => !x.on) && /LUIS MIGUEL 1 en reparación/.test(r.chips[0].t) && /Elija el técnico/.test(r.vacio), [r.chips, r.vacio]);
  c(`${t} botones de técnico de 44 px y sin barra de lado`, r.chips.every(x => x.h >= 44) && r.sw <= 0, [r.chips.map(x => x.h), r.sw]);
  await p.locator('#rpkGrupo [data-grupo="t2"]').click(); await p.waitForTimeout(100); r = await ver();
  c(`${t} elegir FRANCIS lo marca y deja el cursor en el campo para pasar`, r.chips[1].on && !r.chips[0].on && r.foco === 'rpkIn' && /para FRANCIS/.test(r.vacio), [r.chips.map(x => x.on), r.foco, r.vacio]);
  for (const im of ['353776390128674', '358497891713485', '354506124750025', '353011095998944']) await scan(im);
  r = await ver();
  c(`${t} los 3 evaluados van a FRANCIS; el que ya está en reparación no lleva técnico`, r.sel.length === 3 && r.sel.every(v => v === 't2'), r.sel);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/pistola-tecnico-${W}.png` });
  await p.locator('#rpkGrupo [data-grupo="t3"]').click(); await p.waitForTimeout(100); r = await ver();
  c(`${t} cambiar a JOSE cambia también los ya escaneados`, r.sel.every(v => v === 't3') && r.chips[2].on, r.sel);
  await p.locator('#rpkLista .rpk-tec').first().selectOption('t1'); await scan('353011095998945'); r = await ver();
  c(`${t} una fila se puede cambiar a mano; el siguiente escaneado sigue yendo a JOSE`, r.sel[0] === 't3' && r.sel.filter(v => v === 't1').length === 1, r.sel);
  await p.locator('#rpkGrupo [data-grupo="t3"]').click(); await p.waitForTimeout(100); r = await ver();
  c(`${t} tocar JOSE otra vez lo quita y vuelve a la sugerencia`, r.chips.every(x => !x.on) && r.sel.every(v => v), [r.chips.map(x => x.on), r.sel]);
  await p.locator('#rpkGrupo [data-grupo="t2"]').click(); await p.waitForTimeout(100);
  await p.locator('#rpkAplicar').click(); await p.waitForTimeout(600);
  const fin = await p.evaluate(() => ({ eq: __BD.tablas.equipos_refurbish.filter(e => ['e1', 'e2', 'e3', 'e5'].includes(e.id)).map(e => e.estado_evaluacion + ':' + e.tecnico_asignado_id), hist: __BD.tablas.equipo_historial.map(h => h.accion), av: window.__avisos }));
  c(`${t} «Aplicar»: los 4 quedan en reparación con FRANCIS y con historial`, fin.eq.every(x => x === 'en_proceso:t2') && fin.hist.filter(h => /Asignado a FRANCIS/.test(h)).length === 4, fin);
  c(`${t} sin errores`, errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
