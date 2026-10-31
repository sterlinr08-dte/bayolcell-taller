// 31-oct-2026 · Buscar artículo: si el almacén elegido está en 0 pero hay en otras tiendas, la fila dice «Navarrete: 0 · 5 en otras»
// y el botón apagado dice «5 en otras» (taller-recepcion.js g15). Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/prefactura-stock-otras.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => {
    const out = {}; const w = ms => new Promise(r => setTimeout(r, ms));
    sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    document.querySelectorAll('.view.active').forEach(x => x.classList.remove('active')); document.getElementById('v-recepcion').classList.add('active');
    try { _rpInit(); } catch (e) {}
    _rpState.nivel = 1; toast = () => {}; toastError = () => {};
    const alm = document.getElementById('rxAlmacen'); if (alm) { if (![...alm.options].some(o => o.value === '7')) alm.add(new Option('Navarrete', '7')); alm.value = '7'; }
    cache.infoplusArticulos = [
      { codigo: 2874, descripcion: 'CELULAR IPHONE 14 NORMAL 128GB', marca: 'IPHONE', niveles: { 1: 18990, 2: 18000 }, precio: 18990, existencias: { 1: 1, 4: 1, 6: 3, 7: 0 } },
      { codigo: 1915, descripcion: 'CELULAR IPHONE 14 NORMAL 256GB', marca: 'IPHONE', niveles: { 1: 21990 }, precio: 21990, existencias: { 1: 0, 7: 0 } },
      { codigo: 1143, descripcion: 'CELULAR IPHONE 12 NORMAL 64GB', marca: 'IPHONE', niveles: { 1: 11990 }, precio: 11990, existencias: { 7: 2 } }
    ];
    _rpEsSerial = async () => false; supabaseClient.functions.invoke = async () => ({ data: null });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true })); await w(400);
    const fila = cod => [...document.querySelectorAll('.bcrx-ppk-row')].find(f => f.querySelector('.pk-cod').textContent.trim() === String(cod));
    const t = f => f.textContent.replace(/\s+/g, ' ').trim();
    const f1 = fila(2874), f2 = fila(1915), f3 = fila(1143);
    out.otrasChip = t(f1.querySelector('.bcrx-stk')); out.otrasBtn = t(f1.querySelector('.pk-add')); out.otrasApagado = f1.querySelector('.pk-add').disabled;
    out.otrasAmbar = getComputedStyle(f1.querySelector('.bcrx-stk')).color;
    out.ningunaChip = t(f2.querySelector('.bcrx-stk')); out.ningunaBtn = t(f2.querySelector('.pk-add'));
    out.aquiChip = t(f3.querySelector('.bcrx-stk')); out.aquiBtn = t(f3.querySelector('.pk-add')); out.aquiEnciende = !f3.querySelector('.pk-add').disabled;
    out.anchoDesborde = document.querySelector('.bcrx-ppk-list').scrollWidth - document.querySelector('.bcrx-ppk-list').clientWidth;
    f1.click(); await w(150); out.detalle = t(document.querySelector('.bcrx-ppk-det .pk-dex'));
    return out;
  });
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/stock-otras-${W}.png` });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('fila dice almacén en 0 y cuántos hay en otras', /Navarrete: 0 · 5 en otras/.test(r.otrasChip), r.otrasChip);
  c('botón apagado dice «5 en otras»', r.otrasApagado && /5 en otras/.test(r.otrasBtn), r.otrasBtn);
  c('chip en ámbar, no rojo', r.otrasAmbar === 'rgb(146, 64, 14)', r.otrasAmbar);
  c('sin stock en ninguna: sigue «Sin stock»', /^Sin stock$/i.test(r.ningunaChip) && /Sin stock/i.test(r.ningunaBtn), [r.ningunaChip, r.ningunaBtn]);
  c('con stock aquí: «Stock: 2» y botón con precio', /Stock: 2/.test(r.aquiChip) && /11,990/.test(r.aquiBtn) && r.aquiEnciende, [r.aquiChip, r.aquiBtn]);
  c('detalle muestra las tiendas', /Navarrete: 0/.test(r.detalle) && /Taller: 3/.test(r.detalle), r.detalle);
  c('sin desborde horizontal', r.anchoDesborde <= 0, r.anchoDesborde);
  c('sin errores de JS', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo bien'); process.exit(fallos ? 1 : 0); })();
