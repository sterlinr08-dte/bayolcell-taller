// 10-nov-2026 · CRM rápido: clases de estado en vez de :has() (crm-estilos.js). Datos inventados; no toca Supabase real.
// Comprueba, a 390 y 1280 px: las clases espejo se ponen y se quitan (entrar/salir del CRM, abrir/cerrar chat, buscador,
// Instagram, Facebook), ninguna regla :has() del CRM queda activa, una burbuja nueva ya no recalcula todo el taller, con la
// bandera de apagado (bc_crm_estilos_off=1) vuelven las reglas originales y siguen encendidas al volver a entrar, una pestaña
// con el taller.html anterior (sin la marca ni la capa) queda igual que apagada, y 0 errores.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/crm-estilos.cjs   (PUERTO=xxxx para otro puerto)
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const PUERTO = process.env.PUERTO || 8788;
const HOJAS_CRM = /crm-wa-identico|crm-canales-iguales|crm-wa-compacto|crm-facebook-chat|taller-app-movil|bcAmbientOrbSafeStyle|en-linea/;
let fallos = 0; const ok = (c, t, extra) => { if (!c) fallos++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + t + (extra !== undefined ? ' · ' + JSON.stringify(extra) : '')); };

async function abrir(b, W, apagado, viejo) {
  const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs|jsdelivr/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  await ctx.route(/functions\/v1|rest\/v1/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  // «viejo»: taller.html como estaba antes de esta entrega (sin la marca del <head> ni crm-estilos.js) con los demás archivos nuevos:
  // es lo que tiene una pestaña que quedó abierta desde antes de publicar y entra al CRM después.
  if (viejo) await ctx.route(/\/taller\.html/, async r => { const resp = await r.fetch(); let t = await resp.text(); const n0 = t.length;
    t = t.replace(/<script>var BC_CRM_CLASES=true;[^\n]*<\/script>\n/, '').replace(/<script defer src="crm-estilos\.js[^"]*"><\/script>\n/, ''); if (t.length === n0) throw new Error('no se pudo quitar la capa de taller.html');
    r.fulfill({ response: resp, body: t }); });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message.slice(0, 160)));
  await p.addInitScript((off) => { try { localStorage.setItem('bayol_subtab_crmlinea', 'mensajes'); if (off) localStorage.setItem('bc_crm_estilos_off', '1'); } catch (e) {} }, !!apagado);
  await p.goto('http://127.0.0.1:' + PUERTO + '/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
  await p.evaluate(() => {
    sessionUser = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'flex'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    window.w = ms => new Promise(r => setTimeout(r, ms)); window.tic = () => new Promise(r => setTimeout(r, 0));   // «tic»: deja correr al vigilante
    window.$v = () => document.getElementById('v-crmLinea'); window.$c = () => document.querySelector('.content');
    // Reglas :has() activas (las que el navegador está usando ahora) y bloques «apagados» que quedan, por hoja.
    window.reglas = () => { const o = { hasActivas: [], apagadas: 0, encendidas: 0 }; const rec = (cont, hoja, act) => { let rs; try { rs = cont.cssRules; } catch (e) { return; } for (const r of rs) { if (r.media && r.cssRules) { const m = r.media.mediaText.replace(/\s+/g, ''); if (m === 'notalland(min-width:1px)') { o.apagadas++; continue; } rec(r, hoja, act && matchMedia(r.media.mediaText).matches); } else if (act && r.selectorText && r.selectorText.includes(':has(')) o.hasActivas.push(hoja + ' → ' + r.selectorText.slice(0, 90)); } };
      Array.from(document.styleSheets).forEach(s => { const hoja = s.href ? s.href.split('/').pop().split('?')[0] : ((s.ownerNode && s.ownerNode.id) || 'en-linea'); rec(s, hoja, !s.disabled && (!s.media.mediaText || matchMedia(s.media.mediaText).matches)); }); return o; };
  });
  return p;
}
// Elementos a los que Chrome les recalcula el estilo al añadir una burbuja (lo mismo que midió la auditoría).
async function elementosPorBurbuja(p) {
  const cdp = await p.context().newCDPSession(p); const ev = []; cdp.on('Tracing.dataCollected', e => ev.push(...e.value));
  await p.evaluate(() => { window.burbuja = () => { const sc = document.getElementById('waMessagesScroll'); sc.insertAdjacentHTML('beforeend', '<div class="wa-brow in" data-x="1"><div class="wa-bubble-wrap">hola</div></div>'); void sc.scrollHeight; sc.lastElementChild.remove(); void sc.scrollHeight; }; burbuja(); });
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['blink', 'devtools.timeline'], excludedCategories: ['*'] }, transferMode: 'ReportEvents' });
  await p.evaluate(() => { for (let i = 0; i < 3; i++) burbuja(); });
  const fin = new Promise(r => cdp.once('Tracing.tracingComplete', r)); await cdp.send('Tracing.end'); await fin;
  const n = ev.filter(e => e.name === 'UpdateLayoutTree' && e.args && e.args.elementCount != null).map(e => e.args.elementCount);
  return n.length ? Math.max(...n) : -1;
}

(async () => { const b = await chromium.launch();
  for (const W of [390, 1280]) { const T = '[' + W + '] ';
    // ---------- Encendido (lo normal) ----------
    let p = await abrir(b, W, false);
    let r = await p.evaluate(async () => { const o = {}; const cls = (el, c) => !!el && el.classList.contains(c);
      o.html = document.documentElement.classList.contains('bc-crm-clases'); o.capa = window.__bcCrmEstilos || ''; o.sync = typeof window.bcCrmEstilosSync;
      o.fueraAntes = cls($c(), 'bc-crm-activo');
      nav('crmLinea'); await w(1500);
      if (typeof _crmLineaActualId === 'undefined' || !_crmLineaActualId) { seleccionarLineaCRM('l1', 'Santiago', 'Reparación'); await w(1500); }
      await w(4500);   // las capas del CRM (y sus hojas) cargan al entrar; crm-wa-identico vuelve a colocar sus hojas a los 1.6 s y 4 s
      o.envuelta = !!(window._crmActualizarClaseChatAbierto && window._crmActualizarClaseChatAbierto.__bcCrmEstilos);
      o.activo = cls($c(), 'bc-crm-activo'); o.rebose = getComputedStyle($c()).overflowY; o.relleno = getComputedStyle($c()).paddingTop;
      o.chatAntes = cls(document.body, 'bc-crm-chat-abierto');
      await abrirHiloWhatsapp('h1'); await w(1500);
      o.chatAbierto = cls($v(), 'chat-abierto'); o.chatEspejo = cls(document.body, 'bc-crm-chat-abierto');
      o.colConDetalle = !cls(document.getElementById('waDetalleCol'), 'bc-crm-sin-detalle');
      // Al instante (sin esperar al vigilante): taller-app mide la pantalla justo después de cambiar la clase.
      $v().classList.remove('chat-abierto'); const antesDeLlamar = cls(document.body, 'bc-crm-chat-abierto'); _crmActualizarClaseChatAbierto(); o.alInstante = antesDeLlamar === true && cls(document.body, 'bc-crm-chat-abierto') === cls($v(), 'chat-abierto');
      // Cerrar el chat
      _waHiloId = null; _pintarWhatsapp(); await tic(); o.chatCerrado = !cls($v(), 'chat-abierto') && !cls(document.body, 'bc-crm-chat-abierto');
      // Columna de chat sin #waDetalle (como la de la pestaña vieja de redes)
      const col = document.createElement('div'); col.className = 'wa-chat-col'; col.id = 'pruebaCol'; col.innerHTML = '<p>vacía</p>'; $v().appendChild(col); await tic();
      o.sinDetalle = cls(col, 'bc-crm-sin-detalle'); o.sinDetalleColor = getComputedStyle(col).borderBottomColor;
      col.innerHTML = '<div id="waDetalle2"></div>'; col.firstChild.id = 'waDetalle'; await tic(); o.conDetalle = !cls(col, 'bc-crm-sin-detalle'); col.remove(); await tic();
      // Buscador abierto
      const fila = $v().querySelector('.crm-busq-row'), marco = fila && fila.querySelector('.bcbp-marco'); o.hayBuscador = !!marco;
      if (marco) { marco.classList.add('open'); await tic(); o.busqFila = cls(fila, 'bc-crm-busq-abierta'); o.busqVista = cls($v(), 'bc-crm-busq-abierta'); await w(600); /* la visibilidad cambia con una transición */ const sel = document.getElementById('crmSelectorWrap'); o.busqSelector = sel ? getComputedStyle(sel).visibility : ''; o.busqZ = getComputedStyle(fila).zIndex;
        marco.classList.remove('open'); await tic(); o.busqCerrada = !cls(fila, 'bc-crm-busq-abierta') && !cls($v(), 'bc-crm-busq-abierta'); }
      // Instagram: chat abierto / cerrado y panel sin mensajes
      $v().classList.add('bc-ig-chat-open'); await tic(); o.igAbierto = cls(document.body, 'bc-crm-ig-abierto'); const orb = document.getElementById('bcAmbientOrbSafe'); o.orbOculto = orb ? getComputedStyle(orb).display : 'sin-orb';
      $v().classList.remove('bc-ig-chat-open'); await tic(); o.igCerrado = !cls(document.body, 'bc-crm-ig-abierto');
      const ig = document.createElement('div'); ig.className = 'bc-ig-chat'; ig.id = 'pruebaIg'; $v().appendChild(ig); await tic(); o.igSinMensajes = cls(ig, 'bc-crm-sin-mensajes');
      ig.innerHTML = '<div id="bcIgMessages"></div>'; await tic(); o.igConMensajes = !cls(ig, 'bc-crm-sin-mensajes'); ig.remove(); await tic();
      // Facebook: chat abierto / cerrado
      let fb = document.getElementById('bcSocialFacebookPanel'), propio = false; if (!fb) { fb = document.createElement('div'); fb.id = 'bcSocialFacebookPanel'; $v().appendChild(fb); propio = true; }
      fb.classList.add('bc-fb-open'); await tic(); o.fbAbierto = cls($v(), 'bc-crm-fb-abierto'); fb.classList.remove('bc-fb-open'); await tic(); o.fbCerrado = !cls($v(), 'bc-crm-fb-abierto'); if (propio) fb.remove();
      // Cambiar de canal de verdad (si la barra de canales cargó): no deja clases colgando
      const ir = async (c) => { const bt = document.querySelector('.bc-smart-platform[data-smart-channel="' + c + '"]'); if (bt) { bt.click(); await w(1200); } return !!bt; };
      o.hayCanales = await ir('instagram'); await ir('facebook'); await ir('whatsapp');
      o.trasCanales = { ig: cls(document.body, 'bc-crm-ig-abierto'), fb: cls($v(), 'bc-crm-fb-abierto'), chat: cls(document.body, 'bc-crm-chat-abierto'), canal: $v().dataset.socialChannel };
      o.reglas = reglas();
      await abrirHiloWhatsapp('h1'); await w(1500);
      return o; });
    ok(r.html, T + 'html.bc-crm-clases puesta desde el <head>'); ok(!!r.capa && r.sync === 'function', T + 'capa crm-estilos.js cargada', r.capa); ok(r.envuelta, T + '_crmActualizarClaseChatAbierto envuelta');
    ok(!r.fueraAntes, T + 'fuera del CRM: .content sin .bc-crm-activo');
    ok(r.activo, T + 'al entrar al CRM: .content.bc-crm-activo'); if (W >= 1025) ok(r.rebose === 'hidden' && r.relleno === '8px', T + 'PC: .content sin desplazamiento y con el relleno compacto', [r.rebose, r.relleno]);
    ok(!r.chatAntes && r.chatAbierto && r.chatEspejo, T + 'abrir chat: body.bc-crm-chat-abierto'); ok(r.alInstante, T + 'la clase espejo cambia al instante al llamar _crmActualizarClaseChatAbierto');
    ok(r.chatCerrado, T + 'cerrar chat: se quita'); ok(r.colConDetalle, T + '#waDetalleCol (tiene #waDetalle) sin .bc-crm-sin-detalle');
    ok(r.sinDetalle && r.conDetalle, T + 'columna sin #waDetalle: .bc-crm-sin-detalle se pone y se quita', r.sinDetalleColor); ok(r.sinDetalleColor === 'rgb(37, 211, 102)', T + 'columna sin #waDetalle: franja verde de la portada', r.sinDetalleColor);
    ok(r.hayBuscador && r.busqFila && r.busqVista && r.busqCerrada, T + 'buscador: .bc-crm-busq-abierta se pone y se quita (fila y vista)'); if (W >= 1025) ok(r.busqSelector === 'hidden' && r.busqZ === '40', T + 'PC: buscador abierto esconde Sucursal/Área y queda encima', [r.busqSelector, r.busqZ]);
    ok(r.igAbierto && r.igCerrado, T + 'Instagram: body.bc-crm-ig-abierto se pone y se quita'); ok(r.orbOculto === 'none' || r.orbOculto === 'sin-orb', T + 'Instagram con chat abierto: fondo animado oculto', r.orbOculto);
    ok(r.igSinMensajes && r.igConMensajes, T + 'panel de Instagram sin mensajes: .bc-crm-sin-mensajes se pone y se quita');
    ok(r.fbAbierto && r.fbCerrado, T + 'Facebook: #v-crmLinea.bc-crm-fb-abierto se pone y se quita');
    ok(r.hayCanales && !r.trasCanales.ig && !r.trasCanales.fb && !r.trasCanales.chat && r.trasCanales.canal === 'whatsapp', T + 'cambiar de canal (IG → FB → WA): no quedan clases colgando', r.trasCanales);
    const delCrm = r.reglas.hasActivas.filter(x => HOJAS_CRM.test(x.split(' → ')[0]) && /crmLinea|wa-chat-col|bc-ig-chat|crm-busq-row|\.content:has/.test(x));
    ok(delCrm.length === 0, T + 'ninguna regla :has() del CRM activa', delCrm); ok(r.reglas.apagadas >= 6, T + 'las reglas originales siguen escritas, apagadas', r.reglas.apagadas);
    const n = await elementosPorBurbuja(p); ok(n >= 0 && n < 200, T + 'una burbuja nueva recalcula pocos elementos (antes: 1,215 en celular y 2,359 en PC)', n);
    r = await p.evaluate(async () => { nav('ordenes'); await w(600); return { activo: $c().classList.contains('bc-crm-activo'), rebose: getComputedStyle($c()).overflowY, espejo: document.body.classList.contains('bc-crm-chat-abierto') === $v().classList.contains('chat-abierto') }; });
    ok(!r.activo && r.rebose !== 'hidden', T + 'al salir del CRM: se quita .bc-crm-activo y .content vuelve a desplazarse', r); ok(r.espejo, T + 'fuera del CRM: body.bc-crm-chat-abierto sigue igual que #v-crmLinea.chat-abierto');
    r = await p.evaluate(async () => { nav('crmLinea'); await w(1500); return $c().classList.contains('bc-crm-activo'); }); ok(r, T + 'al volver a entrar: .bc-crm-activo otra vez');
    ok(p.errs.length === 0, T + 'sin errores de JavaScript', p.errs); await p.context().close();

    // ---------- Apagado (bc_crm_estilos_off=1): todo como antes ----------
    p = await abrir(b, W, true); const TA = '[' + W + ' apagado] ';
    r = await p.evaluate(async () => { const o = {};
      o.html = document.documentElement.classList.contains('bc-crm-clases'); o.sync = typeof window.bcCrmEstilosSync;
      nav('crmLinea'); await w(1500);
      if (typeof _crmLineaActualId === 'undefined' || !_crmLineaActualId) { seleccionarLineaCRM('l1', 'Santiago', 'Reparación'); await w(1500); }
      await w(4500);
      await abrirHiloWhatsapp('h1'); await w(1500);
      o.clases = document.querySelectorAll('[class*="bc-crm-activo"],[class*="bc-crm-chat-abierto"],[class*="bc-crm-ig-abierto"],[class*="bc-crm-fb-abierto"],[class*="bc-crm-busq-abierta"],[class*="bc-crm-sin-"]').length;
      o.rebose = getComputedStyle($c()).overflowY; o.relleno = getComputedStyle($c()).paddingTop; o.reglas = reglas();
      const col = document.createElement('div'); col.className = 'wa-chat-col'; $v().appendChild(col); o.sinDetalleColor = getComputedStyle(col).borderBottomColor; col.remove();
      nav('ordenes'); await w(600); o.reboseFuera = getComputedStyle($c()).overflowY;
      nav('crmLinea'); await w(5000); o.reglasVuelta = reglas(); o.reboseVuelta = getComputedStyle($c()).overflowY;
      return o; });
    ok(!r.html && r.sync === 'undefined', TA + 'sin html.bc-crm-clases y la capa no hace nada'); ok(r.clases === 0, TA + 'ninguna clase espejo puesta', r.clases);
    const has = r.reglas.hasActivas.filter(x => /crmLinea|wa-chat-col|bc-ig-chat|crm-busq-row/.test(x));
    ok(r.reglas.apagadas === 0 && has.length >= (W >= 1025 ? 6 : 5), TA + 'las reglas :has() originales vuelven a estar activas', { apagadas: r.reglas.apagadas, activas: has.length });
    if (W >= 1025) ok(r.rebose === 'hidden' && r.relleno === '8px', TA + 'PC: .content igual que antes (por :has)', [r.rebose, r.relleno]);
    ok(r.sinDetalleColor === 'rgb(37, 211, 102)', TA + 'columna sin #waDetalle: franja verde (por :has)', r.sinDetalleColor);
    ok(r.reboseFuera !== 'hidden', TA + 'al salir del CRM: .content vuelve a desplazarse', r.reboseFuera);
    ok(r.reglasVuelta.apagadas === 0, TA + 'al salir y volver a entrar siguen encendidas', r.reglasVuelta.apagadas); if (W >= 1025) ok(r.reboseVuelta === 'hidden', TA + 'PC: .content igual al volver', r.reboseVuelta);
    ok(p.errs.length === 0, TA + 'sin errores de JavaScript', p.errs); await p.context().close();

    // ---------- Pestaña con el taller.html anterior: la capa llega sola al entrar al CRM y queda como apagada ----------
    p = await abrir(b, W, false, true); const TV = '[' + W + ' taller.html anterior] ';
    r = await p.evaluate(async () => { const o = {};
      o.html = document.documentElement.classList.contains('bc-crm-clases'); o.capaAntes = window.__bcCrmEstilos || '';
      nav('crmLinea'); await w(1500);
      if (typeof _crmLineaActualId === 'undefined' || !_crmLineaActualId) { seleccionarLineaCRM('l1', 'Santiago', 'Reparación'); await w(1500); }
      await w(4500);
      await abrirHiloWhatsapp('h1'); await w(1500);
      o.capa = window.__bcCrmEstilos || ''; o.sync = typeof window.bcCrmEstilosSync; o.reglas = reglas(); o.rebose = getComputedStyle($c()).overflowY; o.relleno = getComputedStyle($c()).paddingTop;
      o.clases = document.querySelectorAll('[class*="bc-crm-activo"],[class*="bc-crm-chat-abierto"],[class*="bc-crm-sin-"]').length;
      const col = document.createElement('div'); col.className = 'wa-chat-col'; $v().appendChild(col); o.sinDetalleColor = getComputedStyle(col).borderBottomColor; col.remove();
      return o; });
    ok(!r.html && !r.capaAntes, TV + 'el documento no trae la marca ni la capa'); ok(!!r.capa && r.sync === 'undefined', TV + 'crm-wa-identico.js carga la capa al entrar al CRM, en modo apagado', r.capa);
    ok(r.reglas.apagadas === 0 && r.clases === 0, TV + 'las reglas :has() originales quedan activas y no hay clases espejo', { apagadas: r.reglas.apagadas, clases: r.clases });
    if (W >= 1025) ok(r.rebose === 'hidden' && r.relleno === '8px', TV + 'PC: .content igual que antes', [r.rebose, r.relleno]);
    ok(r.sinDetalleColor === 'rgb(37, 211, 102)', TV + 'columna sin #waDetalle: franja verde', r.sinDetalleColor);
    ok(p.errs.length === 0, TV + 'sin errores de JavaScript', p.errs); await p.context().close();
  }
  await b.close(); console.log(fallos ? '\n' + fallos + ' FALLA(S)' : '\nTodo bien'); process.exit(fallos ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
