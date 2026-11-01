// 1-nov-2026 · Prefactura: el artículo entra AL INSTANTE y las preguntas a Info Plus (¿lleva IMEI?, existencia) corren detrás.
// Info Plus se simula con 2 s de demora. Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/prefactura-instantanea.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname;
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [1280, 390]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); return r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => {
    const out = {}; const w = ms => new Promise(r => setTimeout(r, ms));
    sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    document.querySelectorAll('.view.active').forEach(x => x.classList.remove('active')); document.getElementById('v-recepcion').classList.add('active');
    try { _rpInit(); } catch (e) {}
    const avisos = []; toast = (m) => avisos.push(String(m)); toastError = (m) => avisos.push('ERR ' + m);
    try { localStorage.removeItem('bc_rp_serial'); } catch (e) {}
    // Info Plus simulado, 2 s de demora. Existencias: 2139 → 3 en almacén 1; 3001 → 0; 5005 (iPhone) → 1.
    const EX = { 2139: { 1: 3 }, 3001: { 1: 0 }, 5005: { 1: 1 } }, SERIAL = { 2139: false, 3001: false, 5005: true };
    let llamadas = 0;
    supabaseClient.functions.invoke = async (fn, { body }) => { llamadas++; await w(2000);
      if (fn === 'infoplus-existencia-art') return { data: { ok: true, existencias: EX[body.codarticulo] || {} } };
      if (fn === 'infoplus-imei-almacen' && body.pregunta === 'serial') return { data: { ok: true, serial: !!SERIAL[body.codarticulo] } };
      return { data: { ok: true } }; };
    cache.infoplusArticulos = [
      { codigo: '2139', descripcion: 'BATERIA SAMSUNG A10', niveles: { 1: 1500 }, precio: 1500, existencias: { 1: 3 } },
      { codigo: '3001', descripcion: 'MICA 9D', niveles: { 1: 200 }, precio: 200, existencias: { 1: 5 } },   // la caché dice 5, Info Plus dirá 0
      { codigo: '5005', descripcion: 'EQUIPO USADO XR 64GB', niveles: { 1: 15000 }, precio: 15000, existencias: { 1: 1 } } ]; // nombre sin «celular»: Info Plus dirá que lleva IMEI
    document.getElementById('rxAlmacen').value = '1'; _rpState.items = []; _rpRenderCart(); await w(100);
    // 1) Entra al instante
    const t0 = performance.now(); const pr = _rpAgregarArticulo(cache.infoplusArticulos[0]); await pr; const t1 = performance.now();
    out.msHastaLinea = Math.round(t1 - t0); out.lineaVisible = !!document.querySelector('#rxArticulos') && _rpState.items.length === 1;
    out.etiqueta = !!document.querySelector('#rxArticulos .rx-comprobando, #rxArticulos .srv.chk');
    // 2) Guardar mientras comprueba: espera (no se salta el candado)
    const tg = performance.now(); let gProbs = null; const origCrear = window._rpCrearPrefactura; window._rpCrearPrefactura = async () => { gProbs = 'creó'; _rpState.estado = 'sincronizada'; return true; };
    _rpState.soloPrefactura = true; await _rpGuardar(false); out.msGuardar = Math.round(performance.now() - tg); out.guardoTrasEsperar = gProbs === 'creó'; out.avisoComprobando = avisos.some(a => /Comprobando/.test(a));
    window._rpCrearPrefactura = origCrear; _rpState.estado = null;
    await w(100); out.etiquetaSeVa = !document.querySelector('#rxArticulos .rx-comprobando, #rxArticulos .srv.chk');
    // 3) Sin stock real: la línea entra, luego se pone roja y Guardar no deja
    _rpState.items = []; _rpRenderCart(); avisos.length = 0;
    await _rpAgregarArticulo(cache.infoplusArticulos[1]); out.sinStockEntra = _rpState.items.length === 1; await w(2300);
    out.sinStockRojo = /Solo hay 0/.test(document.querySelector('#rxArticulos').textContent); out.sinStockAviso = avisos.some(a => /Sin stock/.test(a));
    out.sinStockBloquea = _rpProblemasFactura().length > 0;
    // 4) Lleva IMEI aunque el nombre no diga «celular»: entra como normal, Info Plus la convierte a línea con IMEI
    _rpState.items = []; _rpRenderCart();
    await _rpAgregarArticulo(cache.infoplusArticulos[2]); out.imeiProvisional = !!_rpState.items[0].serial; await w(2300);
    out.imeiFinal = _rpState.items[0].serial === true && Array.isArray(_rpState.items[0].imeis) && !!document.getElementById('rpImei_0');
    out.imeiRecordado = (() => { try { return JSON.parse(localStorage.getItem('bc_rp_serial')).v['5005'] === true; } catch (e) { return false; } })();
    // 5) Línea quitada antes de que Info Plus conteste: no revive
    _rpState.items = []; _rpRenderCart(); const a2 = { codigo: '7777', descripcion: 'CABLE', niveles: { 1: 100 }, precio: 100, existencias: { 1: 1 } }; cache.infoplusArticulos.push(a2);
    await _rpAgregarArticulo(a2); _rpQuitar(0); await w(2300); out.quitadaNoRevive = _rpState.items.length === 0;
    out.llamadas = llamadas; return out;
  });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('la línea entra en menos de 150 ms (Info Plus tarda 2 s)', r.lineaVisible && r.msHastaLinea < 150, r.msHastaLinea);
  c('no muestra ninguna etiqueta (dueño: «quítala»)', !r.etiqueta);
  c('Guardar espera la comprobación (≥ 1.5 s) y luego guarda', r.guardoTrasEsperar && r.msGuardar >= 1500 && r.avisoComprobando, r.msGuardar);
  c('sin stock real: entra, se pone roja, avisa y bloquea', r.sinStockEntra && r.sinStockRojo && r.sinStockAviso && r.sinStockBloquea);
  c('lleva IMEI aunque el nombre no lo diga: se convierte a línea con IMEI', !r.imeiProvisional && r.imeiFinal);
  c('recuerda que lleva IMEI para la próxima vez', r.imeiRecordado);
  c('línea quitada a tiempo no revive', r.quitadaNoRevive);
  c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 console.log(fallos ? `${fallos} FALLO(S)` : 'Todo bien'); await b.close(); process.exit(fallos ? 1 : 0); })();
