// 2-nov-2026 · Estado real de la impresora (bc-impresora-estado.js). QZ Tray simulado con estado de impresora y de trabajo.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/impresora-estado.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname;
(async () => { const b = await chromium.launch(); let fallos = 0;
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url();
    if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') });
    r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  // QZ simulado: window.__estado = códigos que informa la impresora; window.__trabajo = código del trabajo tras imprimir
  await ctx.addInitScript(() => {
    window.__estado = ['OK']; window.__trabajo = null; window.__impresos = 0; window.__conEstado = true; let cb = null;
    const emitir = (e) => setTimeout(() => cb && cb(e), 30);
    window.qz = { security: { setCertificatePromise() {}, setSignaturePromise() {}, setSignatureAlgorithm() {} },
      websocket: { isActive: () => true, connect: () => Promise.resolve() },
      configs: { create: (p, o) => ({ p, o }) },
      print: () => { window.__impresos++; if (window.__trabajo) emitir({ eventType: 'JOB', printerName: 'POS-80C', statusText: window.__trabajo, severity: 'ERROR' }); return Promise.resolve(); },
      printers: { find: () => Promise.resolve(['Microsoft Print to PDF', 'POS-80C', '4BARCODE 4B-2054L']),
        setPrinterCallbacks: (f) => { cb = f; },
        startListening: () => window.__conEstado ? Promise.resolve() : Promise.reject(new Error('no soportado')),
        getStatus: () => { if (!window.__conEstado) return Promise.reject(new Error('no soportado')); window.__estado.forEach(s => emitir({ eventType: 'PRINTER', printerName: 'POS-80C', statusText: s, severity: s === 'OK' ? 'INFO' : 'ERROR' })); return Promise.resolve(); } } };
    try { localStorage.setItem('bayol_qz_tickets', 'POS-80C'); localStorage.setItem('bayol_qz_labels', '4BARCODE 4B-2054L'); } catch (e) {}
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
  await p.evaluate(() => { _qzConectado = true; window.__avisos = []; toast = (t, k) => window.__avisos.push((k || 'ok') + ': ' + t); });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const probar = (estado, trabajo, conEstado = true) => p.evaluate(async ([e, t, ce]) => {
    window.__estado = e; window.__trabajo = t; window.__conEstado = ce; window.__avisos = []; const antes = window.__impresos;
    const ok = await qzImprimirHtml('<p>x</p>', 76, null, 1, 'tickets'); await new Promise(r => setTimeout(r, 400));
    return { ok, mando: window.__impresos - antes, avisos: window.__avisos };
  }, [estado, trabajo, conEstado]);

  c('capa cargada y funciones envueltas', await p.evaluate(() => !!window.bcImpresoraEstado && qzImprimirHtml._bcImpEst && qzImprimirRaw._bcImpEst && qzImprimirHtmlComoImagen._bcImpEst));
  let r = await probar(['OK'], null);
  c('impresora bien: imprime y no avisa en rojo', r.ok === true && r.mando === 1 && !r.avisos.some(a => /^error/.test(a)), r);
  r = await probar(['OFFLINE'], null);
  c('sin conexión: NO manda y avisa qué pasa', r.ok === false && r.mando === 0 && r.avisos.length === 1 && /^error: No se imprimió: la impresora POS-80C está sin conexión/.test(r.avisos[0]), r);
  r = await probar(['PAUSED'], null);
  c('en pausa: avisa «en pausa»', r.ok === false && r.mando === 0 && r.avisos.some(a => /en pausa/.test(a)), r);
  r = await probar(['PAPER_OUT'], null);
  c('sin papel: avisa «no tiene papel»', r.ok === false && r.avisos.some(a => /no tiene papel/.test(a)), r);
  r = await probar(['OK'], 'ERROR');
  c('trabajo con error en Windows: avisa «No salió el papel»', r.ok === true && r.mando === 1 && r.avisos.some(a => /^error: No salió el papel/.test(a)), r);
  r = await probar(['OFFLINE'], null, false);
  c('QZ sin informe de estado: imprime como antes', r.ok === true && r.mando === 1, r);
  r = await p.evaluate(async () => { window.__estado = ['OFFLINE']; window.__conEstado = true; window.__avisos = []; const a = window.__impresos;
    const ok = await qzImprimirRaw('PRINT 1,1', 'labels'); return { ok, mando: window.__impresos - a }; });
  c('etiquetas: la de etiquetas (otra impresora) no se bloquea por el estado de la de tickets', r.ok === true && r.mando === 1, r);
  c('sin errores de JS', errs.length === 0, errs);
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
