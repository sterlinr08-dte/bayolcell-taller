// 28-oct-2026 · Avisos del código de vendedor Info Plus al guardar un empleado. Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/codigo-vendedor.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  // Ventas falsas: solo el 748 y el 697 tienen ventas.
  await p.evaluate(() => {
    cache.tecnicos = [{ id: 'a', nombre: 'Michelle', infoplus_codempleado: '748' }, { id: 'b', nombre: 'Kenifer', infoplus_codempleado: '1020' }];
    const real = supabaseClient.from.bind(supabaseClient);
    supabaseClient.from = (t) => t !== 'infoplus_ventas' ? real(t) : { select() { const q = { _c: null, eq(k, v) { q._c = v; return q; }, limit() { return Promise.resolve({ data: ['748', '697', '1020'].includes(q._c) ? [{ id: 'x' }] : [], error: null }); } }; return q; } };
  });
  const caso = async (cod, id, boton) => p.evaluate(async ([cod, id, boton]) => {
    const pr = _tecAvisosCodInfoplus(cod, id); const textos = [];
    for (let i = 0; i < 2; i++) { await new Promise(r => setTimeout(r, 250)); const m = document.getElementById('modalConfirm'); if (!m) break; textos.push(m.innerText.replace(/\s+/g, ' ').slice(0, 90)); document.getElementById(boton).click(); }
    return { ok: await pr, textos };
  }, [cod, id, boton]);
  const r1 = await caso('697', 'nuevo', 'confOk');                    // sin dueño y con ventas: no pregunta nada
  const r2 = await caso('748', 'nuevo', 'confCancel');                // repetido → Corregir
  const r3 = await caso('748', 'a', 'confOk');                        // es el mismo empleado: no avisa
  const r4 = await caso('7480', 'nuevo', 'confCancel');               // nunca usado → Corregir
  const r5 = await caso('9999', 'nuevo', 'confOk');                   // nunca usado → Guardar igual
  if (SHOTS) { await p.evaluate(() => { _tecAvisosCodInfoplus('1020', 'nuevo'); }); await p.waitForTimeout(400); await p.screenshot({ path: `${SHOTS}/codigo-repetido-${W}.png` }); }
  const ok = [r1.ok && r1.textos.length === 0, !r2.ok && /ya lo tiene Michelle/.test(r2.textos[0] || ''), r3.ok && r3.textos.length === 0,
    !r4.ok && /nunca ha usado el código 7480/.test(r4.textos[0] || ''), r5.ok && r5.textos.length === 1, errs.length === 0];
  ok.forEach((v, i) => { console.log(W + 'px caso ' + (i + 1) + ': ' + (v ? 'OK' : 'FALLA')); if (!v) fallos++; });
  if (errs.length) console.log(errs);
  // Medidas de los botones del aviso (regla: ≥44 px).
  await p.evaluate(() => { document.getElementById('modalConfirm')?.remove(); _tecAvisosCodInfoplus('748', 'nuevo'); }); await p.waitForTimeout(300);
  const h = await p.evaluate(() => ['confOk', 'confCancel'].map(i => Math.round(document.getElementById(i).getBoundingClientRect().height)));
  console.log(W + 'px botones del aviso (alto px): ' + h.join(', ')); if (h.some(x => x < 44)) { fallos++; console.log('FALLA: botón < 44 px'); }
  await ctx.close(); }
 await b.close(); console.log(fallos ? `❌ ${fallos} fallos` : '✅ todo bien'); process.exit(fallos ? 1 : 0); })();
