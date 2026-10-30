// 30-oct-2026 · Prefactura: botón Delivery (artículo 1161) y pregunta para clientes por mayor. Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/prefactura-delivery.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const [W, admin] of [[390, false], [1280, false], [1280, true]]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async (admin) => {
    const out = {}; const w = ms => new Promise(r => setTimeout(r, ms));
    sessionUser = admin ? { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' } : { id: 't1', nombre: 'Cajera', usuario: 'caja', rol: 'tecnico', _tipo: 'tecnico' };
    if (!admin) isAdminUser = () => false;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    document.querySelectorAll('.view.active').forEach(x => x.classList.remove('active')); document.getElementById('v-recepcion').classList.add('active');
    try { _rpInit(); } catch (e) {}
    const avisos = []; toast = (m) => avisos.push(m); toastError = (m) => avisos.push('ERR ' + m);
    cache.infoplusArticulos = [{ codigo: '1161', descripcion: 'ENVIO  -  MENSAJERIA', niveles: { 1: 100, 2: 50, 3: 200 }, precio: 100, existencias: {} }];
    await w(300);
    const bDel = document.querySelector('#v-recepcion .bcpf-deliv');
    out.boton = !!bDel; out.botonAlto = bDel ? Math.round(bDel.getBoundingClientRect().height) : 0; out.botonVisible = bDel && bDel.offsetParent !== null;
    // cliente final
    _rpState.nivel = 1; _rpState.items = [{ cod: '2139', desc: 'BATERIA SAMSUNG', precio: 1500, cant: 1, niveles: { 1: 1500, 2: 600 } }]; _rpRenderCart(); await w(100);
    out.sinSugerenciaFinal = !document.querySelector('.bcpf-deliv-sug');
    bDel.click(); await w(200);
    let d = _rpState.items.find(x => String(x.cod) === '1161'); out.precioFinal = d && d.precio; out.etiqueta = !!document.querySelector('.bcpf-it .srv.dlv');
    bDel.click(); await w(200); out.noDuplica = _rpState.items.filter(x => String(x.cod) === '1161').length === 1 && avisos.some(a => /Ya tiene delivery/.test(a));
    // precio manual (empleado puede)
    const k = _rpState.items.findIndex(x => String(x.cod) === '1161');
    const inp = document.querySelectorAll('#rxArticulos .bcpf-it')[k].querySelector('.pin'); out.campoEditable = !inp.readOnly;
    _rpPrecio(k, '150'); await w(100); out.precioManual = _rpState.items[k].precio;
    out.stockNulo = _rpStockItem(_rpState.items[k]) === null;
    // por mayor: pregunta
    _rpState.items = [{ cod: '2139', desc: 'BATERIA SAMSUNG', precio: 600, cant: 1, niveles: { 1: 1500, 2: 600 } }]; _rpState.nivel = 2; _rpState.sinDelivery = false; _rpRenderCart(); await w(100);
    const sug = document.querySelector('.bcpf-deliv-sug'); out.sugerencia = sug ? sug.textContent.replace(/\s+/g, ' ').trim() : '';
    out.sugAlto = sug ? Math.round(sug.getBoundingClientRect().height) : 0;
    out._shot = true; return out;
  }, admin);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/delivery-${W}${admin ? '-admin' : ''}.png` });
  const r2 = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const o = {};
    document.querySelector('.bcpf-deliv-sug').click(); await w(200);
    const d = _rpState.items.find(x => String(x.cod) === '1161'); o.precioMayor = d && d.precio; o.sugSeVa = !document.querySelector('.bcpf-deliv-sug');
    _rpQuitar(_rpState.items.indexOf(d)); await w(100); o.vuelve = !!document.querySelector('.bcpf-deliv-sug');
    o.desborde = document.documentElement.scrollWidth - document.documentElement.clientWidth; return o; });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}${admin ? ' admin' : ' empleado'}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('botón Delivery visible', r.boton && r.botonVisible); c('botón ≥ 44 px', r.botonAlto >= 44, r.botonAlto);
  c('cliente final: no pregunta', r.sinSugerenciaFinal);
  c('cliente final: delivery RD$100', r.precioFinal === 100, r.precioFinal); c('línea marcada «Delivery»', r.etiqueta);
  c('no se duplica (avisa)', r.noDuplica); c('precio editable', r.campoEditable); c('precio manual 150', r.precioManual === 150, r.precioManual);
  c('sin control de existencia', r.stockNulo);
  c('por mayor: botón «+ Delivery RD$ 50»', /^\+ Delivery RD\$ ?50\.00$/.test(r.sugerencia), r.sugerencia); c('botón ≥ 44 px', r.sugAlto >= 44, r.sugAlto);
  c('«Sí» agrega RD$50', r2.precioMayor === 50, r2.precioMayor); c('el botón se va al agregar', r2.sugSeVa);
  c('al quitarlo vuelve el botón', r2.vuelve);
  c('sin desplazamiento horizontal', r2.desborde <= 1, r2.desborde); c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0); })();
