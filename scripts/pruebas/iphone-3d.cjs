// 4-nov-2026 · Página de prueba iphone-3d.html: carga el modelo, cambia de color, botón AR y medidas a 390/1280.
// Usa model-viewer real de jsdelivr (internet). Correr: node scripts/pruebas/servidor.cjs &  y luego este archivo [capturas].
const { chromium } = require('playwright'); const CAP = process.argv[2] || null;
(async () => { const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] }); let fallos = 0;
  const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
  for (const [w, h] of [[390, 844], [1280, 860]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await p.goto('http://127.0.0.1:8788/iphone-3d.html', { waitUntil: 'load', timeout: 120000 });
    const ok = await p.waitForFunction(() => { const m = document.getElementById('mv'); return m && m.loaded; }, null, { timeout: 60000 }).then(() => true, () => false);
    c(`[${w}] el modelo 3D carga`, ok);
    const r = await p.evaluate(() => { const m = document.getElementById('mv'); const mats = m.model ? m.model.materials.map(x => x.name) : [];
      const t = m.getDimensions ? m.getDimensions() : null;
      document.querySelector('.color[data-n="Verde"]').click();
      const marco = m.model.materials.find(x => x.name === 'Trasera').pbrMetallicRoughness.baseColorFactor.map(v => +v.toFixed(2));
      const btn = document.getElementById('btnAr').getBoundingClientRect(), chip = document.querySelector('.color').getBoundingClientRect();
      return { mats, dim: t && [t.x, t.y, t.z].map(v => +(v * 1000).toFixed(1)), color: document.getElementById('nomColor').textContent, marco, btn: Math.round(btn.height), chip: Math.round(chip.width), scrollX: document.documentElement.scrollWidth > innerWidth }; });
    c(`[${w}] materiales Marco y Trasera`, r.mats.includes('Marco') && r.mats.includes('Trasera'), r.mats);
    c(`[${w}] tamaño real ≈ 71.6 × 147.6 mm`, r.dim && Math.abs(r.dim[0] - 72.4) < 3 && Math.abs(r.dim[1] - 147.6) < 3, r.dim);
    c(`[${w}] cambiar color a Verde`, r.color === 'Verde' && r.marco[0] > 0.6, r.marco);
    c(`[${w}] botón 56 px y colores 48 px`, r.btn >= 56 && r.chip >= 48, [r.btn, r.chip]);
    c(`[${w}] sin scroll de lado`, !r.scrollX);
    await p.click('#btnAr'); const sinAr = await p.evaluate(() => getComputedStyle(document.getElementById('sinAr')).display);
    c(`[${w}] en PC sin AR: explica abrirlo en el celular`, sinAr === 'block', sinAr);
    await p.evaluate(() => document.querySelector('.color[data-n="Azul"]').click()); await p.evaluate(() => { const m = document.getElementById('mv'); m.removeAttribute('auto-rotate'); m.cameraOrbit = '200deg 78deg 0.44m'; m.jumpCameraToGoal(); scrollTo(0, 0); }); await p.waitForTimeout(800); if (CAP) await p.screenshot({ path: `${CAP}/iphone3d-${w}.png` });
    c(`[${w}] sin errores de JS`, errs.length === 0, errs); await ctx.close();
  }
  await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
