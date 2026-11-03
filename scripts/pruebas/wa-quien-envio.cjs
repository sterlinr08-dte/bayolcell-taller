// 2-nov-2026 · Chat de WhatsApp: cada mensaje enviado dice quién lo mandó (dueño). Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/wa-quien-envio.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname;
(async () => { const b = await chromium.launch(); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    cache.tecnicos = [{ id: 't-ale', nombre: 'alejandro espaillat' }]; cache.usuarios = [{ id: 'u-1', nombre: 'Sterling' }];
    sessionUser = { id: 't-mi', nombre: 'MICHELLE FELIPE BAEZ', _tipo: 'tecnico' };
    const et = (m, opt) => { const h = _waBurbujaRowHTML(Object.assign({ id: 'x', direccion: 'out', creado_en: '2026-11-02T17:28:25Z', cuerpo: 'hola', estado: 'enviado' }, m), 'Cliente'); const d = document.createElement('div'); d.innerHTML = h; return d.textContent; };
    return {
      crm: et({ enviado_por_id: 't-ale' }), admin: et({ enviado_por_id: 'u-1' }), celular: et({}),
      ia: et({ es_automatico: true }), viejo: et({ creado_en: '2026-09-20T10:00:00Z' }), plantilla: et({ plantilla_nombre: 'factura_generada' }),
      opt: _waQuienEnvio({ direccion: 'out' }, true), entrante: et({ direccion: 'in' })
    };
  });
  c('enviado desde el CRM: nombre del empleado', /Alejandro Espaillat · BayolCell/.test(r.crm), r.crm);
  c('enviado por el administrador: su nombre', /Sterling · BayolCell/.test(r.admin), r.admin);
  c('escrito en el celular: «Desde el celular»', /Desde el celular · BayolCell/.test(r.celular), r.celular);
  c('IA: sigue «Tú (BayolCell)» y «Respondido por IA»', /Tú \(BayolCell\)/.test(r.ia), r.ia);
  c('mensajes viejos (antes del 9-oct): sin acusar al celular', /Tú \(BayolCell\)/.test(r.viejo), r.viejo);
  c('plantilla automática: sin acusar al celular', !/celular/.test(r.plantilla), r.plantilla);
  c('mientras se envía: nombre de quien escribe', r.opt === 'Michelle Felipe Baez · BayolCell', r.opt);
  c('mensaje del cliente: su nombre, sin cambios', /Cliente/.test(r.entrante) && !/BayolCell/.test(r.entrante), r.entrante);
  c('sin errores de JS', errs.length === 0, errs);
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
