// Reacondicionados, capa visual (taller-ui-reacond.*, 26-oct-2026). Uso: node scripts/pruebas/servidor.cjs & ; node scripts/pruebas/reacond-ui.cjs
// Puerto: PUERTO=8788 por defecto (cámbielo si otro banco usa ese puerto).
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
const PUERTO = process.env.PUERTO || '8788'; const STUB = __dirname + '/supabase-stub.js';
async function abrir(b, W, apagar) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs|jsdelivr/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(STUB, 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  if (apagar) await ctx.addInitScript(() => { try { localStorage.setItem('bc_reacond_ui_off', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.goto('http://127.0.0.1:' + PUERTO + '/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  await p.evaluate(() => {
    sessionUser = { id: 'u', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; const al = document.getElementById('appLoader'); if (al) al.style.display = 'none';
    window.loadAll = async () => {}; const hace = d => new Date(Date.now() - d * 86400000).toISOString();
    cache.tecnicos = [{ id: 't1', nombre: 'Josiel', activo: true }];
    cache.lotes = [{ id: 'L', codigo_lote: 'LOTE-1', enviado_reacond: true, fecha_compra: hace(9), gastos_envio: 1000 }];
    const est = ['pendiente', 'en_evaluacion', 'evaluado', 'en_proceso', 'listo_revision', 'listo_venta', 'vendido'];
    cache.refurb = est.map((e, i) => ({ id: 'e' + i, lote_id: 'L', modelo: 'iPhone 1' + i, imei: '35000000000000' + i, estado_evaluacion: e, tecnico_asignado_id: i >= 3 ? 't1' : null, fecha_asignacion: hace(1), creado_en: hace(5), costo_compra: 10000, costo_repuestos: i === 3 ? 1500 : 0 }));
    cache.tareas = [{ id: 'k1', tipo: 'equipo', ref_id: 'e3', estado: 'pendiente', descripcion: 'Pantalla' }, { id: 'k2', tipo: 'equipo', ref_id: 'e3', estado: 'hecha', descripcion: 'Batería' }];
    cache.piezasReacond = [{ id: 'p1', equipo_id: 'e3', pieza_nombre: 'Pantalla', cantidad: 1, estado: 'recibida', agregada_por_tecnico: true, pieza_id: 'x' }];
    nav('refurb'); try { cambiarMainTabReacond('lotes'); } catch (e) {}
  });
  await p.waitForTimeout(1200); await p.evaluate(() => { reacondTabActual = 'todos'; abrirLoteReacond('L'); }); await p.waitForTimeout(800); return { ctx, p, errs };
}
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 1280]) {
  const { ctx, p, errs } = await abrir(b, W);
  const r = await p.evaluate(async () => {
    const o = {}; const h = e => e ? Math.round(e.getBoundingClientRect().height) : 0;
    o.capa = !!window.BayolReacondUI && document.documentElement.classList.contains('bc-rcu');
    o.grupos = [...document.querySelectorAll('#reacondDetalleLote .rcu-grupo')].map(g => (g.querySelector('.rcu-grupo-t') || {}).textContent);
    const bIP = document.getElementById('btnRegistrarCompraIP'); o.ipEnMenu = !!(bIP && bIP.closest('details.rcu-menu')) && bIP.getAttribute('onclick') === 'registrarCompraLoteInfoPlus()';
    o.unaVez = document.querySelectorAll('#btnDespacharTel').length === 1 && document.querySelectorAll('.rcu-barra').length === 1;
    const k = document.getElementById('kpiCardDiagnostico'); k.click(); o.filtro = [document.getElementById('reacondFiltroEstado').value, document.querySelectorAll('#reacondEquiposLista .bcf-card').length];
    document.getElementById('kpiCardDiagnostico').click(); o.sinFiltro = [document.getElementById('reacondFiltroEstado').value, document.querySelectorAll('#reacondEquiposLista .bcf-card').length];
    renderDetalleLoteReacond(); o.siguaUnaBarra = document.querySelectorAll('.rcu-barra').length === 1;
    const m = document.querySelector('.rcu-menu'); m.querySelector('summary').click(); await new Promise(r => setTimeout(r, 50)); o.menu = [m.open, h(bIP), h(m.querySelector('summary'))];
    document.body.click(); await new Promise(r => setTimeout(r, 50)); o.menuCierra = !m.open;
    const t = document.getElementById('reacondSelTodos'); t.click(); o.marcados = _reacondSel.size; o.todosAlto = h(t.closest('label'));
    o.resumen = [...document.querySelectorAll('#reacondEquiposLista .rcu-res')].length; o.costo = /RD\$ 11,/.test((document.querySelector('[onclick*="e3"] .rcu-res, .bcf-card .rcu-res') || {}).textContent || '') || [...document.querySelectorAll('.rcu-res')].some(x => /Costo/.test(x.textContent));
    o.fallas = [...document.querySelectorAll('.rcu-res')].map(x => x.textContent).filter(x => /Fallas/.test(x))[0] || '';
    o.ancho = document.documentElement.scrollWidth;
    sessionUser = { id: 't1', nombre: 'Josiel', _tipo: 'tecnico', rol: 'tecnico' }; nav('misReacond'); renderMisReacond();
    o.mis = document.querySelectorAll('#misReacondContenido .rcu-mis-card').length; o.misCosto = /Costo/.test(document.getElementById('misReacondContenido').textContent);
    o.misBoton = h(document.querySelector('.rcu-mis-card .btn'));
    return o; });
  const ok = r.capa && r.grupos.join() === 'Selección,Salida,Lote' && r.ipEnMenu && r.unaVez && r.filtro[0] === 'diagnostico' && r.filtro[1] === 2 && r.sinFiltro[0] === '' && r.sinFiltro[1] === 7 && r.siguaUnaBarra && r.menu[0] && r.menu[1] >= 44 && r.menu[2] >= 44 && r.menuCierra && r.marcados === 7 && r.todosAlto >= 48 && r.resumen >= 1 && r.costo && /1 de 2/.test(r.fallas) && r.ancho <= W && r.mis === 3 && !r.misCosto && r.misBoton >= 48 && !errs.length;
  if (!ok) fallos++; console.log(W, ok ? 'OK' : 'FALLO', JSON.stringify(r), 'errores', errs); await ctx.close();
  // Interruptor: con bc_reacond_ui_off=1 la pantalla queda como antes
  const a = await abrir(b, W, true);
  const off = await a.p.evaluate(() => ({ clase: document.documentElement.classList.contains('bc-rcu'), barra: !!document.querySelector('.rcu-barra'), api: !!window.BayolReacondUI }));
  const okOff = !off.clase && !off.barra && !off.api && !a.errs.length; if (!okOff) fallos++;
  console.log(W, 'apagada', okOff ? 'OK' : 'FALLO', JSON.stringify(off)); await a.ctx.close();
 }
 await b.close(); process.exit(fallos ? 1 : 0); })();
