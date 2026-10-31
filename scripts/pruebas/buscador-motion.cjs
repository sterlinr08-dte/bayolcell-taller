// 31-oct-2026 · Buscar artículo con movimiento (bc-buscador-motion.js/.css, html.bc-bmo). Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/buscador-motion.cjs [carpeta-capturas] [--video]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || ''; const VIDEO = process.argv.includes('--video');
const ARTS = [
  { codigo: 1970, descripcion: 'BATERIA IPHONE 14 NORMAL ORIGINAL CALIDAD PREMIUM', referencia: 'BAT 14', marca: 'IPHONE', niveles: { 1: 3000, 2: 1200 }, precio: 3000, existencias: { 1: 19 } },
  { codigo: 3056, descripcion: 'BATERIA IPHONE 14 NORMAL GENERICA CON FLEX', referencia: '', marca: 'IPHONE', niveles: { 1: 3500 }, precio: 3500, existencias: { 1: 5 } },
  { codigo: 2524, descripcion: 'BATERIA IPHONE 14 PRO MAX ORIGINAL', referencia: 'BAT 14 PM', marca: 'IPHONE', niveles: { 1: 4000, 2: 1300, 3: 1200 }, precio: 4000, existencias: { 1: 42, 3: 3, 4: 1, 6: 1, 7: 15 } },
  { codigo: 2722, descripcion: 'BATERIA IPHONE 14 PRO ORIGINAL', referencia: '', marca: 'IPHONE', niveles: { 1: 3500 }, precio: 3500, existencias: { 1: 15 } },
  { codigo: 1470, descripcion: 'BATERIA IPHONE 15 PRO', referencia: '', marca: 'IPHONE', niveles: { 1: 4000 }, precio: 4000, existencias: { 1: 4 } },
  { codigo: 2019, descripcion: 'COVER IPHONE XR TRANSPARENTE', referencia: '', niveles: { 1: 250 }, precio: 250, existencias: { 1: 10 } }
];
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const [W, quieto] of [[390, false], [1280, false], [390, true]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, reducedMotion: quieto ? 'reduce' : 'no-preference', recordVideo: (VIDEO && W === 390 && !quieto && SHOTS) ? { dir: SHOTS + '/video', size: { width: 390, height: 844 } } : undefined });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  await p.evaluate(async (ARTS) => {
    sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    document.querySelectorAll('.view.active').forEach(x => x.classList.remove('active')); document.getElementById('v-recepcion').classList.add('active');
    try { _rpInit(); } catch (e) {} _rpState.nivel = 1; toast = () => {}; toastError = () => {};
    cache.infoplusArticulos = ARTS; _rpEsSerial = async () => false; supabaseClient.functions.invoke = async () => ({ data: null });
  }, ARTS);
  const out = {};
  out.capa = await p.evaluate(() => document.documentElement.classList.contains('bc-bmo'));
  // abrir y escribir
  await p.keyboard.press('F2'); await p.waitForTimeout(300);
  await p.focus('.bcrx-ppk-inp input'); await p.waitForTimeout(50);
  out.foco = await p.evaluate(() => !!document.querySelector('.bcrx-ppk-inp.bmo-foco'));
  await p.type('.bcrx-ppk-inp input', 'bateria 14', { delay: 20 }); await p.waitForTimeout(60);
  out.cascada = await p.evaluate(() => { const f = [...document.querySelectorAll('.bcrx-ppk-row')]; return { n: f.length, con: f.filter(x => x.classList.contains('bmo-in')).length, delays: f.map(x => x.style.animationDelay) }; });
  await p.waitForTimeout(400);
  out.lineas390 = await p.evaluate(() => { const d = document.querySelector('.bcrx-ppk-row .pk-dtx'); return d ? getComputedStyle(d).webkitLineClamp : null; });
  out.pildora = await p.evaluate(() => { const c = document.querySelector('.bcrx-ppk-chips'); return { hay: !!c.querySelector('.bmo-pil'), on: !!c.querySelector('.bmo-pil.on') }; });
  // flecha: no se repite la cascada
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(60);
  out.flecha = await p.evaluate(() => document.querySelectorAll('.bcrx-ppk-row.bmo-in').length);
  // ficha de categoría: píldora se enciende y se mueve
  await p.click('.bcrx-ppk-chip[data-chip="bateria"]'); await p.waitForTimeout(300);
  out.pildoraOn = await p.evaluate(() => { const pl = document.querySelector('.bmo-pil'); return { on: pl.classList.contains('on'), tr: pl.style.transform }; });
  out.cascadaChip = await p.evaluate(() => document.querySelectorAll('.bcrx-ppk-row.bmo-in').length);
  // abrir detalle: panel se despliega y filas de abajo se corren (FLIP)
  await p.evaluate(() => { window.__anims = 0; const o = Element.prototype.animate; Element.prototype.animate = function () { window.__anims++; return o.apply(this, arguments); }; });
  const filas = await p.$$('.bcrx-ppk-row'); await filas[0].click({ position: { x: 40, y: 10 } }); await p.waitForTimeout(80);
  out.detalle = await p.evaluate(() => ({ abre: !!document.querySelector('.bcrx-ppk-det.bmo-abre'), flips: window.__anims }));
  await p.waitForTimeout(300);
  if (SHOTS && !quieto) await p.screenshot({ path: `${SHOTS}/motion-${W}.png` });
  // agregar: pulso en el botón, línea nueva y total que rueda
  await p.evaluate(() => { window.__pulso = false; document.addEventListener('pointerdown', () => { setTimeout(() => { window.__pulso = !!document.querySelector('.pk-add.bmo-pulso'); }, 0); }, true); });
  const btn = await p.$('.bcrx-ppk-row .pk-add'); await btn.dispatchEvent('pointerdown'); await p.waitForTimeout(10);
  out.pulso = await p.evaluate(() => !!document.querySelector('.pk-add.bmo-pulso'));
  await btn.click(); await p.waitForTimeout(120);
  out.rueda = await p.evaluate(() => !!document.querySelector('.bcpf-bar .bn .bmo-rol, .bcrx-total-num .bmo-rol'));
  out.lineaNueva = await p.evaluate(() => !!document.querySelector('.bcpf-it.bmo-nueva'));
  await p.waitForTimeout(500);
  out.totalFinal = await p.evaluate(() => (document.querySelector('.bcpf-bar .bn') || document.querySelector('.bcrx-total-num')).textContent.trim());
  out.desborde = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (VIDEO && W === 390 && !quieto) { await p.keyboard.press('F2'); await p.waitForTimeout(300); await p.type('.bcrx-ppk-inp input', 'bateria', { delay: 60 }); await p.waitForTimeout(500); const f2 = await p.$$('.bcrx-ppk-row'); await f2[1].click({ position: { x: 40, y: 10 } }); await p.waitForTimeout(700); await p.click('.bcrx-ppk-chip[data-chip="celular"]'); await p.waitForTimeout(600); await p.click('.bcrx-ppk-chip[data-chip="bateria"]'); await p.waitForTimeout(600); const b2 = await p.$('.bcrx-ppk-row .pk-add'); await b2.click(); await p.waitForTimeout(900); }
  const tag = `${W}${quieto ? ' sin movimiento' : ''}`;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${tag}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('capa activa', out.capa);
  if (!quieto) {
    c('campo respira al enfocar', out.foco);
    c('cascada al escribir (todas las filas, retraso ≤ 90 ms)', out.cascada.con === out.cascada.n && out.cascada.n > 0 && out.cascada.delays.every(d => parseInt(d) <= 90), out.cascada);
    c('con flecha no se repite', out.flecha === 0, out.flecha);
    c('ficha: cascada otra vez y píldora encendida', out.cascadaChip > 0 && out.pildoraOn.on && /translate/.test(out.pildoraOn.tr), out.pildoraOn);
    c('detalle se despliega y las filas de abajo se corren', out.detalle.abre && out.detalle.flips > 0, out.detalle);
    c('botón hace pulso al tocar', out.pulso);
    c('línea nueva entra y el total rueda', out.lineaNueva && out.rueda, { lineaNueva: out.lineaNueva, rueda: out.rueda });
    if (W === 390) c('nombre en dos líneas en el celular', out.lineas390 === '2', out.lineas390);
  } else {
    c('sin movimiento: nada de clases de animación', !out.foco && out.cascada.con === 0 && !out.detalle.abre && !out.pulso && !out.rueda, { foco: out.foco, casc: out.cascada.con, abre: out.detalle.abre });
  }
  c('total correcto al final', /3,000\.00|4,000\.00|3,500\.00/.test(out.totalFinal), out.totalFinal);
  c('sin desborde horizontal', out.desborde <= 0, out.desborde);
  c('sin errores de JS', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo bien'); process.exit(fallos ? 1 : 0); })();
