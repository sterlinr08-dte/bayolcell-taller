// 10-nov-2026 · Ventana «Artículos Info Plus»: los filtros (Todos, Celulares…) no se aplastan con la lista larga. Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/buscador-filtros.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const [W, H] of [[390, 844], [1280, 720], [1920, 950]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    sessionUser = { id: 'a1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; isAdminUser = () => true;
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    cache.infoplusArticulos = Array.from({ length: 60 }, (_, i) => ({ codigo: String(1000 + i), descripcion: 'HOUSING IPHONE 14 PLUS ' + i, marca: 'IPHONE', precio1: 2500, costo: 900, existencia: 0 }));
    _ensureInfoplusArticulos = async () => cache.infoplusArticulos;
    const ref = '<div class="ab-ref-fallas"><span class="t">Fallas del equipo</span><span>CAMBIAR MARCO</span><span>PULIR PANTALLA</span></div>';
    try { await abrirBuscadorArticulos('x', () => {}, ref, 'IPHONE 14 PLUS'); } catch (e) {} await w(900);
    const ch = document.getElementById('abChips'), c1 = ch.querySelector('.ab-chip'), m = document.querySelector('.ab-modal'), l = document.getElementById('artBuscModalLista');
    const rc = ch.getBoundingClientRect(), r1 = c1.getBoundingClientRect(), rm = m.getBoundingClientRect();
    return { filas: l.children.length, altoFila: Math.round(rc.height), altoChip: Math.round(r1.height), chipDentro: r1.bottom <= rc.bottom + 1, modal: Math.round(rm.height), lista: Math.round(l.getBoundingClientRect().height), scroll: l.scrollHeight > l.clientHeight }; });
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/filtros-${W}.png` });
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ` [${W}x${H}] ${n}` + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  c('filtros completos (no aplastados)', r.altoChip >= 26 && r.chipDentro && r.altoFila >= r.altoChip, r);
  c('la lista sigue con su desplazamiento', r.scroll && r.lista > 150, [r.lista, r.scroll]);
  c('la ventana cabe en la pantalla', r.modal <= H, r.modal); c('sin errores de JavaScript', errs.length === 0, errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? fallos + ' fallo(s)' : 'Todo bien'); process.exit(fallos ? 1 : 0); })();
