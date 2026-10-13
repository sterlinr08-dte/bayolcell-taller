// Prueba del catálogo web (catalogo.html) con los servicios simulados (sin tocar Supabase).
// Uso: NODE_PATH=/opt/node22/lib/node_modules node tests/catalogo-web/catalogo.test.cjs [carpetaCapturas] [celulares.json real opcional]
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const RAIZ = path.resolve(__dirname, '../..');
const SALIDA = process.argv[2] || path.join(__dirname, 'salida');
const REAL = process.argv[3];
const CEL = REAL ? JSON.parse(fs.readFileSync(REAL, 'utf8')) : { ok: true, publicado: true, tienda: { nombre: 'BAYOL CELL', telefono: '' }, items: [
  { codigo: '1', nombre: 'IPHONE 15 PRO MAX 256GB', foto_url: '', capacidad: '256GB', color: '', precio: 62000, disponible: true },
  { codigo: '2', nombre: 'CELULAR SAMSUNG A15 128GB', foto_url: '', capacidad: '128GB + 4GB RAM', color: '', precio: 9500, disponible: true },
  { codigo: '3', nombre: 'Redmi Note 14', foto_url: '', capacidad: '256GB', color: '', precio: 11500, disponible: false },
  { codigo: '4', nombre: 'MOTO G24', foto_url: '', capacidad: '128GB', color: '', precio: 7800, disponible: true } ] };
// Simula pantallas-publico: devuelve solo {nombre, calidad, precio}; la OLED solo si se busca «oled».
const PANT = [
  { nombre: 'iPhone 11 Pro Max', calidad: 'Calidad certificada', precio: 2500 },
  { nombre: 'iPhone 11 Pro Max', calidad: 'Calidad Soft OLED', precio: 4000 },
  { nombre: 'iPhone 11', calidad: 'Calidad certificada', precio: 2000 },
  { nombre: 'Samsung A10s', calidad: 'Original', precio: 1500 } ];
function pantallas(q) {
  const p = q.toLowerCase().split(/\s+/).filter(w => w && w !== 'oled'), oled = /oled/i.test(q);
  if (q.replace(/\s/g, '').length < 2) return [];
  return PANT.filter(x => p.every(w => x.nombre.toLowerCase().includes(w)) && (oled || !/oled/i.test(x.calidad))).slice(0, 6);
}
function servidor() {
  return new Promise(res => { const s = http.createServer((req, r) => {
    const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(RAIZ, u === '/' ? 'catalogo.html' : u);
    if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    const t = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp' };
    r.writeHead(200, { 'content-type': t[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0, '127.0.0.1', () => res(s)); });
}
async function preparar(page, base, llamadas) {
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith(base)) return route.continue();
    if (url.includes('/functions/v1/catalogo-publico')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CEL) });
    if (url.includes('/functions/v1/pantallas-publico')) { const q = JSON.parse(route.request().postData() || '{}').q || ''; llamadas.push(q); return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, items: pantallas(q) }) }); }
    if (REAL && process.env.FOTOS_DIR) { // fotos reales (bajadas antes) solo para las capturas
      const f = path.join(process.env.FOTOS_DIR, require('crypto').createHash('sha1').update(url).digest('hex'));
      if (fs.existsSync(f)) return route.fulfill({ status: 200, contentType: /\.webp/i.test(url) ? 'image/webp' : /\.png/i.test(url) ? 'image/png' : 'image/jpeg', body: fs.readFileSync(f) });
    }
    return route.abort();
  });
}
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const srv = await servidor(), base = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errores = []; let ok = 0; const prueba = async (n, fn) => { await fn(); ok++; console.log('PASS', n); };
  try {
    for (const [w, h, nom, movil] of [[1280, 900, 'pc', false], [390, 844, 'cel', true]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: movil ? 2 : 1, isMobile: movil, hasTouch: movil });
      const page = await ctx.newPage(); const llamadas = [];
      page.on('pageerror', e => errores.push(nom + ': ' + e));
      await preparar(page, base, llamadas);
      await page.goto(base + 'catalogo.html');
      await page.waitForSelector('.card');
      await page.waitForTimeout(REAL ? 2500 : 300);
      await page.screenshot({ path: path.join(SALIDA, nom + '-inicio.png') });
      await prueba(nom + ': no se sale de la pantalla (sin desplazamiento horizontal)', async () => {
        const sobra = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert.ok(sobra <= 1, 'sobra ' + sobra + 'px');
      });
      await prueba(nom + ': celulares con nombres limpios y solo disponibles', async () => {
        const t = await page.$$eval('.card h3', e => e.map(x => x.textContent));
        assert.ok(t.length > 0 && !t.some(x => /^CELULAR /i.test(x)), t.join(','));
        assert.ok(!(await page.$('.card.agotado')), 'salió un agotado con el filtro activo');
      });
      await prueba(nom + ': destacado del héroe', async () => { assert.ok(await page.isVisible('#dest')); assert.ok((await page.textContent('#destPrecio')).includes('RD$')); });
      await page.click('.card .mas'); await page.click('.card .mas');
      await prueba(nom + ': carrito con 2 y total', async () => {
        assert.strictEqual(await page.textContent(movil ? '#barraN' : '#carritoN'), '2');
        const ls = await page.evaluate(() => JSON.parse(localStorage.getItem('bayol_cat_cart'))); assert.ok(Object.values(ls)[0].qty === 2);
      });
      await page.click(movil ? '#barraPedido' : '#btnCarrito'); await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SALIDA, nom + '-pedido.png') });
      await page.click('#cerrarHoja'); await page.waitForTimeout(300);
      // pantallas
      await page.click('#tabPan'); await page.fill('#qPan', '11 pro max'); await page.waitForTimeout(700);
      await page.locator('#catalogo').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SALIDA, nom + '-pantallas.png') });
      await prueba(nom + ': pantallas solo por búsqueda, sin «Incell» y sin OLED si no la pide', async () => {
        const txt = await page.textContent('#resPan');
        assert.ok(/IPHONE 11 PRO MAX/i.test(txt) && /2,500/.test(txt) && /Calidad certificada/.test(txt), txt);
        assert.ok(!/incell/i.test(txt) && !/OLED/.test(txt) && !/4,000/.test(txt), txt);
        assert.ok(llamadas.every(q => q.replace(/\s/g, '').length >= 2), 'se pidió sin búsqueda: ' + llamadas.join('|'));
      });
      await page.fill('#qPan', 'iphone 11 oled'); await page.waitForTimeout(700);
      await prueba(nom + ': la Soft OLED sale solo si el cliente la busca', async () => { assert.ok(/Calidad Soft OLED/.test(await page.textContent('#resPan'))); });
      await prueba(nom + ': el botón de agendar lleva el modelo y el precio', async () => {
        await page.fill('#qPan', '11 pro max'); await page.waitForTimeout(700);
        const href = await page.getAttribute('#resPan .go', 'href'); const msg = decodeURIComponent(href.split('text=')[1]);
        assert.ok(href.startsWith('https://wa.me/18495644791') && /iPhone 11 Pro Max/.test(msg) && /RD\$2,500/.test(msg) && !/incell/i.test(msg), msg);
      });
      await page.fill('#qPan', 'nokia 3310'); await page.waitForTimeout(700);
      await prueba(nom + ': modelo que no está → invita a escribir por WhatsApp', async () => { assert.ok(/No encontramos/.test(await page.textContent('#resPan'))); });
      await page.click('#tabCel'); await page.locator('#tiendas').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SALIDA, nom + '-tiendas.png') });
      await prueba(nom + ': 3 tiendas con estado', async () => { assert.strictEqual(await page.$$eval('.tienda', e => e.length), 3); });
      await ctx.close();
    }
    // servicio de pantallas caído → mensaje amable
    const p2 = await browser.newPage(); await p2.route('**/*', r => { const u = r.request().url(); if (u.startsWith(base)) return r.continue(); if (u.includes('catalogo-publico')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CEL) }); if (u.includes('pantallas-publico')) return r.fulfill({ status: 404, body: 'no' }); return r.abort(); });
    p2.on('pageerror', e => errores.push('caido: ' + e));
    await p2.goto(base + 'catalogo.html#pantallas'); await p2.fill('#qPan', 'iphone 11'); await p2.waitForTimeout(700);
    await prueba('si el servicio de pantallas no responde, invita a WhatsApp', async () => { assert.ok(/no podemos mostrar el precio/.test(await p2.textContent('#resPan'))); });
    await prueba('sin errores de JavaScript', async () => { assert.deepStrictEqual(errores, []); });
  } catch (e) { console.error('FAIL', e.message); process.exitCode = 1; }
  finally { await browser.close(); srv.close(); console.log(`${ok} pruebas OK`); }
})();
