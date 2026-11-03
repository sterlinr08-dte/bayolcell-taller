// 3-nov-2026 · Ventana «Imprimir label» pro + avisos animados (bc-label-modal-pro.js). Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/label-modal-pro.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const CAP = process.argv[2] || null;
(async () => { const b = await chromium.launch(); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  for (const [ancho, alto] of [[1280, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 2 });
    await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url();
      if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') });
      if (/tabler/.test(u)) return r.continue().catch(() => r.fulfill({ status: 200, body: '' }));
      r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
    const q = `[${ancho}]`;
    const r = await p.evaluate(async () => {
      sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
      document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; const L = document.getElementById('appLoader'); if (L) L.style.display = 'none';
      cache.refurb = [{ id: 'E1', lote_id: 'L1', imei: '352951035843397', notas_diagnostico: '' }]; cache.lotes = [{ id: 'L1', codigo_lote: 'C00002071' }];
      findArticulo = () => ({}); construirModeloAbreviado = () => 'CELULAR IP 8G PLUS 256GB';
      cargarFallasParaLabel = async () => { _fallasPorEquipo = { E1: [{ falla_corto: 'CAMBIAR BATERIA' }, { falla_corto: 'FLEX DE AUDIO' }] }; };
      await abrirPreviewLabelDiagIndividual('E1'); await new Promise(r => setTimeout(r, 500));
      const m = document.getElementById('modalLabelDiag'), lab = document.querySelector('#labelDiagPreview > *');
      const imp = m.querySelector('.bclp-imp'), cop = document.getElementById('diag_copias'), btns = m.querySelectorAll('.bclp-cop button');
      const out = { capa: m.classList.contains('bclp'), titulo: document.getElementById('modalLabelTitulo').textContent, info: document.getElementById('labelDiagInfo').textContent,
        ajustesCerrado: !m.querySelector('.bclp-ajustes').open, resumen: m.querySelector('.bclp-ajustes summary small').textContent,
        anchoLabel: Math.round(lab.getBoundingClientRect().width), anchoVentana: Math.round(m.querySelector('.modal-box').getBoundingClientRect().width),
        altoImp: Math.round(imp.getBoundingClientRect().height), textoImp: imp.textContent.trim(), btnCop: Array.from(btns).map(x => Math.round(x.getBoundingClientRect().width) + 'x' + Math.round(x.getBoundingClientRect().height)),
        cerrar: Math.round(m.querySelector('.modal-close').getBoundingClientRect().width) };
      btns[1].click(); btns[1].click(); out.copias = cop.value; btns[0].click(); out.copias2 = cop.value;
      // lo que se imprime no cambia de tamaño (se arma aparte, sin zoom)
      const html = generarHtmlLabelDiag(cache.refurb[0]); const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d); out.anchoImpreso = Math.round(d.firstElementChild.getBoundingClientRect().width); d.remove();
      return out;
    });
    c(q + ' capa puesta y título corto', r.capa && r.titulo === 'Imprimir label', r.titulo);
    c(q + ' etiqueta grande en la vista previa', r.anchoLabel >= (ancho > 600 ? 400 : 260) && r.anchoLabel <= r.anchoVentana, [r.anchoLabel, r.anchoVentana]);
    c(q + ' lo impreso sigue de 51 mm (≈193 px)', Math.abs(r.anchoImpreso - 193) <= 2, r.anchoImpreso);
    c(q + ' «Ajustar medidas» plegado con resumen', r.ajustesCerrado && /51 × 25 mm/.test(r.resumen), r.resumen);
    c(q + ' botón Imprimir 54 px', r.altoImp >= 54 && r.textoImp === 'Imprimir', [r.altoImp, r.textoImp]);
    c(q + ' copias con − y + (≥44 px)', r.btnCop.every(s => +s.split('x')[0] >= 44 && +s.split('x')[1] >= 44) && r.copias === '3' && r.copias2 === '2', r);
    c(q + ' cerrar ≥ 44 px', r.cerrar >= 44, r.cerrar);
    if (CAP) await p.screenshot({ path: `${CAP}/label-modal-${ancho}.png` });
    // abrir ajustes
    await p.click('#modalLabelDiag .bclp-ajustes summary'); await p.waitForTimeout(300);
    const aj = await p.evaluate(() => { const i = document.getElementById('mlbl_font'); const r = i.getBoundingClientRect(); return { alto: Math.round(r.height), letra: getComputedStyle(i).fontSize, visible: r.width > 0 }; });
    c(q + ' ajustes: campos 48 px y letra 16', aj.visible && aj.alto >= 48 && aj.letra === '16px', aj);
    if (CAP) await p.screenshot({ path: `${CAP}/label-modal-${ancho}-ajustes.png` });
    // aviso
    await p.evaluate(() => { cerrarModalLabelDiag(); toast('🖨️ Enviado a la impresora.'); });
    await p.waitForTimeout(450);
    const t = await p.evaluate(() => { const t = document.getElementById('toast'); const r = t.getBoundingClientRect(); return { cls: t.className, txt: t.querySelector('.bct-txt') && t.querySelector('.bct-txt').textContent, centro: Math.round(r.left + r.width / 2), ancho: innerWidth, abajo: Math.round(innerHeight - r.bottom), op: getComputedStyle(t).opacity, ico: !!t.querySelector('.bct-ico .ti-check') }; });
    c(q + ' aviso al centro, abajo, con ícono ✓ y sin emoji repetido', /bct-ok/.test(t.cls) && t.ico && t.txt === 'Enviado a la impresora.' && Math.abs(t.centro - t.ancho / 2) <= 2 && t.abajo >= 12 && t.op === '1', t);
    if (CAP) await p.screenshot({ path: `${CAP}/aviso-${ancho}.png` });
    await p.evaluate(() => toast('No imprimió: POS-80C sin conexión. Revise la impresora y su cola.', 'error')); await p.waitForTimeout(400);
    const e = await p.evaluate(() => document.getElementById('toast').className);
    c(q + ' aviso de error en rojo', /bct-mal/.test(e), e);
    if (CAP) await p.screenshot({ path: `${CAP}/aviso-error-${ancho}.png` });
    await p.click('#toast'); await p.waitForTimeout(400);
    const fuera = await p.evaluate(() => getComputedStyle(document.getElementById('toast')).display);
    c(q + ' un toque cierra el aviso (baja y se va)', fuera === 'none', fuera);
    c(q + ' sin errores de JS', errs.length === 0, errs);
    await ctx.close();
  }
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
