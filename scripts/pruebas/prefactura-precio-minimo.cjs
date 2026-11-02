// 2-nov-2026 · Prefactura: el empleado sube el precio libre y lo baja solo hasta el mínimo del nivel (datos inventados).
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/prefactura-precio-minimo.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname;
(async () => { const b = await chromium.launch(); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  for (const admin of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
    const r = await p.evaluate(async (admin) => {
      const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
      sessionUser = admin ? { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' } : { id: 't1', nombre: 'Cajera', usuario: 'caja', rol: 'tecnico', _tipo: 'tecnico' };
      if (!admin) isAdminUser = () => false;
      document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
      document.querySelectorAll('.view.active').forEach(x => x.classList.remove('active')); document.getElementById('v-recepcion').classList.add('active');
      try { _rpInit(); } catch (e) {}
      _rpState.nivel = 1; window.__t = []; toast = (t, k) => window.__t.push(t); toastError = () => {};
      cache.infoplusArticulos = [
        { codigo: 2139, descripcion: 'BATERIA SAMSUNG A20', niveles: { 1: 1500, 2: 600 }, niveles_min: { 1: 1200, 2: 500 }, precio: 1500, existencias: { 1: 9 } },
        { codigo: 2019, descripcion: 'COVER IPHONE XR', niveles: { 1: 250 }, precio: 250, existencias: { 1: 10 } }
      ];
      _rpEsSerial = async () => false; supabaseClient.functions.invoke = async () => ({ data: null });
      await _rpAgregarArticulo(cache.infoplusArticulos[0]); await _rpAgregarArticulo(cache.infoplusArticulos[1]); await w(200);
      const inp = i => document.querySelectorAll('#v-recepcion .pin')[i];
      out.editable = !!inp(0) && !inp(0).readOnly;
      out.titulo = inp(0) && inp(0).title;
      _rpPrecio(0, '1800'); out.subir = _rpState.items[0].precio;
      _rpPrecio(0, '1300'); out.bajarEncima = _rpState.items[0].precio;
      window.__t = []; _rpPrecio(0, '900'); out.bajarDebajo = _rpState.items[0].precio; out.aviso = window.__t[0] || '';
      _rpState.nivel = 2; _rpPrecio(0, '450'); out.nivel2 = _rpState.items[0].precio; _rpState.nivel = 1;
      _rpPrecio(1, '200'); out.sinMinimo = _rpState.items[1].precio;
      _rpPrecio(1, '300'); out.sinMinimoSubir = _rpState.items[1].precio;
      return out;
    }, admin);
    const q = admin ? '[admin]' : '[empleado]';
    c(q + ' precio del artículo editable', r.editable, r);
    if (!admin) {
      c(q + ' muestra el mínimo al pasar el ratón', /Mínimo/.test(r.titulo || ''), r.titulo);
      c(q + ' sube libre (1,500 → 1,800)', r.subir === 1800, r.subir);
      c(q + ' baja hasta el mínimo (1,300 ok)', r.bajarEncima === 1300, r.bajarEncima);
      c(q + ' por debajo del mínimo queda en 1,200 y avisa', r.bajarDebajo === 1200 && /Mín\./.test(r.aviso), r);
      c(q + ' mínimo del nivel 2 (500)', r.nivel2 === 500, r.nivel2);
      c(q + ' sin mínimo conocido: no baja del precio de lista (250)', r.sinMinimo === 250, r.sinMinimo);
      c(q + ' sin mínimo conocido: sube libre (300)', r.sinMinimoSubir === 300, r.sinMinimoSubir);
    } else {
      c(q + ' administrador libre (900)', r.bajarDebajo === 900, r.bajarDebajo);
    }
    c(q + ' sin errores de JS', errs.length === 0, errs);
    await ctx.close();
  }
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
