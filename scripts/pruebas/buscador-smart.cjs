// 10-nov-2026 · Ventana «Artículos Info Plus» smart: contadores en los filtros y fallas que se tocan. Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/buscador-smart.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const [W, H, off] of [[390, 844, false], [1280, 800, false], [1280, 800, true]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: W < 500, isMobile: W < 500 });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  if (off) await p.addInitScript(() => localStorage.setItem('bc_ab_smart_off', '1'));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const o = {};
    sessionUser = { id: 'a1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    const A = (c, d) => ({ codigo: String(c), descripcion: d, marca: 'IPHONE', precio: 2500, costo: 900, existencia: 0 });
    cache.infoplusArticulos = [A(1014, 'CELULAR IPHONE 14 PLUS 256GB'), A(1056, 'COVER IPHONE 14 PLUS / 15 PLUS'), A(1279, 'MARCO IPHONE 14 PLUS NEGRO MIDNIGHT'), A(1280, 'HOUSING IPHONE 14 PLUS AZUL'),
      A(1350, 'FLEX DE AUDIO 14 PLUS IPHONE'), A(1500, 'PANTALLA IPHONE 14 PLUS INCELL'), A(1501, 'PANTALLA IPHONE 14 PLUS OLED'), A(1600, 'BATERIA IPHONE 14 PLUS'), A(1700, 'TAPA IPHONE 14 PLUS NEGRA'),
      A(1800, 'BATERIA SAMSUNG A12'), A(1801, 'PANTALLA SAMSUNG A12')];
    _ensureInfoplusArticulos = async () => cache.infoplusArticulos;
    const sp = t => `<span style="display:inline-block;background:#fee2e2;color:#991b1b;font-size:11px;font-weight:600;padding:3px 9px;border-radius:10px;margin:2px;"><i class="ti ti-alert-triangle"></i> ${t}</span>`;
    const ref = '<div class="ab-ref-fallas"><span class="t">Fallas del equipo</span>' + ['CAMBIAR MARCO', 'PULIR PANTALLA', 'SUBIR BATERIA', 'TAPA ROTA', 'CAMBIAR BOCINA'].map(sp).join('') + '</div>';
    let elegido = null; try { await abrirBuscadorArticulos(null, a => { elegido = a && a.codigo; }, ref, 'IPHONE 14 PLUS'); } catch (e) {} await w(700);
    const chips = () => [...document.querySelectorAll('#abChips .ab-chip')].filter(c => c.offsetParent).map(c => c.textContent.replace(/\s+/g, ' ').trim());
    const fallas = () => [...document.querySelectorAll('.ab-ref-fallas span:not(.t)')].map(c => c.textContent.replace(/\s+/g, ' ').trim() + (c.classList.contains('on') ? '*' : '') + (c.classList.contains('cero') ? '0' : ''));
    const filas = () => [...document.querySelectorAll('#artBuscModalLista .ab-card')].map(c => c.dataset.cod);
    o.chips = chips(); o.fallas = fallas(); o.filas = filas().length; o.smart = !!document.querySelector('.ab-falla');
    const F = t => [...document.querySelectorAll('.ab-falla')].find(x => x.dataset.falla === t);
    if (o.smart) {
      const r0 = F('CAMBIAR MARCO').getBoundingClientRect(); o.altoFalla = Math.round(r0.height); o.altoChip = Math.round(document.querySelector('#abChips .ab-chip').getBoundingClientRect().height);
      F('CAMBIAR MARCO').click(); await w(150); o.marco = filas(); o.marcoChips = chips(); o.marcoFallas = fallas(); o.cuenta = document.getElementById('abCount').textContent;
      F('TAPA ROTA').click(); await w(150); o.tapa = filas();
      F('TAPA ROTA').click(); await w(150); o.sinFalla = filas().length;
      F('CAMBIAR BOCINA').click(); await w(150); o.bocina = document.getElementById('artBuscModalLista').textContent.replace(/\s+/g, ' ').trim(); const bt = document.querySelector('#artBuscModalLista button'); o.altoVer = bt ? Math.round(bt.getBoundingClientRect().height) : 0; if (bt) bt.click(); await w(150); o.trasVer = filas().length;
      _artBuscCat('pantalla'); await w(150); o.pant = filas(); o.pantChips = chips();
      const i = document.getElementById('artBuscModal'); i.value = 'SAMSUNG'; i.dispatchEvent(new Event('input', { bubbles: true })); await w(150); o.samsung = { chips: chips(), filas: filas(), fallas: fallas() };
      document.querySelector('#artBuscModalLista .ab-elegir').click(); await w(200); o.elegido = elegido;
    }
    const e = document.documentElement; o.sw = e.scrollWidth - e.clientWidth; return o; });
  if (SHOTS && !off) { await p.evaluate(async () => { try { await abrirBuscadorArticulos(null, () => {}, document.querySelector('.ab-ref-fallas') ? '' : '', 'IPHONE 14 PLUS'); } catch (e) {} }); }
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}${off ? ' apagado' : ''}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  if (off) { c('apagado: sin contadores ni fallas tocables', !r.smart && r.chips.join('|') === 'Todos|Celulares|Pantallas|Baterías|Flex|Cámaras|IC|Herramientas|Accesorios' && r.filas === 9, r.chips); }
  else {
    c('filtros con contador; los vacíos se esconden', r.chips.join('|') === 'Todos9|Celulares1|Pantallas2|Baterías1|Flex1|Accesorios1', r.chips);
    c('fallas con contador (bocina en 0)', r.fallas.join('|') === 'CAMBIAR MARCO2|PULIR PANTALLA2|SUBIR BATERIA1|TAPA ROTA2|CAMBIAR BOCINA00', r.fallas);
    c('tocar «CAMBIAR MARCO» deja marco y housing del modelo', r.marco.join() === '1279,1280' && /^2 artículos/.test(r.cuenta) && r.marcoFallas[0] === 'CAMBIAR MARCO2*', [r.marco, r.cuenta, r.marcoFallas[0]]);
    c('con la falla, los filtros cuentan solo eso', r.marcoChips.join('|') === 'Todos2', r.marcoChips);
    c('otra falla reemplaza; otro toque la quita', r.tapa.join() === '1280,1700' && r.sinFalla === 9, [r.tapa, r.sinFalla]);
    c('falla sin piezas: aviso + «Ver todos»', /No hay resultados.*CAMBIAR BOCINA/.test(r.bocina) && r.altoVer >= 44 && r.trasVer === 9, [r.bocina.slice(0, 70), r.altoVer, r.trasVer]);
    c('filtro Pantallas sigue igual', r.pant.join() === '1500,1501' && /Pantallas2/.test(r.pantChips.join()), r.pant);
    c('al cambiar el texto: se mantiene el filtro activo y se recuenta', r.samsung.filas.join() === '1801' && r.samsung.chips.join('|') === 'Todos2|Pantallas1|Baterías1', r.samsung);
    c('«Elegir» sigue funcionando', r.elegido === '1801', r.elegido);
    if (W < 500) c('celular: fallas y filtros ≥ 44 px', r.altoFalla >= 44 && r.altoChip >= 44, [r.altoFalla, r.altoChip]);
  }
  c('sin desplazamiento horizontal', r.sw <= 1, r.sw); c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0); })();
