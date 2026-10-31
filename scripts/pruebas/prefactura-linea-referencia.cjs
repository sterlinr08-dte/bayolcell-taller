// 31-oct-2026 · La línea de la prefactura lleva la referencia de Info Plus («· 128GB», «· VACIO», «· Con aviso»). Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/prefactura-linea-referencia.cjs [carpeta-capturas]
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
    const arts = [
      { codigo: 2874, descripcion: 'CELULAR IPHONE 14 NORMAL', referencia: '128GB', marca: 'IPHONE', niveles: { 1: 18990 }, precio: 18990, existencias: { 1: 2 } },
      { codigo: 1985, descripcion: 'CELULAR IPHONE 14 NORMAL 128GB', referencia: 'AVISO', marca: 'IPHONE', niveles: { 1: 17990 }, precio: 17990, existencias: { 1: 1 } },
      { codigo: 1416, descripcion: 'HOUSING IPHONE X BLANCO ', referencia: 'VACIO', marca: 'IPHONE', niveles: { 1: 1500 }, precio: 1500, existencias: { 1: 3 } },
      { codigo: 1412, descripcion: 'HOUSING IPHONE 8G PLUS BLANCO COMPLETO', referencia: 'HOUSING 8G PLUS BLANCO ', marca: 'IPHONE', niveles: { 1: 1800 }, precio: 1800, existencias: { 1: 3 } },
      { codigo: 2019, descripcion: 'COVER IPHONE XR TRANSPARENTE', referencia: '', niveles: { 1: 250 }, precio: 250, existencias: { 1: 10 } },
      { codigo: 1161, descripcion: 'ENVIO-MENSAJERIA', referencia: 'MOTOR', niveles: { 1: 100, 2: 50 }, precio: 100, existencias: {} }
    ];
    cache.infoplusArticulos = arts;
    _rpEsSerial = async () => false; supabaseClient.functions.invoke = async () => ({ data: null });
    out.helper = arts.map(a => _ipDescCompleta(a));
    for (const a of arts.slice(0, 5)) { await _rpAgregarArticulo(a); await w(80); }
    out.lineas = _rpState.items.map(it => it.desc);
    out.pantalla = [...document.querySelectorAll('#v-recepcion .dnb, #v-recepcion .bcpf-lin .d')].map(x => x.textContent.replace(/\s+/g, ' ').trim());
    out.infoplus = _rpState.items.map((it, i) => _rpDescInfoplus(it, i));
    out.largoMax = Math.max(...out.infoplus.map(s => s.length));
    return out;
  });
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/linea-referencia-${W}.png` });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('128GB se suma', r.helper[0] === 'CELULAR IPHONE 14 NORMAL · 128GB', r.helper[0]);
  c('AVISO → «Con aviso»', r.helper[1] === 'CELULAR IPHONE 14 NORMAL 128GB · Con aviso', r.helper[1]);
  c('VACIO se suma y limpia espacios', r.helper[2] === 'HOUSING IPHONE X BLANCO · VACIO', r.helper[2]);
  c('referencia ya contenida: no se repite', r.helper[3] === 'HOUSING IPHONE 8G PLUS BLANCO COMPLETO', r.helper[3]);
  c('sin referencia: igual', r.helper[4] === 'COVER IPHONE XR TRANSPARENTE', r.helper[4]);
  c('las 5 líneas llevan el texto completo', JSON.stringify(r.lineas) === JSON.stringify(r.helper.slice(0, 5)), r.lineas);
  c('se ve en pantalla', r.pantalla.some(t => /14 NORMAL · 128GB/.test(t)) && r.pantalla.some(t => /BLANCO · VACIO/.test(t)), r.pantalla.slice(0, 3));
  c('va a Info Plus con la referencia', r.infoplus.some(t => /· 128GB/.test(t)) && r.infoplus.some(t => /· VACIO/.test(t)), r.infoplus);
  c('ninguna línea pasa de 100 letras', r.largoMax <= 100, r.largoMax);
  c('sin errores de JS', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo bien'); process.exit(fallos ? 1 : 0); })();
