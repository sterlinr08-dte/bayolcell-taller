// 09-nov-2026 · Prefactura compacta (bc-prefactura-compacta.js/.css). Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/prefactura-compacta.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const [W, H, off] of [[390, 844, false], [1280, 900, false], [1440, 900, false], [390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  if (off) await p.addInitScript(() => localStorage.setItem('bc_pfc_off', '1'));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const o = {};
    sessionUser = { id: 't1', nombre: 'Cajera', usuario: 'caja', rol: 'tecnico', _tipo: 'tecnico' }; isAdminUser = () => false;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    document.querySelectorAll('.view.active').forEach(x => x.classList.remove('active')); document.getElementById('v-recepcion').classList.add('active');
    try { _rpInit(); } catch (e) {}
    cache.clientes = [{ id: 'c1', nombre: 'Ana Rodríguez', whatsapp: '8095551234', cedula: '00112345678' }];
    await w(600);
    _rpState.nivel = 1; _rpState.items = [{ cod: '2139', desc: 'BATERIA SAMSUNG A12', precio: 1500, cant: 1, niveles: { 1: 1500, 2: 600 } }, { cod: '3301', desc: 'PROTECTOR CRISTAL IPHONE 13 DE 6.1', precio: 350, cant: 2, niveles: { 1: 350, 2: 150 } }, { cod: '1161', desc: 'ENVIO - MENSAJERIA', precio: 100, cant: 1 }];
    _rpRenderCart(); _rpRenderResumen(); await w(1500);
    const v = document.getElementById('v-recepcion'), vis = e => !!(e && e.offsetParent !== null && e.getBoundingClientRect().height > 0);
    o.on = document.documentElement.classList.contains('bc-pfc');
    o.nombres = [...v.querySelectorAll('.bcpf-it .dnb')].map(e => e.textContent.trim());
    o.pildora = vis(v.querySelector('.pfc-cond')) ? v.querySelector('.pfc-cond').textContent.trim() : null;
    o.almVisible = vis(document.getElementById('rxAlmacen'));
    const its = [...v.querySelectorAll('.bcpf-it')]; o.altoArt = its.map(e => Math.round(e.getBoundingClientRect().height));
    o.descVisible = vis(v.querySelector('.bcpf-it .dc'));
    const busc = v.querySelector('.bcpf-busc'), fila = v.querySelector('.bcpf-rapidos');
    o.buscArriba = busc.getBoundingClientRect().top < fila.getBoundingClientRect().top;
    const wa = document.getElementById('c_whatsapp'), nom = document.getElementById('c_nombre');
    o.waPrimero = wa.getBoundingClientRect().top < nom.getBoundingClientRect().top - 5 || (Math.abs(wa.getBoundingClientRect().top - nom.getBoundingClientRect().top) < 5 && wa.getBoundingClientRect().left < nom.getBoundingClientRect().left);
    o.cedVisible = vis(document.getElementById('c_cedula'));
    o.nuevaArriba = vis(v.querySelector('.pfc-nueva'));
    o.enResumen = !!v.querySelector('.bcpro-res #c_whatsapp');
    const peq = [...v.querySelectorAll('button,input,select,textarea,summary')].filter(e => { if (!vis(e) || e.closest('.bcpf-it .stp')) return false; if (/checkbox|radio/.test(e.type) && e.closest('label') && e.closest('label').getBoundingClientRect().height >= 44) return false; const r = e.getBoundingClientRect(); return r.height < 44; }).map(e => (e.className || e.id || e.tagName + '<' + (e.parentElement.className || e.parentElement.tagName)).toString().slice(0, 40) + ':' + Math.round(e.getBoundingClientRect().height));
    o.peq = peq; o.sw = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    // Interacciones
    const cond = v.querySelector('.pfc-cond'); if (vis(cond)) { cond.click(); await w(100); o.abreAlm = vis(document.getElementById('rxAlmacen')); cond.click(); await w(100); }
    const pct = v.querySelector('.bcpf-it .pfc-pct'); if (vis(pct)) { pct.click(); await w(100); o.pctAbre = vis(v.querySelector('.bcpf-it .dc')) && document.activeElement.classList.contains('dc'); }
    const pre = [...v.querySelectorAll('.bcpf-it .pin')][1]; o.precioOk = pre && pre.value === '350.00';
    _rpCant(1, 3); await w(300); o.cantOk = _rpState.items[1].cant === 3 && v.querySelectorAll('.bcpf-it')[1].dataset.pfc === '1';
    wa.value = '809555123'; wa.dispatchEvent(new Event('input')); await w(100); o.antesDe10 = nom.value;
    wa.value = '809-555-1234'; wa.dispatchEvent(new Event('input', { bubbles: true })); await w(200);
    o.autollena2 = nom.value; await w(1400); o.cedSale = vis(document.getElementById('c_cedula'));
    o.descOriginal = _rpState.items[0].desc;
    return o; });
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/pfc-${W}${off ? '-apagada' : ''}.png`, fullPage: true });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}${off ? ' apagada' : ''}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  if (off) {
    c('apagada: sin capa', !r.on); c('apagada: nombres como vienen', r.nombres[0] === 'BATERIA SAMSUNG A12', r.nombres[0]); c('apagada: sin píldora', r.pildora === null);
  } else {
    c('nombres sin mayúsculas', r.nombres.join('|') === 'Bateria Samsung A12|Protector Cristal iPhone 13 de 6.1|Envio - Mensajeria', r.nombres);
    c('a Info Plus va el nombre original', r.descOriginal === 'BATERIA SAMSUNG A12', r.descOriginal);
    c('buscador encima de los accesos', r.buscArriba); c('WhatsApp primero', r.waPrimero); c('«Nueva» arriba', r.nuevaArriba);
    c('precio y cantidad siguen funcionando', r.precioOk && r.cantOk, [r.precioOk, r.cantOk]);
    c('WhatsApp de cliente existente llena el nombre (al llegar a 10 cifras)', r.antesDe10 === '' && r.autollena2 === 'Ana Rodríguez', [r.antesDe10, r.autollena2]);
    if (W < 761) {
      c('píldora Precio · Almacén · Vendedor', /·/.test(r.pildora || ''), r.pildora); c('almacén plegado', !r.almVisible); c('píldora abre el almacén', r.abreAlm);
      c('cédula plegada', !r.cedVisible); c('cédula sale si el cliente la tiene', r.cedSale);
      c('descuento plegado', !r.descVisible); c('«%» abre el descuento y pone el cursor', r.pctAbre);
      c('artículo ≤ 170 px de alto (antes ~260)', Math.max(...r.altoArt) <= 170, r.altoArt);
    } else c('PC: descuento a la vista', r.descVisible);
    if (W >= 1440) c('PC ancha: cliente en el Resumen', r.enResumen); else c('sin columna Resumen: cliente en su sitio', !r.enResumen);
  }
  c('botones ≥ 44 px', r.peq.length === 0, r.peq); c('sin desplazamiento horizontal', r.sw <= 1, r.sw); c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0); })();
