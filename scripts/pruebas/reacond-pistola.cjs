// 12-nov-2026 · Reacondicionados «Pasar con pistola» (taller-reacond-pistola.js): cada equipo avanza a su paso siguiente,
// en lote, y el despacho usa la ventana de siempre con solo los escaneados. Datos inventados.
// Correr: PUERTO=8788 node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/reacond-pistola.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
 for (const [W, H] of [[390, 844], [1280, 800]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: W < 500, isMobile: W < 500 });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1') || (SHOTS && /tabler|fonts\.g/.test(u))) return r.continue(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const correr = async () => await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const o = {};
    sessionUser = { id: 'a1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true; tienePermiso = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    loadAll = async () => {}; asignarFallasSinDueno = async () => {}; window.__avisos = []; toast = m => window.__avisos.push(m); toastError = m => window.__avisos.push('ERR ' + m);
    const eq = (id, imei, est, extra) => Object.assign({ id, imei, modelo: 'CELULAR IPHONE 12 PRO MAX', capacidad: '128GB', lote_id: 'L1', estado_evaluacion: est, articulo_codigo: '2060', creado_en: '2026-11-01T10:00:00Z' }, extra || {});
    const E = [eq('e1', '353011095998941', 'evaluado'), eq('e2', '353011095998942', 'en_proceso', { tecnico_asignado_id: 't1' }), eq('e3', '353011095998943', 'tecnico_recibio', { tecnico_asignado_id: 't1' }),
      eq('e4', '353011095998944', 'listo_revision', { tecnico_asignado_id: 't2' }), eq('e5', '353011095998945', 'listo_venta', { tecnico_asignado_id: 't2' }), eq('e6', '353011095998946', 'listo_venta', { tecnico_asignado_id: 't2' }),
      eq('e7', '353011095998947', 'pendiente'), eq('e8', '353011095998948', 'vendido'), eq('e9', '353011095998949', 'evaluado')];
    cache.refurb = E; cache.lotes = [{ id: 'L1', codigo_lote: 'C00002071', enviado_reacond: true }];
    cache.tecnicos = [{ id: 't1', nombre: 'LUIS MIGUEL', activo: true, tipo_empleado: 'tecnico' }, { id: 't2', nombre: 'FRANCIS P', activo: true, tipo_empleado: 'tecnico' }];
    __BD.tablas.equipos_refurbish = E; __BD.tablas.equipo_historial = []; __BD.tablas.equipo_piezas_pedidas = [];
    __BD.tablas.tareas_trabajo = [{ id: 'k1', tipo: 'equipo', ref_id: 'e2', estado: 'pendiente' }, { id: 'k2', tipo: 'equipo', ref_id: 'e2', estado: 'hecha' }];
    o.hay = !!window.BayolReacondPistola; if (!o.hay) return o;
    const tb = document.createElement('div'); tb.id = 'rssTablero'; tb.innerHTML = '<div class="rss-head"><span>Lo que está parado</span></div>'; document.body.appendChild(tb); await w(80);
    const bt = tb.querySelector('.rpk-btn'); o.botonTablero = !!bt && bt.getBoundingClientRect().height >= 44; tb.remove();
    const P = BayolReacondPistola; window.BC_REACOND_PISTOLA_MODO = 'completo'; o.pasosCompleto = E.map(e => P.paso(e).k); window.BC_REACOND_PISTOLA_MODO = window.__modoFoto || ''; o.pasos = E.map(e => P.paso(e).k);
    o.buscaCorto = (P.buscar('98941').e || {}).id; o.buscaNada = P.buscar('00000111').error; o.buscaPoco = P.buscar('12').error;
    P.abrir(); await w(120);
    const inp = document.getElementById('rpkIn'), scan = async t => { inp.value = t; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await w(60); };
    o.foco = document.activeElement === inp; o.altoIn = Math.round(inp.getBoundingClientRect().height); o.fuente = getComputedStyle(inp).fontSize;
    for (const e of E) await scan(e.imei);
    await scan(E[0].imei); o.repetido = window.__avisos.includes('Ya está en la lista');
    await scan('999999999999999'); o.noEsta = window.__avisos.some(a => /No está en Reacondicionados/.test(a));
    await w(200);
    const filas = [...document.querySelectorAll('#rpkLista .rpk-fila')]; o.nFilas = filas.length;
    o.pasosTxt = filas.map(f => f.querySelector('.rpk-paso').textContent).reverse();
    o.avisoTareas = /1 tarea sin marcar/.test(document.getElementById('rpkLista').innerText);
    o.sugiereTec = [...document.querySelectorAll('#rpkLista .rpk-tec')].map(s => s.value);
    o.boton = document.getElementById('rpkAplicar').textContent; o.altoBoton = Math.round(document.getElementById('rpkAplicar').getBoundingClientRect().height);
    o.chicos = [...document.querySelectorAll('#rpkVentana button, #rpkVentana select, #rpkVentana input')].filter(x => x.offsetParent && x.getBoundingClientRect().height < 44).map(x => (x.className || x.id) + ':' + Math.round(x.getBoundingClientRect().height));
    const box = document.querySelector('#rpkVentana .modal-box').getBoundingClientRect(); o.cabe = box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight + 1;
    const d = document.documentElement; o.sw = d.scrollWidth - d.clientWidth;
    if (window.__soloFoto) { if (window.__modoFoto) document.getElementById('rpkLista').scrollTop = 99999; return o; }
    // sin técnico no aplica
    const sel = document.querySelector('#rpkLista .rpk-tec'); const antes = sel.value; sel.value = ''; sel.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('rpkAplicar').click(); await w(150); o.frenaSinTec = window.__avisos.some(a => /Falta el técnico/.test(a)) && E.every(e => !(e.id === 'e9' && e.estado_evaluacion !== 'evaluado'));
    const s2 = document.querySelector('#rpkLista .rpk-tec'); s2.value = antes || 't1'; s2.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('rpkAplicar').click(); await w(900);
    o.estados = E.map(e => e.id + ':' + e.estado_evaluacion); o.tecE1 = E[0].tecnico_asignado_id; o.fechaTerm = !!E[1].fecha_terminado;
    o.hist = __BD.tablas.equipo_historial.map(h => h.equipo_id + ':' + h.estado_nuevo).sort();
    o.cerrada = !document.getElementById('rpkVentana');
    const dsp = document.getElementById('rssDespacho'); o.despAbierto = !!dsp;
    if (dsp) { o.marcados = [...dsp.querySelectorAll('.rss-chk[data-id]')].filter(x => x.checked).map(x => x.getAttribute('data-id')).sort(); o.contador = dsp.querySelector('[data-n]').textContent; dsp.remove(); }
    return o; });
  if (SHOTS) { await p.evaluate(() => { window.__soloFoto = 1; }); await correr(); await p.screenshot({ path: `${SHOTS}/pistola-${W}.png` }); await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(3500); await p.evaluate(() => { window.__soloFoto = 1; window.__modoFoto = 'completo'; }); await correr(); await p.screenshot({ path: `${SHOTS}/pistola-completo-${W}.png` }); await p.evaluate(() => { window.__soloFoto = 0; }); await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(3500); }
  const r = await correr();
  c(`[${W}] la capa cargó`, r.hay === true);
  c(`[${W}] botón «Pasar con pistola» en el tablero (44 px)`, r.botonTablero === true);
  c(`[${W}] paso según estado`, JSON.stringify(r.pasos) === JSON.stringify(['asignar', 'listo', 'listo', 'listo', 'despachar', 'despachar', 'evaluar', 'nada', 'asignar']), r.pasos);
  c(`[${W}] modo completo no salta pasos`, JSON.stringify(r.pasosCompleto) === JSON.stringify(['asignar', 'recibio', 'calidad', 'aprobar', 'despachar', 'despachar', 'evaluar', 'nada', 'asignar']), r.pasosCompleto);
  c(`[${W}] busca por los últimos 5 y avisa lo que no encuentra`, r.buscaCorto === 'e1' && /No está/.test(r.buscaNada) && /al menos 5/.test(r.buscaPoco), [r.buscaCorto, r.buscaNada, r.buscaPoco]);
  c(`[${W}] campo: foco, 48 px y 16 px`, r.foco && r.altoIn >= 48 && r.fuente === '16px', [r.foco, r.altoIn, r.fuente]);
  c(`[${W}] 9 escaneados, sin repetir, y avisa el que no está`, r.nFilas === 9 && r.repetido && r.noEsta, [r.nFilas, r.repetido, r.noEsta]);
  c(`[${W}] cada fila dice su paso`, JSON.stringify(r.pasosTxt) === JSON.stringify(['Entregar a técnico', 'Terminado', 'Terminado', 'Terminado', 'Despachar', 'Despachar', 'Falta evaluar', 'Ya despachado', 'Entregar a técnico']), r.pasosTxt);
  c(`[${W}] avisa tareas sin marcar y sugiere técnico`, r.avisoTareas && r.sugiereTec.length === 2 && r.sugiereTec.every(Boolean), [r.avisoTareas, r.sugiereTec]);
  c(`[${W}] botón «Aplicar 7» de 54 px; nada menor de 44`, r.boton === 'Aplicar 7' && r.altoBoton >= 54 && r.chicos.length === 0, [r.boton, r.altoBoton, r.chicos]);
  c(`[${W}] cabe y sin barra horizontal`, r.cabe && r.sw <= 0, [r.cabe, r.sw]);
  c(`[${W}] sin técnico no aplica`, r.frenaSinTec === true);
  c(`[${W}] estados después de aplicar`, JSON.stringify(r.estados) === JSON.stringify(['e1:en_proceso', 'e2:listo_venta', 'e3:listo_venta', 'e4:listo_venta', 'e5:listo_venta', 'e6:listo_venta', 'e7:pendiente', 'e8:vendido', 'e9:en_proceso']) && !!r.tecE1 && r.fechaTerm, r.estados);
  c(`[${W}] historial de los 5 movidos`, JSON.stringify(r.hist) === JSON.stringify(['e1:en_proceso', 'e2:listo_venta', 'e3:listo_venta', 'e4:listo_venta', 'e9:en_proceso']), r.hist);
  c(`[${W}] abre el despacho de siempre con solo los 2 escaneados`, r.cerrada && r.despAbierto && JSON.stringify(r.marcados) === JSON.stringify(['e5', 'e6']) && r.contador === '2', [r.despAbierto, r.marcados, r.contador]);
  c(`[${W}] sin errores de JS`, errs.length === 0, errs);

  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
