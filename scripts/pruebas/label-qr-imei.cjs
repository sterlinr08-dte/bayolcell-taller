// 3-nov-2026 · QR chico con el IMEI en el label de diagnóstico: cabe, no corta textos y se lee aun bajado a 203 dpi en blanco y negro.
// Usa qrcodejs y html2canvas reales de cdnjs (internet) y jsQR (npm i jsqr, o JSQR=<ruta a jsQR.js>) para leerlo.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/label-qr-imei.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const B = __dirname; const CAP = process.argv[2] || null;
let JSQR = process.env.JSQR; try { if (!JSQR) JSQR = require.resolve('jsqr/dist/jsQR.js'); } catch (e) {}
(async () => { const b = await chromium.launch(); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url();
    if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') });
    if (/html2canvas|qrcodejs/.test(u)) return r.continue();
    r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  await ctx.addInitScript(() => { window.__impresos = []; window.qz = { security: { setCertificatePromise() {}, setSignaturePromise() {}, setSignatureAlgorithm() {} }, websocket: { isActive: () => true }, configs: { create: (p, o) => ({ p, o }) }, print: (cfg, data) => { window.__impresos.push(data[0].data); return Promise.resolve(); }, printers: { find: () => Promise.resolve([]), setPrinterCallbacks() {}, startListening: () => Promise.reject(new Error('no')), getStatus: () => Promise.reject(new Error('no')) } }; try { localStorage.setItem('bayol_qz_labels', '4BARCODE'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  if (JSQR) await p.addScriptTag({ content: fs.readFileSync(JSQR, 'utf8') });
  const casos = [
    { n: 'foto (2 fallas)', imei: '356118094108198', modelo: 'CELULAR IP 8G PLUS 256GB', notas: '', fallas: ['CAMBIAR BATERIA', 'FLEX DE AUDIO'] },
    { n: '4 fallas largas', imei: '353013095205510', modelo: 'CELULAR IP 8G PLUS 256GB', notas: '', fallas: ['CAMBIAR BATERIA', 'FLEX DE CARGA', 'HOUSING', 'PULIR PANTALLA'] },
    { n: 'modelo largo + notas', imei: '352642890077236', modelo: 'CELULAR SAMSUNG S22 ULTRA 128GB+8GB RAM', notas: 'COMPRAR EL GLASS', fallas: ['GLASS'] }
  ];
  for (const k of casos) {
    const r = await p.evaluate(async (k) => {
      _qzConectado = true; toast = () => {};
      cache.lotes = [{ id: 'L1', codigo_lote: 'C00002071' }]; findArticulo = () => ({}); construirModeloAbreviado = () => k.modelo;
      ['bayol_dlbl_f', 'bayol_dlbl_w', 'bayol_dlbl_h', 'bayol_dlbl_qr'].forEach(x => localStorage.removeItem(x));
      _fallasPorEquipo = { E1: k.fallas.map(f => ({ falla_corto: f })) };
      const html = generarHtmlLabelDiag({ id: 'E1', lote_id: 'L1', imei: k.imei, notas_diagnostico: k.notas });
      const cont = document.createElement('div'); cont.id = 'qrPrueba'; cont.style.cssText = 'position:fixed;left:20px;top:20px;background:#fff;z-index:999999;outline:1px solid #f0f'; cont.innerHTML = html; document.body.appendChild(cont);
      const el = cont.firstElementChild, qr = el.querySelector('.diag-qr');
      await new Promise(r => setTimeout(r, 100));
      const out = { hayQr: !!qr, qrMm: qr ? +(qr.getBoundingClientRect().width / 3.7795).toFixed(1) : 0 };
      el.style.minHeight = ''; out.altoMm = +(el.offsetHeight / 3.7795).toFixed(1); el.style.minHeight = '25mm';
      out.cortado = Array.from(el.querySelectorAll('.diag-line,.diag-header,.diag-falla')).filter(x => x.scrollWidth > x.clientWidth + 1).map(x => x.textContent.trim().slice(0, 20));
      out.letra = parseFloat(el.style.fontSize);
      // imprimir (vía imagen) y simular la térmica: 203 dpi y blanco/negro
      const ok = await qzImprimirHtmlComoImagen(el, 51, 25, 1, 'labels'); out.imprimio = ok;
      const b64 = window.__impresos[window.__impresos.length - 1];
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const W = 51 * 8, H = 25 * 8, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
      x.imageSmoothingEnabled = true; x.drawImage(im, 0, 0, W, H);
      const d = x.getImageData(0, 0, W, H); for (let i = 0; i < d.data.length; i += 4) { const v = d.data[i] < 140 ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0);
      out.png203 = cv.toDataURL('image/png').split(',')[1];
      if (typeof jsQR === 'function') { const res = jsQR(d.data, W, H); out.leido = res ? res.data : null; }
      return out;
    }, k);
    c(`[${k.n}] QR puesto (~10.5 mm)`, r.hayQr && r.qrMm >= 9 && r.qrMm <= 12.5, r.qrMm);
    c(`[${k.n}] todo cabe en 25 mm y nada se corta`, r.altoMm <= 25 && r.cortado.length === 0, { alto: r.altoMm, cortado: r.cortado, letra: r.letra });
    c(`[${k.n}] se imprime`, r.imprimio === true);
    if (JSQR) c(`[${k.n}] el QR impreso a 203 dpi se lee = IMEI`, r.leido === k.imei, r.leido);
    if (CAP) { await p.locator('#qrPrueba').screenshot({ path: `${CAP}/qr-${k.n.replace(/\W+/g, '-')}.png` }); fs.writeFileSync(`${CAP}/qr-${k.n.replace(/\W+/g, '-')}-203dpi.png`, Buffer.from(r.png203, 'base64')); }
    await p.evaluate(() => document.getElementById('qrPrueba').remove());
  }
  // apagar el QR
  const off = await p.evaluate(() => { localStorage.setItem('bayol_dlbl_qr', '0'); const h = generarHtmlLabelDiag({ id: 'E1', lote_id: 'L1', imei: '356118094108198', notas_diagnostico: '' }); localStorage.removeItem('bayol_dlbl_qr'); return /diag-qr/.test(h); });
  c('con bayol_dlbl_qr=0 no sale el QR', off === false);
  const sinImei = await p.evaluate(() => /diag-qr/.test(generarHtmlLabelDiag({ id: 'E1', lote_id: 'L1', imei: '', notas_diagnostico: '' })));
  c('sin IMEI no sale QR', sinImei === false);
  c('sin errores de JS', errs.length === 0, errs);
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
