// 10-nov-2026 · Paquete «CRM rápido»: los 8 errores del chat de WhatsApp y las mejoras de velocidad.
// Datos inventados (crm-rapido-stub.js); no toca Supabase real ni la web en vivo.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/crm-rapido.cjs [carpeta-capturas]
//         (PUERTO=xxxx en los dos si el 8788 está ocupado)
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788; const BASE = 'http://127.0.0.1:' + PUERTO + '/';
const w = ms => new Promise(r => setTimeout(r, ms));
let fallos = 0, pasadas = 0;

async function abrirPagina(b, W, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, serviceWorkers: 'block', hasTouch: W < 500, isMobile: W < 500 });
  const enviados = []; const vistos = {};
  await ctx.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith(BASE)) return r.continue();
    if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/crm-rapido-stub.js', 'utf8') });
    if (/functions\/v1\/whatsapp-enviar/.test(u)) {
      const body = JSON.parse(r.request().postData() || '{}'); enviados.push(body); const m = String(body.mensaje || ''); const n = (vistos[m] = (vistos[m] || 0) + 1);
      const ok = (extra) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.assign({ ok: true, messageId: 'wamid.env' + enviados.length }, extra || {})) }).catch(() => {});
      if (/LENTO/.test(m) && n === 1) { await w(60000); return ok(); }                       // el servidor no contesta (solo la primera vez)
      if (/SIN RED/.test(m)) return r.abort('internetdisconnected');                           // se cayó la conexión
      if (/502/.test(m)) { await w(150); return r.fulfill({ status: 502, contentType: 'text/html', body: '<html><body>Bad gateway</body></html>' }); }
      if (/ya esta listo/.test(m)) { await w(900); return ok({ messageId: 'wamid.orto' + n, texto_enviado: 'Buenas tardes, ya está listo.', ortografia: { corregido: true, original: m } }); }
      if (/DEMORA/.test(m)) { await w(1500); return ok(); }
      await w(150); return ok();
    }
    r.fulfill({ status: 200, contentType: /\.css|css2/.test(u) ? 'text/css' : (/functions\/v1|rest\/v1/.test(u) ? 'application/json' : 'application/javascript'), body: /functions\/v1|rest\/v1/.test(u) ? '{}' : '' });
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.addInitScript((o) => {
    window.__CRM_CFG = { hilos: 120, msgs: 200, lat: 0 };
    try { localStorage.setItem('bayol_subtab_crmlinea', 'mensajes'); if (o.apagado) localStorage.setItem('bc_crm_rapido_off', '1'); } catch (e) {}
  }, { apagado: !!opt.apagado });
  await p.goto(BASE + 'taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 180000 }); await w(3500);
  await p.evaluate((usuario) => {
    sessionUser = usuario;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'flex'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    window.d = ms => new Promise(r => setTimeout(r, ms));
    window.movil = () => window.innerWidth <= 1024;
    window.aLista = async () => { if (movil() && _waHiloId) { volverListaWhatsapp(); await d(400); } };
    window.tocar = (id) => document.querySelector('#waLista .wa-row[data-hiloid="' + id + '"]').click();
    window.abrir = async (id, ms) => { await aLista(); tocar(id); await d(ms || 1200); };
    window.cab = () => { const h = document.querySelector('#waDetalle .wa-chat-head'); return h ? (h.textContent.match(/Cliente \d+/) || [''])[0] : null; };
    window.copias = rx => Array.from(document.querySelectorAll('#waMessagesScroll .wa-brow')).filter(x => rx.test(x.textContent)).length;
    window.escribir = (t) => { const c = document.getElementById('waTexto'); c.value = t; c.dispatchEvent(new Event('input', { bubbles: true })); };
    window.viejas = () => __Q.filter(x => x.tabla === 'whatsapp_mensajes' && /creado_en</.test(x.filtros || '')).length;
    window.desde = (q0) => { const o = {}; __Q.slice(q0).forEach(x => { o[x.tabla] = (o[x.tabla] || 0) + 1; }); return { total: __Q.length - q0, porTabla: o }; };
    window.textoToast = () => (document.getElementById('toast') || {}).textContent || '';
    window.__refrescos = 0; _bcRefreshSession = function () { window.__refrescos++; };
    window.__pintadosLista = 0; const _pl = _pintarWhatsappLista; _pintarWhatsappLista = function () { window.__pintadosLista++; return _pl.apply(this, arguments); };
    // datos de la prueba
    const M = __BD.tablas.whatsapp_mensajes, X = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';
    const de = (h) => M.filter(m => m.hilo_id === h);
    de('h7')[6].cuerpo = 'mira https://wa.me/18095551234 y https://tienda.com/p?a=1&b=2 gracias. Llame al 809-555-1234.';
    de('h7')[8].cuerpo = 'malo ' + X + ' https://x.com/"onmouseover="window.__xss=9 https://y.com/?q=<script>window.__xss=8</script>&r=' + X;
    __BD.tablas.whatsapp_mensajes = M.filter(m => m.hilo_id !== 'h20');            // h20: chat que de verdad no tiene mensajes
  }, opt.usuario || { id: '11111111-1111-4111-8111-111111111111', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' });
  return { ctx, p, errs, enviados };
}

(async () => {
  const b = await chromium.launch();
  for (const W of [390, 1280]) {
    const c = (n, ok, det) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}] ${n}` + (det !== undefined ? ' · ' + JSON.stringify(det) : '')); if (ok) pasadas++; else fallos++; };
    const { ctx, p, errs, enviados } = await abrirPagina(b, W);
    const pc = W > 1024;
    await p.evaluate(async () => { nav('crmLinea'); await d(4000); window.__q1 = __Q.length; });   // __q1: a partir de aquí se cuentan las consultas por acción

    // ───────── A8 · canal de Facebook solo dentro del CRM ─────────
    const fb = await p.evaluate(async () => { const nombre = 'bc-social-facebook-stable-v2'; const hay = () => __BD.canales.filter(x => x.nombre === nombre).length;
      const o = { capa: !!window.BayolFacebookRealtimeDirect, dentro: hay() }; nav('dashboard'); await d(900); o.fuera = hay(); o.waFuera = __BD.canales.filter(x => /^crm-linea-/.test(x.nombre)).length; nav('crmLinea'); await d(2500); o.alVolver = hay(); o.waAlVolver = __BD.canales.filter(x => /^crm-linea-/.test(x.nombre)).length; return o; });
    c('A8 el canal de Facebook existe dentro del CRM', fb.capa && fb.dentro === 1, fb);
    c('A8 al salir del CRM el canal de Facebook se cierra', fb.fuera === 0, fb.fuera);
    c('A8 al volver se abre uno solo (y el de WhatsApp también)', fb.alVolver === 1 && fb.waAlVolver === 1, fb);

    // ───────── A1 · cambiar de chat con la red lenta ─────────
    const a1 = await p.evaluate(async () => { const o = {};
      await abrir('h10', 1500); escribir('borrador para el 10'); o.cabInicio = cab();
      const lista = document.getElementById('waLista'), fila10 = document.querySelector('#waLista .wa-row[data-hiloid="h10"]');
      let cuerpos = 0, conBurbujas = 0; const mo = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.id === 'waMessagesScroll') { cuerpos++; if (n.querySelector('.wa-brow')) conBurbujas++; } })));
      mo.observe(document.getElementById('waWrap'), { childList: true, subtree: true });
      await aLista(); window.__LAT = 1200; tocar('h11'); await d(200);
      const caja = document.getElementById('waTexto'), btn = document.getElementById('btnWaEnviar');
      o.a200 = { cab: cab(), cargando: !!document.querySelector('#waMessagesScroll [data-carga="cargando"]'), sinMensajes: /Sin mensajes todavía/.test((document.getElementById('waMessagesScroll') || {}).textContent || ''), cajaBloqueada: caja ? caja.disabled : null, botonBloqueado: btn ? btn.disabled : null, textoCaja: caja ? caja.value : null, hilo: _waHiloId };
      // se intenta escribir y enviar a la fuerza mientras carga
      if (caja && !movil()) { caja.value = 'para el cliente 10'; enviarMensajeWhatsapp(); if (btn) btn.click(); caja.value = ''; }
      await d(150); window.__LAT = 0; await d(3000); mo.disconnect();
      const caja2 = document.getElementById('waTexto');
      o.final = { cab: cab(), burbujas: document.querySelectorAll('#waMessagesScroll .wa-brow').length, cajaBloqueada: caja2.disabled, textoCaja: caja2.value, botonBloqueado: document.getElementById('btnWaEnviar').disabled };
      o.pintados = { cuerpos, conBurbujas, mismaLista: document.getElementById('waLista') === lista, mismaFila: movil() ? null : document.querySelector('#waLista .wa-row[data-hiloid="h10"]') === fila10 };
      await abrir('h10', 1500); o.borrador10 = document.getElementById('waTexto').value; escribir(''); return o; });
    if (pc) {
      c('A1 al tocar otro chat se ve enseguida su cabecera', a1.a200.cab === 'Cliente 11', a1.a200);
      c('A1 el cuerpo dice «Cargando…» (no «Sin mensajes todavía.»)', a1.a200.cargando && !a1.a200.sinMensajes);
      c('A1 la caja y el botón quedan bloqueados mientras carga', a1.a200.cajaBloqueada === true && a1.a200.botonBloqueado === true);
      c('A1 lo escrito para el chat anterior no pasa a la caja del nuevo', a1.a200.textoCaja === '' && a1.final.textoCaja === '', [a1.a200.textoCaja, a1.final.textoCaja]);
      c('A1 no sale ningún mensaje mientras carga', enviados.length === 0, enviados.length);
      c('A1 al terminar: chat nuevo pintado y caja libre', a1.final.cab === 'Cliente 11' && a1.final.burbujas > 5 && a1.final.cajaBloqueada === false && a1.final.botonBloqueado === false, a1.final);
      c('A1 sin parpadeo: un pintado «cargando» y uno del chat; la lista no se recrea', a1.pintados.cuerpos === 2 && a1.pintados.conBurbujas === 1 && a1.pintados.mismaLista && a1.pintados.mismaFila, a1.pintados);
      c('A1 el borrador sigue guardado en su chat', a1.borrador10 === 'borrador para el 10', a1.borrador10);
    } else {
      c('A1 en el celular el chat tocado se ve al instante con «Cargando…»', a1.a200.cab === 'Cliente 11' && a1.a200.cargando && !a1.a200.sinMensajes, a1.a200);
      c('A1 al terminar carga el chat tocado', a1.final.cab === 'Cliente 11' && a1.final.burbujas > 5, a1.final);
      c('A1 el borrador sigue guardado en su chat', a1.borrador10 === 'borrador para el 10', a1.borrador10);
    }
    // el envío va al chat que se ve
    const a1b = await p.evaluate(async () => { await abrir('h12', 1500); escribir('hola cliente 12'); const visto = cab(); await enviarMensajeWhatsapp(); await d(400); return { visto, burbuja: copias(/hola cliente 12/) }; });
    c('A1 el envío va al chat que se ve', a1b.visto === 'Cliente 12' && enviados.length === 1 && enviados[0].hilo_id === 'h12' && a1b.burbuja === 1, { visto: a1b.visto, destino: enviados[0] && enviados[0].hilo_id });

    // ───────── A7 · Cargando… / No se pudo cargar / Sin mensajes todavía ─────────
    const a7 = await p.evaluate(async () => { const o = {}; const cuerpo = () => (document.getElementById('waMessagesScroll') || {}).textContent.replace(/\s+/g, ' ').trim();
      await abrir('h20', 1500); o.vacio = cuerpo();
      const orig = supabaseClient.from; supabaseClient.from = function (t) { const q = orig.call(this, t); if (t === 'whatsapp_mensajes') q.then = (res, rej) => Promise.resolve({ data: null, error: { message: 'Failed to fetch' }, count: null }).then(res, rej); return q; };
      await abrir('h6', 1500); o.error = cuerpo(); const btn = document.querySelector('#waMessagesScroll .wa-reintentar-carga'); const r = btn ? btn.getBoundingClientRect() : null; o.boton = r ? { alto: Math.round(r.height), ancho: Math.round(r.width) } : null; o.cabError = cab();
      supabaseClient.from = orig; if (btn) btn.click(); await d(1500); o.trasReintentar = document.querySelectorAll('#waMessagesScroll .wa-brow').length;
      // un refresco que falla con el chat ya cargado no borra lo que se ve
      supabaseClient.from = function (t) { const q = orig.call(this, t); if (t === 'whatsapp_mensajes') q.then = (res, rej) => Promise.resolve({ data: null, error: { message: 'Failed to fetch' }, count: null }).then(res, rej); return q; };
      await cargarMensajesHilo('h6'); _pintarWhatsappDetalle(); await d(300); o.trasRefrescoFallido = document.querySelectorAll('#waMessagesScroll .wa-brow').length; supabaseClient.from = orig; return o; });
    c('A7 «Sin mensajes todavía.» solo cuando no hay ninguno', a7.vacio === 'Sin mensajes todavía.', a7.vacio);
    c('A7 si falla la carga: «No se pudo cargar · Reintentar»', /^No se pudo cargar · ?Reintentar$/.test(a7.error) && a7.cabError === 'Cliente 6', a7.error);
    c('A7 el botón Reintentar mide ≥44 px', a7.boton && a7.boton.alto >= 44 && a7.boton.ancho >= 44, a7.boton);
    c('A7 Reintentar carga el chat', a7.trasReintentar > 5, a7.trasReintentar);
    c('A7 un refresco fallido no borra los mensajes ya cargados', a7.trasRefrescoFallido === a7.trasReintentar, a7.trasRefrescoFallido);

    // ───────── A2 · volver a un chat no baja el historial; subir a mano sí ─────────
    const a2 = await p.evaluate(async () => { const o = {}; await abrir('h1', 3000); o.alAbrir = { viejas: viejas(), burbujas: document.querySelectorAll('#waMessagesScroll .wa-brow').length };
      await abrir('h2', 2000); const v0 = viejas(); await abrir('h1', 5000); o.alVolver = { viejas: viejas() - v0, burbujas: document.querySelectorAll('#waMessagesScroll .wa-brow').length };
      const sc = document.getElementById('waMessagesScroll'); const v1 = viejas(); sc.scrollTop = 0; sc.dispatchEvent(new Event('scroll')); await d(1500);
      const sc2 = document.getElementById('waMessagesScroll'); o.alSubir = { viejas: viejas() - v1, burbujas: sc2.querySelectorAll('.wa-brow').length, scrollTop: Math.round(sc2.scrollTop) };
      sc2.scrollTop = 0; sc2.dispatchEvent(new Event('scroll')); await d(1500); sc2.scrollTop = 0; document.getElementById('waMessagesScroll').dispatchEvent(new Event('scroll')); await d(1500);
      document.getElementById('waMessagesScroll').scrollTop = 0; document.getElementById('waMessagesScroll').dispatchEvent(new Event('scroll')); await d(1500);
      o.alFinal = { burbujas: document.querySelectorAll('#waMessagesScroll .wa-brow').length, hayMas: BayolWhatsAppPaging.messages.hasMore, primero: (document.querySelector('#waMessagesScroll .wa-brow[data-msgid]') || { dataset: {} }).dataset.msgid }; return o; });
    c('A2 al abrir un chat largo se pintan 80 mensajes y no se piden viejos', a2.alAbrir.viejas === 0 && a2.alAbrir.burbujas === 80, a2.alAbrir);
    c('A2 al volver al chat no se dispara ninguna carga de viejos', a2.alVolver.viejas === 0 && a2.alVolver.burbujas === 80, a2.alVolver);
    c('A2 subir a mano sí carga la página anterior y conserva la posición', a2.alSubir.viejas === 1 && a2.alSubir.burbujas === 160 && a2.alSubir.scrollTop > 100, a2.alSubir);
    c('A2 subiendo se llega hasta el primer mensaje', a2.alFinal.burbujas === 200 && a2.alFinal.primero === 'h1m0' && a2.alFinal.hayMas === false, a2.alFinal);

    // ───────── A3 · un envío lento no bloquea a los demás; tiempo límite; reintentar ─────────
    const n0 = enviados.length;
    const a3 = await p.evaluate(async () => { const o = {}; _waEnvioLimiteMs = 8000;   // en la app son 25 s; aquí 8 para no alargar la prueba
      await abrir('h3', 1500); escribir('primero LENTO'); enviarMensajeWhatsapp(); await d(300);
      o.enCurso = { burbuja: copias(/primero LENTO/), estado: (document.querySelector('#waMessagesScroll .wa-brow[data-tempid]') || { dataset: {} }).dataset.estado, boton: document.getElementById('btnWaEnviar').disabled };
      escribir('segundo del mismo chat'); await enviarMensajeWhatsapp(); await d(100); o.mismoChat = { caja: document.getElementById('waTexto').value, burbuja: copias(/segundo del mismo chat/), aviso: textoToast() };
      await abrir('h4', 1500); o.otroBoton = document.getElementById('btnWaEnviar').disabled; escribir('en otro chat'); await enviarMensajeWhatsapp(); await d(500); o.otroChat = { burbuja: copias(/en otro chat/), caja: document.getElementById('waTexto').value };
      await abrir('h3', 1200); o.alVolver = { burbuja: copias(/primero LENTO/), boton: document.getElementById('btnWaEnviar').disabled, caja: document.getElementById('waTexto').value };
      for (let i = 0; i < 100 && !copias(/No enviado/); i++) await d(100);
      const fila = Array.from(document.querySelectorAll('#waMessagesScroll .wa-brow')).find(x => /primero LENTO/.test(x.textContent)); const rb = fila && fila.querySelector('.wa-reintentar'); const r = rb ? rb.getBoundingClientRect() : null;
      o.vencido = { texto: fila ? fila.textContent.replace(/\s+/g, ' ').trim() : '', estado: fila ? fila.dataset.estado : null, boton: document.getElementById('btnWaEnviar').disabled, reintentar: r ? { alto: Math.round(r.height), ancho: Math.round(r.width) } : null, aviso: textoToast(), caja: document.getElementById('waTexto').value, enVuelo: _waEnviosEnVuelo.size };
      if (rb) rb.click(); await d(900);
      o.reintentado = { copias: copias(/primero LENTO/), noEnviado: copias(/No enviado/), caja: document.getElementById('waTexto').value };
      escribir(''); return o; });
    const lentos = enviados.slice(n0).filter(x => x.mensaje === 'primero LENTO');
    c('A3 el envío en curso se ve y bloquea solo el botón de su chat', a3.enCurso.burbuja === 1 && a3.enCurso.estado === 'enviando' && a3.enCurso.boton === true && a3.otroBoton === false, { enCurso: a3.enCurso, otroBoton: a3.otroBoton });
    c('A3 un segundo mensaje en el mismo chat no se pierde y avisa', a3.mismoChat.caja === 'segundo del mismo chat' && a3.mismoChat.burbuja === 0 && /Enviando el mensaje anterior/.test(a3.mismoChat.aviso), a3.mismoChat);
    c('A3 en otro chat sí se puede enviar mientras tanto', a3.otroChat.burbuja === 1 && a3.otroChat.caja === '' && enviados.slice(n0).some(x => x.hilo_id === 'h4' && x.mensaje === 'en otro chat'), a3.otroChat);
    c('A3 al volver, el envío sigue en curso y lo escrito sigue en la caja', a3.alVolver.burbuja === 1 && a3.alVolver.boton === true && a3.alVolver.caja === 'segundo del mismo chat', a3.alVolver);
    c('A3 al vencer el tiempo: «No enviado · Reintentar» con el texto', /primero LENTO/.test(a3.vencido.texto) && /No enviado ·\s?Reintentar/.test(a3.vencido.texto) && a3.vencido.estado === 'fallido', a3.vencido.texto);
    c('A3 al vencer se libera el botón y avisa en corto', a3.vencido.boton === false && a3.vencido.enVuelo === 0 && a3.vencido.aviso === 'El servidor no respondió', { aviso: a3.vencido.aviso, enVuelo: a3.vencido.enVuelo });
    c('A3 el botón Reintentar mide ≥44 px', a3.vencido.reintentar && a3.vencido.reintentar.alto >= 44 && a3.vencido.reintentar.ancho >= 44, a3.vencido.reintentar);
    c('A3 Reintentar reenvía ese texto una vez y devuelve lo que se estaba escribiendo', lentos.length === 2 && a3.reintentado.copias === 1 && a3.reintentado.noEnviado === 0 && a3.reintentado.caja === 'segundo del mismo chat', { llamadas: lentos.length, r: a3.reintentado });
    const n1 = enviados.length;
    const a3b = await p.evaluate(async () => { escribir('doble toque'); const btn = document.getElementById('btnWaEnviar'); btn.click(); const b2 = document.getElementById('btnWaEnviar'); if (b2) b2.click(); enviarMensajeWhatsapp(); await d(800); return { copias: copias(/doble toque/), grabando: typeof _waGrabando !== 'undefined' && !!_waGrabando }; });
    c('A3 doble toque: una sola llamada y una sola burbuja', enviados.length - n1 === 1 && a3b.copias === 1 && !a3b.grabando, { llamadas: enviados.length - n1, r: a3b });
    // venció la espera pero el mensaje sí se guardó: no se ofrece reenviar
    const a3c = await p.evaluate(async () => { _waEnvioLimiteMs = 2500; await abrir('h5', 1500); escribir('salió aunque LENTO respondió'); enviarMensajeWhatsapp(); await d(500);
      __BD.tablas.whatsapp_mensajes.push({ id: 'real-lento', hilo_id: 'h5', direccion: 'out', tipo_contenido: 'text', cuerpo: 'salió aunque LENTO respondió', estado: 'enviado', wa_message_id: 'wamid.lento', enviado_por_id: sessionUser.id, creado_en: new Date().toISOString() });
      await d(3500); _waEnvioLimiteMs = 25000; return { copias: copias(/salió aunque LENTO/), noEnviado: copias(/No enviado/), real: !!document.querySelector('#waMessagesScroll .wa-brow[data-msgid="real-lento"]'), caja: document.getElementById('waTexto').value }; });
    c('A3 si venció pero el mensaje sí salió, no se ofrece reenviar', a3c.copias === 1 && a3c.noEnviado === 0 && a3c.real && a3c.caja === '', a3c);

    // ───────── A4 · 502 con HTML ─────────
    const a4 = await p.evaluate(async () => { await abrir('h8', 1500); window.__refrescos = 0; escribir('esto da 502'); await enviarMensajeWhatsapp(); await d(400);
      const fila = Array.from(document.querySelectorAll('#waMessagesScroll .wa-brow')).find(x => /esto da 502/.test(x.textContent));
      const o = { aviso: textoToast(), refrescos: window.__refrescos, burbuja: fila ? fila.textContent.replace(/\s+/g, ' ').trim() : '', caja: document.getElementById('waTexto').value,
        json: getFriendlyError(new Error('Unexpected token \'<\', "<html><bod"... is not valid JSON')), refrescosJson: window.__refrescos };
      o.jwt = getFriendlyError(new Error('JWT expired')); o.refrescosJwt = window.__refrescos;
      escribir('esto va SIN RED'); await enviarMensajeWhatsapp(); await d(400); const f2 = Array.from(document.querySelectorAll('#waMessagesScroll .wa-brow')).find(x => /esto va SIN RED/.test(x.textContent));
      o.sinRed = { aviso: textoToast(), burbuja: f2 ? f2.textContent.replace(/\s+/g, ' ').trim() : '', caja: document.getElementById('waTexto').value, boton: document.getElementById('btnWaEnviar').disabled, noEnviados: copias(/No enviado/) }; escribir(''); return o; });
    c('A4 502: aviso corto y verdadero', a4.aviso === 'El servidor no respondió' && !/sesión/i.test(a4.aviso), a4.aviso);
    c('A4 502: no renueva la sesión', a4.refrescos === 0 && a4.refrescosJson === 0 && !/sesión/i.test(a4.json), { refrescos: a4.refrescos, json: a4.json });
    c('A4 502: la burbuja queda «No enviado · Reintentar» y el texto vuelve a la caja', /No enviado ·\s?Reintentar/.test(a4.burbuja) && a4.caja === 'esto da 502', a4.burbuja);
    c('A4 una sesión vencida de verdad sí se sigue renovando', /sesión/i.test(a4.jwt) && a4.refrescosJwt === 1, a4.jwt);
    c('A4 sin conexión: «Sin conexión», burbuja «No enviado · Reintentar», texto en la caja y botón libre', a4.sinRed.aviso === 'Sin conexión' && /esto va SIN RED/.test(a4.sinRed.burbuja) && /No enviado ·\s?Reintentar/.test(a4.sinRed.burbuja) && a4.sinRed.caja === 'esto va SIN RED' && a4.sinRed.boton === false && a4.sinRed.noEnviados === 1, a4.sinRed);

    // ───────── A5 · burbuja provisional y definitiva ─────────
    const a5 = await p.evaluate(async () => { const o = {}; const cuenta = () => ({ original: copias(/buenas tardes ya esta listo/), corregido: copias(/Buenas tardes, ya está listo\./) });
      const real = (id, wam, autor) => ({ id, hilo_id: 'h9', direccion: 'out', tipo_contenido: 'text', cuerpo: 'Buenas tardes, ya está listo.', estado: 'enviado', wa_message_id: wam, enviado_por_id: autor, creado_en: new Date().toISOString() });
      await abrir('h9', 1500);
      // a) la fila del servidor (con el empleado que envió) llega por tiempo real ANTES que la respuesta
      escribir('buenas tardes ya esta listo'); enviarMensajeWhatsapp(); await d(300); o.a = [cuenta()];
      let f = real('orto-a', 'wamid.orto1', sessionUser.id); __BD.tablas.whatsapp_mensajes.push(f); __rt('whatsapp_mensajes', 'INSERT', Object.assign({}, f));
      await d(300); o.a.push(cuenta()); await d(700); o.a.push(cuenta()); await d(3200); o.a.push(cuenta());
      // b) llega sin autor (eco de WhatsApp): no se empareja por texto distinto, pero al volver la respuesta queda una
      escribir('buenas tardes ya esta listo'); enviarMensajeWhatsapp(); await d(300);
      f = real('orto-b', 'wamid.orto2', null); __BD.tablas.whatsapp_mensajes.push(f); __rt('whatsapp_mensajes', 'INSERT', Object.assign({}, f));
      await d(1000); o.b = [cuenta()]; await d(3200); o.b.push(cuenta());
      // c) entra un mensaje del cliente mientras el envío sigue en curso
      escribir('mensaje con DEMORA'); enviarMensajeWhatsapp(); await d(300);
      const ent = { id: 'ent-1', hilo_id: 'h9', direccion: 'in', tipo_contenido: 'text', cuerpo: 'Gracias, paso mañana', creado_en: new Date().toISOString(), wa_message_id: 'wamid.ent1' }; __BD.tablas.whatsapp_mensajes.push(ent); __rt('whatsapp_mensajes', 'INSERT', Object.assign({}, ent));
      await d(400); const filas = Array.from(document.querySelectorAll('#waMessagesScroll .wa-brow')); const iE = filas.findIndex(x => /Gracias, paso mañana/.test(x.textContent)), iP = filas.findIndex(x => /mensaje con DEMORA/.test(x.textContent));
      o.c = { provisional: copias(/mensaje con DEMORA/), entrante: copias(/Gracias, paso mañana/), estado: iP >= 0 ? filas[iP].dataset.estado : null, provisionalAlFinal: iP === filas.length - 1 && iE >= 0 };
      await d(1500); o.cFin = { provisional: copias(/mensaje con DEMORA/), estado: (Array.from(document.querySelectorAll('#waMessagesScroll .wa-brow')).find(x => /mensaje con DEMORA/.test(x.textContent)) || { dataset: {} }).dataset.estado };
      // d) dos mensajes iguales seguidos siguen siendo dos
      escribir('ok listo'); await enviarMensajeWhatsapp(); escribir('ok listo'); await enviarMensajeWhatsapp(); await d(300); o.dosIguales = copias(/ok listo/); return o; });
    c('A5 con corrección del servidor nunca hay dos burbujas', a5.a.every(x => x.original + x.corregido === 1) && a5.a[1].corregido === 1 && a5.a[3].corregido === 1, a5.a);
    c('A5 si la fila llega sin autor, al volver la respuesta queda una sola', a5.b.every(x => x.original === 0 && x.corregido === 2), a5.b);
    c('A5 la burbuja «enviando» no desaparece al entrar un mensaje del cliente', a5.c.provisional === 1 && a5.c.entrante === 1 && a5.c.estado === 'enviando' && a5.c.provisionalAlFinal, a5.c);
    c('A5 al confirmar el servidor sigue una sola y ya enviada', a5.cFin.provisional === 1 && a5.cFin.estado === 'enviado', a5.cFin);
    c('A5 dos mensajes iguales seguidos siguen siendo dos', a5.dosIguales === 2, a5.dosIguales);

    // ───────── A6 · enlaces y textos maliciosos ─────────
    const a6 = await p.evaluate(async () => { await abrir('h7', 1500); const fila = (i) => document.querySelector('#waMessagesScroll .wa-brow[data-msgid="h7m' + i + '"]');
      const enl = Array.from(fila(6).querySelectorAll('a')).map(a => ({ href: a.getAttribute('href'), cls: a.className, tel: a.dataset.tel || '', txt: a.textContent }));
      const m = fila(8); return { enl, anidados: fila(6).querySelectorAll('a a').length, xss: window.__xss || 0, imgs: m.querySelectorAll('img').length, scripts: m.querySelectorAll('script').length, conEventos: Array.from(m.querySelectorAll('*')).filter(e => Array.from(e.attributes).some(a => /^on(?!click$)/i.test(a.name))).length, hrefs: Array.from(m.querySelectorAll('a')).map(a => a.getAttribute('href')), texto: m.textContent.includes('<img src=x') }; });
    c('A6 el enlace de wa.me abre la dirección completa', a6.enl.some(e => e.href === 'https://wa.me/18095551234' && e.txt === 'https://wa.me/18095551234') && a6.anidados === 0, a6.enl);
    c('A6 una dirección con «&» no se corta', a6.enl.some(e => e.href === 'https://tienda.com/p?a=1&b=2'), a6.enl.map(e => e.href));
    c('A6 el teléfono suelto sigue abriendo su menú y no hay teléfonos dentro de enlaces', a6.enl.filter(e => e.cls === 'wa-tel').length === 1 && a6.enl.some(e => e.cls === 'wa-tel' && e.tel === '18095551234' && e.txt === '809-555-1234'), a6.enl.filter(e => e.cls === 'wa-tel'));
    c('A6 textos maliciosos: nada se ejecuta ni se inyecta', a6.xss === 0 && a6.imgs === 0 && a6.scripts === 0 && a6.conEventos === 0 && a6.texto, { xss: a6.xss, imgs: a6.imgs, scripts: a6.scripts, conEventos: a6.conEventos, hrefs: a6.hrefs });

    // ───────── B · velocidad ─────────
    // V2 · refreshKpisReal no consulta
    const v2 = await p.evaluate(() => ({ elementos: ['bcKpiWa', 'bcKpiIg', 'bcKpiLeads', 'bcKpiChannels'].filter(id => document.getElementById(id)).length, consultas: __Q.slice(__q1).filter(x => /refreshKpisReal/.test(x.pila || '')).length, acciones: __Q.length - __q1 }));
    c('V2 refreshKpisReal no consulta en ninguna acción (sus contadores no están en pantalla)', v2.elementos === 0 && v2.consultas === 0 && v2.acciones > 20, v2);
    // V7 + V8 + V3 · adjuntos
    const v7 = await p.evaluate(async () => { await abrir('h2', 1200); await aLista(); _waUrlCache.clear(); const q0 = __Q.length; window.__LAT_POR = { storage: 500 }; tocar('h1'); await d(250);
      const nodo = document.getElementById('waMessagesScroll'); const antes = { burbujas: nodo.querySelectorAll('.wa-brow').length, esperando: nodo.querySelectorAll('.wa-media-cargando').length, imgs: nodo.querySelectorAll('img').length };
      await d(1500); window.__LAT_POR = {}; const sc = document.getElementById('waMessagesScroll'); const q = desde(q0);
      const imgs = Array.from(sc.querySelectorAll('.wa-bubble-wrap > img')), auds = Array.from(sc.querySelectorAll('audio'));
      return { antes, mismoNodo: sc === nodo, lote: q.porTabla['storage:signedUrls'] || 0, sueltos: q.porTabla['storage:signedUrl'] || 0, esperando: sc.querySelectorAll('.wa-media-cargando').length, imgs: imgs.length, lazy: imgs.filter(i => i.loading === 'lazy' && i.decoding === 'async').length, audios: auds.length, sinPrecarga: auds.filter(a => a.preload === 'none').length, alFondo: Math.round(sc.scrollHeight - sc.scrollTop - sc.clientHeight), consultas: q }; });
    c('V7 los enlaces firmados se piden en una sola petición', v7.lote === 1 && v7.sueltos === 0 && v7.imgs > 0 && v7.esperando === 0, { lote: v7.lote, sueltos: v7.sueltos, imgs: v7.imgs, audios: v7.audios });
    c('V4 el texto del chat se pinta antes de que lleguen los adjuntos', v7.antes.burbujas === 80 && v7.antes.esperando > 0 && v7.antes.imgs === 0, v7.antes);
    c('V3 al llegar los adjuntos cambia solo su burbuja (el chat no se reconstruye)', v7.mismoNodo, v7.mismoNodo);
    c('V8 fotos con carga diferida y audios sin precarga', v7.imgs > 0 && v7.lazy === v7.imgs && v7.audios > 0 && v7.sinPrecarga === v7.audios, { imgs: v7.imgs, lazy: v7.lazy, audios: v7.audios, sinPrecarga: v7.sinPrecarga });
    c('V8 al abrir el chat queda al fondo', v7.alFondo <= 2, v7.alFondo);
    // V3 · enviar no reconstruye el chat
    const v3 = await p.evaluate(async () => { const nodo = document.getElementById('waMessagesScroll'), caja = document.getElementById('waTexto'); const q0 = __Q.length; escribir('envío sin repintar'); await enviarMensajeWhatsapp(); await d(300);
      const real = { id: 'env-real', hilo_id: 'h1', direccion: 'out', tipo_contenido: 'text', cuerpo: 'envío sin repintar', estado: 'enviado', wa_message_id: (Array.from(_waMensajesOptimistas.values()).pop() || {}).wa_message_id || 'wamid.x', enviado_por_id: sessionUser.id, creado_en: new Date().toISOString() };
      __BD.tablas.whatsapp_mensajes.push(real); __rt('whatsapp_mensajes', 'INSERT', Object.assign({}, real)); await d(3500);
      const sc = document.getElementById('waMessagesScroll'); return { mismoNodo: sc === nodo, mismaCaja: document.getElementById('waTexto') === caja, copias: copias(/envío sin repintar/), real: !!sc.querySelector('[data-msgid="env-real"]'), alFondo: Math.round(sc.scrollHeight - sc.scrollTop - sc.clientHeight), consultas: desde(q0) }; });
    c('V3 al enviar se añade solo esa burbuja (ni el chat ni la caja se reconstruyen)', v3.mismoNodo && v3.mismaCaja && v3.copias === 1 && v3.real && v3.alFondo <= 2, { mismoNodo: v3.mismoNodo, mismaCaja: v3.mismaCaja, copias: v3.copias, alFondo: v3.alFondo });
    // V4 · sugerencia de IA en paralelo; bandeja sin esperar a los leads
    const v4 = await p.evaluate(async () => { const o = {}; await aLista();
      __BD.tablas.whatsapp_ia_sugerencias = [{ id: 'sug1', hilo_id: 'h13', estado: 'pendiente', texto_sugerido: 'Con gusto, le confirmo el precio.', razon: 'cotización', creado_en: new Date().toISOString() }];
      window.__LAT_POR = { whatsapp_ia_sugerencias: 1500, whatsapp_mensajes: 100 }; const t0 = performance.now(); tocar('h13');
      while (!document.querySelector('#waMessagesScroll .wa-brow') && performance.now() - t0 < 5000) await d(10); o.msChat = Math.round(performance.now() - t0); o.sugAlPintar = /IA sugiere/.test(document.getElementById('waDetalle').textContent);
      await d(1900); o.sugDespues = /IA sugiere/.test(document.getElementById('waDetalle').textContent); o.burbujas = document.querySelectorAll('#waMessagesScroll .wa-brow').length;
      // las dos a la vez: la sugerencia sale en el mismo pintado
      window.__LAT_POR = {}; await abrir('h14', 600); let cuerpos = 0; const mo = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.id === 'waMessagesScroll') cuerpos++; }))); mo.observe(document.getElementById('waWrap'), { childList: true, subtree: true });
      await abrir('h13', 1200); mo.disconnect(); o.juntas = { sug: /IA sugiere/.test(document.getElementById('waDetalle').textContent), cuerpos };
      await aLista(); nav('dashboard'); await d(500); __BD.tablas.whatsapp_hilos.find(x => x.id === 'h50').ultimo_mensaje_preview = 'vista previa nueva'; window.__LAT_POR = { leads: 1500 }; nav('crmLinea');
      await d(700); o.lista = { filas: document.querySelectorAll('#waLista .wa-row').length, vistaPrevia: (document.querySelector('#waLista .wa-row[data-hiloid="h50"] .fila-preview') || {}).textContent }; await d(1800); window.__LAT_POR = {}; return o; });
    c('V4 el chat se pinta sin esperar a la sugerencia de IA', v4.msChat < 900 && v4.burbujas > 5 && !v4.sugAlPintar, { msChat: v4.msChat, sugAlPintar: v4.sugAlPintar });
    c('V4 la sugerencia de IA aparece cuando llega', v4.sugDespues === true);
    c('V4 si llegan a la vez, la sugerencia sale sin pintar de más', v4.juntas.sug && v4.juntas.cuerpos <= 2, v4.juntas);
    c('V4 la bandeja se pinta con lo nuevo sin esperar al conteo de leads', v4.lista.filas >= 60 && v4.lista.vistaPrevia === 'vista previa nueva', v4.lista);
    // V5 · búsqueda
    const v5 = await p.evaluate(async () => { await aLista(); await d(300); _crmAbrirBusqueda(); const inp = document.getElementById('crmBuscarInput'); window.__pintadosLista = 0; const txt = 'Cliente 11';
      for (let i = 1; i <= txt.length; i++) { inp.value = txt.slice(0, i); inp.dispatchEvent(new Event('input', { bubbles: true })); await d(40); }
      const alTeclear = window.__pintadosLista; await d(1200); const filas = Array.from(document.querySelectorAll('#waLista .wa-row .fila-nombre')).map(x => x.textContent);
      const o = { alTeclear, pintados: window.__pintadosLista, filas: filas.length, todasCoinciden: filas.every(n => /Cliente 11/.test(n)) };
      inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); await d(600); o.alBorrar = document.querySelectorAll('#waLista .wa-row').length; inp.blur(); return o; });
    c('V5 al escribir 10 letras seguidas la lista no se recrea en cada tecla', v5.alTeclear === 0 && v5.pintados <= 2, { alTeclear: v5.alTeclear, pintados: v5.pintados });
    c('V5 la búsqueda encuentra lo mismo (también lo que no estaba cargado)', v5.filas === 11 && v5.todasCoinciden && v5.alBorrar >= 60, { filas: v5.filas, alBorrar: v5.alBorrar });
    // V10 · conteo exacto solo la primera vez
    const v10 = await p.evaluate(async () => { const msjs = (q0) => __Q.slice(q0).filter(x => x.tabla === 'whatsapp_mensajes' && x.op === 'select' && x.lim === 80 && !/creado_en/.test(x.filtros || '')); const hilos = (q0) => __Q.slice(q0).filter(x => x.tabla === 'whatsapp_hilos' && x.op === 'select' && x.rango);
      let q0 = __Q.length; await abrir('h15', 1200); const o = { abrir: msjs(q0).map(x => !!x.count) }; q0 = __Q.length; await cargarMensajesHilo('h15'); await d(300); o.refresco = msjs(q0).map(x => !!x.count);
      q0 = __Q.length; await cargarHilosWhatsapp(); await d(300); o.hilosRefresco = hilos(q0).map(x => !!x.count); o.total = BayolWhatsAppPaging.thread.total; o.hayMas = BayolWhatsAppPaging.thread.hasMore;
      BayolWhatsAppPaging.thread.countAt = Date.now() - 6 * 60 * 1000; q0 = __Q.length; await cargarHilosWhatsapp(); await d(300); o.hilos5min = hilos(q0).map(x => !!x.count); return o; });
    c('V10 mensajes: conteo exacto al abrir el chat, no en los refrescos', v10.abrir.length === 1 && v10.abrir[0] === true && v10.refresco.length === 1 && v10.refresco[0] === false, { abrir: v10.abrir, refresco: v10.refresco });
    c('V10 conversaciones: sin conteo en los refrescos, y otra vez a los 5 minutos', v10.hilosRefresco.length === 1 && v10.hilosRefresco[0] === false && v10.hilos5min[0] === true && v10.total === 120 && v10.hayMas === true, v10);

    // ───────── consultas por acción (antes, medido en la auditoría: entrar 21 · abrir 24 · entrante 8 · enviar 7) ─────────
    const cq = await p.evaluate(async () => { const o = {}; await aLista(); nav('dashboard'); await d(600); let q0 = __Q.length; nav('crmLinea'); await d(3000); o.entrar = desde(q0);
      await aLista(); _waUrlCache.clear(); q0 = __Q.length; tocar('h1'); await d(3500); o.abrir = desde(q0);
      _crmRtUltimaRecargaCompleta = Date.now();   // sin la recarga de respaldo de cada 90 s
      q0 = __Q.length; const ahora = new Date().toISOString(); const msg = { id: 'rt-9', hilo_id: 'h1', direccion: 'in', tipo_contenido: 'text', cuerpo: 'Hola, ¿ya está listo?', creado_en: ahora, wa_message_id: 'wamid.rt9' }; __BD.tablas.whatsapp_mensajes.push(msg); const h = __BD.tablas.whatsapp_hilos.find(x => x.id === 'h1'); Object.assign(h, { ultimo_mensaje_at: ahora, ultimo_inbound_at: ahora, ultimo_mensaje_preview: msg.cuerpo, no_leidos_count: 1 });
      __rt('whatsapp_mensajes', 'INSERT', Object.assign({}, msg)); __rt('whatsapp_hilos', 'UPDATE', Object.assign({}, h)); await d(6000); o.entrante = desde(q0); o.entranteVisto = !!document.querySelector('.wa-brow[data-msgid="rt-9"]'); return o; });
    console.log(`     [${W}] consultas por acción · entrar ${cq.entrar.total} · abrir un chat ${cq.abrir.total} · mensaje entrante ${cq.entrante.total} · enviar ${v3.consultas.total}`);
    console.log(`     [${W}]   entrar ${JSON.stringify(cq.entrar.porTabla)}`); console.log(`     [${W}]   abrir ${JSON.stringify(cq.abrir.porTabla)}`); console.log(`     [${W}]   entrante ${JSON.stringify(cq.entrante.porTabla)}`); console.log(`     [${W}]   enviar ${JSON.stringify(v3.consultas.porTabla)}`);
    c('consultas al volver a entrar al CRM ≤ 12 (antes 21)', cq.entrar.total <= 12, cq.entrar.total);
    c('consultas al abrir un chat con 9 adjuntos ≤ 8 (antes 24)', cq.abrir.total <= 8, cq.abrir.total);
    c('consultas por un mensaje entrante ≤ 3 (antes 8)', cq.entrante.total <= 3 && cq.entranteVisto, cq.entrante.total);
    c('consultas al enviar ≤ 2 (antes 7)', v3.consultas.total <= 2, v3.consultas.total);

    // ───────── Instagram y Facebook siguen abriendo ─────────
    const redes = await p.evaluate(async () => { const o = {}; const boton = (canal) => document.querySelector('[data-smart-channel="' + canal + '"]');
      for (const canal of ['instagram', 'facebook', 'whatsapp']) { const bt = boton(canal); o[canal] = !!bt; if (bt) { bt.click(); await d(1500); o[canal + 'Canal'] = document.getElementById('v-crmLinea').dataset.socialChannel; } }
      await d(500); await aLista(); await d(300); o.listaWa = document.querySelectorAll('#waLista .wa-row').length; return o; });
    c('Instagram y Facebook abren y se vuelve a WhatsApp', redes.instagramCanal === 'instagram' && redes.facebookCanal === 'facebook' && redes.whatsappCanal === 'whatsapp' && redes.listaWa >= 60, redes);

    if (SHOTS) await p.screenshot({ path: `${SHOTS}/crm-rapido-${W}.png` });
    c('cero errores de JavaScript', errs.length === 0, errs);
    await ctx.close();

    // ───────── empleado no administrador ─────────
    {
      const { ctx, p, errs, enviados } = await abrirPagina(b, W, { usuario: { id: '22222222-2222-4222-8222-222222222222', nombre: 'Michelle', usuario: 'michelle', rol: 'servicio', _tipo: 'tecnico', _permisos: { whatsapp_ver: true, whatsapp_responder: true, recepcion_ver: true } } });
      const e = await p.evaluate(async () => { const o = {}; nav('crmLinea'); await d(4000); o.filas = document.querySelectorAll('#waLista .wa-row').length; await abrir('h3', 1500); o.cab = cab(); o.caja = !!document.getElementById('waTexto');
        escribir('respuesta de la empleada'); await enviarMensajeWhatsapp(); await d(500); o.burbuja = copias(/respuesta de la empleada/);
        sessionUser._permisos = { whatsapp_ver: true }; _pintarWhatsappDetalle(); await d(200); o.sinPermisoCaja = !!document.getElementById('waTexto'); o.sinPermisoBurbujas = document.querySelectorAll('#waMessagesScroll .wa-brow').length; return o; });
      c('empleado no administrador: ve la bandeja, abre un chat y envía', e.filas >= 60 && e.cab === 'Cliente 3' && e.caja && e.burbuja === 1 && enviados.length === 1 && enviados[0].hilo_id === 'h3', e);
      c('empleado sin permiso de responder: ve el chat sin caja de escribir', e.sinPermisoCaja === false && e.sinPermisoBurbujas > 5, { caja: e.sinPermisoCaja, burbujas: e.sinPermisoBurbujas });
      c('empleado: cero errores de JavaScript', errs.length === 0, errs);
      await ctx.close();
    }

    // ───────── apagado con bc_crm_rapido_off: vuelve el comportamiento anterior y sigue funcionando ─────────
    {
      const { ctx, p, errs, enviados } = await abrirPagina(b, W, { apagado: true });
      const e = await p.evaluate(async () => { const o = { apagado: !_crmRapidoOn() }; nav('crmLinea'); await d(4000); const q1 = __Q.length; o.filas = document.querySelectorAll('#waLista .wa-row').length; await abrir('h1', 3000);
        const sc = document.getElementById('waMessagesScroll'); o.burbujas = sc.querySelectorAll('.wa-brow').length; o.lazy = sc.querySelectorAll('img[loading="lazy"]').length; o.lote = __Q.filter(x => x.tabla === 'storage:signedUrls').length; o.sueltos = __Q.filter(x => x.tabla === 'storage:signedUrl').length;
        escribir('envío con el paquete apagado'); await enviarMensajeWhatsapp(); await d(500); o.burbuja = copias(/envío con el paquete apagado/); o.kpis = __Q.slice(q1).filter(x => /refreshKpisReal/.test(x.pila || '')).length; return o; });
      c('apagado: bc_crm_rapido_off=1 se respeta', e.apagado === true);
      c('apagado: bandeja, chat y envío funcionan como antes', e.filas >= 60 && e.burbujas === 80 && e.burbuja === 1 && enviados.length === 1 && e.lazy === 0 && e.lote === 0 && e.sueltos > 0 && e.kpis > 0, e);
      c('apagado: cero errores de JavaScript', errs.length === 0, errs);
      await ctx.close();
    }
  }
  await b.close();
  console.log(`\n${pasadas} aprobadas · ${fallos} fallidas`);
  console.log(fallos ? 'HAY FALLOS' : 'Todo OK');
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
