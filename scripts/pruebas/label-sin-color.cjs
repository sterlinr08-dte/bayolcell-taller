// 28-oct-2026 · El label del equipo reacondicionado no lleva el color en el modelo. Datos inventados.
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname;
(async () => { const b = await chromium.launch(); let fallos = 0;
 const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
 await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
 const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
 await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
 const casos = [
   [{ id: 'a', modelo: 'CELULAR IPHONE 13 PRO MAX', capacidad: '128GB', color: 'Verde alpino', imei: '351016097520739', marca: 'Apple' }, 'iP 13 PRO MAX', '128GB'],
   [{ id: 'b', modelo: 'CELULAR IPHONE 12 PRO MAX', color: '256GB', imei: '1', marca: 'Apple' }, 'iP 12 PRO MAX', '256GB'],              // datos viejos: GB en «color»
   [{ id: 'c', modelo: 'SAMSUNG S23 ULTRA 256GB', color: 'Negro', imei: '2', marca: 'Samsung' }, 'S23 ULTRA', '256GB']];
 for (const [eq, mod, cap] of casos) {
   const r = await p.evaluate((eq) => { cache.refurb = [eq]; imprimirLabelEquipo(eq.id); const o = { m: document.getElementById('lr_modelo')?.value, c: document.getElementById('lr_gb')?.value, prev: (document.getElementById('lr_preview') || document.body).innerText }; try { cerrarLabelRapido(); } catch (e) {} return o; }, eq);
   const ok = r.m === mod && (r.c || '').replace(/\s/g, '') === cap && !/verde|negro|alpino/i.test(r.m);
   console.log((ok ? 'OK   ' : 'FALLA ') + eq.id + ' → modelo «' + r.m + '» · capacidad «' + r.c + '»'); if (!ok) fallos++;
 }
 if (errs.length) { console.log(errs); fallos++; }
 await b.close(); console.log(fallos ? `❌ ${fallos} fallos` : '✅ todo bien'); process.exit(fallos ? 1 : 0); })();
