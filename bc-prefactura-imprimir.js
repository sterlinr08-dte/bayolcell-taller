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
    var loc = String(m.codlocalidad) === '4' ? 'Moca' : String(m.codlocalidad) === '7' ? 'Navarrete' : 'Santiago'; // 23-oct-2026: Navarrete tiene su sucursal
    var lineas = (m.detallesPreFactura || []).map(function (d) {
      var pct = Number(d.porcentaje || 0), imp = Math.round(d.precio * d.cantidad * (100 - pct)) / 100;
      var imeis = (m.seriales || []).filter(function (s) { return String(s.codarticulo) === String(d.codarticulo); }).map(function (s) { return s.numero; });
      return { cod: d.codarticulo, desc: d.descripcion, cant: d.cantidad, precio: d.precio, pct: pct, imp: imp, imeis: imeis };
    });
    var cant = lineas.reduce(function (a, l) { return a + (Number(l.cant) || 0); }, 0);
    return {
      negocio: ct.nombre || 'BAYOL CELL', dir: ct.direccion || '', tel: ct.telefono || '', loc: loc,
      num: p.num || '', cliente: m.nombre || 'CONTADO', fecha: fechaBonita(m.fecha), hora: horaBonita(m.hora),
      vendedor: textoSel('rxVendedor', m.codempleado), almacen: textoSel('rxAlmacen', m.codlocalidad),
      lineas: lineas, cant: cant, desc: Number(m.descuentototal || 0), total: Number(p.total || 0), ref: r,
      logo: location.origin + location.pathname.replace(/[^/]*$/, '') + 'assets/logo-carga.webp'
    };
  }
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fechaBonita(f) { var x = String(f || '').split('-'); return x.length === 3 ? Number(x[2]) + ' ' + MESES[Number(x[1]) - 1] + ' ' + x[0] : String(f || ''); }
  function horaBonita(h) {
    var x = String(h || '').split(':'); if (x.length < 2) return '';
    var hh = Number(x[0]), ap = hh >= 12 ? 'p. m.' : 'a. m.'; hh = hh % 12 || 12; return hh + ':' + x[1] + ' ' + ap;
  }
  // Código de barras del Nº (la cajera lo escanea en Info Plus). Si no carga la librería, no sale y ya.
  function barras(num, alto, ancho) {
    try {
      if (!num || typeof JsBarcode !== 'function') return '';
      var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, String(num), { format: 'CODE128', height: alto, width: ancho, displayValue: false, margin: 0 });
      return svg.outerHTML;
    } catch (e) { return ''; }
  }
  function clienteExtra(r) { return [r.cedula ? 'Céd. ' + esc(r.cedula) : '', r.telefono ? 'Tel. ' + esc(r.telefono) : ''].filter(Boolean).join(' · '); }

  var PIE = 'Este documento no es una factura fiscal. Preséntelo en caja para pagar y recibir su factura con comprobante.';
  var FUENTE = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

  function htmlTicket(d, copia) {
    var filas = d.lineas.map(function (l) {
      return '<div class="it"><div class="d">' + esc(l.desc) + '</div>' +
        (l.imeis.length ? '<div class="s">IMEI ' + l.imeis.map(esc).join(', ') + '</div>' : '') +
        '<div class="r"><span>' + l.cant + ' × ' + rd(l.precio) + (l.pct ? ' · −' + l.pct + '%' : '') + '</span><b>' + rd(l.imp) + '</b></div></div>';
    }).join('');
    var eq = d.ref || {}, eqTxt = [eq.equipo, eq.imei ? 'IMEI ' + eq.imei : ''].filter(Boolean).join(' · ');
    var ce = clienteExtra(eq);
    return '<!doctype html><html><head><meta charset="utf-8"><title>Prefactura ' + esc(d.num) + '</title><style>' +
      '@page{size:80mm auto;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'body{width:72mm;margin:0 auto;padding:3mm 0 6mm;font:12px/1.35 ' + FUENTE + ';color:#000;font-variant-numeric:tabular-nums}' +
      '.c{text-align:center}.logo{max-width:40mm;max-height:15mm;display:block;margin:0 auto 1.5mm}' +
      '.neg{font-size:15px;font-weight:800;letter-spacing:.5px}.mut{font-size:10.5px}' +
      '.band{background:none;color:#000;text-align:center;font-weight:900;letter-spacing:3px;font-size:13px;padding:1.2mm 0;margin:3mm 0 1.5mm;border-top:2px solid #000;border-bottom:2px solid #000}' +
      '.no{font-size:22px;font-weight:900;text-align:center;letter-spacing:.5px}.bar{text-align:center;margin:1mm 0 .5mm}.bar svg{max-width:62mm;height:11mm}' +
      '.cp{text-align:center;font-weight:900;letter-spacing:4px;border:1.5px solid #000;margin:1.5mm 12mm 0;padding:.6mm 0}' +
      '.hr{border-top:1px dashed #000;margin:2.5mm 0}.kv{display:table;width:100%;border-collapse:collapse}.kv span:first-child{display:table-cell;color:#000;opacity:.75;white-space:nowrap;padding-right:3mm;vertical-align:top}.kv b{display:table-cell;text-align:right;vertical-align:top}' +
      '.blk{margin-bottom:1mm}.blk span{display:block;font-size:10.5px;opacity:.75}.blk b{display:block}.sub{font-size:10.5px;text-align:right}.it{margin:0 0 2mm}.d{font-weight:700}.s{font-size:10.5px}.r{display:flex;justify-content:space-between}' +
      '.tot{display:flex;justify-content:space-between;align-items:baseline;font-size:18px;font-weight:900;margin-top:1mm}' +
      '.pie{font-size:10px;text-align:center;margin-top:3mm;line-height:1.4}.gr{font-weight:800;font-size:12px;margin-top:2mm}' +
      '</style></head><body>' +
      '<img class="logo" src="' + esc(d.logo) + '" onerror="this.remove()">' +
      '<div class="c"><div class="neg">' + esc(d.negocio) + '</div><div class="mut">Sucursal ' + esc(d.loc) + (d.dir ? '<br>' + esc(d.dir) : '') + (d.tel ? '<br>Tel. ' + esc(d.tel) : '') + '</div></div>' +
      '<div class="band">PREFACTURA</div><div class="no">Nº ' + esc(d.num) + '</div>' +
      '<div class="bar">' + barras(d.num, 40, 1.6) + '</div>' + (copia ? '<div class="cp">COPIA</div>' : '') +
      '<div class="hr"></div>' +
      '<div class="kv"><span>Fecha</span><b>' + esc(d.fecha) + ', ' + esc(d.hora) + '</b></div>' +
      '<div class="kv"><span>Cliente</span><b>' + esc(d.cliente) + '</b></div>' + (ce ? '<div class="sub">' + ce + '</div>' : '') +
      (d.vendedor ? '<div class="kv"><span>Le atendió</span><b>' + esc(d.vendedor) + '</b></div>' : '') +
      (d.almacen ? '<div class="kv"><span>Almacén</span><b>' + esc(d.almacen) + '</b></div>' : '') +
      (eqTxt || eq.falla ? '<div class="hr"></div>' : '') +
      (eqTxt ? '<div class="blk"><span>Equipo</span><b>' + esc(eqTxt) + '</b></div>' : '') +
      (eq.falla ? '<div class="blk"><span>Falla</span><b>' + esc(eq.falla) + '</b></div>' : '') +
      '<div class="hr"></div>' + filas + '<div class="hr"></div>' +
      '<div class="kv"><span>Artículos</span><b>' + d.cant + '</b></div>' +
      (d.desc ? '<div class="kv"><span>Subtotal</span><b>' + rd(d.total + d.desc) + '</b></div><div class="kv"><span>Descuento</span><b>−' + rd(d.desc) + '</b></div>' : '') +
      '<div class="tot"><span>TOTAL</span><span>' + rd(d.total) + '</span></div>' +
      (eq.coment ? '<div class="hr"></div><div class="mut"><b>Nota:</b> ' + esc(eq.coment) + '</div>' : '') +
      '<div class="hr"></div><div class="pie">' + PIE + '<div class="gr">¡Gracias por preferirnos!</div></div>' +
      '<script>window.onload=function(){setTimeout(function(){window.print();},150);}<\/script></body></html>';
  }

  function htmlCarta(d, copia, paraPdf) {
    var conDesc = d.lineas.some(function (l) { return l.pct; });
    var filas = d.lineas.map(function (l, i) {
      return '<tr><td class="i">' + (i + 1) + '</td><td><div class="ds">' + esc(l.desc) + '</div><div class="sm">Cód. ' + esc(l.cod) +
        (l.imeis.length ? ' · IMEI ' + l.imeis.map(esc).join(', ') : '') + '</div></td>' +
        '<td class="n">' + l.cant + '</td><td class="n">' + rd(l.precio) + '</td>' + (conDesc ? '<td class="n">' + (l.pct ? '−' + l.pct + '%' : '—') + '</td>' : '') +
        '<td class="n b">' + rd(l.imp) + '</td></tr>';
    }).join('');
    var eq = d.ref || {}, ce = clienteExtra(eq);
    var eqTxt = [eq.equipo, eq.imei ? 'IMEI ' + eq.imei : ''].filter(Boolean).join(' · ');
    var celda = function (t, v, x) { return '<div class="cel"><div class="lb">' + t + '</div><div class="vl">' + v + '</div>' + (x ? '<div class="sm">' + x + '</div>' : '') + '</div>'; };
    return '<!doctype html><html><head><meta charset="utf-8"><title>Prefactura ' + esc(d.num) + '</title><style>' +
      '@page{size:letter;margin:12mm 14mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'body{margin:0;font:13px/1.45 ' + FUENTE + ';color:#0f172a;font-variant-numeric:tabular-nums;position:relative}' +
      '.acc{height:6px;background:#e4572e;border-radius:3px;margin-bottom:16px}' +
      '.top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}' +
      '.marca{display:flex;gap:14px;align-items:center}.logo{height:60px;max-width:170px;object-fit:contain}' +
      '.neg{font-size:22px;font-weight:800;letter-spacing:.2px}.mut{color:#64748b;font-size:12px;line-height:1.5}' +
      '.doc{text-align:right}.pill{display:inline-block;background:#fff1ec;color:#c2410c;font-weight:800;font-size:11px;letter-spacing:2px;padding:4px 10px;border-radius:999px}' +
      '.no{font-size:30px;font-weight:800;margin:6px 0 4px;letter-spacing:.3px}.bar svg{height:34px;max-width:200px}' +
      '.cp{display:inline-block;margin-top:6px;border:2px solid #0f172a;border-radius:6px;padding:1px 10px;font-weight:800;letter-spacing:3px;font-size:12px}' +
      '.info{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:0;margin:20px 0 14px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}' +
      '.cel{padding:10px 14px;border-left:1px solid #e2e8f0}.cel:first-child{border-left:0}.lb{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:700}' +
      '.vl{font-weight:700;font-size:14px;margin-top:2px}.sm{color:#64748b;font-size:11.5px}' +
      '.eq{display:flex;gap:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;margin-bottom:14px}' +
      'table{width:100%;border-collapse:collapse}th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:700;padding:8px 8px;border-bottom:1.5px solid #0f172a}' +
      'td{padding:9px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}.i{color:#94a3b8;width:26px}.ds{font-weight:600}.n{text-align:right;white-space:nowrap}.b{font-weight:700}' +
      '.pie2{display:flex;justify-content:space-between;gap:24px;margin-top:16px;align-items:flex-start}' +
      '.nota{flex:1;font-size:12px;color:#475569;background:#f8fafc;border-radius:12px;padding:12px 14px}.nota b{color:#0f172a}' +
      '.tot{width:290px}.tot div{display:flex;justify-content:space-between;padding:4px 0;color:#475569}' +
      '.tot .g{margin-top:6px;padding:10px 14px;border-radius:12px;background:#0f172a;color:#fff;font-size:20px;font-weight:800;align-items:baseline}' +
      '.fin{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;color:#94a3b8;font-size:11px}' +
      '.wm{position:fixed;top:42%;left:0;right:0;text-align:center;font-size:120px;font-weight:900;color:rgba(15,23,42,.05);transform:rotate(-24deg);letter-spacing:12px;pointer-events:none}' +
      '</style></head><body>' + (copia ? '<div class="wm">COPIA</div>' : '') +
      '<div class="acc"></div>' +
      '<div class="top"><div class="marca"><img class="logo" src="' + esc(d.logo) + '" onerror="this.remove()"><div><div class="neg">' + esc(d.negocio) + '</div>' +
      '<div class="mut">Sucursal ' + esc(d.loc) + (d.dir ? '<br>' + esc(d.dir) : '') + (d.tel ? '<br>Tel. ' + esc(d.tel) : '') + '</div></div></div>' +
      '<div class="doc"><span class="pill">PREFACTURA</span><div class="no">Nº ' + esc(d.num) + '</div><div class="bar">' + barras(d.num, 40, 1.8) + '</div>' +
      (copia ? '<span class="cp">COPIA</span>' : '') + '</div></div>' +
      '<div class="info">' + celda('Cliente', esc(d.cliente), ce) + celda('Fecha', esc(d.fecha), esc(d.hora)) +
      celda('Le atendió', esc(d.vendedor || '—')) + celda('Almacén', esc(d.almacen || '—')) + '</div>' +
      (eqTxt || eq.falla ? '<div class="eq">' + (eqTxt ? '<div><div class="lb">Equipo</div><div class="vl">' + esc(eqTxt) + '</div></div>' : '') +
        (eq.falla ? '<div><div class="lb">Falla</div><div class="vl">' + esc(eq.falla) + '</div></div>' : '') + '</div>' : '') +
      '<table><thead><tr><th>#</th><th>Descripción</th><th class="n">Cant.</th><th class="n">Precio</th>' + (conDesc ? '<th class="n">Desc.</th>' : '') + '<th class="n">Importe</th></tr></thead><tbody>' + filas + '</tbody></table>' +
      '<div class="pie2"><div class="nota"><b>¿Cómo pagar?</b> ' + PIE + (eq.coment ? '<br><br><b>Nota:</b> ' + esc(eq.coment) : '') + '</div>' +
      '<div class="tot"><div><span>Artículos</span><span>' + d.cant + '</span></div>' +
      (d.desc ? '<div><span>Subtotal</span><span>' + rd(d.total + d.desc) + '</span></div><div><span>Descuento</span><span>−' + rd(d.desc) + '</span></div>' : '') +
      '<div class="g"><span>Total</span><span>' + rd(d.total) + '</span></div></div></div>' +
      '<div class="fin"><span>¡Gracias por preferirnos!</span><span>' + esc(d.negocio) + ' · Prefactura Nº ' + esc(d.num) + '</span></div>' +
      (paraPdf ? '' : '<script>window.onload=function(){setTimeout(function(){window.print();},150);}<\/script>') + '</body></html>';
  }

  function abrir(html) {
    var w = window.open('', '_blank');
    if (!w) { try { toast('Permita las ventanas emergentes para imprimir.', 'error'); } catch (e) {} return false; }
    w.document.write(html); w.document.close(); w.focus(); return true;
  }

  // 23-oct-2026 (dueño: «quiero que no salga la pantalla emergente»): con QZ Tray conectado y una impresora de tickets elegida
  // en «Config. Impresora», el ticket sale DIRECTO a la impresora (sin ventana). Si QZ no está o falla, sigue la ventana de siempre.
  function qzListo() { try { return typeof _qzConectado !== 'undefined' && _qzConectado && typeof qzImpresoraTickets === 'function' && !!qzImpresoraTickets() && typeof qzImprimirHtml === 'function'; } catch (e) { return false; } }
  function sinAutoPrint(html) { return html.replace(/<script>window\.onload=[\s\S]*?<\/script>/, ''); }
  function imprimir(modo) {
    var p = typeof _prefUltima !== 'undefined' ? _prefUltima : null; if (!p) return;
    var d = datos(p), copia = yaImpresa(d.num);
    if (modo === 'pdf') { try { return _htmlAPdf(htmlCarta(d, copia, true), 'Prefactura_' + (d.num || 'SN'), { ancho: 760 }); } catch (e) { return; } }
    if (modo !== 'ticket' && modo !== 'carta') modo = formato();
    if (modo === 'ticket' && qzListo()) {
      return Promise.resolve(qzImprimirHtml(sinAutoPrint(htmlTicket(d, copia)), 76, null, 1, 'tickets')).then(function (ok) {
        if (ok) { marcarImpresa(d.num); try { toast('Prefactura Nº ' + d.num + ' impresa en ' + qzImpresoraTickets() + '.'); } catch (e) {} return true; }
        if (abrir(htmlTicket(d, copia))) marcarImpresa(d.num); return false;
      }, function () { if (abrir(htmlTicket(d, copia))) marcarImpresa(d.num); return false; });
    }
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
        '<div class="bcpffmt-mut">Se usa al imprimir la prefactura en esta computadora. Con QZ Tray conectado y una impresora de tickets elegida arriba, el ticket sale directo, sin ventana.</div>' +
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
