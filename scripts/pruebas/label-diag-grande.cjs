// 3-nov-2026 · Label de diagnóstico: la letra crece hasta llenar el label sin cortarse (datos de la foto del dueño).
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/label-diag-grande.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const CAP = process.argv[2] || null;
(async () => { const b = await chromium.launch(); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
  const casos = [
    { nombre: 'foto', notas: 'COMPRAR EL GLASS', fallas: [{ falla_corto: 'GLASS' }] },
    { nombre: 'muchas fallas', notas: 'CAMBIAR PANTALLA Y BATERIA, REVISAR CAMARA TRASERA', fallas: ['PANTALLA', 'BATERIA', 'CAMARA', 'FACE ID', 'CARGA', 'BOCINA'].map(x => ({ falla_corto: x })) },
    { nombre: 'sin notas', notas: '', fallas: [] }
  ];
  for (const k of casos) {
    const r = await p.evaluate((k) => {
      cache.lotes = [{ id: 'L1', codigo_lote: 'C00002071' }];
      findArticulo = () => ({ marca: 'SAMSUNG', modelo: 'S22 ULTRA', capacidad: '' });
      construirModeloAbreviado = () => 'CELULAR SAMSUNG S22 ULTRA 128GB+8GB RAM';
      localStorage.removeItem('bayol_dlbl_f'); localStorage.removeItem('bayol_dlbl_w'); localStorage.removeItem('bayol_dlbl_h');
      _fallasPorEquipo = { E1: k.fallas };
      const html = generarHtmlLabelDiag({ id: 'E1', lote_id: 'L1', imei: '352642890077236', notas_diagnostico: k.notas });
      const d = document.createElement('div'); d.id = 'prueba'; d.style.cssText = 'position:fixed;left:20px;top:20px;background:#fff;z-index:999999;outline:1px solid #f0f'; d.innerHTML = html; document.body.appendChild(d);
      const el = d.firstElementChild; const F = parseInt(el.style.fontSize);
      // letra con la cuenta vieja
      const h = 25, cols = k.fallas.length >= 4 ? 2 : 1, nl = k.notas ? Math.max(1, Math.ceil(k.notas.length / 26)) : 0, fr = k.fallas.length ? 1 + Math.ceil(k.fallas.length / cols) : 0;
      const vieja = Math.max(6, Math.min(18, Math.floor(Math.max(24, h * 3.7795 - 22) / ((4 + 2 + nl + fr) * 1.28))));
      el.style.minHeight = ''; const alto = el.offsetHeight, limite = h * 3.7795, ancho = el.scrollWidth <= el.clientWidth + 1;
      const lineasOk = !Array.from(el.querySelectorAll('.diag-line,.diag-header')).some(x => x.scrollWidth > x.clientWidth + 1);
      return { F, vieja, alto: Math.round(alto), limite: Math.round(limite), ancho, lineasOk };
    }, k);
    c(`[${k.nombre}] letra igual o más grande que antes (${r.vieja}px → ${r.F}px)`, r.F >= r.vieja && (k.nombre !== 'foto' || r.F > r.vieja), r);
    c(`[${k.nombre}] usa al menos 85 % del alto`, r.alto >= r.limite * 0.85, r);
    c(`[${k.nombre}] cabe en el alto (≤ 25 mm)`, r.alto <= r.limite, r);
    c(`[${k.nombre}] nada se sale a lo ancho`, r.ancho && r.lineasOk, r);
    if (CAP) await p.locator('#prueba').screenshot({ path: `${CAP}/label-${k.nombre.replace(/ /g, '-')}.png` });
    await p.evaluate(() => document.getElementById('prueba').remove());
  }
  c('sin errores de JS', errs.length === 0, errs);
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
