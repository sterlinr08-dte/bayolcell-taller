// Genera el catálogo: una imagen PNG por página (1080×1350, para carrusel de Instagram/WhatsApp) y un PDF.
// Uso:  node render.js [datos.json]      (por defecto catalogo.json; si no existe, ejemplo-datos.json)
// Requiere Playwright. Si Chromium no está en la ruta por defecto: CHROMIUM_PATH=/ruta/a/chrome node render.js
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const dir = __dirname;
  const arch = process.argv[2] || (fs.existsSync(path.join(dir, 'catalogo.json')) ? 'catalogo.json' : 'ejemplo-datos.json');
  const datos = JSON.parse(fs.readFileSync(path.join(dir, arch), 'utf8'));
  // Candado: el catálogo es público. Si algún artículo trae costo o niveles 2/3, se para.
  for (const g of datos.grupos) for (const i of g.items) {
    const malos = Object.keys(i).filter(k => !['nombre', 'precio', 'codigo'].includes(k));
    if (malos.length) throw new Error(`«${i.nombre}» trae campos que no van en un catálogo público: ${malos.join(', ')}`);
    if (!(i.precio > 0)) throw new Error(`«${i.nombre}» no tiene precio`);
  }
  const salida = path.join(dir, 'salida'); fs.mkdirSync(salida, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.addInitScript(d => { window.DATOS = d; }, datos);
  await page.goto('file://' + path.join(dir, 'catalogo.html'));
  await page.waitForSelector('body[data-ready="1"]');
  await page.evaluate(() => document.fonts.ready);
  const n = await page.locator('.pag').count();
  for (let i = 0; i < n; i++) {
    await page.locator('.pag').nth(i).screenshot({ path: path.join(salida, `pagina-${String(i + 1).padStart(2, '0')}.png`) });
  }
  await page.pdf({ path: path.join(salida, 'catalogo.pdf'), width: '1080px', height: '1350px', printBackground: true });
  await browser.close();
  console.log(`listo: ${n} páginas en ${salida}`);
})();
