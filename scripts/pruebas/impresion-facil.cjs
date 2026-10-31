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
 await b.close(); console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo bien'); process.exit(fallos ? 1 : 0); })();
