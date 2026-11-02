// 2-nov-2026 · Marca «✓ corregido» (crm-ortografia.js) en el chat de WhatsApp del CRM. Datos inventados; no toca Supabase real.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/crm-ortografia.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, deviceScaleFactor: 2 });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const enviados = [];
  // El servidor (simulado) corrige «esta listo su equipo» -> «Está listo su equipo.»
  await ctx.route(/functions\/v1\/whatsapp-enviar/, r => { const body = JSON.parse(r.request().postData() || '{}'); enviados.push(body);
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, messageId: 'wamid.orto', texto_enviado: 'Está listo su equipo.', ortografia: { corregido: true, original: body.mensaje } }) }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.addInitScript(() => { try { localStorage.setItem('bayol_subtab_crmlinea', 'mensajes'); } catch (e) {} });
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => {
    const out = {}; const w = ms => new Promise(r => setTimeout(r, ms));
    sessionUser = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    __BD.tablas.whatsapp_mensajes.forEach(m => { if (m.hilo_id === 'h1') m.tipo_contenido = 'text'; });
    out.capa = typeof window.bcOrtoMarca === 'function';
    nav('crmLinea'); await w(1500);
    if (typeof _crmLineaActualId === 'undefined' || !_crmLineaActualId) { seleccionarLineaCRM('l1', 'Santiago', 'Reparación'); await w(1500); }
    await abrirHiloWhatsapp('h1'); await w(1200);
    // 1) envío: la burbuja provisional muestra lo que salió de verdad
    document.getElementById('waTexto').value = 'esta listo su equipo';
    await enviarMensajeWhatsapp(); await w(500);
    const filas = [...document.querySelectorAll('#waMessagesScroll .wa-brow.out')];
    const ult = filas[filas.length - 1];
    out.textoProvisional = ult ? ult.innerText : '';
    out.marcaProvisional = !!(ult && ult.querySelector('.bc-orto'));
    // 2) la fila real del servidor (con meta.ortografia) reemplaza a la provisional
    const ahora = new Date().toISOString();
    __BD.tablas.whatsapp_mensajes.push({ id: 'h1orto', hilo_id: 'h1', direccion: 'out', tipo_contenido: 'text', cuerpo: 'Está listo su equipo.', estado: 'sent', wa_message_id: 'wamid.orto', creado_en: ahora, meta: { ortografia: { original: 'esta listo su equipo', en: ahora, ms: 640 } } });
    __BD.tablas.whatsapp_mensajes.push({ id: 'h1xss', hilo_id: 'h1', direccion: 'out', tipo_contenido: 'text', cuerpo: 'Gracias.', estado: 'sent', creado_en: ahora, meta: { ortografia: { original: 'grasias <img src=x onerror="window.__xss=1">' } } });
    __BD.tablas.whatsapp_mensajes.push({ id: 'h1fal', hilo_id: 'h1', direccion: 'out', tipo_contenido: 'text', cuerpo: 'Mañana.', estado: 'fallido', creado_en: ahora, meta: { ortografia: { original: 'manana' } } });
    __BD.tablas.whatsapp_mensajes.push({ id: 'h1sin', hilo_id: 'h1', direccion: 'out', tipo_contenido: 'text', cuerpo: 'Sin cambios.', estado: 'sent', creado_en: ahora });
    await cargarMensajesHilo('h1'); _pintarWhatsappDetalle(); await w(600);
    const fila = id => document.querySelector(`.wa-brow[data-msgid="${id}"]`);
    out.marcaReal = !!fila('h1orto')?.querySelector('.bc-orto');
    out.marcaFallido = !!fila('h1fal')?.querySelector('.bc-orto');
    out.marcaSinCambio = !!fila('h1sin')?.querySelector('.bc-orto');
    out.marcaCliente = document.querySelectorAll('.wa-brow.in .bc-orto').length;
    const marca = fila('h1orto').querySelector('.bc-orto');
    const area = getComputedStyle(marca, '::after').height;
    out.areaToque = parseFloat(area);
    marca.click(); await w(100);
    const pop = fila('h1orto').querySelector('.bc-orto-pop');
    out.popTexto = pop ? pop.innerText : '';
    out.ariaAbierto = marca.getAttribute('aria-expanded');
    // 3) texto seguro: el original con HTML se ve como texto
    fila('h1xss').querySelector('.bc-orto').click(); await w(100);
    const popX = fila('h1xss').querySelector('.bc-orto-pop');
    out.xssTexto = popX ? popX.querySelector('.bc-orto-tx').textContent : '';
    out.xssImg = !!popX?.querySelector('img'); out.xss = window.__xss || 0;
    fila('h1orto').scrollIntoView({ block: 'center' });
    return out;
  });
  await p.waitForTimeout(300);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/ortografia-wa-${W}.png` });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('capa crm-ortografia cargada', r.capa);
  c('se envía lo que escribió el empleado (el servidor corrige)', enviados[0] && enviados[0].mensaje === 'esta listo su equipo', enviados[0] && enviados[0].mensaje);
  c('burbuja provisional muestra el texto corregido', /Está listo su equipo\./.test(r.textoProvisional), r.textoProvisional);
  c('burbuja provisional lleva la marca', r.marcaProvisional);
  c('fila real con corrección lleva la marca', r.marcaReal);
  c('mensaje fallido: sin marca', !r.marcaFallido);
  c('mensaje sin corrección: sin marca', !r.marcaSinCambio);
  c('mensajes del cliente: sin marca', r.marcaCliente === 0, r.marcaCliente);
  c('área de toque ≥ 44 px', r.areaToque >= 44, r.areaToque);
  c('al tocar se ve «Usted escribió» y el original', /Usted escribió/.test(r.popTexto) && /esta listo su equipo/.test(r.popTexto), r.popTexto);
  c('aria-expanded = true', r.ariaAbierto === 'true');
  c('original con HTML se muestra como texto', r.xssTexto.includes('<img') && !r.xssImg && !r.xss, r.xssTexto);
  c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
