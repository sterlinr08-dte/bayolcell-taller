// 10-nov-2026 · Ventana «Imprimir label» (Reacondicionados): cabe en la pantalla y «Texto de estado» smart. Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/label-rapido-smart.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const [W, H] of [[390, 844], [1280, 720], [1920, 950]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: W < 500, isMobile: W < 500 });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1') || (SHOTS && /tabler|fonts\.g/.test(u))) return r.continue(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const o = {};
    sessionUser = { id: 'a1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    localStorage.removeItem('bc_lr_eq'); localStorage.removeItem('bc_lr_lista');
    cache.refurb = [{ id: 'e1', modelo: 'CELULAR IPHONE 8G PLUS', capacidad: '256GB', color: 'Negro', imei: '353011095998944', marca: 'Apple' }, { id: 'e2', modelo: 'CELULAR IPHONE 13', capacidad: '128GB', imei: '351016097520739', marca: 'Apple', clasificacion_final: 'b' }];
    let impresos = []; imprimirLabelAdhesivo = async () => { impresos.push({ estado: document.getElementById('lbl_estado_texto').value, copias: document.getElementById('lbl_copias').value }); };
    const $ = id => document.getElementById(id), chips = () => [...document.querySelectorAll('#lr_chips .lr-chip:not(.lr-chip-ed)')].map(c => c.textContent + (c.classList.contains('on') ? '*' : ''));
    imprimirLabelEquipo('e1'); await w(400);
    const box = document.querySelector('#modalLabelRapido .lr-box').getBoundingClientRect(), body = document.querySelector('#modalLabelRapido .lr-body'), imp = document.querySelector('#modalLabelRapido .lr-imp').getBoundingClientRect(), prev = $('lr_preview').getBoundingClientRect();
    o.cabe = box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth; o.box = [Math.round(box.width), Math.round(box.height)];
    o.sinScroll = body.scrollHeight <= body.clientHeight + 1; o.impVisible = imp.bottom <= innerHeight && imp.height >= 54; o.prevVisible = prev.bottom <= box.bottom && prev.height > 40;
    o.peq = [...document.querySelectorAll('#modalLabelRapido button, #modalLabelRapido input')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 44).map(e => (e.id || e.className || e.textContent).toString().slice(0, 20) + ':' + Math.round(e.getBoundingClientRect().height));
    o.datos = [$('lr_marca').value, $('lr_modelo').value, $('lr_gb').value, $('lr_imei').value]; o.estado0 = $('lr_estado').value; o.chips0 = chips();
    document.querySelector('#lr_chips .lr-chip').click(); await w(60); o.trasChip = [$('lr_estado').value, chips()[0], /CLASE A/.test($('lr_preview').innerText)];
    document.querySelector('#lr_chips .lr-chip').click(); await w(60); o.quita = $('lr_estado').value;
    const e = $('lr_estado'); e.value = 'aviso bat'; e.dispatchEvent(new Event('input', { bubbles: true })); await w(60); o.mayus = e.value;
    document.querySelector('#modalLabelRapido .lr-paso button:last-of-type').click(); o.copias = $('lr_copias').value;
    await imprimirLabelRapido(); await w(100); o.impreso = impresos[0]; o.cerrada = !$('modalLabelRapido').classList.contains('active');
    imprimirLabelEquipo('e1'); await w(200); o.recuerda = $('lr_estado').value; o.chips1 = chips(); cerrarLabelRapido();
    imprimirLabelEquipo('e2'); await w(200); o.clasif = $('lr_estado').value; o.chips2 = chips();
    // Editar accesos rápidos: quitar, agregar y que quede guardado
    const ed = () => document.querySelector('#lr_chips .lr-chip-ed'); ed().click(); await w(60);
    o.edicion = chips(); [...document.querySelectorAll('#lr_chips .lr-chip-x')].find(c => c.dataset.t === 'CLASE C').click(); await w(60);
    const e2 = $('lr_estado'); e2.value = 'sin face id'; e2.dispatchEvent(new Event('input', { bubbles: true })); await w(60); o.ofrece = (document.querySelector('#lr_chips .lr-chip-mas') || {}).textContent;
    e2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await w(60); o.noImprime = impresos.length; ed().click(); await w(60); o.editada = chips();
    o.altoEd = Math.round(ed().getBoundingClientRect().height); cerrarLabelRapido(); imprimirLabelEquipo('e2'); await w(200); o.guardada = chips();
    const d = document.documentElement; o.sw = d.scrollWidth - d.clientWidth;
    if (window.__foto) { cerrarLabelRapido(); imprimirLabelEquipo('e1'); await w(300); }
    return o; });
  if (SHOTS) { await p.evaluate(async () => { cerrarLabelRapido(); imprimirLabelEquipo('e1'); await new Promise(r => setTimeout(r, 500)); }); await p.screenshot({ path: `${SHOTS}/label-${W}.png` }); }
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}x${H}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('la ventana cabe completa, sin desplazarse', r.cabe && r.sinScroll, [r.box, r.cabe, r.sinScroll]); c('«Imprimir» (54 px) y la vista previa a la vista', r.impVisible && r.prevVisible, [r.impVisible, r.prevVisible]);
  c('todo lo que se toca ≥ 44 px', r.peq.length === 0, r.peq); c('los datos del equipo siguen igual', r.datos.join('|') === 'Apple|iP 8G PLUS|256GB|353011095998944', r.datos);
  c('abre vacío con CLASE A · B · C', r.estado0 === '' && r.chips0.join('|') === 'CLASE A|CLASE B|CLASE C', [r.estado0, r.chips0]);
  c('un toque lo pone (y sale en la vista previa); otro lo quita', r.trasChip.join('|') === 'CLASE A|CLASE A*|true' && r.quita === '', [r.trasChip, r.quita]);
  c('escribe en MAYÚSCULAS solo', r.mayus === 'AVISO BAT', r.mayus); c('copias con + y se imprime lo escrito', r.copias === '2' && r.impreso && r.impreso.estado === 'AVISO BAT' && r.impreso.copias === '2' && r.cerrada, [r.copias, r.impreso, r.cerrada]);
  c('recuerda el texto del equipo y lo ofrece como botón', r.recuerda === 'AVISO BAT' && r.chips1.join('|') === 'CLASE A|CLASE B|CLASE C|AVISO BAT*', [r.recuerda, r.chips1]);
  c('Editar: quita «CLASE C», agrega «SIN FACE ID» con Enter (sin imprimir) y queda guardado', /^\+ SIN FACE ID/.test(r.ofrece || '') && r.noImprime === 1 && r.editada.join('|') === 'CLASE A|CLASE B|AVISO BAT|SIN FACE ID*' && r.guardada.join('|') === 'CLASE A|CLASE B*|AVISO BAT|SIN FACE ID' && r.altoEd >= 44, [r.ofrece, r.noImprime, r.editada, r.guardada, r.altoEd]);
  c('equipo con clasificación «b» abre en CLASE B', r.clasif === 'CLASE B' && r.chips2[1] === 'CLASE B*', [r.clasif, r.chips2]);
  c('sin desplazamiento horizontal', r.sw <= 1, r.sw); c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0); })();
