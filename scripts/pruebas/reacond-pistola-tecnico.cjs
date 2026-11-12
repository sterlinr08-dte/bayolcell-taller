// 12-nov-2026 · «Pasar con pistola»: primero se elige el técnico del grupo y todos los «Entregar a técnico» van a él.
// Y al aplicar se ofrece la HOJA DE ENTREGA con las fallas del diagnóstico de cada equipo.
// Correr: PUERTO=8788 node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/reacond-pistola-tecnico.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
 for (const [W, H] of [[390, 844], [1280, 800]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: W < 500, isMobile: W < 500 });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1') || (SHOTS && /tabler|fonts\.g/.test(u))) return r.continue(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const t = `[${W}]`;
  await p.evaluate(() => {
    sessionUser = { id: 'a1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true; tienePermiso = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    loadAll = async () => {}; asignarFallasSinDueno = async () => {}; window.__avisos = []; toast = m => window.__avisos.push(m); toastError = m => window.__avisos.push('ERR ' + m);
    const eq = (id, imei, est, extra) => Object.assign({ id, imei, modelo: 'CELULAR IPHONE 12 PRO MAX', capacidad: '128GB', lote_id: 'L1', estado_evaluacion: est, articulo_codigo: '2060', creado_en: '2026-11-01T10:00:00Z' }, extra || {});
    const E = [eq('e1', '353776390128674', 'evaluado'), eq('e2', '358497891713485', 'evaluado'), eq('e3', '354506124750025', 'evaluado'), eq('e4', '353011095998944', 'en_proceso', { tecnico_asignado_id: 't1' }), eq('e5', '353011095998945', 'evaluado')];
    cache.refurb = E; cache.lotes = [{ id: 'L1', codigo_lote: 'C00002071', enviado_reacond: true }];
    cache.tecnicos = [{ id: 't1', nombre: 'LUIS MIGUEL BRETON', activo: true, tipo_empleado: 'tecnico' }, { id: 't2', nombre: 'FRANCIS PEREZ', activo: true, tipo_empleado: 'tecnico' }, { id: 't3', nombre: 'JOSE RAMON', activo: true, tipo_empleado: 'tecnico' }];
    __BD.tablas.equipos_refurbish = E; __BD.tablas.equipo_historial = []; __BD.tablas.equipo_piezas_pedidas = []; __BD.tablas.tareas_trabajo = [];
    E[0].notas_diagnostico = 'Pantalla con mancha en la esquina';
    __BD.tablas.equipo_fallas = [{ equipo_id: 'e1', falla_nombre: 'Cambio de pantalla', falla_corto: 'PANTALLA', creado_en: '2026-11-10T10:00:00Z' }, { equipo_id: 'e1', falla_nombre: 'Cambio de batería', falla_corto: 'BATERIA', creado_en: '2026-11-10T10:01:00Z', nota: 'Condición 79 %' },
      { equipo_id: 'e2', falla_nombre: 'Face ID', falla_corto: 'FACE ID', creado_en: '2026-11-10T10:02:00Z', adicional: true }];
    window.__hoja = null; window.open = () => { const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:-9999px;width:816px;height:1056px'; document.body.appendChild(f);
      const cw = f.contentWindow; cw.print = () => { window.__impreso = (window.__impreso || 0) + 1; }; setTimeout(() => { window.__hoja = f.contentDocument.documentElement.outerHTML; }, 900); return cw; };
    window.BC_REACOND_PISTOLA_MODO = '';
    const tb = document.createElement('div'); tb.id = 'rssTablero'; tb.innerHTML = '<div class="rss-head"><span>Lo que está parado</span></div>'; document.body.appendChild(tb);
    BayolReacondPistola.abrir();
  });
  await p.waitForTimeout(200);
  const elegir = async id => { if (await p.locator('#rpkOp').isHidden()) await p.locator('#rpkSel').click(); await p.locator(`#rpkGrupo [data-grupo="${id}"]`).click(); await p.waitForTimeout(100); };
  const scan = async imei => { await p.locator('#rpkIn').fill(imei); await p.locator('#rpkIn').press('Enter'); await p.waitForTimeout(80); };
  const ver = () => p.evaluate(() => ({ chips: [...document.querySelectorAll('#rpkGrupo [data-grupo]')].map(b => ({ t: b.innerText.replace(/\s+/g, ' ').trim(), on: b.classList.contains('on'), h: Math.round(b.getBoundingClientRect().height) })),
    sel: [...document.querySelectorAll('#rpkLista .rpk-tec')].map(s => s.value), vacio: (document.querySelector('#rpkLista .rpk-vacio') || {}).textContent || '', foco: document.activeElement && document.activeElement.id,
    sw: document.documentElement.scrollWidth - document.documentElement.clientWidth, chipsArriba: (() => { const g = document.getElementById('rpkGrupo').getBoundingClientRect(), i = document.getElementById('rpkIn').getBoundingClientRect(); return g.bottom <= i.top + 1; })() }));
  const nombres = await p.evaluate(() => ({ boton: document.querySelector('#rssTablero .rpk-btn') ? document.querySelector('#rssTablero .rpk-btn').textContent.trim() : '', titulo: document.querySelector('#rpkVentana h3').textContent.trim(),
    sel: document.getElementById('rpkSel').innerText.replace(/\s+/g, ' ').trim(), oculto: document.getElementById('rpkOp').hidden, selH: Math.round(document.getElementById('rpkSel').getBoundingClientRect().height) }));
  c(`${t} la ventana se llama «Asignar equipo» y arriba dice «Seleccionar técnico», con la lista recogida`, nombres.titulo === 'Asignar equipo' && /^Seleccionar técnico/.test(nombres.sel) && nombres.oculto && nombres.selH >= 48, nombres);
  await p.locator('#rpkSel').click(); await p.waitForTimeout(100);
  let r = await ver();
  c(`${t} al tocarlo salen los 3 técnicos con su carga, ninguno elegido`, r.chips.length === 3 && r.chipsArriba && r.chips.every(x => !x.on) && /LUIS MIGUEL 1 en reparación/.test(r.chips[0].t) && /Seleccionar técnico/.test(r.vacio), [r.chips, r.vacio]);
  c(`${t} botones de técnico de 44 px y sin barra de lado`, r.chips.every(x => x.h >= 44) && r.sw <= 0, [r.chips.map(x => x.h), r.sw]);
  await elegir('t2'); r = await ver();
  const sel2 = await p.evaluate(() => ({ t: document.getElementById('rpkSel').innerText.replace(/\s+/g, ' ').trim(), oculto: document.getElementById('rpkOp').hidden }));
  c(`${t} elegir FRANCIS recoge la lista, el botón dice «Técnico: FRANCIS PEREZ» y el cursor queda en el campo`, r.chips[1].on && !r.chips[0].on && r.foco === 'rpkIn' && /para FRANCIS/.test(r.vacio) && sel2.oculto && /Técnico: FRANCIS PEREZ/.test(sel2.t), [r.chips.map(x => x.on), r.foco, sel2]);
  for (const im of ['353776390128674', '358497891713485', '354506124750025', '353011095998944']) await scan(im);
  r = await ver();
  c(`${t} los 3 evaluados van a FRANCIS; el que ya está en reparación no lleva técnico`, r.sel.length === 3 && r.sel.every(v => v === 't2'), r.sel);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/pistola-tecnico-${W}.png` });
  await elegir('t3'); r = await ver();
  c(`${t} cambiar a JOSE cambia también los ya escaneados`, r.sel.every(v => v === 't3') && r.chips[2].on, r.sel);
  await p.locator('#rpkLista .rpk-tec').first().selectOption('t1'); await scan('353011095998945'); r = await ver();
  c(`${t} una fila se puede cambiar a mano; el siguiente escaneado sigue yendo a JOSE`, r.sel[0] === 't3' && r.sel.filter(v => v === 't1').length === 1, r.sel);
  await elegir('t3'); r = await ver();
  c(`${t} tocar JOSE otra vez lo quita, vuelve a la sugerencia y la lista queda abierta`, r.chips.every(x => !x.on) && r.sel.every(v => v) && !(await p.locator('#rpkOp').isHidden()), [r.chips.map(x => x.on), r.sel]);
  await elegir('t2');
  await p.locator('#rpkAplicar').click(); await p.waitForTimeout(600);
  const fin = await p.evaluate(() => ({ eq: __BD.tablas.equipos_refurbish.filter(e => ['e1', 'e2', 'e3', 'e5'].includes(e.id)).map(e => e.estado_evaluacion + ':' + e.tecnico_asignado_id), hist: __BD.tablas.equipo_historial.map(h => h.accion), av: window.__avisos }));
  c(`${t} «Aplicar»: los 4 quedan en reparación con FRANCIS y con historial`, fin.eq.every(x => x === 'en_proceso:t2') && fin.hist.filter(h => /Asignado a FRANCIS/.test(h)).length === 4, fin);
  const of = await p.evaluate(() => { const b = document.getElementById('rpkHoja'); return b ? { txt: b.innerText.replace(/\s+/g, ' '), h: Math.round(b.querySelector('[data-imp]').getBoundingClientRect().height) } : null; });
  c(`${t} al aplicar se ofrece «Imprimir hoja» (4 equipos a FRANCIS)`, of && /4 equipos entregados a FRANCIS/.test(of.txt) && of.h >= 54, of);
  await p.locator('#rpkHoja [data-imp]').click(); await p.waitForTimeout(1500);
  const hoja = await p.evaluate(() => ({ html: window.__hoja || '', impreso: window.__impreso || 0, abierta: !!document.getElementById('rpkHoja') }));
  const txt = hoja.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  c(`${t} la hoja trae técnico, los 4 IMEI y el resumen por modelo`, /FRANCIS PEREZ/.test(txt) && ['353776390128674', '358497891713485', '354506124750025', '353011095998945'].every(i => txt.includes(i)) && /4 × CELULAR IPHONE 12 PRO MAX 128GB /.test(txt) && !/128GB 128GB/.test(txt) && txt.indexOf('353776390128674') < txt.indexOf('358497891713485'), txt.slice(0, 300));
  c(`${t} la hoja trae las fallas del diagnóstico, con nota y «agregada»`, /Cambio de pantalla/.test(txt) && /Cambio de batería/.test(txt) && /Condición 79 %/.test(txt) && /Face ID \(agregada\)/.test(txt) && /Pantalla con mancha/.test(txt) && /Fallas a reparar 3/.test(txt), txt.match(/Fallas a reparar \d+/));
  c(`${t} el equipo sin fallas dice «Sin fallas anotadas»; firmas y se manda a imprimir`, (txt.match(/Sin fallas anotadas/g) || []).length === 2 && /Recibido por \(FRANCIS PEREZ\)/.test(txt) && hoja.impreso === 1 && !hoja.abierta, [(txt.match(/Sin fallas anotadas/g) || []).length, hoja.impreso]);
  if (SHOTS && W >= 1280) { const q = await b.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2 }); await q.setContent(hoja.html.replace(/<script[\s\S]*?<\/script>/, '')); await q.screenshot({ path: `${SHOTS}/hoja-entrega.png`, fullPage: true }); await q.close(); }
  c(`${t} sin errores`, errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
