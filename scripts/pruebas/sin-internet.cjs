// 1-nov-2026 · Sin internet (bc-sin-internet.js/.css, html.bc-sin). Se corta la red del navegador y se vuelve a dar.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/sin-internet.cjs [carpeta-capturas] [carpeta-tabler]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || ''; const TD = process.argv[3] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url();
    if (TD && /tabler-icons\.min\.css/.test(u)) return r.fulfill({ contentType: 'text/css', body: fs.readFileSync(TD + '/tabler-icons.min.css', 'utf8') });
    if (TD && /tabler-icons\.woff2/.test(u)) return r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(TD + '/fonts/tabler-icons.woff2') });
    if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') });
    r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
  await p.evaluate(() => { sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none'; });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const ver = () => p.evaluate(() => { const e = document.getElementById('bcSinRed'); if (!e) return { hay: false };
    const r = e.querySelector('.bsr-card').getBoundingClientRect();
    return { hay: true, visible: !e.hidden && getComputedStyle(e).opacity > 0.5, w: Math.round(r.width), vw: innerWidth, textos: e.querySelectorAll('p,button').length, z: getComputedStyle(e).zIndex,
      cv: e.querySelector('canvas').width, desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
  c('con internet no aparece', !(await ver()).visible);
  await ctx.setOffline(true); await p.waitForTimeout(2600);
  const a = await ver();
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/sin-internet-${W}.png` });
  c('sin internet aparece la ventana', a.visible, a);
  c('cabe en la pantalla y sin desborde', a.w <= a.vw - 32 && a.desborde <= 0, a);
  c('solo el logo: sin textos ni botón', a.textos === 0, a.textos);
  const rojo = () => p.evaluate(() => { const e = document.getElementById('bcrzRed'); return !!(e && e.className === 'mal' && getComputedStyle(e).display !== 'none'); });
  c('una sola señal: el aviso rojo de arriba no se ve con la ventana', !(await rojo()));
  // se dibuja la animación: comparar dos cuadros del lienzo
  const cambia = await p.evaluate(async () => { const cv = document.querySelector('#bcSinRed canvas'); const u1 = cv.toDataURL(); await new Promise(r => setTimeout(r, 450)); return u1 !== cv.toDataURL(); });
  c('la animación se mueve', cambia);
  await p.mouse.click(20, 20); await p.waitForTimeout(400);
  c('tocar la pantalla lo cierra', !(await ver()).visible);
  c('al cerrarla vuelve el aviso rojo pequeño', await rojo());
  await ctx.setOffline(false); await p.waitForTimeout(400); await ctx.setOffline(true); await p.waitForTimeout(500);
  c('si se va otra vez el internet, vuelve a salir', (await ver()).visible);
  await ctx.setOffline(false); await p.waitForTimeout(500);
  c('al volver el internet se quita sola', !(await ver()).visible);
  c('sin errores de página', errs.length === 0, errs);
  await ctx.close(); }
 // reducir movimiento: se ve quieta
 { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => /supabase-js/.test(r.request().url()) ? r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }) : r.fulfill({ status: 200, body: '' }));
  const p = await ctx.newPage(); await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(2000);
  await ctx.setOffline(true); await p.waitForTimeout(800);
  const quieta = await p.evaluate(async () => { const cv = document.querySelector('#bcSinRed canvas'); if (!cv) return false; const u1 = cv.toDataURL(); await new Promise(r => setTimeout(r, 600)); return u1 === cv.toDataURL(); });
  console.log((quieta ? 'OK   ' : 'FALLO') + ' [390] reducir movimiento: se ve quieta'); if (!quieta) fallos++;
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTODO OK'); process.exit(fallos ? 1 : 0); })();
