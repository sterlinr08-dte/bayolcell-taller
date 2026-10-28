// 28-oct-2026 · Excel «Diagnósticos (Excel)» del lote de reacondicionados. Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/diagnosticos-lote.cjs [carpeta]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const OUT = process.argv[2] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
 await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
 const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
 await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
 await p.evaluate(() => {
   sessionUser = { id: 't1', nombre: 'Técnico', rol: 'tecnico', _tipo: 'tecnico', _permisos: {} }; // no admin: igual puede sacarlo
   cache.lotes = [{ id: 'L1', codigo_lote: 'C00002051', fecha_compra: '2026-10-22', proveedor_id: null }];
   cache.tecnicos = [{ id: 'tec', nombre: 'Yves' }];
   cache.refurb = [
     { id: 'e1', lote_id: 'L1', modelo: 'CELULAR IPHONE 14 PRO MAX', capacidad: '256GB', imei: '356000000000011', color: 'Morado', estado_evaluacion: 'evaluado', tecnico_asignado_id: 'tec', articulo_codigo: '11447', notas_diagnostico: 'pant mens. 2da mano\ncamara crackeada' },
     { id: 'e2', lote_id: 'L1', modelo: 'CELULAR IPHONE 12 PRO MAX', imei: '356000000000029', estado_evaluacion: 'en_proceso', notas_diagnostico: null },
     { id: 'x9', lote_id: 'OTRO', modelo: 'NO DEBE SALIR', imei: '1' }];
   cache.piezasReacond = [{ equipo_id: 'e1', pieza_nombre: 'BATERIA IPHONE 14 PRO MAX', cantidad: 1, costo_unitario: 1800 }];
   reacondLoteAbiertoId = 'L1';
   const real = supabaseClient.from.bind(supabaseClient);
   const T = [{ ref_id: 'e1', descripcion: 'CAMBIAR BATERIA', estado: 'pendiente', creado_en: '1' }, { ref_id: 'e1', descripcion: 'PULIR PANTALLA', estado: 'hecha', creado_en: '2' }, { ref_id: 'e2', descripcion: 'HOUSING', estado: 'pendiente', creado_en: '3' }];
   // En la base hay un tercer equipo del lote que no está en el caché: debe salir igual (lote completo).
   const BD = [...cache.refurb.filter(e => e.lote_id === 'L1'), { id: 'e3', lote_id: 'L1', modelo: 'CELULAR IPHONE 11', imei: '356000000000037', estado_evaluacion: 'listo_venta', notas_diagnostico: 'SOLO EN LA BASE' }];
   supabaseClient.from = (t) => {
     if (t === 'equipos_refurbish') return { select() { const q = { eq(k, v) { q._v = v; return q; }, order() { return Promise.resolve({ data: BD.filter(e => e.lote_id === q._v), error: null }); } }; return q; } };
     return t !== 'tareas_trabajo' ? real(t) : { select() { const q = { eq() { return q; }, in(k, ids) { return Promise.resolve({ data: T.filter(x => ids.includes(x.ref_id)), error: null }); } }; return q; } };
   };
   // Filtro de estado puesto en la pantalla (p. ej. «Diagnóstico»): el Excel lo ignora.
   const f = document.getElementById('reacondFiltroEstado'); if (f) { if (![...f.options].some(o => o.value === 'diagnostico')) f.add(new Option('Diagnóstico', 'diagnostico')); f.value = 'diagnostico'; }
 });
 const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.evaluate(() => exportarDiagnosticosLoteExcel())]);
 const ruta = (OUT || '/tmp') + '/' + dl.suggestedFilename(); await dl.saveAs(ruta); const x = fs.readFileSync(ruta, 'utf8');
 const chk = { nombre: /^Diagnosticos_C00002051_\d{4}-\d\d-\d\d\.xls$/.test(dl.suggestedFilename()), tres: (x.match(/<tr style="vertical-align:top;">/g) || []).length === 3, soloBase: x.includes('SOLO EN LA BASE'),
   otroLote: !x.includes('NO DEBE SALIR'), nota: /pant mens\. 2da mano<br[^>]*>camara crackeada/.test(x), pend: x.includes('CAMBIAR BATERIA') && x.includes('HOUSING'),
   hecha: x.includes('PULIR PANTALLA'), pieza: x.includes('BATERIA IPHONE 14 PRO MAX'), sinCostos: !/1,800|1800/.test(x), color: x.includes('Morado'), tecnico: x.includes('Yves'), cap: x.includes('256GB'), errores: errs.length === 0 };
 for (const [k, v] of Object.entries(chk)) { console.log((v ? 'OK   ' : 'FALLA ') + k); if (!v) fallos++; }
 if (errs.length) console.log(errs);
 await b.close(); console.log(fallos ? `❌ ${fallos} fallos` : '✅ todo bien'); process.exit(fallos ? 1 : 0); })();
