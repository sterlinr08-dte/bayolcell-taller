// Pruebas de la capa global de interfaz (taller-ui-global.css/.js, 26-oct-2026).
// Uso: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/ui-global.cjs   (PUERTO=xxxx para otro puerto)
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
const B = __dirname, PUERTO = process.env.PUERTO || 8788;
async function abrir(b, W, sinChart) {
  const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs|tabler/, r => { const u = r.request().url();
    if (/chart\.umd/i.test(u) && !sinChart) return r.fulfill({ contentType: 'application/javascript', body: 'window.Chart=function(){this.destroy=function(){}};' });
    if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') });
    r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:' + PUERTO + '/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(2000);
  await p.evaluate(() => { sessionUser = { id: '8ccbe4c8-e699-4cab-80a0-0d1634862d80', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; const l = document.getElementById('appLoader'); if (l) l.style.display = 'none';
    cache.tecnicos = [{ id: 't1', nombre: 'Josiel', activo: true, tipo_empleado: 'tecnico', rol: 'tecnico' }]; });
  await p.mouse.move(W - 20, 600); return { ctx, p };
}
(async () => { const b = await chromium.launch(); let fallos = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLO ') + m); if (!c) fallos++; };
  for (const W of [390, 1280]) {
    const { ctx, p } = await abrir(b, W);
    const r = await p.evaluate(async () => {
      const o = {}; o.capa = document.documentElement.classList.contains('bc-ui');
      const tb = [...document.querySelectorAll('.top-bar > button')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect());
      o.topMin = Math.min(...tb.map(x => Math.min(x.width, x.height)));
      o.menuVisiblePC = !!document.querySelector('.top-bar .menu-toggle').offsetParent;
      nav('configuracion'); await new Promise(r => setTimeout(r, 400));
      o.titulo = document.getElementById('pageTitle').textContent; o.tituloMayus = getComputedStyle(document.getElementById('pageTitle')).textTransform;
      o.seccion = getComputedStyle(document.querySelector('.nav-section')).textTransform;
      cambiarMainTabConfig('general'); await new Promise(r => setTimeout(r, 300));
      const lbls = [...document.querySelectorAll('#cfgContentGeneral label')].filter(e => e.offsetParent);
      o.lblMayus = lbls.filter(e => getComputedStyle(e).textTransform === 'uppercase').length;
      o.lblGarantia = (lbls.find(e => /Garantía de celulares/.test(e.textContent)) || {}).innerText;
      o.campos = [...document.querySelectorAll('#cfgContentGeneral input:not([type=checkbox]), #cfgContentGeneral textarea')].filter(e => e.offsetParent).map(e => [Math.round(e.getBoundingClientRect().height), parseFloat(getComputedStyle(e).fontSize)]);
      const g = [...document.querySelectorAll('#cfgContentGeneral .card > button.btn-blue')].filter(e => e.offsetParent)[0]; o.guardar = g ? Math.round(g.getBoundingClientRect().height) : 0;
      o.notaDatosOculta = [...document.querySelectorAll('#cfgContentGeneral .card > p')].some(e => /Estos datos aparecen/.test(e.textContent) && !e.offsetParent);
      const i = [...document.querySelectorAll('#cfgContentGeneral .bcInfoI')].filter(e => e.offsetParent); o.infoI = i.length;
      if (i[0]) { i[0].click(); await new Promise(r => setTimeout(r, 50)); const t = document.getElementById('bcInfoTip'); o.tip = t ? t.textContent.slice(0, 40) : ''; document.body.click(); o.tipCerrado = !document.getElementById('bcInfoTip'); }
      nav('reportes'); await new Promise(r => setTimeout(r, 600));
      const kg = document.querySelector('#v-reportes .kpi-grid'); o.kpiCols = kg ? getComputedStyle(kg).gridTemplateColumns.split(' ').filter(x => x !== '0px').length : 0;
      o.cobro = (document.querySelector('#reporteCobros .kpi-box strong') || {}).textContent;
      o.desborde = document.documentElement.scrollWidth > innerWidth + 1;
      return o; });
    ok(r.capa, W + ' capa bc-ui activa');
    ok(r.topMin >= 44, W + ' botones de la barra de arriba ≥ 44 px (' + r.topMin + ')');
    ok(W < 1025 ? r.menuVisiblePC : !r.menuVisiblePC, W + ' botón ☰ solo en celular');
    ok(r.titulo === 'Configuración' && r.tituloMayus === 'none', W + ' título «' + r.titulo + '» sin mayúsculas ni «ADMIN»');
    ok(r.seccion === 'lowercase', W + ' secciones del menú en letra normal');
    ok(r.lblMayus === 0, W + ' etiquetas de Configuración sin MAYÚSCULAS');
    ok(/^Garantía de celulares\s*$/.test((r.lblGarantia || '').replace(/i$/, '').trim()), W + ' etiqueta corta, paréntesis en la ⓘ («' + (r.lblGarantia || '').trim() + '»)');
    ok(r.campos.every(c => c[0] >= 48 && c[1] >= 16), W + ' campos 48 px / 16 px (' + r.campos.length + ')');
    ok(r.guardar >= 54, W + ' botón Guardar ' + r.guardar + ' px');
    ok(r.notaDatosOculta && r.infoI >= 3 && r.tip && r.tipCerrado, W + ' ayudas detrás de la ⓘ (' + r.infoI + ', «' + r.tip + '…»)');
    ok(r.kpiCols >= 2, W + ' KPI de Reportes en ' + r.kpiCols + ' columnas');
    ok(r.cobro === 'RD$ 0.00', W + ' dinero con formato «' + r.cobro + '»');
    ok(!r.desborde, W + ' sin desplazamiento horizontal');
    ok(p.errs.length === 0, W + ' sin errores de JavaScript ' + JSON.stringify(p.errs));
    await ctx.close();
  }
  // Reportes sin Chart.js (internet caído): la página no se congela
  { const { ctx, p } = await abrir(b, 1280, true);
    const t0 = Date.now(); await p.evaluate(() => nav('reportes')); await p.waitForTimeout(800);
    const vivo = await Promise.race([p.evaluate(() => 'vivo'), new Promise(r => setTimeout(() => r('congelada'), 8000))]);
    ok(vivo === 'vivo', 'Reportes sin Chart.js: la página responde (' + vivo + ', ' + (Date.now() - t0) + ' ms)');
    await ctx.close(); }
  await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0);
})();
