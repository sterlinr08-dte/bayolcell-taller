// 10-nov-2026 · Precios en lote (nivel 1). Datos inventados; Info Plus simulado (no se llama de verdad).
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/precios-lote.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const [W, H, adm] of [[390, 844, true], [1280, 800, true], [1280, 800, false]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: W < 500, isMobile: W < 500 });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1') || (SHOTS && /tabler|fonts\.g/.test(u))) return r.continue(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async (adm) => { const w = ms => new Promise(r => setTimeout(r, ms)); const o = {};
    sessionUser = { id: 'a1', nombre: 'Admin', usuario: 'admin', rol: adm ? 'admin' : 'tecnico', _tipo: 'usuario' }; isAdminUser = () => adm;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    const A = (c, d, n1) => ({ codigo: c, descripcion: d, precio: n1, niveles: { '1': n1, '2': 999, '3': 300 }, existencias: {} });
    cache.infoplusArticulos = [A('2785', 'MICA CRISTAL DE PANTALLA IPHONE 15 PRO MAX + OCA', 9000), A('2778', 'MICA CRISTAL DE PANTALLA IPHONE 13 / 13 PRO + OCA', 3700), A('2742', 'MICA CRISTAL DE PANTALLA IPHONE X + OCA', 1200), A('2924', 'MICA CRISTAL DE PANTALLA IPHONE 15 PRO + OCA', 7990)];
    _ensureInfoplusArticulos = async () => cache.infoplusArticulos;
    const envios = []; let fallar = '';
    supabaseClient.functions.invoke = async (fn, op) => { envios.push({ fn, body: op.body }); await w(20); return op.body.codarticulo === fallar ? { data: { ok: false }, error: null } : { data: { ok: true }, error: null }; };
    confirmar = async () => true; const avisos = []; toast = (m, t) => avisos.push(m);
    try { await abrirBuscadorArticulos(null, () => {}, '', ''); } catch (e) {} await w(400);
    const btn = document.querySelector('#modalBuscadorArt [aria-label="Precios en lote"]'); o.boton = !!btn;
    if (!btn) return o;
    btn.click(); await w(300);
    const filas = () => [...document.querySelectorAll('#plModal tbody tr')].map(tr => [...tr.children].map(td => td.querySelector('input') ? td.querySelector('input').value : td.textContent.trim()));
    document.querySelector('#plModal .pl-acc .btn').click(); await w(100);
    o.filas = filas().length; o.f2785 = filas()[0]; o.nota2778 = (document.querySelector('#plModal .pl-nota') || {}).textContent || '';
    o.noCat = filas().filter(f => /No está en el catálogo/.test(f[5])).length; o.igual = filas().filter(f => /Igual/.test(f[5])).map(f => f[0]);
    o.botonG = document.getElementById('plGuardar').textContent.trim();
    const inp = document.querySelector('#plModal input[aria-label="Precio nuevo 2742"]'); inp.value = '1600'; inp.dispatchEvent(new Event('input', { bubbles: true })); await w(50);
    o.editado = filas().find(f => f[0] === '2742');
    fallar = '2778';
    document.getElementById('plGuardar').click(); await w(800);
    o.envios = envios.filter(e => e.fn === 'infoplus-precio-actualizar'); o.trasGuardar = filas().map(f => f[0] + ':' + f[5]); o.aviso = avisos.slice(-1)[0]; o.cache2785 = cache.infoplusArticulos[0].niveles;
    o.peq = [...document.querySelectorAll('#plModal button, #plModal input:not([disabled])')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 44).map(e => (e.className || e.id) + ':' + Math.round(e.getBoundingClientRect().height));
    const d = document.documentElement; o.sw = d.scrollWidth - d.clientWidth;
    o.leer = BayolPreciosLote._leer('2785 - $8,990.00\n2924;7990\nhola\n2742  RD$1,500'); 
    return o; }, adm);
  if (SHOTS && adm) await p.screenshot({ path: `${SHOTS}/lote-${W}.png` });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}${adm ? '' : ' no admin'}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  if (!adm) { c('sin admin no sale el botón', r.boton === false, r.boton); }
  else {
    c('botón «Precios en lote» en el buscador', r.boton);
    c('carga las 18 líneas del glass', r.filas === 18, r.filas);
    c('muestra hoy y nuevo', r.f2785 && r.f2785[2] === 'RD$ 9,000' && r.f2785[3] === '8990', r.f2785);
    c('avisa los artículos compartidos', /13 y 13 Pro/.test(r.nota2778), r.nota2778);
    c('los que no están en el catálogo se marcan y no se mandan', r.noCat === 14, r.noCat);
    c('el que ya tiene ese precio dice «Igual» y no se manda', r.igual.join() === '2924', r.igual);
    c('se puede editar un precio antes de guardar', r.editado && r.editado[3] === '1600', r.editado);
    c('manda SOLO nivel 1 contado y crédito (sin mínimo, sin otros niveles)', r.envios.length === 3 && r.envios.every(e => e.fn === 'infoplus-precio-actualizar' && JSON.stringify(e.body.precios) === JSON.stringify([{ codnivelprecio: 1, contado: e.body.precios[0].contado, credito: e.body.precios[0].contado }])) && r.envios.map(e => e.body.codarticulo + '=' + e.body.precios[0].contado).join() === '2785=8990,2778=4490,2742=1600', r.envios.map(e => e.body));
    c('marca guardado y el que falla', /2785:.*Guardado/.test(r.trasGuardar.join()) && /2778:Info Plus no lo aceptó/.test(r.trasGuardar.join()) && /2742:.*Guardado/.test(r.trasGuardar.join()), r.trasGuardar.slice(0, 3).concat(r.trasGuardar.filter(x => /2742/.test(x))));
    c('aviso final honesto', /2 de 3/.test(r.aviso || ''), r.aviso);
    c('actualiza el precio en pantalla sin tocar nivel 2', r.cache2785['1'] === 8990 && r.cache2785['2'] === 999, r.cache2785);
    c('lee líneas pegadas en varios formatos', JSON.stringify(r.leer) === '[["2785",8990],["2924",7990],["2742",1500]]', r.leer);
    c('botones y campos ≥ 44 px', r.peq.length === 0, r.peq);
  }
  c('sin desplazamiento horizontal', (r.sw || 0) <= 1, r.sw); c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0); })();
