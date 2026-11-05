/* BAYOL CELL · Reportes en Excel de verdad (.xlsx) — dueño, 05-nov-2026:
   «¿Por qué el archivo Excel, cuando descargo el reporte, se descarga con esa carpeta y no puedo enviarlo por correo?»
   Los reportes (Diagnósticos, Costos, inventarios…) se armaban como una página web con extensión .xls. Excel la abre, pero
   al guardarla la guarda como página web y crea la carpeta «…_archivos» al lado: así no se puede mandar como un archivo.
   Esta capa intercepta esas descargas (enlace con download="….xls" y blob de tipo Excel), convierte la tabla con SheetJS y
   baja un .xlsx real: un solo archivo, que se abre y se reenvía sin carpeta. Los IMEI y números largos quedan como texto
   (si no, Excel los muestra como 3,5E+14). Si algo falla, baja el archivo de antes, como siempre.
   No cambia los reportes ni sus datos. Apagar en un equipo: localStorage.bc_excel_real_off = '1'. */
(function () {
  'use strict';
  if (window.BayolExcelReal) return;
  try { if (localStorage.getItem('bc_excel_real_off') === '1') return; } catch (e) {}

  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  var cargando = null;
  function cargarXlsx() {
    if (window.XLSX && window.XLSX.utils) return Promise.resolve(window.XLSX);
    if (cargando) return cargando;
    cargando = new Promise(function (ok, mal) {
      var s = document.createElement('script'); s.src = CDN; s.async = true;
      s.onload = function () { window.XLSX ? ok(window.XLSX) : mal(new Error('Sin XLSX')); };
      s.onerror = function () { cargando = null; mal(new Error('No se pudo cargar la librería de Excel')); };
      document.head.appendChild(s);
    });
    return cargando;
  }
  function aviso(t, k) { try { if (typeof toast === 'function') toast(t, k); } catch (e) {} }

  // Números de 12 cifras o más (IMEI, cédula, referencias): como texto. Anchos de columna según el contenido.
  function pulir(XLSX, ws) {
    if (!ws || !ws['!ref']) return;
    var rg = XLSX.utils.decode_range(ws['!ref']), anchos = [];
    for (var r = rg.s.r; r <= rg.e.r; r++) for (var c = rg.s.c; c <= rg.e.c; c++) {
      var ref = XLSX.utils.encode_cell({ r: r, c: c }), cel = ws[ref]; if (!cel) continue;
      if (cel.t === 'n' && Math.abs(cel.v) >= 1e11 && Number.isInteger(cel.v)) { cel.t = 's'; cel.v = String(cel.w || cel.v).replace(/\s/g, ''); delete cel.w; delete cel.z; }
      if (cel.t === 's' || cel.t === 'str') { var limpio = String(cel.v).replace(/^(\s*·\s*)+|(\s*·\s*)+$/g, '').replace(/(\s*·\s*){2,}/g, ' · '); if (limpio !== cel.v) { cel.v = limpio; delete cel.w; } }
      var txt = String(cel.w != null ? cel.w : cel.v == null ? '' : cel.v);
      var largo = Math.max.apply(null, txt.split(/\r?\n/).map(function (x) { return x.length; }));
      // Las filas de título (celdas unidas) no deben ensanchar la primera columna.
      var unida = (ws['!merges'] || []).some(function (m) { return m.s.r === r && m.s.c === c && m.e.c > m.s.c; });
      if (!unida) anchos[c] = Math.max(anchos[c] || 6, Math.min(48, largo + 2));
    }
    ws['!cols'] = anchos.map(function (w) { return { wch: w || 10 }; });
  }

  function bajarOriginal(blob, nombre) {
    var u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = nombre; a.dataset.bcXlsxPasa = '1';
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 1500);
  }

  async function convertir(pBlob, nombre) {
    var blob = null;
    try {
      blob = await pBlob;
      var texto = (await blob.text()).replace(/^﻿/, '');
      if (!/<table[\s>]/i.test(texto)) { bajarOriginal(blob, nombre); return; }
      var XLSX = await cargarXlsx();
      // Los saltos de línea dentro de una celda (<br>) se perderían y pegarían las palabras: se separan con « · ».
      texto = texto.replace(/<br\b[^>]*>/gi, ' · ');
      var wb = XLSX.read(texto, { type: 'string', cellDates: false });
      wb.SheetNames.forEach(function (n) { pulir(XLSX, wb.Sheets[n]); });
      if (wb.SheetNames[0] === 'Sheet1') { wb.Sheets['Reporte'] = wb.Sheets['Sheet1']; delete wb.Sheets['Sheet1']; wb.SheetNames[0] = 'Reporte'; }
      XLSX.writeFile(wb, nombre.replace(/\.xls$/i, '.xlsx'), { compression: true });
    } catch (e) {
      try { console.warn('[Excel real] se baja el archivo de antes:', e); } catch (_) {}
      if (blob) bajarOriginal(blob, nombre);
      else aviso('No se pudo preparar el Excel. Intente de nuevo.', 'error');
    }
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;
    if (!a || a.dataset.bcXlsxPasa === '1') return;
    var nombre = a.getAttribute('download') || '';
    if (!/\.xls$/i.test(nombre) || !/^blob:/i.test(a.href || '')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    // Se lee el archivo YA: quien lo armó libera el enlace a los ~100 ms.
    var p = fetch(a.href).then(function (r) { return r.blob(); });
    convertir(p, nombre);
  }, true);

  window.BayolExcelReal = { convertir: convertir, cargarXlsx: cargarXlsx };
})();
