// Raspa y gana (29-oct-2026): página pública raspa.html, cupón en la hoja impresa y canje en la Prefactura.
// Todo con datos inventados: las RPC raspa_* están simuladas (aquí para la página pública y en supabase-stub.js para el taller).
// Uso: node scripts/pruebas/servidor.cjs &   y   node scripts/pruebas/raspa-y-gana.cjs [carpeta-capturas]
// QRJS=/ruta/qrcode.min.js para servir qrcodejs sin Internet (si no, se pide a cdnjs).
const { chromium } = require(process.env.PW || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const S = __dirname, PUERTO = process.env.PUERTO || 8788, BASE = 'http://127.0.0.1:' + PUERTO;
const OUT = process.argv[2] || path.join(require('os').tmpdir(), 'raspa-capturas'); fs.mkdirSync(OUT, { recursive: true });
let fallos = 0; const R = [];
function ok(nombre, cond, extra) { R.push((cond ? 'OK   ' : 'FALLO') + ' ' + nombre + (extra ? ' · ' + extra : '')); if (!cond) fallos++; }

// ---------- Simulador de la base para la página pública ----------
function simPublico() {
  const J = {
    ['a'.repeat(36)]: { estado: 'pendiente', codigo: 'BC-PEN4' },
    ['b'.repeat(36)]: { estado: 'activo', codigo: 'BC-ACT7', premio_sorteo: '10' },
    ['c'.repeat(36)]: { estado: 'jugado', codigo: 'BC-JUG3', premio: 'regalo', vence_en: '2026-11-29T15:00:00Z' },
    ['d'.repeat(36)]: { estado: 'usado', codigo: 'BC-USA9', premio: '5' },
    ['e'.repeat(36)]: { estado: 'vencido', codigo: 'BC-VEN6', premio: '5', vence_en: '2026-09-01T15:00:00Z' },
    ['f'.repeat(36)]: { estado: 'activo', codigo: 'BC-ACT8', premio_sorteo: '5' }
  };
  const llamadas = [];
  return { J, llamadas, ruta: async (route) => {
    const u = route.request().url(), n = u.split('/rpc/')[1], a = JSON.parse(route.request().postData() || '{}'); llamadas.push({ n, a, h: route.request().headers() });
    const j = J[a.p_token]; let r;
    if (n === 'raspa_ver') r = j ? { ok: true, estado: j.estado, codigo: j.codigo, premio: j.premio || null, vence_en: j.vence_en || null } : { ok: false, estado: 'no_existe' };
    else if (n === 'raspa_jugar') {
      const tel = String(a.p_telefono || '').replace(/\D/g, '');
      if (tel.length !== 10) r = { ok: false, motivo: 'telefono' };
      else if (!j) r = { ok: false, motivo: 'no_existe' };
      else if (j.estado === 'activo') { Object.assign(j, { estado: 'jugado', premio: j.premio_sorteo, telefono: tel, vence_en: '2026-11-29T15:00:00Z' }); r = { ok: true, premio: j.premio, codigo: j.codigo, vence_en: j.vence_en, estado: 'jugado' }; }
      else if (j.estado === 'jugado') r = { ok: true, premio: j.premio, codigo: j.codigo, vence_en: j.vence_en, estado: 'jugado' };
      else r = { ok: false, motivo: j.estado };
    } else return route.fulfill({ status: 404, body: '{}' });
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(r) });
  } };
}

async function medirPublico(p, W) {
  return p.evaluate((W) => {
    const vis = e => e && e.offsetParent !== null; const box = e => e.getBoundingClientRect();
    const cup = document.querySelector('.cupon'), cs = getComputedStyle(cup);
    const tocables = [...document.querySelectorAll('button, a.btn, input')].filter(vis).map(e => Math.round(box(e).height));
    const prim = [...document.querySelectorAll('.btn:not(.sec)')].filter(vis).map(e => Math.round(box(e).height));
    const inp = document.querySelector('.campo input'), lab = document.querySelector('.campo label');
    return { sw: document.documentElement.scrollWidth, pad: [parseFloat(cs.paddingTop), parseFloat(cs.paddingLeft)], tocMin: tocables.length ? Math.min(...tocables) : 99, primMin: prim.length ? Math.min(...prim) : 99,
      inpAlto: inp ? Math.round(box(inp).height) : null, inpLetra: inp ? parseFloat(getComputedStyle(inp).fontSize) : null, labGap: inp && lab ? Math.round(box(inp).top - box(lab).bottom) : null,
      letraMin: Math.min(...[...document.querySelectorAll('.cupon *')].filter(e => vis(e) && e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => parseFloat(getComputedStyle(e).fontSize))),
      excl: /!/.test(document.querySelector('.cupon').innerText) };
  }, W);
}

async function publico(b) {
  for (const W of [390, 1280]) {
    for (const tema of W === 390 ? ['light', 'dark'] : ['light']) {
      const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, colorScheme: tema, deviceScaleFactor: 1 });
      const sim = simPublico(); await ctx.route(/\/rest\/v1\/rpc\//, sim.ruta);
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      const ir = async (t, nombre) => { await p.goto(BASE + '/raspa.html' + (t == null ? '' : '?t=' + t)); await p.waitForTimeout(500); if (nombre) await p.screenshot({ path: path.join(OUT, `publica-${nombre}-${W}${tema === 'dark' ? '-oscuro' : ''}.png`), fullPage: true }); return p.textContent('.cupon'); };
      const et = `[${W}${tema === 'dark' ? ' oscuro' : ''}]`;
      let t = await ir('a'.repeat(36), 'pendiente'); ok(et + ' pendiente', /se activa cuando la compra se pague en caja/i.test(t) && /BC-PEN4/.test(t));
      t = await ir('d'.repeat(36), 'usado'); ok(et + ' usado', /ya se usó/.test(t) && /BC-USA9/.test(t));
      t = await ir('e'.repeat(36), 'vencido'); ok(et + ' vencido', /venció/.test(t) && /BC-VEN6/.test(t));
      t = await ir('0'.repeat(36), 'no-existe'); ok(et + ' no existe', /no existe/.test(t));
      t = await ir(null); ok(et + ' sin token', /no existe/.test(t));
      t = await ir('c'.repeat(36), 'jugado'); const mJ = await medirPublico(p, W);
      ok(et + ' jugado (regalo)', /Accesorio gratis/.test(t) && /BC-JUG3/.test(t) && /Dónde vale/.test(t) && /Dónde no vale/.test(t) && /29 de noviembre de 2026/.test(t));
      ok(et + ' botón reseña', (await p.getAttribute('#resena', 'href')) === 'https://share.google/iqIYsfVeciXd3MzLL' && mJ.primMin >= 54, 'alto ' + mJ.primMin);
      // activo → teléfono → raspar
      t = await ir('b'.repeat(36), 'activo'); const mA = await medirPublico(p, W);
      ok(et + ' activo pide WhatsApp', /Raspe y gane/.test(t) && !!(await p.$('#tel')));
      const padOk = W < 600 ? (mA.pad[0] === 24 && mA.pad[1] === 16) : (mA.pad[0] === 48 && mA.pad[1] === 40);
      ok(et + ' medidas', padOk && mA.inpAlto === 48 && mA.inpLetra === 16 && mA.labGap === 8 && mA.primMin >= 54 && mA.tocMin >= 44 && mA.letraMin >= 12 && mA.sw <= W && !mA.excl && !mJ.excl, JSON.stringify(mA));
      await p.fill('#tel', '80955'); await p.click('#jugar'); await p.waitForTimeout(200);
      ok(et + ' teléfono corto rechazado', /10 dígitos/.test(await p.textContent('#telAyuda')) && !sim.llamadas.some(c => c.n === 'raspa_jugar'));
      await p.fill('#tel', ''); await p.type('#tel', '8095551234'); ok(et + ' formato teléfono', (await p.inputValue('#tel')) === '809-555-1234');
      await p.click('#jugar'); await p.waitForTimeout(500);
      const jug = sim.llamadas.find(c => c.n === 'raspa_jugar');
      ok(et + ' premio pedido al servidor antes de raspar', !!jug && jug.a.p_telefono === '8095551234' && !!(await p.$('#lienzo')) && jug.h.apikey && /^sb_publishable_/.test(jug.h.apikey));
      ok(et + ' premio oculto bajo la zona plateada', (await p.getAttribute('#premioDebajo', 'aria-hidden')) === 'true');
      // raspar con el dedo/ratón (Pointer Events): primero un poco (captura «jugando») y después casi todo
      const z = await p.$eval('#lienzo', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
      await p.mouse.move(z.x + 10, z.y + 20); await p.mouse.down();
      for (let k = 0; k <= 10; k++) await p.mouse.move(z.x + 10 + k * (z.w / 2) / 10, z.y + 20 + (k % 2) * 40, { steps: 2 });
      await p.mouse.up(); await p.waitForTimeout(100);
      await p.screenshot({ path: path.join(OUT, `publica-jugando-${W}${tema === 'dark' ? '-oscuro' : ''}.png`), fullPage: true });
      ok(et + ' raspar poco no revela', !!(await p.$('#lienzo:not(.fuera)')));
      await p.mouse.move(z.x + 2, z.y + 2); await p.mouse.down();
      for (let fila = 0; fila <= 6; fila++) { const y = z.y + 4 + fila * (z.h - 8) / 6; await p.mouse.move(z.x + (fila % 2 ? z.w - 4 : 4), y, { steps: 12 }); await p.mouse.move(z.x + (fila % 2 ? 4 : z.w - 4), y + 2, { steps: 12 }); }
      await p.mouse.up(); await p.waitForTimeout(1000);
      t = await p.textContent('.cupon');
      ok(et + ' raspar revela y muestra el premio', /Ganó 10 % de descuento/.test(t) && /BC-ACT7/.test(t) && /hasta 10 %/.test(t));
      ok(et + ' anuncio accesible', /10 % de descuento/.test(await p.textContent('#anuncio')));
      await p.screenshot({ path: path.join(OUT, `publica-jugada-${W}${tema === 'dark' ? '-oscuro' : ''}.png`), fullPage: true });
      // alternativa accesible «Descubrir premio» (teclado)
      await ir('f'.repeat(36)); await p.type('#tel', '8295550000'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
      await p.focus('#descubrir'); await p.keyboard.press('Enter'); await p.waitForTimeout(900);
      ok(et + ' «Descubrir premio» sin raspar', /Ganó 5 % de descuento/.test(await p.textContent('.cupon')));
      ok(et + ' sin errores de consola', errs.length === 0, errs.join(' | '));
      await ctx.close();
    }
  }
  // movimiento reducido: sin animación, revela al instante
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const sim = simPublico(); await ctx.route(/\/rest\/v1\/rpc\//, sim.ruta);
  const p = await ctx.newPage(); await p.goto(BASE + '/raspa.html?t=' + 'b'.repeat(36)); await p.waitForTimeout(300);
  await p.type('#tel', '8095551234'); await p.click('#jugar'); await p.waitForTimeout(300); await p.click('#descubrir'); await p.waitForTimeout(80);
  ok('[390 movimiento reducido] revela al instante', /Ganó 10 %/.test(await p.textContent('.cupon')));
  await ctx.close();
}

// ---------- Taller: hoja impresa y canje ----------
async function taller(b) {
  for (const W of [1280, 390]) {
    const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, deviceScaleFactor: 1 });
    await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => {
      const u = r.request().url();
      if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(S + '/supabase-stub.js', 'utf8') });
      if (/qrcodejs/.test(u)) return process.env.QRJS ? r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(process.env.QRJS, 'utf8') }) : r.continue();
      r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' });
    });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    await p.goto(BASE + '/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
    const et = `[taller ${W}]`;
    await p.evaluate(() => {
      sessionUser = { id: 'u1', nombre: 'Michelle', usuario: 'michelle', rol: 'admin', _tipo: 'usuario' }; document.body.classList.add('logged-in');
      document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
      document.querySelectorAll('.view.active').forEach(x => x.classList.remove('active')); document.getElementById('v-recepcion').classList.add('active');
      try { _rpInit(); } catch (e) {}
      window.__toasts = []; toast = (m, t) => window.__toasts.push((t === 'error' ? 'ERR: ' : 'OK: ') + m); toastError = m => window.__toasts.push('ERR: ' + m);
      window.__avisos = []; confirmar = async (m) => { window.__avisos.push(m); return true; }; logError = () => {};
      cache.configTaller = Object.assign(cache.configTaller || {}, { prefactura_desc_max_pct: 3 }); // tope general bajo: el premio debe pasar igual
      const A = (codigo, descripcion, precio, ex) => ({ codigo, descripcion, precio, niveles: { '1': precio }, existencias: { '1': ex } });
      cache.infoplusArticulos = [A('1085', 'PANTALLA IPHONE 11 INCELL', 1098, 3), A('1662', 'LAMINA HIDROGEL', 300, 20), A('2637', 'CELULAR SAMSUNG A15 128GB', 9500, 2), A('1582', 'TEMPLADO CRISTAL VARIADO', 119, 40), A('1021', 'CABLE USB TIPO C SAMSUNG', 156, 12)];
      const BD = window.__BD; BD.tablas.recepcion_prefacturas = [{ id: 'p0', codprefactura: '119000', total: 2000 }, { id: 'p1', codprefactura: '119500', total: 2650 }, { id: 'p2', codprefactura: '119501', total: 300 }]; BD.tablas.clientes = [];
      const RG = BD.raspa; const vence = new Date(Date.now() + 20 * 86400000).toISOString();
      RG.juegos.push({ token: '1'.repeat(36), codigo: 'BC-DIEZ', codprefactura: '119000', estado: 'jugado', premio: '10', telefono: '8095551234', vence_en: vence });
      RG.juegos.push({ token: '2'.repeat(36), codigo: 'BC-REGA', codprefactura: '118990', estado: 'jugado', premio: 'regalo', telefono: '8095551234', vence_en: vence });
      RG.juegos.push({ token: '5'.repeat(36), codigo: 'BC-CINC', codprefactura: '118991', estado: 'jugado', premio: '5', telefono: '8095551234', vence_en: vence });
      RG.juegos.push({ token: '3'.repeat(36), codigo: 'BC-PEND', codprefactura: '118995', estado: 'pendiente' });
      RG.juegos.push({ token: '4'.repeat(36), codigo: 'BC-VIEJ', codprefactura: '118000', estado: 'jugado', premio: '5', telefono: '8091110000', vence_en: new Date(Date.now() - 86400000).toISOString() });
      let num = 119600; supabaseClient.functions.invoke = async (fn, { body }) => fn === 'infoplus-prefactura-crear' ? { data: { ok: true, data: { message: 'Se ha creado correctamente', data: [{ codprefactura: String(body.codprefactura || ++num) }] } } } : { data: { ok: true } };
      _rpEnviarWhatsApp = async () => {};
      window.__item = (cod, cant) => { const a = _findInfoplusArt(cod); return { cod: a.codigo, desc: a.descripcion, niveles: a.niveles, precio: a.precio, cant: cant || 1 }; };
      window.__nueva = (cods, extra) => { _rpState = Object.assign({ items: cods.map(c => c === '1121' ? { cod: '1121', desc: 'Servicio: cambio de pantalla', precio: 800, cant: 1, servicio: true } : __item(c)), descMonto: 0, codcliente: '1', infoNombre: 'CLIENTE DE CONTADO', codprefactura: null, localId: null, estado: 'pendiente', nivel: 1 }, extra || {}); _rpRenderCart(); _rpRenderResumen(); };
    });

    // 1) Hoja impresa con cupón (carta y ticket)
    const hoja = await p.evaluate(async () => {
      const H = window.bcPfImprimirHtml, out = {};
      const doc = { num: '119500', total: 2650, model: { codlocalidad: '1', fecha: '2026-10-30', hora: '15:20:00', nombre: 'CONTADO MARIA PEREZ', descuentototal: 0, detallesPreFactura: [{ codarticulo: 1085, descripcion: 'PANTALLA IPHONE 11 INCELL', precio: 1098, cantidad: 1, porcentaje: 0 }, { codarticulo: 1662, descripcion: 'LAMINA HIDROGEL', precio: 300, cantidad: 1, porcentaje: 0 }, { codarticulo: 1121, descripcion: 'Servicio: cambio de pantalla', precio: 1252, cantidad: 1, porcentaje: 0 }], seriales: [] }, ref: {} };
      const d = H.datos(doc); const c = await H.raspaCupon(d);
      out.cupon = c && { codigo: c.codigo, url: c.url, qr: (c.qr || '').slice(0, 22), qrLargo: (c.qr || '').length };
      out.carta = H.conCupon(H.carta(d, false, true), c, 'carta', d); out.ticket = H.conCupon(H.ticket(d, false).replace(/<script>window\.onload[\s\S]*?<\/script>/, ''), c, 'ticket', d);
      // menor de RD$500 → sin cupón; apagado → sin cupón; falla del servidor → sin cupón y sin bloquear
      const d2 = H.datos(Object.assign({}, doc, { num: '119501', total: 300 })); out.menor = await H.raspaCupon(d2);
      localStorage.setItem('bc_raspa_off', '1'); const d3 = H.datos(Object.assign({}, doc, { num: '119777', total: 900 })); out.apagado = await H.raspaCupon(d3); localStorage.removeItem('bc_raspa_off');
      const rpcReal = supabaseClient.rpc; supabaseClient.rpc = () => Promise.reject(new Error('sin red')); const t0 = Date.now(); out.falla = await H.raspaCupon(H.datos(Object.assign({}, doc, { num: '119778' }))); out.fallaMs = Date.now() - t0;
      supabaseClient.rpc = () => new Promise(() => {}); const t1 = Date.now(); out.lento = await H.raspaCupon(H.datos(Object.assign({}, doc, { num: '119779' }))); out.lentoMs = Date.now() - t1; supabaseClient.rpc = rpcReal;
      // imprimir de verdad (ventana): la ventana se abre al momento y luego se llena con el cupón
      let escrito = ''; const ventana = { document: { open() { escrito = ''; }, write(h) { escrito += h; }, close() {} }, focus() {} };
      const abrirReal = window.open; let abiertas = 0; window.open = () => { abiertas++; return ventana; };
      _prefUltima = doc; localStorage.setItem('bc_pref_formato', 'carta'); const pr = imprimirPrefactura(); out.abiertaAntes = abiertas; await pr; window.open = abrirReal;
      out.ventana = { conCupon: /rg-cup/.test(escrito), conQr: /<img class="rg-qr" src="data:image\/png/.test(escrito), url: /raspa\.html\?t=/.test(c ? c.url : ''), autoPrint: /window\.print/.test(escrito) };
      return out;
    });
    ok(et + ' raspa_emitir al imprimir', !!hoja.cupon && /^BC-/.test(hoja.cupon.codigo) && /^https:\/\/bayolcell\.com\/raspa\.html\?t=[0-9a-f]{36}$/.test(hoja.cupon.url) && hoja.cupon.qr === 'data:image/png;base64,', JSON.stringify(hoja.cupon));
    ok(et + ' sin cupón: menor de RD$500, apagado, sin red, servidor lento', hoja.menor === null && hoja.apagado === null && hoja.falla === null && hoja.lento === null && hoja.fallaMs < 500 && hoja.lentoMs < 4500, `falla ${hoja.fallaMs} ms · lento ${hoja.lentoMs} ms`);
    ok(et + ' ventana abierta antes de esperar el cupón y llenada con QR', hoja.abiertaAntes === 1 && hoja.ventana.conCupon && hoja.ventana.conQr && hoja.ventana.autoPrint, JSON.stringify(hoja.ventana));
    if (W === 1280) {
      const pc = await ctx.newPage(); await pc.setViewportSize({ width: 816, height: 1056 }); await pc.setContent(hoja.carta, { waitUntil: 'load' }); await pc.waitForTimeout(200);
      await pc.screenshot({ path: path.join(OUT, 'hoja-carta-con-cupon.png'), fullPage: true }); await pc.pdf({ path: path.join(OUT, 'hoja-carta-con-cupon.pdf'), format: 'Letter', printBackground: true });
      const color = await pc.evaluate(() => { const malos = []; document.querySelectorAll('.rg *, .rg').forEach(e => { const cs = getComputedStyle(e); [cs.color, cs.borderTopColor].forEach(c => { const m = c.match(/\d+/g); if (m && !(m[0] === m[1] && m[1] === m[2])) malos.push(c); }); }); return { malos, texto: document.querySelector('.rg-cup').innerText }; });
      ok('[hoja] cupón en blanco y negro con tijera, código y regla', color.malos.length === 0 && /RASPE Y GANE/i.test(color.texto) && /Se activa al pagar esta compra en caja · un juego por compra · vence a los 30 días/.test(color.texto) && !/!/.test(color.texto), color.malos.join(','));
      await pc.setViewportSize({ width: 302, height: 900 }); await pc.setContent(hoja.ticket, { waitUntil: 'load' }); await pc.waitForTimeout(200);
      await pc.screenshot({ path: path.join(OUT, 'hoja-ticket-con-cupon.png'), fullPage: true });
      ok('[hoja] ticket 80 mm con cupón', await pc.evaluate(() => !!document.querySelector('.rg-t .rg-qr') && document.documentElement.scrollWidth <= 302));
      await pc.close();
    }

    // 2) Canje con 10 %: pantalla 5 %, lámina 10 %, celular «No aplica», servicio 10 %
    await p.evaluate(() => __nueva(['1085', '1662', '2637', '1121']));
    await p.click('.bcrg-pild'); await p.waitForSelector('#bcRg .bcrg-win'); await p.waitForTimeout(350);
    await p.fill('#bcRgQ', 'bc-diez'); await p.click('#bcRg .bcrg-buscar button'); await p.waitForTimeout(300);
    const lin = await p.$$eval('#bcRg .bcrg-lin .r', rs => rs.map(r => r.querySelector('.d em').textContent.replace('Cód. ', '') + '=' + r.querySelector('.p').textContent));
    ok(et + ' canje 10 %: % por línea', lin.join(',') === '1085=5 %,1662=10 %,2637=No aplica,1121=10 %', lin.join(','));
    const med = await p.evaluate(() => {
      const q = s => document.querySelector(s), bx = e => e.getBoundingClientRect(), vis = e => e.offsetParent !== null;
      const cu = getComputedStyle(q('#bcRg .bcrg-cuerpo')), inp = q('#bcRgQ'), lab = q('#bcRg label[for="bcRgQ"]');
      const toc = [...document.querySelectorAll('#bcRg button')].filter(vis).map(e => Math.round(bx(e).height));
      const lbl = [...document.querySelectorAll('#bcRg label')].map(l => getComputedStyle(l).textTransform);
      return { pad: [parseFloat(cu.paddingTop), parseFloat(cu.paddingLeft)], inp: [Math.round(bx(inp).height), parseFloat(getComputedStyle(inp).fontSize)], labGap: Math.round(bx(inp).top - bx(lab).bottom),
        b1: Math.round(bx(q('#bcRg .bcrg-b1')).height), tocMin: Math.min(...toc), x: Math.round(bx(q('#bcRg .bcrg-x')).width), sw: document.documentElement.scrollWidth, mayus: lbl.some(t => t === 'uppercase'),
        grupo: Math.round(bx(q('#bcRgRes')).top - bx(q('#bcRg .bcrg-buscar')).bottom), excl: /!/.test(q('#bcRg').innerText) };
    });
    const padOk = W < 600 ? med.pad[0] === 24 && med.pad[1] === 16 : med.pad[0] === 48 && med.pad[1] === 40;
    ok(et + ' ventana: medidas', padOk && med.inp[0] === 48 && med.inp[1] === 16 && med.labGap === 8 && med.b1 >= 54 && med.tocMin >= 44 && med.x >= 44 && med.grupo === 24 && !med.mayus && !med.excl && med.sw <= W, JSON.stringify(med));
    await p.screenshot({ path: path.join(OUT, `canje-10-${W}.png`) });
    await p.click('#bcRg [data-acc="aplicar"]'); await p.waitForTimeout(250);
    const ap = await p.evaluate(() => ({ pct: _rpState.items.map(i => i.cod + '=' + (i.descPct || 0)).join(','), raspa: _rpState.raspa, probs: _rpProblemasFactura(), sinGancho: _rpTotales(_rpState.items).descuento }));
    ok(et + ' aplicar 10 %', ap.pct === '1085=5,1662=10,2637=0,1121=10' && ap.raspa && ap.raspa.codigo === 'BC-DIEZ' && Math.abs(ap.raspa.ahorro - (54.9 + 30 + 80)) < 0.01, ap.pct + ' ahorro ' + (ap.raspa && ap.raspa.ahorro));
    ok(et + ' el premio no choca con el tope general (3 %)', ap.probs.length === 0, ap.probs.join(' | '));
    const tope = await p.evaluate(() => { _rpState.descMonto = 500; const pr = _rpProblemasFactura(); _rpState.descMonto = 0; return pr; });
    ok(et + ' el tope general sigue para el resto del descuento', tope.some(x => /supera el tope/.test(x)));
    await p.screenshot({ path: path.join(OUT, `canje-10-aplicado-${W}.png`) });
    await p.click('#bcRg .bcrg-x'); await p.waitForTimeout(150);
    await p.evaluate(() => _rpGuardar(false)); await p.waitForTimeout(400);
    const cj = await p.evaluate(() => { const j = __BD.raspa.juegos.find(x => x.codigo === 'BC-DIEZ'); return { estado: j.estado, en: j.usado_codprefactura, por: j.usado_por, toasts: __toasts.slice(-3) }; });
    ok(et + ' guardar → raspa_canjear', cj.estado === 'usado' && /^1196\d\d$/.test(cj.en) && cj.toasts.some(t => /marcado como usado/.test(t)), JSON.stringify(cj));

    // 3) Ya usado (con prefactura, fecha y cajera)
    await p.evaluate(() => __nueva(['1662']));
    await p.click('.bcrg-pild'); await p.waitForSelector('#bcRg .bcrg-win'); await p.fill('#bcRgQ', 'BC-DIEZ'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    let tx = await p.textContent('#bcRgRes'); ok(et + ' ya usado', /Ya usado/.test(tx) && new RegExp('prefactura Nº ' + cj.en).test(tx) && /Michelle/.test(tx), tx.slice(0, 120));
    await p.screenshot({ path: path.join(OUT, `canje-usado-${W}.png`) });
    // 4) Vencido
    await p.fill('#bcRgQ', 'BC-VIEJ'); await p.keyboard.press('Enter'); await p.waitForTimeout(300); tx = await p.textContent('#bcRgRes'); ok(et + ' vencido', /Vencido/.test(tx));
    // 5) Accesorio gratis: el cliente escoge el cable 1021
    await p.fill('#bcRgQ', 'BC-REGA'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    await p.click('#bcRg [data-reg="1021"]'); await p.waitForTimeout(100);
    await p.screenshot({ path: path.join(OUT, `canje-regalo-${W}.png`) });
    await p.click('#bcRg [data-acc="aplicar"]'); await p.waitForTimeout(200);
    const rg = await p.evaluate(() => { const l = _rpState.items[_rpState.items.length - 1]; return { cod: l.cod, pct: l.descPct, cant: l.cant, total: _rpTotales(_rpState.items).total, probs: _rpProblemasFactura(), raspa: _rpState.raspa }; });
    ok(et + ' accesorio gratis', rg.cod === '1021' && rg.pct === 100 && rg.cant === 1 && rg.total === 300 && rg.probs.length === 0 && rg.raspa.premio === 'regalo', JSON.stringify(rg));
    await p.click('#bcRg [data-acc="quitar"]'); await p.waitForTimeout(150);
    ok(et + ' quitar premio', await p.evaluate(() => _rpState.items.length === 1 && !_rpState.raspa && !(_rpState.items[0].descPct)));
    // 6) Misma compra
    await p.evaluate(() => { const j = __BD.raspa.juegos.find(x => x.codigo === 'BC-REGA'); __nueva(['1662'], { codprefactura: j.codprefactura, estado: 'sincronizada' }); });
    await p.fill('#bcRgQ', 'BC-REGA'); await p.keyboard.press('Enter'); await p.waitForTimeout(300); tx = await p.textContent('#bcRgRes');
    ok(et + ' misma compra', /Es de esta misma compra/.test(tx) && !(await p.$('#bcRg [data-acc="aplicar"]')));
    await p.screenshot({ path: path.join(OUT, `canje-misma-compra-${W}.png`) });
    // 7) Compra con celular solamente: «No aplica» y botón apagado
    await p.evaluate(() => __nueva(['2637']));
    await p.fill('#bcRgQ', '809-555-1234'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    tx = await p.textContent('#bcRgRes'); const lista = await p.$$('#bcRg .bcrg-item');
    ok(et + ' búsqueda por teléfono: lista de vigentes', lista.length === 2 && /BC-REGA/.test(tx) && /BC-CINC/.test(tx) && !/BC-DIEZ/.test(tx), 'premios vigentes: ' + lista.length);
    if (W === 1280) await p.screenshot({ path: path.join(OUT, 'canje-telefono-1280.png') });
    await p.click('#bcRg .bcrg-item:last-child'); await p.waitForTimeout(250);
    ok(et + ' elegir de la lista', /BC-CINC/.test(await p.textContent('#bcRgRes')) && /Vigente/.test(await p.textContent('#bcRgRes')));
    await p.fill('#bcRgQ', 'https://bayolcell.com/raspa.html?t=' + '1'.repeat(36)); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    ok(et + ' búsqueda por QR', /BC-DIEZ/.test(await p.textContent('#bcRgRes')));
    await p.evaluate(() => { const j = __BD.raspa.juegos.find(x => x.codigo === 'BC-DIEZ'); Object.assign(j, { estado: 'jugado', usado_codprefactura: null }); });
    await p.fill('#bcRgQ', 'BC-DIEZ'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    tx = await p.textContent('#bcRgRes');
    ok(et + ' compra con celular: «No aplica»', /2637/.test(tx) && /No aplica/.test(tx) && await p.$eval('#bcRg [data-acc="aplicar"]', b => b.disabled), tx.slice(0, 160));
    await p.screenshot({ path: path.join(OUT, `canje-celular-${W}.png`) });
    // 8) Pendiente → «Activar con factura»
    await p.fill('#bcRgQ', 'BC-PEND'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    await p.fill('#bcRgFac', 'FAC-55021'); await p.click('#bcRg [data-acc="activar"]'); await p.waitForTimeout(300);
    ok(et + ' activar con factura', await p.evaluate(() => __BD.raspa.juegos.find(x => x.codigo === 'BC-PEND').estado === 'activo') && /Sin raspar/.test(await p.textContent('#bcRgRes')));
    // 9) Canje que falla al guardar (otro lo usó mientras tanto): aviso que no se cierra solo
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    ok(et + ' Escape cierra la ventana', !(await p.$('#bcRg')));
    await p.evaluate(() => __nueva(['1662', '1121']));
    await p.click('.bcrg-pild'); await p.waitForSelector('#bcRg .bcrg-win'); await p.fill('#bcRgQ', 'BC-DIEZ'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    await p.click('#bcRg [data-acc="aplicar"]'); await p.waitForTimeout(150); await p.click('#bcRg .bcrg-x');
    await p.evaluate(() => { const j = __BD.raspa.juegos.find(x => x.codigo === 'BC-DIEZ'); Object.assign(j, { estado: 'usado', usado_codprefactura: '119999', usado_en: new Date().toISOString(), usado_por: 'Kenifer' }); __avisos.length = 0; });
    await p.evaluate(() => _rpGuardar(false)); await p.waitForTimeout(400);
    const av = await p.evaluate(() => __avisos.slice());
    ok(et + ' canje rechazado: aviso claro', av.length === 1 && /NO quedó marcado como usado/.test(av[0]) && /119999/.test(av[0]), (av[0] || '').slice(0, 140));
    ok(et + ' sin errores de consola', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
}

(async () => {
  const b = await chromium.launch();
  try { await publico(b); await taller(b); } catch (e) { fallos++; R.push('FALLO excepción: ' + (e && e.stack || e)); }
  await b.close();
  console.log(R.join('\n')); console.log((fallos ? fallos + ' fallo(s)' : 'Todo OK') + ' · capturas en ' + OUT);
  process.exit(fallos ? 1 : 0);
})();
