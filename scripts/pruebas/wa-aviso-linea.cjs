// 14-nov-2026 · CRM WhatsApp: el aviso «línea desconectada» sale solo a quien tiene abierta esa línea (dueño:
// «el rojo estaba saliendo para todos»). Datos inventados.
// Correr: PUERTO=8788 node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/wa-aviso-linea.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname;
(async () => { const b = await chromium.launch(); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  for (const W of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
    await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
    const r = await p.evaluate(() => {
      let w = document.getElementById('waWrap'); if (!w) { w = document.createElement('div'); w.id = 'waWrap'; document.body.appendChild(w); }
      const caida = { id: 'l-caida', nombre: 'Al por Mayor', whatsapp_numero: '+18090000001', conectada: false, conexion_cambio_en: '2026-11-13T23:23:57Z' };
      const ver = () => { _waPintarAvisoLineas(); const a = document.getElementById('waAvisoLineas'); return a ? a.textContent : null; };
      const o = {};
      _waLineasCaidas = [caida];
      _crmLineaActualId = 'l-otra'; o.otra = ver();
      _crmLineaActualId = 'l-caida'; o.suya = ver();
      const a = document.getElementById('waAvisoLineas'); const d = document.documentElement; o.sw = d.scrollWidth - d.clientWidth; o.rol = a && a.getAttribute('role');
      _crmLineaActualId = 'l-otra'; o.vuelve = ver();
      _crmLineaActualId = null; o.sinLinea = ver();
      _waLineasCaidas = [caida, { id: 'l-otra', nombre: 'Reparación', whatsapp_numero: '+18090000002', conectada: false }]; _crmLineaActualId = 'l-otra'; o.dos = ver();
      _waLineasCaidas = []; _crmLineaActualId = 'l-caida'; o.ninguna = ver();
      return o;
    });
    const t = `[${W}]`;
    c(`${t} en otra línea: no sale el aviso`, r.otra === null, r.otra);
    c(`${t} en la línea caída: sale, con su nombre y número`, /Al por Mayor · \+18090000001/.test(r.suya || '') && /desconectada/.test(r.suya || '') && r.rol === 'alert', r.suya);
    c(`${t} sin barra de lado`, r.sw <= 0, r.sw);
    c(`${t} al cambiar a otra línea: se quita`, r.vuelve === null, r.vuelve);
    c(`${t} sin línea elegida: no sale`, r.sinLinea === null, r.sinLinea);
    c(`${t} dos caídas: solo se nombra la que está abierta`, /Reparación/.test(r.dos || '') && !/Al por Mayor/.test(r.dos || ''), r.dos);
    c(`${t} ninguna caída: no sale`, r.ninguna === null, r.ninguna);
    c(`${t} sin errores de JS`, errs.length === 0, errs); await ctx.close();
  }
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
