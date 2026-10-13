// Prueba de la capa crm-cotizar-pantalla.js con datos simulados (sin red ni base real).
// Uso: node tests/cotizar-pantalla/cotizar.test.cjs [carpetaCapturas]
// Requiere Playwright (NODE_PATH=/opt/node22/lib/node_modules si no está instalado en el repo).
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const RAIZ = path.resolve(__dirname, '../..');
const SALIDA = process.argv[2] || path.join(__dirname, 'salida');
const COSTO_TRAMPA = 12345; // si este número aparece en algún lado, la capa filtró el costo

const ARTICULOS = [
  { codigo: '2155', descripcion: 'PANTALLA IPHONE 11 PRO MAX ZY INCELL', costo: COSTO_TRAMPA, precio_especial: 1800, niveles: { 1: 2500, 2: 1800, 3: 1700 } },
  { codigo: '2156', descripcion: 'PANTALLA IPHONE 11 PRO MAX OLED', costo: COSTO_TRAMPA, niveles: { 1: 4000, 2: 3200 } },
  { codigo: '2901', descripcion: 'PANTALLA IPHONE 15 PRO ZY INCELL', costo: COSTO_TRAMPA, niveles: { 1: 6500, 2: 5000 } },
  { codigo: '3001', descripcion: 'PANTALLA IPHONE 13 OLED ORIGINAL', costo: COSTO_TRAMPA, niveles: { 1: 9000, 2: 7000 } },
  { codigo: '1500', descripcion: 'PANTALLA SAMSUNG A10S SM-A107 ORIGINAL NEGRA', costo: COSTO_TRAMPA, niveles: { 1: 1500, 2: 900 } },
  { codigo: '1639', descripcion: 'PANTALLA MOTO E6 XT2005 NEGRA', costo: COSTO_TRAMPA, niveles: {}, precio: 1200 },
  { codigo: '1335', descripcion: 'PANTALLA REDMI NOTE 8 ORIGINAL', costo: COSTO_TRAMPA, niveles: { 1: 1200 } },
  { codigo: '1488', descripcion: 'PANTALLA ALCATEL 1X 5059 5059Y 5059D 5059A', costo: COSTO_TRAMPA, niveles: { 1: 1200 } },
  { codigo: '9001', descripcion: 'MICA GLASS IPHONE 11 PRO MAX', costo: 50, niveles: { 1: 300 } },
  { codigo: '9002', descripcion: 'FLEX DE CARGA PANTALLA SAMSUNG A10', costo: 80, niveles: { 1: 400 } },
  { codigo: '9003', descripcion: 'PANTALLA HUAWEI Y9 SIN PRECIO', costo: 500, niveles: { 1: 0 } }
];

const HARNESS = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:system-ui;background:#efeae2}#waWrap{height:100vh;display:flex;flex-direction:column}#waDetalle{flex:1;display:flex;flex-direction:column;justify-content:flex-end}
.wa-input-bar{display:flex;gap:6px;align-items:center;padding:10px;background:#f0f2f5}.wa-icon-btn{width:40px;height:40px;border:0;background:transparent;font-size:22px;cursor:pointer}
#waTexto{flex:1;padding:10px;border-radius:20px;border:0}.wa-acciones-menu{position:fixed;display:none;flex-direction:column;background:#fff;border-radius:12px;box-shadow:0 8px 30px #0003;z-index:500;min-width:220px}
.wa-acciones-menu button{border:0;background:#fff;text-align:left;padding:9px 14px;height:38px;font-size:14px}</style></head><body>
<div id="waWrap"><div id="waDetalleCol"><div id="waDetalle" style="height:calc(100vh - 0px)"><div style="flex:1"></div>
<div class="wa-input-bar" id="waInputBar"><button class="wa-icon-btn" id="btnWaEmoji">☺</button><button class="wa-icon-btn" id="btnWaAdjuntar" onclick="_waAbrirMenuAdjuntar(event)">📎</button><button class="wa-icon-btn" id="btnWaUbicacion">📍</button><textarea id="waTexto" rows="1"></textarea><button id="btnWaEnviar">➤</button></div></div></div></div>
<script>
let _waHiloId = 'hilo-1';
let cache = { infoplusArticulos: ${JSON.stringify(ARTICULOS)} };
function _catPrecioN1(c){ const a = cache.infoplusArticulos.find(x => String(x.codigo) === String(c)); if(!a) return 0; if(a.niveles && a.niveles['1'] != null && a.niveles['1'] !== '') return Number(a.niveles['1'])||0; return Number(a.precio)||0; }
async function _ensureInfoplusArticulos(){ window.__ensure = (window.__ensure||0)+1; }
function _waActualizarBotonEnvio(){}
function toast(m){ window.__toasts=(window.__toasts||[]).concat(m); } function toastError(m){ toast('ERR:'+m); }
function _waCerrarFlotantesDelChat(){ const m=document.getElementById('waAdjuntarMenu'); if(m) m.style.display='none'; }
function _waAbrirMenuAdjuntar(ev){ ev.stopPropagation(); let menu=document.getElementById('waAdjuntarMenu'); if(!menu){ menu=document.createElement('div'); menu.id='waAdjuntarMenu'; menu.className='wa-acciones-menu';
  menu.innerHTML='<button>Foto</button><button>Documento</button><button>Cámara</button><button>Ubicación</button><button>Ubicación de la tienda</button><button>Contacto</button><button>Contactos de sucursales</button>'; document.body.appendChild(menu); }
  menu.style.display='flex'; const r=ev.currentTarget.getBoundingClientRect(); menu.style.top=(r.top-7*38-18)+'px'; menu.style.left=r.left+'px'; }
window._waAdjuntoSeleccionado = function(input, tipo){ const f = input.files[0]; window.__adj = { nombre: f.name, type: f.type, size: f.size, tipo, caption: document.getElementById('waTexto').value }; };
</script><script src="/crm-cotizar-pantalla.js"></script></body></html>`;

function servidor() {
  return new Promise(res => {
    const s = http.createServer((req, r) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      if (u === '/' || u === '/harness.html') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return r.end(HARNESS); }
      const f = path.join(RAIZ, u); if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
      const tipos = { '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };
      r.writeHead(200, { 'content-type': tipos[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, '127.0.0.1', () => res(s));
  });
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const srv = await servidor(); const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errores = []; let ok = 0; const prueba = (n, fn) => fn().then(() => { ok++; console.log('PASS', n); });
  try {
    // ---------- PC ----------
    const pc = await browser.newPage({ viewport: { width: 1280, height: 860 } });
    pc.on('pageerror', e => errores.push(String(e)));
    await pc.route(/^(?!http:\/\/127\.0\.0\.1).*/, r => r.abort());
    await pc.goto(base);
    await prueba('nombres limpios', async () => {
      const n = await pc.evaluate(() => ['PANTALLA IPHONE 11 PRO MAX ZY INCELL', 'PANTALLA SAMSUNG A10S SM-A107 ORIGINAL NEGRA', 'PANTALLA ALCATEL 1X 5059 5059Y 5059D 5059A', 'PANTALLA MOTO E6 XT2005 NEGRA', 'PANTALLA REDMI NOTE 8 ORIGINAL'].map(BcCotizarPantalla.nombreLimpio));
      assert.deepStrictEqual(n, ['iPhone 11 Pro Max', 'Samsung A10s', 'Alcatel 1X 5059', 'Moto E6', 'Redmi Note 8']);
    });
    await prueba('lista sin micas, flex ni precios en cero; sin costo', async () => {
      const l = await pc.evaluate(() => BcCotizarPantalla.pantallas().map(x => x.nombre + '|' + x.tipo + '|' + x.precio));
      assert.ok(!l.some(x => /mica|glass|flex|huawei/i.test(x)), l.join(','));
      assert.strictEqual(l.length, 8);
      assert.ok(l.includes('iPhone 11 Pro Max|Calidad certificada|2500') && l.includes('iPhone 11 Pro Max|OLED · parecida a la original|4000') && l.includes('Moto E6||1200'));
    });
    await prueba('botón en la barra (PC)', async () => { assert.ok(await pc.$('#btnWaCotizar')); });
    await pc.click('#btnWaCotizar');
    await pc.waitForSelector('#bcCot.on .it');
    await pc.fill('#bcCotQ', '11 pro');
    await pc.waitForTimeout(150);
    await pc.screenshot({ path: path.join(SALIDA, 'pc-buscador.png') });
    await prueba('búsqueda «11 pro» → certificada y OLED, sin decir «Incell»', async () => {
      const t = await pc.$$eval('#bcCot .it', b => b.map(x => x.innerText.replace(/\s+/g, ' ')));
      assert.strictEqual(t.length, 2, t.join(' | '));
      assert.ok(t.some(x => /Calidad certificada/.test(x) && /2,500/.test(x)) && t.some(x => /OLED/.test(x) && /4,000/.test(x)), t.join(' | '));
      assert.ok(!t.some(x => /incell/i.test(x)));
    });
    await pc.fill('#bcCotQ', '');
    await pc.click('#bcCot [data-f="Samsung"]');
    await prueba('filtro Samsung', async () => {
      const t = await pc.$$eval('#bcCot .it', b => b.map(x => x.innerText));
      assert.strictEqual(t.length, 1); assert.ok(/Samsung A10s/.test(t[0]));
    });
    await pc.click('#bcCot [data-f="Todas"]'); await pc.fill('#bcCotQ', '11 pro max certificada');
    await pc.click('#bcCot .it');
    await pc.waitForTimeout(600);
    await pc.screenshot({ path: path.join(SALIDA, 'pc-tarjeta.png') });
    await prueba('el costo nunca aparece en pantalla', async () => {
      const txt = await pc.evaluate(() => document.body.innerText);
      assert.ok(!/12[,.]?345/.test(txt) && !/1[,.]?800/.test(txt), 'apareció el costo o el por mayor');
      assert.ok(!/incell/i.test(txt), 'apareció la palabra Incell');
    });
    await pc.click('#bcCot [data-a="enviar"]');
    await pc.waitForFunction(() => window.__adj);
    await prueba('envía una foto JPG por el envío de siempre, con texto', async () => {
      const a = await pc.evaluate(() => window.__adj);
      assert.strictEqual(a.tipo, 'imagen'); assert.strictEqual(a.type, 'image/jpeg'); assert.ok(a.size > 30000, 'imagen muy pequeña');
      assert.ok(/iphone-11-pro-max/.test(a.nombre)); assert.ok(/RD\$2,500/.test(a.caption) && !/12,345/.test(a.caption), a.caption);
      assert.ok(/calidad certificada/.test(a.caption) && !/incell/i.test(a.caption), a.caption);
      assert.ok(!/OLED|4,000/.test(a.caption), 'la OLED no se ofrece sola: ' + a.caption);
      assert.ok(!(await pc.$('#bcCot.on')), 'el modal debió cerrarse');
    });
    await prueba('candado: rechaza campos extra (costo)', async () => {
      const e = await pc.evaluate(() => { try { BcCotizarPantalla.pintarTarjeta(document.createElement('canvas'), { codigo: '1', nombre: 'X', tipo: '', precio: 10, costo: 5 }); return ''; } catch (err) { return err.message; } });
      assert.ok(/no permitido/.test(e), e);
    });
    await prueba('si cambian de chat, no envía al chat equivocado', async () => {
      await pc.evaluate(() => { window.__adj = null; document.getElementById('waTexto').value = ''; });
      await pc.click('#btnWaCotizar'); await pc.waitForSelector('#bcCot.on .it'); await pc.click('#bcCot .it');
      await pc.evaluate(() => { _waHiloId = 'hilo-2'; });
      await pc.click('#bcCot [data-a="enviar"]'); await pc.waitForTimeout(400);
      assert.strictEqual(await pc.evaluate(() => window.__adj), null);
      await pc.evaluate(() => { _waHiloId = 'hilo-1'; });
    });
    // tarjetas de muestra para el dueño
    for (const [i, c] of [[1, { codigo: '2155', nombre: 'iPhone 11 Pro Max', tipo: 'Calidad certificada', precio: 2500 }], [4, { codigo: '2156', nombre: 'iPhone 11 Pro Max', tipo: 'OLED · parecida a la original', precio: 4000 }], [2, { codigo: '1500', nombre: 'Samsung A10s', tipo: 'Original', precio: 1500 }], [3, { codigo: '1335', nombre: 'Redmi Note 8', tipo: 'Original', precio: 1200 }]]) {
      const data = await pc.evaluate(async c => { const r = await BcCotizarPantalla.recursos(); const cv = BcCotizarPantalla.pintarTarjeta(document.createElement('canvas'), c, r); return cv.toDataURL('image/png'); }, c);
      fs.writeFileSync(path.join(SALIDA, 'tarjeta-' + i + '.png'), Buffer.from(data.split(',')[1], 'base64'));
    }
    // ---------- celular ----------
    const cel = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    cel.on('pageerror', e => errores.push(String(e)));
    await cel.route(/^(?!http:\/\/127\.0\.0\.1).*/, r => r.abort());
    await cel.goto(base);
    await prueba('celular: sin botón extra en la barra', async () => { assert.strictEqual(await cel.$('#btnWaCotizar'), null); });
    await cel.click('#btnWaAdjuntar');
    await cel.waitForTimeout(200);
    await cel.screenshot({ path: path.join(SALIDA, 'cel-menu-clip.png') });
    await prueba('celular: «Cotizar pantalla» en el menú del clip, dentro de la pantalla', async () => {
      const b = await cel.$('#waAdjuntarMenu [data-bc-cotizar]'); assert.ok(b);
      const r = await cel.$eval('#waAdjuntarMenu', m => m.getBoundingClientRect().toJSON()); assert.ok(r.top >= 0 && r.bottom <= 844, JSON.stringify(r));
    });
    await cel.click('#waAdjuntarMenu [data-bc-cotizar]');
    await cel.waitForSelector('#bcCot.on .it');
    await cel.screenshot({ path: path.join(SALIDA, 'cel-buscador.png') });
    await cel.fill('#bcCotQ', 'note 8'); await cel.click('#bcCot .it'); await cel.waitForTimeout(600);
    await cel.screenshot({ path: path.join(SALIDA, 'cel-tarjeta.png') });
    await prueba('celular: la hoja no se sale de la pantalla', async () => {
      const r = await cel.$eval('#bcCot .cs', e => e.getBoundingClientRect().toJSON()); assert.ok(r.left >= 0 && r.right <= 390.5 && r.top >= 0, JSON.stringify(r));
    });
    await prueba('sin errores de JavaScript', async () => { assert.deepStrictEqual(errores, []); });
  } catch (e) { console.error('FAIL', e.message); process.exitCode = 1; }
  finally { await browser.close(); srv.close(); console.log(`${ok} pruebas OK`); }
})();
