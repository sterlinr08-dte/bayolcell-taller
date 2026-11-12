// 12-nov-2026 · Reacondicionados «Columnas» (taller-reacond-columnas.js): el lote por columnas, curvo, con cifras arriba.
// Correr: PUERTO=8788 node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/reacond-columnas.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
 for (const [W, adminOn] of [[390, true], [1280, true], [1280, false]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, deviceScaleFactor: SHOTS ? 2 : 1 });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1') || (SHOTS && /tabler|fonts\.g/.test(u))) return r.continue(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.addInitScript(() => { try { localStorage.removeItem('bc_reacond_vista'); } catch (e) {} });
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const t = `[${W}${adminOn ? '' : ' técnico'}]`;
  await p.evaluate(adm => { sessionUser = { id: 'u', nombre: 'Admin', usuario: 'admin', rol: adm ? 'admin' : 'tecnico', _tipo: adm ? 'usuario' : 'tecnico' }; isAdminUser = () => adm; tienePermiso = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; const al = document.getElementById('appLoader'); if (al) al.style.display = 'none';
    window.loadAll = async () => {}; const hace = d => new Date(Date.now() - d * 86400000).toISOString();
    cache.tecnicos = [{ id: 't1', nombre: 'LUIS MIGUEL BRETON', activo: true, tipo_empleado: 'tecnico' }, { id: 't2', nombre: 'FRANCIS PEREZ', activo: true, tipo_empleado: 'tecnico' }, { id: 't3', nombre: 'JOSE RAMON', activo: true, tipo_empleado: 'tecnico' }];
    cache.lotes = [{ id: 'L', codigo_lote: 'C00002071', enviado_reacond: true, fecha_compra: hace(9) }];
    const M = ['IPHONE 12 PRO MAX', 'IPHONE 14 PRO MAX', 'IPHONE 13', 'IPHONE 12 PRO', 'IPHONE 11', 'IPHONE 13 PRO', 'IPHONE XR', 'IPHONE 14'], C = ['Negro', 'Azul', 'Blanco', 'Grafito', 'Rojo'];
    const plan = [['pendiente', 2], ['evaluado', 10], ['en_proceso', 3], ['tecnico_recibio', 3], ['espera_pieza', 1], ['listo_revision', 2], ['listo_venta', 5], ['vendido', 7]];
    let i = 0; cache.refurb = []; plan.forEach(([e, n]) => { for (let k = 0; k < n; k++, i++) cache.refurb.push({ id: 'L' + i, lote_id: 'L', modelo: 'CELULAR ' + M[i % M.length], capacidad: i % 3 ? '128GB' : '256GB', color: C[i % C.length], imei: '35301309' + String(5201000 + i * 137).padStart(7, '0'), estado_evaluacion: e,
      tecnico_asignado_id: ['en_proceso', 'tecnico_recibio', 'espera_pieza', 'listo_revision', 'listo_venta', 'vendido'].includes(e) ? ['t1', 't2', 't3'][i % 3] : null, fecha_asignacion: hace([1, 3, 9, 12, 2, 5][i % 6]), creado_en: hace(9), costo_compra: 9000 + (i % 6) * 2500 }); });
    const T = window.__BD.tablas; T.equipos_refurbish = cache.refurb; T.equipo_historial = [{ equipo_id: 'L12', fecha: new Date().toISOString() }, { equipo_id: 'L13', fecha: new Date().toISOString() }, { equipo_id: 'L14', fecha: new Date().toISOString() }, { equipo_id: 'L15', fecha: hace(1) }];
    T.equipo_fallas = [];
    cache.tareas = []; cache.piezasReacond = []; nav('refurb'); try { cambiarMainTabReacond('lotes'); } catch (e) {} }, adminOn);
  await p.waitForTimeout(1200); await p.mouse.move(1000, 500); await p.evaluate(() => { const a = document.querySelector('aside.sidebar'); if (a) a.classList.remove('bcm-abierta'); });
  await p.evaluate(() => { reacondTabActual = 'todos'; abrirLoteReacond('L'); }); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const L = document.getElementById('reacondEquiposLista'), o = {};
    o.on = L.classList.contains('rco-on'); o.cols = [...L.querySelectorAll('.rco-col')].map(c => c.querySelector('.rco-h b').textContent + ':' + c.querySelector('.rco-h small').textContent + ':' + c.querySelectorAll('.rco-card').length);
    o.mas = [...L.querySelectorAll('.rco-mas')].map(x => x.textContent); o.tiles = [...L.querySelectorAll('.rco-res > div')].map(x => x.innerText.replace(/\s+/g, ' ').trim());
    o.plata = /RD\$/.test(L.innerText); o.pag = getComputedStyle(document.getElementById('reacondEquiposPagination')).display;
    o.radio = parseFloat(getComputedStyle(L.querySelector('.rco-col')).borderTopLeftRadius); o.radioCard = parseFloat(getComputedStyle(L.querySelector('.rco-card')).borderTopLeftRadius);
    o.altoCard = Math.max(...[...L.querySelectorAll('.rco-card')].map(x => x.getBoundingClientRect().height));
    o.vista = [...document.querySelectorAll('#rcoVista button')].map(x => x.textContent.trim() + ':' + x.getAttribute('aria-pressed') + ':' + Math.round(x.getBoundingClientRect().height));
    const d = document.documentElement; o.sw = d.scrollWidth - d.clientWidth; return o; });
  c(`${t} el lote se ve por columnas (6) y sin páginas`, r.on && r.cols.length === 6 && r.pag === 'none', [r.cols, r.pag]);
  c(`${t} cada columna con su cuenta; en Diagnosticado 8 a la vista y «+2 más»`, r.cols.join() === 'Recibido:2:2,Diagnosticado:10:8,En reparación:7:7,Calidad:2:2,Listo:5:5,Despachado:7:7' && r.mas.join() === '+2 más', [r.cols, r.mas]);
  c(`${t} cifras arriba: en el taller 26 de 33 y movidos hoy 3 (↑ 2 más que ayer)`, /En el taller 26 de 33/.test(r.tiles[0]) && /Movidos hoy 3 ↑ 2 más que ayer/.test(r.tiles[1]), r.tiles.slice(0, 2));
  if (adminOn) c(`${t} administrador: ve los montos y «Invertido en el taller»`, r.plata && r.tiles.length === 5 && /Invertido/.test(r.tiles[4]), r.tiles.length);
  else c(`${t} sin ser administrador: ningún monto`, !r.plata && r.tiles.length === 4, [r.plata, r.tiles]);
  c(`${t} todo curvo: columnas ≥ 24 px y tarjetas ≥ 20 px de radio; tarjetas compactas`, r.radio >= 24 && r.radioCard >= 20 && r.altoCard <= 140, [r.radio, r.radioCard, r.altoCard]);
  c(`${t} botón Lista / Columnas (Columnas marcado), sin barra de lado`, r.vista.length === 2 && /Columnas:true/.test(r.vista[1]) && r.sw <= 0, [r.vista, r.sw]);
  if (SHOTS && adminOn) { await p.evaluate(() => { document.getElementById('rcoVista').scrollIntoView(); window.scrollBy(0, -20); }); await p.waitForTimeout(300); await p.screenshot({ path: `${SHOTS}/columnas-${W}.png` }); }
  await p.locator('.rco-mas').click(); await p.waitForTimeout(200);
  const n2 = await p.evaluate(() => document.querySelectorAll('.rco-col')[1].querySelectorAll('.rco-card').length);
  c(`${t} «+2 más» abre la columna completa`, n2 === 10, n2);
  await p.locator('.rco-col').nth(2).locator('.rco-card').first().locator('.rco-m').click(); await p.waitForTimeout(500);
  const cs = await p.evaluate(() => ({ id: window.BayolReacondCostado ? BayolReacondCostado.abierto() : null, modales: document.querySelectorAll('.modal-backdrop.active').length }));
  c(`${t} tocar una tarjeta abre su ficha al costado`, cs.id === 'L12' && cs.modales === 0, cs);
  if (SHOTS && adminOn) await p.screenshot({ path: `${SHOTS}/columnas-costado-${W}.png` });
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(250);
  const sig = await p.evaluate(() => BayolReacondCostado.abierto());
  c(`${t} en el costado, ↓ pasa a la siguiente tarjeta de la columna`, W < 500 || sig === 'L13', sig);
  await p.evaluate(() => BayolReacondCostado.cerrar(true));
  await p.evaluate(() => { window.__BayolCost = window.BayolReacondCostado; });
  await p.locator('#rcoVista [data-v="lista"]').click(); await p.waitForTimeout(400);
  const li = await p.evaluate(() => ({ on: document.getElementById('reacondEquiposLista').classList.contains('rco-on'), n: document.querySelectorAll('#reacondEquiposLista .bcf-card').length, pag: getComputedStyle(document.getElementById('reacondEquiposPagination')).display, ls: localStorage.getItem('bc_reacond_vista') }));
  c(`${t} «Lista» vuelve a la lista de siempre (10 por página) y se recuerda`, !li.on && li.n === 10 && li.pag !== 'none' && li.ls === 'lista', li);
  c(`${t} sin errores`, errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
