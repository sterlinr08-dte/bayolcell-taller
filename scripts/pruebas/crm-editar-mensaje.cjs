// 30-oct-2026 · «Editar» un mensaje enviado en el CRM (crm-wa-identico.js w20). Datos inventados; no toca Supabase real.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/crm-editar-mensaje.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const enviados = [];
  await ctx.route(/functions\/v1\/whatsapp-enviar/, r => { enviados.push(JSON.parse(r.request().postData() || '{}')); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, messageId: 'wamid.prueba' }) }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.addInitScript(() => { try { localStorage.setItem('bayol_subtab_crmlinea', 'mensajes'); } catch (e) {} });
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => {
    const out = {}; const w = ms => new Promise(r => setTimeout(r, ms));
    sessionUser = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    __BD.tablas.whatsapp_mensajes.forEach(m => { if (m.hilo_id === 'h1') m.tipo_contenido = 'text'; });
    nav('crmLinea'); await w(1500);
    if (typeof _crmLineaActualId === 'undefined' || !_crmLineaActualId) { seleccionarLineaCRM('l1', 'Santiago', 'Reparación'); await w(1500); }
    out.version = (window.BayolWaIdentico || {}).version;
    await abrirHiloWhatsapp('h1'); await w(1200);
    const btn = document.querySelector('.wa-brow[data-msgid="h1m13"] .wa-menu-btn');
    out.hayChevron = !!btn;
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); await w(150);
    const ed = document.getElementById('waMenuCorregir');
    out.etiqueta = ed ? ed.textContent.trim() : ''; out.visible = ed && ed.style.display !== 'none';
    out.altoBoton = ed ? Math.round(ed.getBoundingClientRect().height) : 0;
    // en un mensaje del cliente no aparece
    _waCerrarMenuAcciones(); document.querySelector('.wa-brow[data-msgid="h1m12"] .wa-menu-btn').dispatchEvent(new MouseEvent('click', { bubbles: true })); await w(150);
    out.ocultoEnCliente = document.getElementById('waMenuCorregir').style.display === 'none';
    _waCerrarMenuAcciones(); btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); await w(150);
    _waMenuAccion('corregir'); await w(200);
    const t = document.getElementById('waTexto');
    out.cajaConOriginal = t.value; out.barra = (document.querySelector('#waReplyBar .who') || {}).textContent || '';
    // sin cambios: no envía
    await enviarMensajeWhatsapp(); await w(200); out.cajaTrasSinCambio = t.value;
    t.value = 'Texto 13 del chat 1 (corregido)'; await enviarMensajeWhatsapp(); await w(400);
    // el webhook traería el mensaje real: se simula
    __BD.tablas.whatsapp_mensajes.push({ id: 'h1ed', hilo_id: 'h1', direccion: 'out', tipo_contenido: 'text', cuerpo: '✏️ *Editado:* Texto 13 del chat 1 (corregido)', responde_a_id: 'h1m13', estado: 'sent', creado_en: new Date().toISOString() });
    await cargarMensajesHilo('h1'); _pintarWhatsappDetalle(); await w(600);
    const viejo = document.querySelector('.wa-brow[data-msgid="h1m13"]');
    out.viejoMarcado = viejo && viejo.classList.contains('bcwa-editado');
    out.etiquetaEditado = viejo && !!viejo.querySelector('.bcwa-ed');
    out.otrosSinMarca = document.querySelectorAll('.wa-brow.bcwa-editado').length;
    return out;
  });
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/editar-${W}.png` });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('versión w20', r.version === '20261030-w20', r.version);
  c('menú dice «Editar» en mensaje propio', r.etiqueta === 'Editar' && r.visible, r.etiqueta);
  c('botón del menú ≥ 44 px', r.altoBoton >= 44, r.altoBoton);
  c('no aparece en mensaje del cliente', r.ocultoEnCliente);
  c('la caja trae el texto original', r.cajaConOriginal === 'Texto 13 del chat 1', r.cajaConOriginal);
  c('barra «Editando su mensaje»', /Editando/.test(r.barra), r.barra);
  c('sin cambios no envía', enviados.length === 1 ? true : enviados.length === 1, enviados.length);
  const e = enviados[enviados.length - 1] || {};
  c('envía «✏️ *Editado:*» + texto nuevo', e.mensaje === '✏️ *Editado:* Texto 13 del chat 1 (corregido)', e.mensaje);
  c('cita el mensaje original', e.responde_a_id === 'h1m13', e.responde_a_id);
  c('un solo envío', enviados.length === 1, enviados.length);
  c('viejo queda «Editado» y atenuado', r.viejoMarcado && r.etiquetaEditado);
  c('solo ese mensaje marcado', r.otrosSinMarca === 1, r.otrosSinMarca);
  c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0); })();
