const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs'); const S = __dirname, B = S;
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => {
    const out = {};
    sessionUser = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    out.capa = window.__bcFlowFinanciamiento || 'NO CARGÓ';
    out.renderEnvuelto = !!(window._waBurbujaMedia && window._waBurbujaMedia.__bcff);
    // Burbuja de respuesta
    const m = { id: 'm1', direccion: 'in', tipo_contenido: 'flow_respuesta', cuerpo: 'x', creado_en: new Date().toISOString(), meta: { flow: { datos: { cedula: '00112345678', nombres: 'Juan Pérez', telefono: '8095551234', provincia: 'Santiago', municipio: 'Santiago', sector: 'Los Jardines', calle: 'Calle 5', casa: '12', equipo: 'iPhone 13 128GB', precio: 'RD$ 38,500.00', referencia: 'Santiago · Loribel Ventura · iPhone 13 128GB RD$ 38,500.00' } } } };
    const html = window._waBurbujaMedia(m); const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d);
    const btns = [...d.querySelectorAll('button')]; out.botones = btns.length; out.minBtn = Math.min(...btns.map(x => Math.round(x.getBoundingClientRect().height)));
    out.tieneRef = html.includes('Referencia para el banco') && html.includes('Loribel Ventura'); out.formatos = { ced: html.includes('001-1234567-8'), tel: html.includes('809-555-1234'), monto: html.includes('data-bcff-copiar="38500"') };
    out.preview = window._waPreviewTexto({ tipo_contenido: 'flow_respuesta' });
    out.burbujaOut = window._waBurbujaMedia({ tipo_contenido: 'flow', meta: { flow: { borrador: true } } });
    // Botón en la caja de escribir: simular la caja
    const caja = document.createElement('div'); caja.innerHTML = '<button class="wa-icon-btn" id="btnWaRapidas"></button><input id="waTexto">'; document.body.appendChild(caja);
    await new Promise(r => setTimeout(r, 400));
    const bf = document.getElementById('btnWaFlowFin'); out.botonChat = !!bf; out.botonAlto = bf ? Math.round(bf.getBoundingClientRect().height) : 0;
    // Ventana: abrir con hilo simulado y RPC simulada
    _waHiloId = 'h1'; const llamadas = []; supabaseClient.functions.invoke = async (n, o) => { llamadas.push({ n, body: o.body }); return { data: { ok: true, referencia: 'Santiago · Admin · iPhone 13 RD$ 38,500.00', borrador: true }, error: null }; };
    window._bcffAbrir();
    await new Promise(r => setTimeout(r, 150));
    const eq = document.getElementById('bcffEquipo'), pr = document.getElementById('bcffPrecio'), env = document.getElementById('bcffEnviar');
    out.ventana = !!(eq && pr && env); if (eq) { out.campoAlto = Math.round(eq.getBoundingClientRect().height); out.campoLetra = parseFloat(getComputedStyle(eq).fontSize); out.enviarAlto = Math.round(env.getBoundingClientRect().height); }
    if (eq) { eq.value = 'iPhone 13 128GB'; pr.value = '38500'; document.getElementById('bcffPrueba').checked = true; env.click(); await new Promise(r => setTimeout(r, 200)); out.sinCasilla = llamadas.length; out.toastCasilla = (document.getElementById('toast') || {}).textContent || ''; document.getElementById('bcffInformado').checked = true; env.click(); await new Promise(r => setTimeout(r, 300)); }
    out.llamada = llamadas[0] ? { fn: llamadas[0].n, accion: llamadas[0].body.accion, equipo: llamadas[0].body.equipo, precio: llamadas[0].body.precio, prueba: llamadas[0].body.prueba, hilo: llamadas[0].body.hilo_id } : null;
    out.toast = (document.getElementById('toast') || {}).textContent || '';
    return out;
  });
  const ok = r.capa !== 'NO CARGÓ' && r.renderEnvuelto && r.botones >= 13 && r.minBtn >= 44 && r.tieneRef && r.formatos.ced && r.formatos.tel && r.formatos.monto && r.botonChat && r.ventana && r.campoAlto >= 48 && r.campoLetra >= 16 && r.enviarAlto >= 54 && r.sinCasilla === 0 && /inf[oó]rmele/.test(r.toastCasilla) && r.llamada && r.llamada.fn === 'whatsapp-flow-financiamiento' && r.llamada.precio === 38500 && /enviado/.test(r.toast);
  if (!ok) fallos++;
  console.log(W, ok ? 'OK' : 'FALLO', JSON.stringify(r), 'errores', errs.filter(e => !/net::|Failed/.test(e)));
  await ctx.close(); }
 await b.close(); process.exit(fallos ? 1 : 0); })();
