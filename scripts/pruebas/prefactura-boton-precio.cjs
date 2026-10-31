// 30-oct-2026 · Buscar artículo de la Prefactura: precio y agregar en un solo botón (taller-recepcion.js g11). Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/prefactura-boton-precio.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const [W, admin] of [[390, true], [1280, true], [1280, false]]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
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
    _rpState.nivel = 1; toast = () => {}; toastError = () => {};
    cache.infoplusArticulos = [
      { codigo: 2139, descripcion: 'BATERIA SAMSUNG A20 / A30', marca: 'SAMSUNG', niveles: { 1: 1500, 2: 600, 3: 450 }, precio: 1500, existencias: { 1: 29, 4: 4 } },
      { codigo: 2019, descripcion: 'COVER IPHONE XR TRANSPARENTE', marca: 'APPLE', niveles: { 1: 250 }, precio: 250, existencias: { 1: 10 } },
      { codigo: 3001, descripcion: 'PANTALLA SIN STOCK', marca: 'APPLE', niveles: { 1: 900 }, precio: 900, existencias: { 1: 0 } }
    ];
    _rpEsSerial = async () => false; supabaseClient.functions.invoke = async () => ({ data: null });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true })); await w(400);
    const filas = [...document.querySelectorAll('.bcrx-ppk-row')];
    out.filas = filas.length;
    const btn = i => document.querySelectorAll('.bcrx-ppk-row')[i].querySelector('.pk-add');
    out.textoBtn = btn(0).textContent.trim(); out.altoBtn = Math.round(btn(0).getBoundingClientRect().height);
    out.sinPrecioAparte = !document.querySelector('.bcrx-ppk-row .pk-pre');
    out.sinStockApagado = [...document.querySelectorAll('.bcrx-ppk-row')].some(f => /SIN STOCK/i.test(f.textContent) && f.querySelector('.pk-add').disabled);
    // abrir detalle: no hay botón naranja repetido
    filas[0].click(); await w(150);
    out.sinBotonAbajo = !document.querySelector('.bcrx-ppk-det .pk-elegir');
    out.nivelesBotones = document.querySelectorAll('.bcrx-ppk-det .pk-nv.elegible').length;
    if (admin) {
      document.querySelector('.bcrx-ppk-det .pk-nv[data-nv="2"]').click(); await w(150);
      out.btnTrasNivel = btn(0).textContent.replace(/\s+/g, ' ').trim(); out.btnAzul = btn(0).classList.contains('otro');
    }
    out.claseN1 = document.querySelectorAll('.bcrx-ppk-row')[1].querySelector('.pk-add').classList.contains('pk-n1');
    if (admin) out.claseN2 = btn(0).classList.contains('pk-n2');
    const sinB = [...document.querySelectorAll('.bcrx-ppk-row')].find(f => /SIN STOCK/i.test(f.textContent)).querySelector('.pk-add');
    out.sinColor = getComputedStyle(sinB).color;
    _rpState.nivel = 3; document.getElementById('rxNivel') && (document.getElementById('rxNivel').value = '3'); document.querySelector('.bcrx-ppk input').dispatchEvent(new Event('input', { bubbles: true })); await w(150);
    out.claseN3 = [...document.querySelectorAll('.bcrx-ppk-row')].some(f => f.querySelector('.pk-add.pk-n3'));
    _rpState.nivel = 1; document.getElementById('rxNivel') && (document.getElementById('rxNivel').value = '1'); document.querySelector('.bcrx-ppk input').dispatchEvent(new Event('input', { bubbles: true })); await w(150);
    out.anchoDesborde = document.querySelector('.bcrx-ppk-list').scrollWidth - document.querySelector('.bcrx-ppk-list').clientWidth;
    return out;
  }, admin);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/boton-precio-${W}${admin ? '' : '-empleado'}.png` });
  // agregar con el botón y ver el contador
  const r2 = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); document.querySelector('.bcrx-ppk-row .pk-add').click(); await w(500);
    const it = _rpState.items.find(x => String(x.cod) === '2139'); return { precio: it && it.precio, cant: it && it.cant }; });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}${admin ? '' : ' empleado'}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('botón con el precio', /RD\$\s?1,500\.00/.test(r.textoBtn), r.textoBtn);
  c('botón ≥ 44 px', r.altoBtn >= 44, r.altoBtn);
  c('sin precio repetido aparte', r.sinPrecioAparte);
  c('sin stock: botón apagado', r.sinStockApagado);
  c('sin botón naranja abajo', r.sinBotonAbajo);
  if (admin) {
    c('admin: niveles se pueden tocar', r.nivelesBotones === 3, r.nivelesBotones);
    c('nivel Por mayor cambia el botón', /600\.00/.test(r.btnTrasNivel) && /Por mayor/.test(r.btnTrasNivel) && r.btnAzul, r.btnTrasNivel);
    c('se agrega a RD$600', r2.precio === 600, r2);
  } else {
    c('empleado: niveles solo informativos', r.nivelesBotones === 0, r.nivelesBotones);
    c('se agrega a RD$1,500', r2.precio === 1500, r2);
  }
  c('Cliente final = naranja (pk-n1)', r.claseN1); if (admin) c('Por mayor = azul (pk-n2)', r.claseN2);
  c('Extremo = amarillo (pk-n3)', r.claseN3); c('sin stock = rojo', r.sinColor === 'rgb(220, 38, 38)', r.sinColor);
  c('sin desplazamiento horizontal', r.anchoDesborde <= 1, r.anchoDesborde);
  c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0); })();
