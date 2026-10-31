// 31-oct-2026 · Impresión fácil (bc-impresion-facil.js/.css, html.bc-bif). QZ Tray simulado: primero apagado, luego encendido.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/impresion-facil.cjs [carpeta-capturas] [carpeta-tabler]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || ''; const TD = process.argv[3] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, acceptDownloads: true });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url();
    if (TD && /tabler-icons\.min\.css/.test(u)) return r.fulfill({ contentType: 'text/css', body: fs.readFileSync(TD + '/tabler-icons.min.css', 'utf8') });
    if (TD && /tabler-icons\.woff2/.test(u)) return r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(TD + '/fonts/tabler-icons.woff2') });
    if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') });
    r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  // QZ Tray simulado: window.__qzOn decide si el «programa» está abierto
  await ctx.addInitScript(() => {
    window.__qzOn = false; window.__qzIntentos = 0; let activo = false;
    window.qz = { security: { setCertificatePromise() {}, setSignaturePromise() {}, setSignatureAlgorithm() {} },
      websocket: { isActive: () => activo, connect: () => { window.__qzIntentos++; return window.__qzOn ? (activo = true, Promise.resolve()) : Promise.reject(new Error('Unable to establish connection with QZ')); } },
      printers: { find: () => Promise.resolve(['Microsoft Print to PDF', 'POS-80C', '4BARCODE 4B-2054L']) } };
    try { localStorage.removeItem('bayol_qz_tickets'); localStorage.removeItem('bayol_qz_labels'); } catch (e) {}
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    document.querySelectorAll('.view.active').forEach(x => x.classList.remove('active')); document.getElementById('v-recepcion').classList.add('active');
    try { _rpInit(); } catch (e) {} toast = () => {}; toastError = () => {};
    window.bcImpresoraRapida.abrir(); await w(600); });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const leer = () => p.evaluate(() => { const card = document.getElementById('qzPanelCard'); const ps = [...card.querySelectorAll('.bif-paso')];
    const btn = card.querySelector('#qzNoInstalado .bif-btn');
    return { arm: card.classList.contains('bif'), pasos: ps.map(x => x.classList.contains('hecho') ? 'hecho' : x.classList.contains('actual') ? 'actual' : '-'),
      no: getComputedStyle(document.getElementById('qzNoInstalado')).display, si: getComputedStyle(document.getElementById('qzConectado')).display,
      btn: btn ? { t: btn.textContent.trim(), href: btn.getAttribute('href'), h: Math.round(btn.getBoundingClientRect().height) } : null,
      buscando: (() => { const e = card.querySelector('.bif-buscando'); return e && !e.hidden && e.offsetParent !== null; })(),
      reconectarViejo: !!card.querySelector('button[onclick="qzVerificarConexion()"]') && card.querySelector('button[onclick="qzVerificarConexion()"]').offsetParent !== null,
      perm: (() => { const d = card.querySelector('details.bif-perm'); return d ? { abierto: d.open, cert: !!d.querySelector('button') } : null; })(),
      listo: (() => { const e = card.querySelector('.bif-listo'); return e && !e.hidden ? e.textContent.trim() : ''; })(),
      intentos: window.__qzIntentos, desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
  const a = await leer();
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/imp-apagado-${W}.png` });
  c('tarjeta armada con 3 pasos', a.arm && a.pasos.length === 3, a.pasos);
  c('sin QZ: paso 1 actual, «Buscando…», un solo botón grande', a.pasos[0] === 'actual' && a.buscando && a.btn && /Instalar impresión/.test(a.btn.t) && a.btn.h >= 54, a);
  c('el botón baja el instalador', a.btn && a.btn.href === 'instalar/bayol-impresion.bat', a.btn && a.btn.href);
  c('ya no está «Ya lo instalé, reconectar»', !a.reconectarViejo);
  c('certificado plegado', a.perm && !a.perm.abierto && a.perm.cert, a.perm);
  // Se «abre» QZ Tray: debe conectarse solo en ≤ 4 s, sin tocar nada
  await p.evaluate(() => { window.__qzOn = true; }); await p.waitForTimeout(4200);
  const d = await leer();
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/imp-conectado-${W}.png` });
  c('se conecta solo al abrir QZ', d.si !== 'none' && d.no === 'none', { si: d.si, no: d.no, intentos: d.intentos });
  c('elige sola la impresora de tickets y los 3 pasos quedan hechos', /POS-80C/.test(d.listo) && d.pasos.every(x => x === 'hecho'), { listo: d.listo, pasos: d.pasos });
  c('sin desborde horizontal', d.desborde <= 0, d.desborde);
  c('sin errores de JS', errs.length === 0, errs);
  // El instalador existe y descarga
  const r = await p.evaluate(async () => { const t = await (await fetch('instalar/bayol-impresion.bat')).text(); const c2 = await (await fetch('instalar/bayol-cell.crt')).text(); return { bat: /bayol-impresion\.ps1/.test(t), crt: /BEGIN CERTIFICATE/.test(c2) }; });
  c('instalador y certificado publicados', r.bat && r.crt, r);
  await ctx.close(); }

 // iPhone: QZ no existe. Sin instalador de Windows; explica wifi/AirPrint y «Probar impresora» abre la impresión.
 { const W = 390; const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
     userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1' });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url();
    if (TD && /tabler-icons\.min\.css/.test(u)) return r.fulfill({ contentType: 'text/css', body: fs.readFileSync(TD + '/tabler-icons.min.css', 'utf8') });
    if (TD && /tabler-icons\.woff2/.test(u)) return r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(TD + '/fonts/tabler-icons.woff2') });
    if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') });
    r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  await ctx.addInitScript(() => { window.__qzIntentos = 0; window.qz = { security: { setCertificatePromise() {}, setSignaturePromise() {}, setSignatureAlgorithm() {} },
    websocket: { isActive: () => false, connect: () => { window.__qzIntentos++; return Promise.reject(new Error('no')); } }, printers: { find: () => Promise.resolve([]) } }; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    document.querySelectorAll('.view.active').forEach(x => x.classList.remove('active')); document.getElementById('v-recepcion').classList.add('active');
    try { _rpInit(); } catch (e) {} toast = () => {}; toastError = () => {};
    window.__qzIntentos = 0; window.bcImpresoraRapida.abrir(); await w(3600); });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [iPhone] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const m = await p.evaluate(() => { const card = document.getElementById('qzPanelCard'); const vis = el => !!(el && el.offsetParent !== null);
    const bt = card.querySelector('.bif-probar');
    return { movil: card.classList.contains('bif-movil'), instalador: vis(card.querySelector('#qzNoInstalado .bif-btn')), pasos: vis(card.querySelector('.bif-pasos')),
      caja: vis(card.querySelector('.bif-movil-caja')), texto: (card.querySelector('.bif-movil-caja') || {}).textContent || '', btnH: bt ? Math.round(bt.getBoundingClientRect().height) : 0,
      pie: vis(document.querySelector('.bcpro-imp-pie')), titulo: (document.getElementById('bcproImpT') || {}).textContent || '', badge: document.getElementById('qzEstadoBadge').textContent, intentos: window.__qzIntentos,
      desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/imp-iphone.png` });
  c('modo celular, sin instalador de Windows ni pasos de QZ', m.movil && !m.instalador && !m.pasos && m.caja, m);
  c('explica AirPrint y Bluetooth', /AirPrint/.test(m.texto) && /Bluetooth/.test(m.texto));
  c('«Probar impresora» ≥ 44 px', m.btnH >= 44, m.btnH);
  c('sin botones de QZ abajo (Reconectar / Prueba de ticket)', !m.pie);
  c('no intenta conectar QZ en el celular', m.intentos === 0, m.intentos);
  c('aviso «Celular»', m.badge === 'Celular', m.badge);
  c('título «Impresora», no «de esta computadora»', /Impresora/.test(m.titulo) && !/computadora/.test(m.titulo), m.titulo);
  const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null), p.click('.bif-probar')]);
  c('«Probar impresora» abre la página de prueba', !!pop && /Prueba de impresión/.test(await pop.content()));
  c('sin desborde ni errores', m.desborde <= 0 && errs.length === 0, { d: m.desborde, errs });
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo bien'); process.exit(fallos ? 1 : 0); })();
