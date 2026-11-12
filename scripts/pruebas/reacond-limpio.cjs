// 12-nov-2026 · Reacondicionados «limpio» (bc-reacond-limpio.css): equipos del lote en filas compactas y un solo color de acción.
// Correr: PUERTO=8788 node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/reacond-limpio.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
 for (const [W, apagar] of [[390, false], [1280, false], [390, true]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('bc_reacond_vista', 'lista'); } catch (e) {} }); // estas pruebas son de la vista Lista
  if (apagar) await ctx.addInitScript(() => { try { localStorage.setItem('bc_reacond_limpio_off', '1'); } catch (e) {} });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1')) return r.continue(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  await p.evaluate(() => {
    sessionUser = { id: 'u', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; const al = document.getElementById('appLoader'); if (al) al.style.display = 'none';
    window.loadAll = async () => {}; const hace = d => new Date(Date.now() - d * 86400000).toISOString();
    cache.tecnicos = [{ id: 't1', nombre: 'LUIS MIGUEL BRETON', activo: true, tipo_empleado: 'tecnico' }];
    cache.lotes = [{ id: 'L', codigo_lote: 'C00002071', enviado_reacond: true, fecha_compra: hace(9) }];
    const est = ['pendiente', 'evaluado', 'evaluado', 'en_proceso', 'tecnico_recibio', 'listo_revision', 'listo_venta', 'listo_venta', 'vendido', 'evaluado'];
    cache.refurb = est.map((e, i) => ({ id: 'L' + i, lote_id: 'L', modelo: 'CELULAR IPHONE 12 PRO MAX', capacidad: '128GB', color: 'Negro', imei: '35301309520100' + i, estado_evaluacion: e, tecnico_asignado_id: i > 2 && i < 9 ? 't1' : null, fecha_asignacion: hace(3), creado_en: hace(8), costo_compra: 9000 + i * 100 }));
    cache.tareas = []; cache.piezasReacond = []; nav('refurb'); try { cambiarMainTabReacond('lotes'); } catch (e) {}
  });
  await p.waitForTimeout(1500);
  const lista = await p.evaluate(() => { const o = {}; o.clase = document.documentElement.classList.contains('bc-rlim');
    const bt = [...document.querySelectorAll('#reacondListaLotes .reacond-overview-card > div:first-child .btn')].filter(x => x.offsetParent);
    o.botones = bt.map(x => Math.round(x.getBoundingClientRect().height)); o.verde = bt.some(x => /rgb\(16, 185|rgb\(5, 150|rgb\(34, 197/.test(getComputedStyle(x).backgroundImage + getComputedStyle(x).backgroundColor));
    const d = document.documentElement; o.sw = d.scrollWidth - d.clientWidth; return o; });
  await p.evaluate(() => { reacondTabActual = 'todos'; abrirLoteReacond('L'); }); await p.waitForTimeout(1200);
  const r = await p.evaluate(async () => { const o = {}; const L = document.getElementById('reacondEquiposLista'); const cards = [...L.querySelectorAll('.bcf-card')];
    o.n = cards.length; o.grid = getComputedStyle(cards[0]).display; o.altos = cards.map(x => Math.round(x.getBoundingClientRect().height));
    o.img = Math.round(cards[0].querySelector('.bcf-media').getBoundingClientRect().height);
    o.abrir = cards.map(x => Math.round(x.querySelector('.bcf-abrir').getBoundingClientRect().height)); o.chk = cards.map(x => Math.round(x.querySelector('.bcf-chk-wrap').getBoundingClientRect().height));
    o.cortado = cards.filter(x => x.scrollWidth > x.clientWidth + 1).length;
    o.datos = ['.bcf-tit', '.bcf-sub', '.bcf-tag', '.bcf-per', '.rcu-res'].every(s => { const e = cards[3].querySelector(s); return e && e.offsetParent && e.getBoundingClientRect().width > 10; });
    const k = cards[1].querySelector('.bcf-chk'); k.click(); await new Promise(r => setTimeout(r, 80)); o.marca = k.checked && cards[1].classList.contains('bcf-sel'); k.click();
    const d = document.documentElement; o.sw = d.scrollWidth - d.clientWidth;
    const oscuros = [...document.querySelectorAll('#reacondDetalleLote .rcu-barra .btn.btn-dark')].filter(x => x.offsetParent).map(x => getComputedStyle(x).backgroundColor); o.oscuros = oscuros; return o; });
  const t = `[${W}${apagar ? ' apagada' : ''}]`;
  if (apagar) { c(`${t} sin la clase y con las tarjetas de antes`, lista.clase === false && r.grid !== 'grid' && Math.max(...r.altos) > 300, [lista.clase, r.grid, Math.max(...r.altos)]); }
  else {
    c(`${t} capa encendida desde el primer pintado`, lista.clase === true);
    c(`${t} cabecera: botones de 44 px y ninguno verde`, lista.botones.every(h => h >= 44) && !lista.verde, lista.botones);
    c(`${t} equipos en filas compactas`, r.grid === 'grid' && r.n === 10 && Math.max(...r.altos) <= (W < 500 ? 220 : 96), [r.grid, r.altos]);
    c(`${t} foto chica y datos a la vista`, r.img <= 48 && r.datos, [r.img, r.datos]);
    c(`${t} «Abrir» y casilla de 44 px; se puede marcar`, r.abrir.every(h => h >= 44) && r.chk.every(h => h >= 44) && r.marca, [r.abrir[0], r.chk[0], r.marca]);
    c(`${t} herramientas del lote sin botones oscuros`, r.oscuros.every(x => /255, 255, 255/.test(x)), r.oscuros);
    c(`${t} nada cortado ni barra horizontal`, r.cortado === 0 && r.sw <= 0 && lista.sw <= 0, [r.cortado, r.sw, lista.sw]);
  }
  c(`${t} sin errores de JS`, errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
