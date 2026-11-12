// 12-nov-2026 · Reacondicionados «Costado» (taller-reacond-costado.js): la ficha del equipo se abre al lado sin tapar la lista.
// Correr: PUERTO=8788 node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/reacond-costado.cjs   (SHOTS=carpeta guarda capturas)
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const PUERTO = process.env.PUERTO || 8788; const SHOTS = process.env.SHOTS || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
 for (const [W, apagar] of [[390, false], [1280, false], [1280, true]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, deviceScaleFactor: SHOTS ? 2 : 1 });
  if (apagar) await ctx.addInitScript(() => { try { localStorage.setItem('bc_reacond_costado_off', '1'); } catch (e) {} });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1')) return r.continue(); if (SHOTS && /tabler/.test(u)) return r.continue(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  await p.evaluate(() => {
    sessionUser = { id: 'u', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; const al = document.getElementById('appLoader'); if (al) al.style.display = 'none';
    window.loadAll = async () => {}; const hace = d => new Date(Date.now() - d * 86400000).toISOString();
    cache.tecnicos = [{ id: 't1', nombre: 'LUIS MIGUEL BRETON', activo: true, tipo_empleado: 'tecnico' }];
    cache.lotes = [{ id: 'L', codigo_lote: 'C00002071', enviado_reacond: true, fecha_compra: hace(9) }];
    const est = ['pendiente', 'evaluado', 'evaluado', 'en_proceso', 'tecnico_recibio', 'listo_revision', 'listo_venta', 'listo_venta', 'vendido', 'evaluado'];
    const mod = ['IPHONE 12 PRO MAX', 'IPHONE 13', 'IPHONE 11', 'IPHONE 12 PRO', 'IPHONE XR', 'IPHONE 14', 'IPHONE 13 PRO', 'IPHONE 12', 'IPHONE 11 PRO', 'IPHONE XS'];
    cache.refurb = est.map((e, i) => ({ id: 'L' + i, lote_id: 'L', modelo: 'CELULAR ' + mod[i], capacidad: '128GB', color: 'Negro', imei: '35301309520100' + i, estado_evaluacion: e, tecnico_asignado_id: i > 2 && i < 9 ? 't1' : null, fecha_asignacion: hace(3), creado_en: hace(8), costo_compra: 9000 + i * 100, notas_diagnostico: i === 3 ? 'Face ID no funciona' : '' }));
    cache.tareas = [{ id: 'k1', tipo: 'equipo', ref_id: 'L3', descripcion: 'Cambiar pantalla', estado: 'hecha' }, { id: 'k2', tipo: 'equipo', ref_id: 'L3', descripcion: 'Cambiar batería', estado: 'pendiente' }];
    cache.piezasReacond = [{ id: 'z1', equipo_id: 'L3', pieza_nombre: 'PANTALLA IPHONE 12 PRO INCELL', cantidad: 1, estado: 'aprobada' }];
    try { const T = window.__BD.tablas; T.equipo_fallas = [{ equipo_id: 'L3', falla_corto: 'PANTALLA' }, { equipo_id: 'L3', falla_corto: 'BATERÍA' }]; T.equipo_historial = [{ equipo_id: 'L3', accion: 'Asignado a LUIS MIGUEL', fecha: hace(3), usuario: 'Admin' }, { equipo_id: 'L3', accion: 'Evaluado', fecha: hace(5), usuario: 'Admin' }]; } catch (e) {}
    nav('refurb'); try { cambiarMainTabReacond('lotes'); } catch (e) {}
  });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { reacondTabActual = 'todos'; abrirLoteReacond('L'); }); await p.waitForTimeout(1200);
  const t = `[${W}${apagar ? ' apagada' : ''}]`;
  if (SHOTS && !apagar) await p.screenshot({ path: `${SHOTS}/antes-${W}.png` });
  const antes = await p.evaluate(() => { const L = document.getElementById('reacondEquiposLista'); return { w: Math.round(L.getBoundingClientRect().width), modales: document.querySelectorAll('.modal-backdrop.active').length }; });
  await p.locator('#reacondEquiposLista .bcf-card').nth(3).locator('.bcf-tit').click(); await p.waitForTimeout(500);
  if (apagar) {
    const o = await p.evaluate(() => ({ api: !!window.BayolReacondCostado, panel: !!document.getElementById('rcsPanel') }));
    c(`${t} apagada: no hay panel ni se intercepta el toque`, !o.api && !o.panel, o);
  } else {
    const r = await p.evaluate(() => { const o = {}; const P = document.getElementById('rcsPanel'), R = P.getBoundingClientRect(), L = document.getElementById('reacondEquiposLista'), C = L.querySelectorAll('.bcf-card');
      o.id = BayolReacondCostado.abierto(); o.on = P.classList.contains('on'); o.panel = [Math.round(R.left), Math.round(R.top), Math.round(R.width), Math.round(R.height)];
      o.listaW = Math.round(L.getBoundingClientRect().width); o.filaDer = Math.round(C[3].getBoundingClientRect().right); o.act = C[3].classList.contains('rcs-act');
      o.tit = document.getElementById('rcsTit').textContent; o.txt = document.getElementById('rcsCuerpo').innerText.replace(/\s+/g, ' ');
      o.btn = [...P.querySelectorAll('.rcs-ib')].map(x => Math.round(x.getBoundingClientRect().width) + 'x' + Math.round(x.getBoundingClientRect().height)); o.abrir = Math.round(document.getElementById('rcsAbrir').getBoundingClientRect().height);
      const cs = getComputedStyle(P), xb = P.querySelector('[data-x]'), xs = getComputedStyle(xb); o.fondo = cs.backgroundColor; o.x = [xs.color, xs.backgroundColor, xs.fontSize, xs.webkitTextFillColor, xb.textContent];
      o.modales = document.querySelectorAll('.modal-backdrop.active').length; const d = document.documentElement; o.sw = d.scrollWidth - d.clientWidth; o.cortado = P.scrollWidth > P.clientWidth + 1; return o; });
    c(`${t} tocar la fila abre el costado y no la ventana`, r.id === 'L3' && r.on && r.act && r.modales === antes.modales, [r.id, r.on, r.act, r.modales]);
    if (W >= 1100) c(`${t} la lista sigue a la vista, al lado del panel`, r.panel[0] >= r.filaDer - 1 && r.listaW < antes.w && r.listaW > 500, [antes.w, r.listaW, r.filaDer, r.panel[0]]);
    else c(`${t} hoja desde abajo, de ancho completo`, r.panel[0] === 0 && r.panel[2] === W && r.panel[1] > 60 && r.panel[1] + r.panel[3] <= 845, r.panel);
    c(`${t} muestra modelo, IMEI, estado, técnico, costo, nota, pieza, tareas`, /12 PRO$/.test(r.tit) && /353013095201003/.test(r.txt) && /LUIS MIGUEL/.test(r.txt) && /Face ID/.test(r.txt) && /PANTALLA IPHONE 12 PRO INCELL/.test(r.txt) && /Cambiar batería/.test(r.txt), [r.tit, r.txt.slice(0, 260)]);
    c(`${t} fallas y movimientos cargados`, /BATERÍA/.test(r.txt) && /Asignado a LUIS MIGUEL/.test(r.txt), r.txt.slice(-200));
    c(`${t} botones de 44 px, principal de 54 px, nada cortado`, r.btn.every(x => x === '44x44') && r.abrir >= 54 && !r.cortado && r.sw <= 0, [r.btn, r.abrir, r.cortado, r.sw]);
    c(`${t} panel opaco y ✕ visible`, /rgb\(255, 255, 255\)|0\.9/.test(r.fondo) && !/255, 255, 255|rgba\(0, 0, 0, 0\)/.test(r.x[0]), [r.fondo, r.x]);
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/costado-${W}.png` });
    if (W >= 1100) { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200); const a = await p.evaluate(() => BayolReacondCostado.abierto()); await p.keyboard.press('k'); await p.keyboard.press('k'); await p.waitForTimeout(200); const z = await p.evaluate(() => BayolReacondCostado.abierto());
      c(`${t} ↓ pasa al siguiente y K vuelve atrás`, a === 'L4' && z === 'L2', [a, z]); }
    else { await p.locator('#rcsPanel [data-sig]').click(); await p.waitForTimeout(200); const a = await p.evaluate(() => BayolReacondCostado.abierto()); c(`${t} flecha pasa al siguiente`, a === 'L4', a); }
    // la casilla y «Abrir» de la fila siguen igual
    const k = await p.evaluate(async () => { const C = document.querySelectorAll('#reacondEquiposLista .bcf-card'); const x = C[1].querySelector('.bcf-chk'); const id0 = BayolReacondCostado.abierto(); x.click(); await new Promise(r => setTimeout(r, 80)); const ok = x.checked && BayolReacondCostado.abierto() === id0; x.click(); return ok; });
    c(`${t} la casilla de la fila sigue marcando sin mover el panel`, k);
    if (W >= 1100) await p.keyboard.press('Escape'); else await p.locator('#rcsFondo').click({ position: { x: 20, y: 20 } }); await p.waitForTimeout(350);
    const f = await p.evaluate(() => ({ id: BayolReacondCostado.abierto(), cls: document.documentElement.classList.contains('rcs-abierto'), w: Math.round(document.getElementById('reacondEquiposLista').getBoundingClientRect().width), act: document.querySelectorAll('.rcs-act').length }));
    c(`${t} se cierra y la lista vuelve a su ancho`, f.id === null && !f.cls && f.w === antes.w && f.act === 0, f);
    await p.locator('#reacondEquiposLista .bcf-card').nth(3).locator('.bcf-tit').click(); await p.waitForTimeout(300); await p.locator('#rcsAbrir').click(); await p.waitForTimeout(700);
    const m = await p.evaluate(() => ({ id: BayolReacondCostado.abierto(), modales: document.querySelectorAll('.modal-backdrop.active').length }));
    c(`${t} «Abrir equipo» abre la ventana de siempre y cierra el costado`, m.id === null && m.modales > antes.modales, m);
  }
  c(`${t} sin errores de JS`, errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
