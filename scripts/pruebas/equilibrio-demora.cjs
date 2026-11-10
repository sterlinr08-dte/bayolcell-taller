// 10-nov-2026 · Punto de equilibrio (incluye «Meta por vendedor»): carga que no parpadea. Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/equilibrio-demora.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const [W, H] of [[390, 844], [1280, 900]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); window.w = w;
    sessionUser = { id: 'a1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    window.__lat = 30;
    const mk = () => { const q = new Proxy(function () {}, { get: (t, k) => k === 'then' ? (res) => setTimeout(() => res({ data: [], error: null }), window.__lat) : () => q }); return q; };
    supabaseClient.from = () => mk(); supabaseClient.rpc = () => mk();
    nav('contabilidad'); await w(400); contaTab('equilibrio'); await w(1200);
    window.cont = () => document.getElementById('pe_contenido');
    window.est = () => { const c = cont(), a = c.querySelector('.pe-esq-aviso'); return { esq: !!c.querySelector('.pe-esq'), viejo: /Cargando ventas/.test(c.textContent), aviso: !!(a && !a.hidden), tabs: !!c.querySelector('.pe-tabs'), msg: (c.querySelector('.pe-carga-msg p') || {}).textContent || '' }; };
    window.vistos = 0; new MutationObserver(() => { if (cont().querySelector('.pe-esq')) window.vistos++; }).observe(cont(), { childList: true, subtree: true });
  });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const ev = (fn) => p.evaluate(fn);
  let r = await ev(async () => { const o = {}; o.ini = est(); __lat = 15; vistos = 0; BayolEquilibrio.recargar(); await w(150); o.a150 = est(); await w(500); o.fin = est(); o.vistos = vistos; return o; });
  c('abre con contenido', r.ini.tabs && !r.ini.esq, r.ini);
  c('rápida (15 ms por lectura): nunca sale esqueleto ni «Cargando»', r.vistos === 0 && !r.a150.viejo && r.fin.tabs, r);
  r = await ev(async () => { const o = {}; __lat = 80; BayolEquilibrio.recargar(); await w(200); o.a200 = est(); await w(250); o.a450 = est(); await w(280); o.a730 = est(); await w(450); o.fin = est();
    const e = document.documentElement; o.sw = e.scrollWidth - e.clientWidth; return o; });
  // 5 lecturas encadenadas de 80 ms ≈ 0,4 s: el esqueleto sale a los 0,3 s y aguanta al menos 0,5 s
  c('media: nada antes de 0,3 s', !r.a200.esq && !r.a200.viejo, r.a200); c('media: esqueleto desde 0,3 s', r.a450.esq, r.a450);
  c('media: el esqueleto dura al menos 0,5 s', r.a730.esq, r.a730); c('media: luego el contenido', r.fin.tabs && !r.fin.esq, r.fin);
  r = await ev(async () => { const o = {}; __lat = 1500; BayolEquilibrio.recargar(); await w(3600); o.a36 = est(); await w(900); o.a45 = est();
    const bt = cont().querySelector('.pe-esq-aviso .btn'); o.alto = Math.round(bt.getBoundingClientRect().height); const e = document.documentElement; o.sw = e.scrollWidth - e.clientWidth; return o; });
  c('lenta: a los 3,6 s solo esqueleto', r.a36.esq && !r.a36.aviso, r.a36); c('lenta: a los 4 s «Sigue tardando» + Cancelar', r.a45.aviso, r.a45);
  c('Cancelar ≥ 44 px', r.alto >= 44, r.alto); c('sin desplazamiento horizontal', r.sw <= 1, r.sw);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/demora-${W}-lenta.png` });
  r = await ev(async () => { const o = {}; cont().querySelector('.pe-esq-aviso .btn').click(); await w(100); o.tras = est(); const bt = cont().querySelector('.pe-carga-msg .btn'); o.alto = Math.round(bt.getBoundingClientRect().height); await w(4500); o.luego = est(); return o; });
  c('Cancelar: «Carga cancelada.» + Reintentar', r.tras.msg === 'Carga cancelada.' && r.alto >= 44, r.tras); c('lo cancelado no pinta después', r.luego.msg === 'Carga cancelada.' && !r.luego.tabs, r.luego);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/demora-${W}-cancelada.png` });
  r = await ev(async () => { const o = {}; __lat = 60000; cont().querySelector('.pe-carga-msg .btn').click(); await w(15600); o.fin = est(); __lat = 40; cont().querySelector('.pe-carga-msg .btn').click(); await w(700); o.ok = est(); return o; });
  c('muy lenta: a los 15 s se corta', r.fin.msg === 'No cargó en 15 segundos.', r.fin); c('Reintentar carga el contenido', r.ok.tabs && !r.ok.msg, r.ok);
  r = await ev(async () => { const o = {}; localStorage.setItem('bc_pe_demora_off', '1'); __lat = 200; BayolEquilibrio.recargar(); await w(60); o.a = est(); await w(1500); o.fin = est(); localStorage.removeItem('bc_pe_demora_off'); return o; });
  c('apagada: vuelve el «Cargando…» de antes', r.a.viejo && r.fin.tabs, r);
  c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0); })();
