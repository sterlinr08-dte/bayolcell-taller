// 3-nov-2026 · Pistola de códigos: lee solo IMEI y marca el equipo para asignar al técnico (datos inventados).
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/pistola-imei.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const CAP = process.argv[2] || null;
(async () => { const b = await chromium.launch(); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  await p.evaluate(() => {
    sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; const L = document.getElementById('appLoader'); if (L) L.style.display = 'none';
    window.__av = []; const t0 = toast; toast = (m, k) => { window.__av.push((k || 'info') + ': ' + m); };
    cache.tecnicos = [{ id: 'T1', nombre: 'Omil', activo: true }, { id: 'T2', nombre: 'Alejandro', activo: true }];
    cache.refurb = [
      { id: 'E1', lote_id: 'L1', imei: '356118094108198', modelo: 'IP 8G PLUS 256GB', estado_evaluacion: 'evaluado', creado_en: '1' },
      { id: 'E2', lote_id: 'L1', imei: '353013095205510', modelo: 'IP 8G PLUS 256GB', estado_evaluacion: 'evaluado', creado_en: '2' },
      { id: 'E3', lote_id: 'L1', imei: '352951035843398', modelo: 'IP 11', estado_evaluacion: 'en_proceso', tecnico_asignado_id: 'T2', creado_en: '3' },
      { id: 'E4', lote_id: 'L1', imei: '352642890077236', modelo: 'S22 ULTRA', estado_evaluacion: 'recibido', creado_en: '4' },
      { id: 'E5', lote_id: 'L9', imei: '357260091900661', modelo: 'IP XS', estado_evaluacion: 'evaluado', creado_en: '5' }
    ];
    reacondLoteAbiertoId = 'L1'; _reacondSel = new Set(); renderDetalleLoteReacond = () => {};
    abrirModalAsignarLote();
  });
  await p.waitForTimeout(400);
  const luhn = await p.evaluate(() => ['356118094108198', '353013095205510', '352951035843398', '352642890077236', '357260091900661'].map(x => BayolPistolaImei.sacarImei(x) === x));
  c('los IMEI de prueba son válidos (Luhn)', luhn.every(Boolean), luhn);
  const caja = await p.evaluate(() => { const i = document.getElementById('bcpiInput'); return { hay: !!i, foco: document.activeElement === i, alto: i && Math.round(i.getBoundingClientRect().height) }; });
  c('campo «Escanear IMEI» con el cursor puesto (48 px)', caja.hay && caja.foco && caja.alto >= 46, caja);
  const pistola = async (txt) => { await p.keyboard.type(txt, { delay: 5 }); await p.keyboard.press('Enter'); await p.waitForTimeout(120); };
  await pistola('356118094108198');
  let r = await p.evaluate(() => ({ sel: [..._reacondSel], disp: document.getElementById('asignlote_disp').textContent, av: window.__av.slice(-1)[0], ult: document.getElementById('bcpiUlt').textContent }));
  c('IMEI del lote evaluado: lo marca', r.sel.join() === 'E1' && /1 equipo/.test(r.disp) && /Marcado/.test(r.av), r);
  await pistola('IMEI 353013095205510'); r = await p.evaluate(() => [..._reacondSel].join());
  c('con texto alrededor también lo lee', r === 'E1,E2', r);
  await pistola('F2LXK0QMJC69'); r = await p.evaluate(() => ({ sel: [..._reacondSel].join(), av: window.__av.slice(-1)[0] }));
  c('código que no es IMEI (serie): lo ignora y avisa', r.sel === 'E1,E2' && /^error: No es un IMEI/.test(r.av), r);
  await pistola('356118094108190'); r = await p.evaluate(() => window.__av.slice(-1)[0]);
  c('15 cifras que no pasan Luhn: no es IMEI', /No es un IMEI/.test(r), r);
  await pistola('352951035843398'); r = await p.evaluate(() => window.__av.slice(-1)[0]);
  c('ya asignado: dice a quién', /Ya lo tiene Alejandro/.test(r), r);
  await pistola('352642890077236'); r = await p.evaluate(() => window.__av.slice(-1)[0]);
  c('no evaluado todavía: avisa', /Aún no está evaluado/.test(r), r);
  await pistola('357260091900661'); r = await p.evaluate(() => window.__av.slice(-1)[0]);
  c('de otro lote: avisa', /otro lote/.test(r), r);
  await pistola('356118094108198'); r = await p.evaluate(() => [..._reacondSel].join());
  c('escanear otra vez lo quita', r === 'E2', r);
  // pistola con el cursor en otro campo (la nota)
  await p.click('#asignlote_nota'); await pistola('356118094108198');
  r = await p.evaluate(() => ({ sel: [..._reacondSel].sort().join(), nota: document.getElementById('asignlote_nota').value }));
  c('con el cursor en otro campo también marca y no ensucia la nota', r.sel === 'E1,E2' && !/356118/.test(r.nota), r);
  if (CAP) await p.locator('#modalAsignarLote .modal-box').screenshot({ path: CAP + '/pistola-imei.png' });
  c('sin errores de JS', errs.length === 0, errs);
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
