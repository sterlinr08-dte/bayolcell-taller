// 3-nov-2026 · Imprimir label rápido: html2canvas dibuja el label dentro de un iframe vacío (no copia toda la pantalla).
// Usa html2canvas real de cdnjs (necesita internet). Correr: node scripts/pruebas/servidor.cjs &  y luego este archivo.
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname;
(async () => { const b = await chromium.launch(); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url();
    if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') });
    if (/html2canvas/.test(u)) return r.continue();
    r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  await ctx.addInitScript(() => {
    window.__impresos = []; let cb = null;
    window.qz = { security: { setCertificatePromise() {}, setSignaturePromise() {}, setSignatureAlgorithm() {} },
      websocket: { isActive: () => true, connect: () => Promise.resolve() }, configs: { create: (p, o) => ({ p, o }) },
      print: (cfg, data) => { window.__impresos.push({ cfg, data }); return Promise.resolve(); },
      printers: { find: () => Promise.resolve(['POS-80C', '4BARCODE']), setPrinterCallbacks: f => { cb = f; },
        startListening: () => Promise.resolve(), getStatus: () => { setTimeout(() => cb && cb({ eventType: 'PRINTER', printerName: '4BARCODE', statusText: 'OK', severity: 'INFO' }), 20); return Promise.resolve(); } } };
    try { localStorage.setItem('bayol_qz_labels', '4BARCODE'); localStorage.setItem('bayol_qz_tickets', 'POS-80C'); } catch (e) {}
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => {
    _qzConectado = true; toast = () => {};
    cache.lotes = [{ id: 'L1', codigo_lote: 'C00002071' }]; findArticulo = () => ({}); construirModeloAbreviado = () => 'CELULAR SAMSUNG S22 ULTRA 128GB+8GB RAM';
    _fallasPorEquipo = { E1: [{ falla_corto: 'GLASS' }] };
    const eq = { id: 'E1', lote_id: 'L1', imei: '352642890077236', notas_diagnostico: 'COMPRAR EL GLASS' };
    const out = { h2c: typeof html2canvas === 'function' };
    let t = performance.now(); const html = generarHtmlLabelDiag(eq); out.armarMs = Math.round(performance.now() - t);
    const correr = async () => { const cont = document.createElement('div'); cont.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff'; cont.innerHTML = html; document.body.appendChild(cont);
      const t0 = performance.now(); const ok = await qzImprimirHtmlComoImagen(cont.firstElementChild, 51, 25, 1, 'labels'); const ms = Math.round(performance.now() - t0); cont.remove();
      const ultimo = window.__impresos[window.__impresos.length - 1]; return { ok, ms, img: ultimo && ultimo.data[0].data }; };
    await correr(); // calentar
    const rapido = await correr();
    localStorage.setItem('bc_label_iframe_off', '1'); const viejo = await correr(); localStorage.removeItem('bc_label_iframe_off');
    // comparar las dos imágenes píxel a píxel (negro/blanco)
    const px = async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0); return { w: im.width, h: im.height, d: x.getImageData(0, 0, im.width, im.height).data }; };
    const A = await px(rapido.img), Bv = await px(viejo.img); let dif = 0, negro = 0;
    if (A.w === Bv.w && A.h === Bv.h) for (let i = 0; i < A.d.length; i += 4) { const a = A.d[i] < 128, bb = Bv.d[i] < 128; if (a) negro++; if (a !== bb) dif++; }
    Object.assign(out, { rapidoMs: rapido.ms, viejoMs: viejo.ms, ok: rapido.ok && viejo.ok, mismoTam: A.w === Bv.w && A.h === Bv.h, tam: [A.w, A.h], negro, difPct: +(100 * dif / Math.max(1, negro)).toFixed(2), iframesSobrantes: document.querySelectorAll('iframe[aria-hidden="true"]').length });
    return out;
  });
  c('html2canvas real cargado', r.h2c, r);
  c('imprime por la vía rápida y por la vieja', r.ok, r);
  c(`vía rápida más rápida (${r.rapidoMs} ms vs ${r.viejoMs} ms)`, r.rapidoMs < r.viejoMs, r);
  c('misma imagen: mismo tamaño', r.mismoTam, r.tam);
  c('misma imagen: diferencia < 2 % de los puntos negros', r.difPct < 2 && r.negro > 500, r);
  c('no quedan iframes sueltos', r.iframesSobrantes === 0, r);
  c(`medir la letra del label es rápido (${r.armarMs} ms < 80)`, r.armarMs < 80, r.armarMs);
  c('sin errores de JS', errs.length === 0, errs);
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
