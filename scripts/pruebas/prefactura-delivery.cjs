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
    const bDel = document.querySelector('#v-recepcion .bcpf-rap[data-rap="1161"]');
    out.boton = !!bDel; out.botonAlto = bDel ? Math.round(bDel.getBoundingClientRect().height) : 0; out.botonVisible = bDel && bDel.offsetParent !== null;
    // cliente final
    _rpState.nivel = 1; _rpState.items = [{ cod: '2139', desc: 'BATERIA SAMSUNG', precio: 1500, cant: 1, niveles: { 1: 1500, 2: 600 } }]; _rpRenderCart(); await w(100);
    out.sinSugerenciaFinal = !document.querySelector('.bcpf-deliv-sug');
    bDel.click(); await w(200);
    let d = _rpState.items.find(x => String(x.cod) === '1161'); out.precioFinal = d && d.precio; out.etiqueta = !!document.querySelector('.bcpf-it .srv.dlv');
    bDel.click(); await w(200); out.noDuplica = !_rpState.items.some(x => String(x.cod) === '1161') && avisos.some(a => /Delivery quitado/.test(a)); bDel.click(); await w(200); out.noDuplica = out.noDuplica && _rpState.items.filter(x => String(x.cod) === '1161').length === 1;
    // precio manual (empleado puede)
    const k = _rpState.items.findIndex(x => String(x.cod) === '1161');
    const inp = document.querySelectorAll('#rxArticulos .bcpf-it')[k].querySelector('.pin'); out.campoEditable = !inp.readOnly;
    _rpPrecio(k, '150'); await w(100); out.precioManual = _rpState.items[k].precio;
    out.stockNulo = _rpStockItem(_rpState.items[k]) === null;
    // por mayor: pregunta
    _rpState.items = [{ cod: '2139', desc: 'BATERIA SAMSUNG', precio: 600, cant: 1, niveles: { 1: 1500, 2: 600 } }]; _rpState.nivel = 2; _rpState.sinDelivery = false; _rpRenderCart(); await w(100);
    const sug = document.querySelector('.bcpf-rap[data-rap="1161"]'); out.sugerencia = sug ? (sug.classList.contains('sug') ? 'sug ' : '') + sug.textContent.replace(/\s+/g, ' ').trim() : '';
    out.sugAlto = sug ? Math.round(sug.getBoundingClientRect().height) : 0;
    _rpState.items.push({ cod: '2219', desc: 'TURBO SIM - E-SIM', precio: 1000, cant: 1 }); _rpRenderCart(); await w(100);
    out.actSug = document.querySelector('.bcpf-rap[data-rap="1187"]').classList.contains('sug');
    _rpState.items.pop(); _rpRenderCart(); await w(50);
    // accesos rápidos: fila con 4, activación y recarga
    const raps = [...document.querySelectorAll('#v-recepcion .bcpf-rap')]; out.raps = raps.map(x => x.querySelector('.nm').textContent.trim()); out.iconos = raps.map(x => { const i = x.querySelector('.ic i'); return i ? Math.round(i.getBoundingClientRect().width) : 0; }); out.precios = raps.map(x => x.querySelector('.rp').textContent.trim()); out.rapAlto = Math.min(...raps.map(x => Math.round(x.getBoundingClientRect().height)));
    const fila = document.querySelector('#v-recepcion .bcpf-rapidos'), busc = document.querySelector('#v-recepcion .bcpf-busc');
    out.filaArriba = !!(fila && busc && fila.getBoundingClientRect().bottom <= busc.getBoundingClientRect().top + 1);
    out.servicioViejoOculto = [...document.querySelectorAll('#v-recepcion .bcpf-busc .bcrx-srv')].every(x => x.offsetParent === null);
    cache.infoplusArticulos.push({ codigo: '1187', descripcion: 'ACTIVACION SIM CAR - E-SIM', niveles: { 1: 100, 2: 100 }, precio: 100, existencias: {} }, { codigo: '1186', descripcion: 'RECARGA', niveles: { 1: 25, 2: 25 }, precio: 25, existencias: {} });
    document.querySelector('.bcpf-rap[data-rap="1187"]').click(); document.querySelector('.bcpf-rap[data-rap="1186"]').click(); await w(200);
    const act = _rpState.items.find(x => String(x.cod) === '1187'), rec = _rpState.items.find(x => String(x.cod) === '1186');
    out.act = act && act.precio; out.rec = rec && rec.precio; out.actStock = _rpStockItem(act) === null;
    out.recFoco = document.activeElement && document.activeElement.classList.contains('pin');
    out._shot = true; return out;
  }, admin);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/delivery-${W}${admin ? '-admin' : ''}.png` });
  const r2 = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const o = {};
    document.querySelector('.bcpf-rap[data-rap="1161"]').click(); await w(200);
    const d = _rpState.items.find(x => String(x.cod) === '1161'); o.precioMayor = d && d.precio; o.sugSeVa = document.querySelector('.bcpf-rap[data-rap="1161"]').classList.contains('puesto') && !document.querySelector('.bcpf-rap[data-rap="1161"]').classList.contains('sug');
    document.querySelector('.bcpf-rap[data-rap="1161"]').click(); await w(150); o.quitaConToque = !_rpState.items.some(x => String(x.cod) === '1161'); o.vuelve = document.querySelector('.bcpf-rap[data-rap="1161"]').classList.contains('sug');
    o.desborde = document.documentElement.scrollWidth - document.documentElement.clientWidth; return o; });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}${admin ? ' admin' : ' empleado'}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('botón Delivery visible', r.boton && r.botonVisible); c('botón ≥ 44 px', r.botonAlto >= 44, r.botonAlto);
  c('cliente final: no pregunta', r.sinSugerenciaFinal);
  c('cliente final: delivery RD$100', r.precioFinal === 100, r.precioFinal); c('línea marcada «Delivery»', r.etiqueta);
  c('2.º toque quita, 3.º vuelve a poner (nunca doble)', r.noDuplica); c('precio editable', r.campoEditable); c('precio manual 150', r.precioManual === 150, r.precioManual);
  c('sin control de existencia', r.stockNulo);
  c('por mayor: Delivery sugerido con RD$ 50', /^sug Delivery ?RD\$ ?50\.00$/.test(r.sugerencia), r.sugerencia); c('botón ≥ 44 px', r.sugAlto >= 44, r.sugAlto);
  c('«Sí» agrega RD$50', r2.precioMayor === 50, r2.precioMayor); c('al agregar queda ✓ (sin punto)', r2.sugSeVa);
  c('otro toque lo quita', r2.quitaConToque); c('al quitarlo vuelve la sugerencia', r2.vuelve);
  c('fila de 4 accesos', r.raps.join('|') === 'Delivery|Servicio|Activar|Recarga', r.raps); c('precio debajo (por mayor)', r.precios.join('|') === 'RD$ 50.00|Precio libre|RD$ 100.00|RD$ 25.00', r.precios); c('accesos ≥ 44 px', r.rapAlto >= 44, r.rapAlto);
  c('fila encima del buscador', r.filaArriba); c('sin botón Servicio repetido', r.servicioViejoOculto);
  c('activación RD$100', r.act === 100, r.act); c('recarga RD$25 y cursor en el monto', r.rec === 25 && r.recFoco, [r.rec, r.recFoco]); c('activación sin existencia', r.actStock); c('con Turbo SIM se sugiere Activación', r.actSug);
  c('sin desplazamiento horizontal', r2.desborde <= 1, r2.desborde); c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0); })();
