/* bc-prefactura-imprimir.js — 21-oct-2026 (dueño): la prefactura impresa lleva el MISMO Nº de Info Plus,
   se imprime al guardar en el papel escogido en «Config. Impresora»: ticket 80 mm o hoja carta (cada PC).
   La reimpresión del mismo Nº dice «COPIA». El PDF sigue igual (hoja carta).
   Reemplaza imprimirPrefactura(modo) de taller-app.js; usa _prefUltima (lo llena _rpImprimir).
   Apagar: localStorage.bc_pfimp_off = '1'. */
(function () {
  'use strict';
  try { if (localStorage.getItem('bc_pfimp_off') === '1') return; } catch (e) {}
  var doc = document;
  var LS_FMT = 'bc_pref_formato', LS_IMP = 'bc_pref_impresas';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rd(n) { return 'RD$ ' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function textoSel(id, val) {
    var el = doc.getElementById(id); if (!el || val == null || val === '') return '';
    var o = [].find.call(el.options || [], function (x) { return String(x.value) === String(val); });
    return o ? o.textContent.trim() : '';
  }
  // ¿Ya se imprimió este Nº en esta PC? → la siguiente es «COPIA»
  function yaImpresa(num) { var l = (lsGet(LS_IMP) || '').split(','); return !!num && l.indexOf(String(num)) >= 0; }
  function marcarImpresa(num) {
    if (!num) return; var l = (lsGet(LS_IMP) || '').split(',').filter(Boolean);
    if (l.indexOf(String(num)) < 0) l.push(String(num));
    lsSet(LS_IMP, l.slice(-300).join(','));
  }

  function datos(p) {
    var m = p.model || {}, ct = (typeof cache !== 'undefined' && cache.configTaller) || {}, r = p.ref || {};
    var loc = String(m.codlocalidad) === '4' ? 'Moca' : 'Santiago';
    var lineas = (m.detallesPreFactura || []).map(function (d) {
      var pct = Number(d.porcentaje || 0), imp = Math.round(d.precio * d.cantidad * (100 - pct)) / 100;
      var imeis = (m.seriales || []).filter(function (s) { return String(s.codarticulo) === String(d.codarticulo); }).map(function (s) { return s.numero; });
      return { cod: d.codarticulo, desc: d.descripcion, cant: d.cantidad, precio: d.precio, pct: pct, imp: imp, imeis: imeis };
    });
    return {
      negocio: ct.nombre || 'BAYOL CELL', dir: ct.direccion || '', tel: ct.telefono || '', loc: loc,
      num: p.num || '', cliente: m.nombre || 'CONTADO', fecha: m.fecha || '', hora: String(m.hora || '').slice(0, 5),
      vendedor: textoSel('rxVendedor', m.codempleado), almacen: textoSel('rxAlmacen', m.codlocalidad),
      lineas: lineas, desc: Number(m.descuentototal || 0), total: Number(p.total || 0), ref: r,
      logo: location.origin + location.pathname.replace(/[^/]*$/, '') + 'assets/logo-carga.webp'
    };
  }

  function equipoHtml(r) {
    var L = [];
    if (r.equipo || r.imei) L.push('<b>Equipo:</b> ' + esc(r.equipo || '') + (r.imei ? ' · IMEI ' + esc(r.imei) : ''));
    if (r.falla) L.push('<b>Falla:</b> ' + esc(r.falla));
    if (r.coment) L.push('<b>Comentario:</b> ' + esc(r.coment));
    return L.length ? '<div class="eq">' + L.join('<br>') + '</div>' : '';
  }

  var PIE = 'Documento preliminar, no válido como factura fiscal. Pase a caja con este número para recibir su factura.';

  function htmlTicket(d, copia) {
    var filas = d.lineas.map(function (l) {
      return '<div class="it"><div class="d">' + esc(l.desc) + '</div>' +
        (l.imeis.length ? '<div class="s">IMEI ' + l.imeis.map(esc).join(', ') + '</div>' : '') +
        '<div class="r"><span>' + l.cant + ' × ' + rd(l.precio) + (l.pct ? ' (−' + l.pct + '%)' : '') + '</span><b>' + rd(l.imp) + '</b></div></div>';
    }).join('');
    return '<!doctype html><html><head><meta charset="utf-8"><title>Prefactura ' + esc(d.num) + '</title><style>' +
      '@page{size:80mm auto;margin:0}*{box-sizing:border-box}body{width:72mm;margin:0 auto;padding:4mm 0;font:12px/1.35 Arial,Helvetica,sans-serif;color:#000}' +
      '.c{text-align:center}.logo{max-width:34mm;max-height:16mm;display:block;margin:0 auto 2mm}h1{font-size:15px;margin:0}.mut{font-size:10.5px}' +
      '.hr{border-top:1px dashed #000;margin:2.5mm 0}.no{font-size:17px;font-weight:800;letter-spacing:.3px;margin:1mm 0}.cp{display:inline-block;border:1.5px solid #000;padding:0 2mm;font-weight:800;margin-top:1mm}' +
      '.kv{display:flex;justify-content:space-between;gap:2mm}.it{margin:0 0 1.6mm}.d{font-weight:600}.s{font-size:10.5px}.r{display:flex;justify-content:space-between}' +
      '.tot{font-size:16px;font-weight:800}.eq{font-size:11px;margin-top:1mm}.pie{font-size:10px;text-align:center;margin-top:3mm}' +
      '</style></head><body>' +
      '<img class="logo" src="' + esc(d.logo) + '" onerror="this.remove()"><div class="c"><h1>' + esc(d.negocio) + '</h1>' +
      '<div class="mut">Sucursal ' + esc(d.loc) + (d.dir ? '<br>' + esc(d.dir) : '') + (d.tel ? '<br>Tel. ' + esc(d.tel) : '') + '</div></div>' +
      '<div class="hr"></div><div class="c">PREFACTURA<div class="no">Nº ' + esc(d.num) + '</div>' + (copia ? '<span class="cp">COPIA</span>' : '') + '</div>' +
      '<div class="hr"></div>' +
      '<div class="kv"><span>Fecha</span><span>' + esc(d.fecha) + ' ' + esc(d.hora) + '</span></div>' +
      '<div class="kv"><span>Cliente</span><span>' + esc(d.cliente) + '</span></div>' +
      (d.vendedor ? '<div class="kv"><span>Vendedor</span><span>' + esc(d.vendedor) + '</span></div>' : '') +
      (d.almacen ? '<div class="kv"><span>Almacén</span><span>' + esc(d.almacen) + '</span></div>' : '') +
      equipoHtml(d.ref) + '<div class="hr"></div>' + filas + '<div class="hr"></div>' +
      (d.desc ? '<div class="kv"><span>Subtotal</span><span>' + rd(d.total + d.desc) + '</span></div><div class="kv"><span>Descuento</span><span>−' + rd(d.desc) + '</span></div>' : '') +
      '<div class="kv tot"><span>TOTAL</span><span>' + rd(d.total) + '</span></div>' +
      '<div class="hr"></div><div class="pie">' + PIE + '<br>¡Gracias por preferirnos!</div>' +
      '<script>window.onload=function(){setTimeout(function(){window.print();},150);}<\/script></body></html>';
  }

  function htmlCarta(d, copia, paraPdf) {
    var conDesc = d.lineas.some(function (l) { return l.pct; });
    var filas = d.lineas.map(function (l) {
      return '<tr><td>' + esc(l.cod) + '</td><td>' + esc(l.desc) + (l.imeis.length ? '<div class="s">IMEI ' + l.imeis.map(esc).join(', ') + '</div>' : '') + '</td>' +
        '<td class="n">' + l.cant + '</td><td class="n">' + rd(l.precio) + '</td>' + (conDesc ? '<td class="n">' + (l.pct ? l.pct + '%' : '') + '</td>' : '') +
        '<td class="n">' + rd(l.imp) + '</td></tr>';
    }).join('');
    return '<!doctype html><html><head><meta charset="utf-8"><title>Prefactura ' + esc(d.num) + '</title><style>' +
      '@page{size:letter;margin:14mm}*{box-sizing:border-box}body{margin:0;font:13px/1.45 Arial,Helvetica,sans-serif;color:#111}' +
      '.top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:2px solid #111;padding-bottom:12px}' +
      '.marca{display:flex;gap:12px;align-items:center}.logo{max-height:56px;max-width:120px}h1{margin:0;font-size:20px}.mut{color:#555;font-size:12px}' +
      '.doc{text-align:right}.doc .t{font-size:12px;letter-spacing:2px;color:#555}.doc .no{font-size:26px;font-weight:800}.cp{display:inline-block;border:2px solid #111;padding:1px 8px;font-weight:800;margin-top:4px}' +
      '.datos{display:grid;grid-template-columns:repeat(2,1fr);gap:4px 24px;margin:14px 0}.datos b{display:inline-block;min-width:78px;color:#555;font-weight:600}' +
      '.eq{background:#f4f4f5;border-radius:8px;padding:8px 12px;margin-bottom:10px}' +
      'table{width:100%;border-collapse:collapse}th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.5px;color:#555;border-bottom:1.5px solid #111;padding:6px}' +
      'td{border-bottom:1px solid #ddd;padding:7px 6px;vertical-align:top}.n{text-align:right;white-space:nowrap}.s{font-size:11px;color:#555}' +
      '.tot{margin-left:auto;width:280px;margin-top:12px}.tot div{display:flex;justify-content:space-between;padding:3px 0}.tot .g{font-size:18px;font-weight:800;border-top:2px solid #111;padding-top:6px;margin-top:4px}' +
      '.pie{margin-top:26px;font-size:11.5px;color:#555;text-align:center;border-top:1px solid #ddd;padding-top:10px}' +
      '</style></head><body>' +
      '<div class="top"><div class="marca"><img class="logo" src="' + esc(d.logo) + '" onerror="this.remove()"><div><h1>' + esc(d.negocio) + '</h1>' +
      '<div class="mut">Sucursal ' + esc(d.loc) + (d.dir ? ' · ' + esc(d.dir) : '') + (d.tel ? ' · Tel. ' + esc(d.tel) : '') + '</div></div></div>' +
      '<div class="doc"><div class="t">PREFACTURA</div><div class="no">Nº ' + esc(d.num) + '</div>' + (copia ? '<span class="cp">COPIA</span>' : '') + '</div></div>' +
      '<div class="datos"><div><b>Cliente</b> ' + esc(d.cliente) + '</div><div><b>Fecha</b> ' + esc(d.fecha) + ' ' + esc(d.hora) + '</div>' +
      (d.vendedor ? '<div><b>Vendedor</b> ' + esc(d.vendedor) + '</div>' : '') + (d.almacen ? '<div><b>Almacén</b> ' + esc(d.almacen) + '</div>' : '') + '</div>' +
      equipoHtml(d.ref) +
      '<table><thead><tr><th>Código</th><th>Descripción</th><th class="n">Cant.</th><th class="n">Precio</th>' + (conDesc ? '<th class="n">Desc.</th>' : '') + '<th class="n">Importe</th></tr></thead><tbody>' + filas + '</tbody></table>' +
      '<div class="tot">' + (d.desc ? '<div><span>Subtotal</span><span>' + rd(d.total + d.desc) + '</span></div><div><span>Descuento</span><span>−' + rd(d.desc) + '</span></div>' : '') +
      '<div class="g"><span>TOTAL</span><span>' + rd(d.total) + '</span></div></div>' +
      '<div class="pie">' + PIE + ' ¡Gracias por preferirnos!</div>' +
      (paraPdf ? '' : '<script>window.onload=function(){setTimeout(function(){window.print();},150);}<\/script>') + '</body></html>';
  }

  function abrir(html) {
    var w = window.open('', '_blank');
    if (!w) { try { toast('Permita las ventanas emergentes para imprimir.', 'error'); } catch (e) {} return false; }
    w.document.write(html); w.document.close(); w.focus(); return true;
  }

  function imprimir(modo) {
    var p = typeof _prefUltima !== 'undefined' ? _prefUltima : null; if (!p) return;
    var d = datos(p), copia = yaImpresa(d.num);
    if (modo === 'pdf') { try { return _htmlAPdf(htmlCarta(d, copia, true), 'Prefactura_' + (d.num || 'SN'), { ancho: 760 }); } catch (e) { return; } }
    if (modo !== 'ticket' && modo !== 'carta') modo = formato();
    if (abrir(modo === 'ticket' ? htmlTicket(d, copia) : htmlCarta(d, copia))) marcarImpresa(d.num);
  }

  // 21-oct-2026 (dueño): no se pregunta al imprimir; el papel se escoge una vez en «Config. Impresora» (cada PC).
  function formato() { return lsGet(LS_FMT) === 'carta' ? 'carta' : 'ticket'; }
  function pintarConfig() {
    var v = doc.getElementById('v-configImpresora'); if (!v) return false;
    var c = doc.getElementById('bcPfFmtCard');
    if (!c) {
      c = doc.createElement('div'); c.id = 'bcPfFmtCard'; c.className = 'card';
      c.innerHTML = '<h3 style="margin:0 0 4px;"><i class="ti ti-file-invoice" style="color:#ea580c;"></i> Papel de la prefactura</h3>' +
        '<div class="bcpffmt-mut">Se usa al imprimir la prefactura en esta computadora.</div>' +
        '<div class="bcpffmt" role="radiogroup" aria-label="Papel de la prefactura">' +
        '<button type="button" role="radio" data-f="ticket"><i class="ti ti-receipt"></i><span>Ticket 80 mm</span></button>' +
        '<button type="button" role="radio" data-f="carta"><i class="ti ti-file-text"></i><span>Hoja carta</span></button></div>';
      var h2 = v.querySelector('h2'); if (h2 && h2.nextSibling) v.insertBefore(c, h2.nextSibling); else v.appendChild(c);
      c.addEventListener('click', function (e) {
        var b = e.target.closest('[data-f]'); if (!b) return;
        lsSet(LS_FMT, b.dataset.f); marcar();
        try { toast('Prefactura: ' + (b.dataset.f === 'ticket' ? 'ticket 80 mm' : 'hoja carta') + ' en esta computadora.'); } catch (er) {}
      });
    }
    function marcar() { [].forEach.call(c.querySelectorAll('[data-f]'), function (b) { var on = b.dataset.f === formato(); b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); }); }
    marcar(); return true;
  }

  var css = doc.createElement('style');
  css.textContent = '#bcPfFmtCard{border-top:4px solid #ea580c}#bcPfFmtCard .bcpffmt-mut{color:#64748b;font-size:14px;margin-bottom:12px}' +
    '#bcPfFmtCard .bcpffmt{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:460px}' +
    '#bcPfFmtCard .bcpffmt button{min-height:72px!important;padding:10px!important;border-radius:14px;border:1.5px solid #e2e8f0;background:#fff;display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px;font-weight:700;color:#0f172a;cursor:pointer;transition:transform .16s ease-out,border-color .16s}' +
    '#bcPfFmtCard .bcpffmt button i{font-size:24px;color:#ea580c}#bcPfFmtCard .bcpffmt button.on{border-color:#ea580c;box-shadow:0 0 0 3px rgba(234,88,12,.15);background:#fff7ed}' +
    '#bcPfFmtCard .bcpffmt button:active{transform:scale(.97)}#bcPfFmtCard .bcpffmt button:focus-visible{outline:3px solid #ea580c;outline-offset:2px}';
  doc.head.appendChild(css);
  if (!pintarConfig()) {
    var mo = new MutationObserver(function () { if (pintarConfig()) mo.disconnect(); });
    mo.observe(doc.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 20000);
  }

  window.imprimirPrefactura = imprimir;
  window.bcPfImprimirHtml = { ticket: htmlTicket, carta: htmlCarta, datos: datos }; // para pruebas
})();
