// 12-nov-2026 · «Asignar equipo», las 4 mejoras: (1) pitido/vibración, (2) «Qué hacer» (un solo paso), (3) resumen por modelo,
// (4) la lista se guarda y vuelve al abrir. Datos inventados.
// Correr: PUERTO=8788 node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/reacond-asignar-mejoras.cjs [carpeta-capturas]
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
    sessionUser = { id: 'a1', nombre: 'Admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true; tienePermiso = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    loadAll = async () => {}; asignarFallasSinDueno = async () => {}; window.__avisos = []; toast = m => window.__avisos.push(m); toastError = m => window.__avisos.push('ERR ' + m);
    const eq = (id, imei, est, mod, extra) => Object.assign({ id, imei, modelo: 'CELULAR IPHONE ' + mod, capacidad: '128GB', lote_id: 'L1', estado_evaluacion: est, creado_en: '2026-11-01T10:00:00Z' }, extra || {});
    const E = [eq('e1', '353776390128674', 'evaluado', '12 PRO MAX'), eq('e2', '358497891713485', 'evaluado', '14 PRO MAX'), eq('e3', '354506124750025', 'evaluado', '12 PRO MAX'), eq('e4', '353011095998944', 'en_proceso', '13', { tecnico_asignado_id: 't1' })];
    cache.refurb = E; cache.lotes = [{ id: 'L1', codigo_lote: 'C00002071' }];
    cache.tecnicos = [{ id: 't1', nombre: 'LUIS MIGUEL BRETON', activo: true, tipo_empleado: 'tecnico' }, { id: 't2', nombre: 'FRANCIS PEREZ', activo: true, tipo_empleado: 'tecnico' }];
    __BD.tablas.equipos_refurbish = E; __BD.tablas.equipo_historial = []; __BD.tablas.equipo_piezas_pedidas = []; __BD.tablas.tareas_trabajo = []; __BD.tablas.equipo_fallas = [];
    try { localStorage.removeItem('bc_asignar_borrador'); localStorage.removeItem('bc_asignar_sonido_off'); } catch (e) {}
    window.__vib = []; navigator.vibrate = x => { window.__vib.push(x); return true; };
    window.open = () => null; BayolReacondPistola.abrir();
  });
  await p.waitForTimeout(250);
  const scan = async imei => { await p.locator('#rpkIn').fill(imei); await p.locator('#rpkIn').press('Enter'); await p.waitForTimeout(90); };
  const ver = () => p.evaluate(() => ({ pit: (window.__rpkPitidos || []).slice(), vib: window.__vib.slice(), filas: document.querySelectorAll('#rpkLista .rpk-fila').length, mods: [...document.querySelectorAll('#rpkMods .rpk-mod')].map(x => x.textContent.trim()),
    av: window.__avisos.slice(-1)[0] || '', grupoOculto: document.getElementById('rpkGrupo').hidden, inCls: document.getElementById('rpkIn').className,
    altos: ['#rpkQue', '#rpkSon'].map(s => Math.round(document.querySelector(s).getBoundingClientRect().height)), sw: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
  // (1) sonido
  await scan('353776390128674'); let r = await ver();
  c(`${t} (1) equipo que entra: un pitido agudo, vibración corta y el campo se pone verde`, r.pit.join() === 'ok' && r.vib[0] === 40 && /\bok\b/.test(r.inCls), [r.pit, r.vib, r.inCls]);
  await scan('353776390128674'); await scan('999999999999999'); r = await ver();
  c(`${t} (1) repetido o que no existe: dos pitidos graves y vibración doble`, r.pit.join() === 'ok,no,no' && JSON.stringify(r.vib[2]) === '[90,60,90]', [r.pit, r.vib]);
  await p.locator('#rpkSon').click(); await scan('358497891713485'); r = await ver();
  const sOff = await p.evaluate(() => ({ off: localStorage.getItem('bc_asignar_sonido_off'), pressed: document.getElementById('rpkSon').getAttribute('aria-pressed') }));
  c(`${t} (1) la bocina apaga el sonido y se recuerda; la vibración sigue`, sOff.off === '1' && sOff.pressed === 'false' && r.vib.length === 4, [sOff, r.vib.length]);
  // (3) resumen por modelo
  await scan('354506124750025'); r = await ver();
  c(`${t} (3) resumen por modelo: 2 × 12 Pro Max y 1 × 14 Pro Max`, r.mods.join(' | ') === '2 × IPHONE 12 PRO MAX 128GB | 1 × IPHONE 14 PRO MAX 128GB', r.mods);
  c(`${t} controles de 48 px y sin barra de lado`, r.altos.every(h => h >= 48) && r.sw <= 0, [r.altos, r.sw]);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/asignar-mejoras-${W}.png` });
  // (4) cerrar y volver a abrir
  await p.locator('#rpkGrupo').evaluate(() => {}); await p.evaluate(() => document.querySelector('#rpkVentana [data-cerrar]').click()); await p.waitForTimeout(150);
  await p.evaluate(() => BayolReacondPistola.abrir()); await p.waitForTimeout(250); r = await ver();
  const rec = await p.evaluate(() => { const x = document.getElementById('rpkRec'); return { vis: !x.hidden, txt: x.innerText.replace(/\s+/g, ' ') }; });
  c(`${t} (4) al cerrar y abrir otra vez vuelve la lista (3) con su aviso`, r.filas === 3 && rec.vis && /3 equipos/.test(rec.txt), [r.filas, rec]);
  await p.locator('#rpkRec [data-vaciar]').click(); await p.waitForTimeout(120); r = await ver();
  const ls = await p.evaluate(() => localStorage.getItem('bc_asignar_borrador'));
  c(`${t} (4) «Vaciar lista» la borra de verdad`, r.filas === 0 && ls === null && r.mods.length === 0, [r.filas, ls]);
  // (2) Qué hacer
  await p.locator('#rpkQue').selectOption('recibio'); await p.waitForTimeout(100);
  await scan('353776390128674'); r = await ver();
  c(`${t} (2) «Solo: Técnico recibió»: un evaluado se rechaza con aviso y pitido grave; se esconde «Seleccionar técnico»`, r.filas === 0 && /No es para «Técnico recibió»/.test(r.av) && r.pit.slice(-1)[0] === 'no' && r.grupoOculto, [r.filas, r.av, r.grupoOculto]);
  await scan('353011095998944'); r = await ver();
  c(`${t} (2) el que sí está en reparación entra`, r.filas === 1 && r.pit.slice(-1)[0] === 'ok', [r.filas, r.pit.slice(-2)]);
  await p.locator('#rpkQue').selectOption(''); await p.waitForTimeout(100); r = await ver();
  c(`${t} (2) volver a «todos los pasos» muestra otra vez «Seleccionar técnico»`, !r.grupoOculto, r.grupoOculto);
  // aplicar borra el borrador
  await p.locator('#rpkAplicar').click(); await p.waitForTimeout(600);
  const fin = await p.evaluate(() => ({ ls: localStorage.getItem('bc_asignar_borrador'), est: __BD.tablas.equipos_refurbish.find(e => e.id === 'e4').estado_evaluacion }));
  c(`${t} (4) al aplicar, la lista guardada se borra`, fin.ls === null && fin.est === 'tecnico_recibio', fin);
  c(`${t} sin errores`, errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
