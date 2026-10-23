/* bc-prefactura-imprimir.js — 21-oct-2026 (dueño): la prefactura impresa lleva el MISMO Nº de Info Plus,
   se imprime al guardar en el papel escogido en «Config. Impresora»: ticket 80 mm o hoja carta (cada PC).
   La reimpresión del mismo Nº dice «COPIA». El PDF sigue igual (hoja carta).
   Reemplaza imprimirPrefactura(modo) de taller-app.js; usa _prefUltima (lo llena _rpImprimir).
   Apagar: localStorage.bc_pfimp_off = '1'. */
(function () {
  'use strict';
  try { if (localStorage.getItem('bc_pfimp_off') === '1') return; } catch (e) {}
  var doc = document;
  var LS_FMT = 'bc_pref_formato', LS_IMP = 'bc_pref_impresas', LS_COP = 'bc_pref_copias'; // 23-oct-2026: copias por PC (1–3)

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

  // 23-oct-2026 (dueño): dirección, teléfono y WhatsApp de cada sucursal en el encabezado. Se leen de la tabla
  // `sucursales` al arrancar (sin esperar al imprimir, para que la ventana no la bloquee el navegador).
  var _sucs = null, _sucsIntentos = 0;
  function cargarSucursales() {
    if (_sucs || _sucsIntentos > 20) return;
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { _sucsIntentos++; setTimeout(cargarSucursales, 1500); return; }
    try {
      supabaseClient.from('sucursales').select('nombre,direccion,telefono,whatsapp').then(function (r) { if (r && r.data) _sucs = r.data; }, function () {});
    } catch (e) {}
  }
  setTimeout(cargarSucursales, 1500);
  function sucursalDe(loc) {
    return (_sucs || []).filter(function (x) { return String(x.nombre || '').toLowerCase() === loc.toLowerCase(); })[0] || null;
  }
  function datos(p) {
    var m = p.model || {}, ct = (typeof cache !== 'undefined' && cache.configTaller) || {}, r = p.ref || {};
    var loc = String(m.codlocalidad) === '4' ? 'Moca' : String(m.codlocalidad) === '7' ? 'Navarrete' : 'Santiago'; // 23-oct-2026: Navarrete tiene su sucursal
    var suc = sucursalDe(loc) || {};
    var lineas = (m.detallesPreFactura || []).map(function (d) {
      var pct = Number(d.porcentaje || 0), imp = Math.round(d.precio * d.cantidad * (100 - pct)) / 100;
      var imeis = (m.seriales || []).filter(function (s) { return String(s.codarticulo) === String(d.codarticulo); }).map(function (s) { return s.numero; });
      return { cod: d.codarticulo, desc: d.descripcion, cant: d.cantidad, precio: d.precio, pct: pct, imp: imp, imeis: imeis };
    });
    var cant = lineas.reduce(function (a, l) { return a + (Number(l.cant) || 0); }, 0);
    return {
      negocio: ct.nombre || 'BAYOL CELL', dir: suc.direccion || ct.direccion || '', tel: suc.telefono || ct.telefono || '', wa: (suc.whatsapp && suc.whatsapp !== suc.telefono) ? suc.whatsapp : '', loc: loc,
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
  // 23-oct-2026 (dueño): garantía «smart». Según lo que lleve la prefactura salen uno, dos o ningún texto:
  // celular = la línea tiene IMEI o el nombre empieza por celular/teléfono/iPhone…; pieza = pantalla, batería, flex, tapa,
  // reparación… Accesorios (cargador, cable, cristal) no llevan texto. Los textos se editan en Configuración → Datos del taller.
  var GAR_CEL = 'GARANTÍA DEL CELULAR\nEste equipo cuenta con 30 días de garantía por fallas de fábrica, a partir de la fecha de compra.\nLa garantía no cubre daños por golpes, caídas, humedad, pantalla rota, rayaduras o mal uso. Tampoco cubre bloqueos relacionados con cuentas, contraseñas o accesos del cliente.\nPara solicitar la garantía, debe presentar el equipo junto con esta prefactura y su factura de compra.\nEl equipo será evaluado en nuestro taller. Si se confirma una falla de fábrica cubierta por la garantía, se procederá con su reparación o cambio, según corresponda.';
  var GAR_PZA = 'GARANTÍA DE LA PIEZA\nLa pieza cuenta con 30 días de garantía desde su instalación, únicamente por defectos de la pieza y siempre que haya sido instalada por BAYOL CELL.\nNo cubre pantallas rotas o rajadas, daños por golpes, humedad ni daños ocasionados por reparaciones posteriores.\nPara solicitar la garantía, debe presentar el equipo junto con esta prefactura. Nuestro taller evaluará la pieza y, si se confirma un defecto cubierto, se procederá con su reparación o cambio, según corresponda.';
  var GAR_MOTO = 'GARANTÍA DE LA MOTO ELÉCTRICA\nLa moto cuenta con 3 meses de garantía por fallas de fábrica en motor, controlador y cargador, a partir de la fecha de compra.\nLa garantía no cubre la batería por desgaste normal, ni daños por golpes, caídas, humedad, sobrecarga, mal uso o modificaciones.\nPara solicitar la garantía, debe presentar la moto junto con esta prefactura y su factura de compra. Nuestro taller la evaluará y, si se confirma una falla cubierta, se procederá con su reparación o cambio de la pieza, según corresponda.';
  var GAR_AIRE = 'GARANTÍA DEL AIRE ACONDICIONADO\nEl equipo cuenta con 1 año de garantía por fallas de fábrica, a partir de la fecha de compra.\nLa garantía no cubre daños por instalación incorrecta realizada por terceros, variaciones de voltaje, falta de mantenimiento, golpes, humedad o mal uso.\nPara solicitar la garantía, debe presentar esta prefactura y su factura de compra. El equipo será evaluado y, si se confirma una falla cubierta, se procederá con su reparación o cambio, según corresponda.';
  var GAR_TV = 'GARANTÍA DEL TELEVISOR\nEl televisor cuenta con 1 año de garantía por fallas de fábrica, a partir de la fecha de compra.\nLa garantía no cubre pantalla rota, rayada o con golpes, daños por humedad, variaciones de voltaje o mal uso.\nPara solicitar la garantía, debe presentar el televisor junto con esta prefactura y su factura de compra. El equipo será evaluado y, si se confirma una falla cubierta, se procederá con su reparación o cambio, según corresponda.';
  var RE_MOTO = /(\bMOTO\b|\bMOTOR\b|MOTOCICLETA|MOTOCARGA|SCOOTER|PATINETA|TRICICLO|BICICLETA)/i;
  var RE_AIRE = /(AIRE ACONDICIONADO|\bAIRE\b|\bAIRES\b|\bSPLIT\b|INVERTER|\bBTU\b|\bA\/C\b|MINISPLIT)/i;
  var RE_TV = /(\bTV\b|TELEVISOR|TELEVISION|TELEVISIÓN|SMART TV|PULGADAS|\bPULG\b)/i;
  var RE_CEL = /^\s*(CELULAR|CELU\b|TELEFONO|TELÉFONO|SMARTPHONE|IPHONE|SAMSUNG|XIAOMI|REDMI|MOTOROLA|MOTO\s|HUAWEI|HONOR|TECNO|INFINIX|REALME|OPPO|VIVO|ONEPLUS|GOOGLE PIXEL|PIXEL\s|NOKIA|ALCATEL|ZTE|BLU\b|TCL\b)/i;
  var RE_PZA = /(PANTALLA|DISPLAY|\bLCD\b|TOUCH|TACTIL|TÁCTIL|BATERIA|BATERÍA|\bFLEX\b|CONECTOR|PIN DE CARGA|PUERTO|CAMARA|CÁMARA|\bLENTE\b|BOCINA|SPEAKER|ALTAVOZ|MICROFONO|MICRÓFONO|TAPA|TRASERA|CARCASA|\bMARCO\b|BANDEJA|BOTON|BOTÓN|VIBRADOR|ANTENA|SENSOR|REPARACION|REPARACIÓN|CAMBIO DE|INSTALACION|INSTALACIÓN|SERVICIO|MANO DE OBRA)/i;
  function garantias(d) {
    var ct = (typeof cache !== 'undefined' && cache.configTaller) || {}, t = {};
    (d.lineas || []).forEach(function (l) {
      var n = String(l.desc || '');
      if (RE_MOTO.test(n)) t.moto = true;
      else if (RE_AIRE.test(n)) t.aire = true;
      else if (RE_TV.test(n)) t.tv = true;
      else if ((l.imeis && l.imeis.length) || RE_CEL.test(n)) t.cel = true;
      else if (RE_PZA.test(n)) t.pza = true;
    });
    var out = [];
    if (t.cel) out.push((ct.garantia_celular || '').trim() || GAR_CEL);
    if (t.moto) out.push((ct.garantia_moto || '').trim() || GAR_MOTO);
    if (t.aire) out.push((ct.garantia_aire || '').trim() || GAR_AIRE);
    if (t.tv) out.push((ct.garantia_tv || '').trim() || GAR_TV);
    if (t.pza) out.push((ct.garantia_pieza || '').trim() || GAR_PZA);
    return out;
  }
  function garHtml(d, cls) {
    return garantias(d).map(function (t) {
      var ls = t.split('\n').map(function (x) { return x.trim(); }).filter(Boolean), tit = ls.shift() || '';
      return '<div class="' + cls + '"><b>' + esc(tit) + '</b>' + ls.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>';
    }).join('');
  }
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
      '.gar{border-top:1px dashed #000;margin-top:2.5mm;padding-top:2mm;font-size:9.5px;line-height:1.35;text-align:left}.gar b{display:block;font-size:10.5px;letter-spacing:.06em;margin-bottom:1mm}.gar p{margin:0 0 1mm}' +
      '.pie{font-size:10px;text-align:center;margin-top:3mm;line-height:1.4}.gr{font-weight:800;font-size:12px;margin-top:2mm}' +
      '</style></head><body>' +
      '<img class="logo" src="' + esc(d.logo) + '" onerror="this.remove()">' +
      '<div class="c"><div class="neg">' + esc(d.negocio) + '</div><div class="mut">Sucursal ' + esc(d.loc) + (d.dir ? '<br>' + esc(d.dir) : '') + (d.tel ? '<br>Tel. ' + esc(d.tel) : '') + (d.wa ? '<br>WhatsApp ' + esc(d.wa) : '') + '</div></div>' +
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
      garHtml(d, 'gar') +
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
      '.gars{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:14px}.garc{font-size:11px;color:#334155;line-height:1.45;border:1px solid rgba(15,23,42,.1);border-radius:12px;padding:10px 12px}.garc b{display:block;color:#0f172a;font-size:11.5px;letter-spacing:.05em;margin-bottom:4px}.garc p{margin:0 0 4px}' +
      '.pie2{display:flex;justify-content:space-between;gap:24px;margin-top:16px;align-items:flex-start}' +
      '.nota{flex:1;font-size:12px;color:#475569;background:#f8fafc;border-radius:12px;padding:12px 14px}.nota b{color:#0f172a}' +
      '.tot{width:290px}.tot div{display:flex;justify-content:space-between;padding:4px 0;color:#475569}' +
      '.tot .g{margin-top:6px;padding:10px 14px;border-radius:12px;background:#0f172a;color:#fff;font-size:20px;font-weight:800;align-items:baseline}' +
      '.fin{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;color:#94a3b8;font-size:11px}' +
      '.wm{position:fixed;top:42%;left:0;right:0;text-align:center;font-size:120px;font-weight:900;color:rgba(15,23,42,.05);transform:rotate(-24deg);letter-spacing:12px;pointer-events:none}' +
      '</style></head><body>' + (copia ? '<div class="wm">COPIA</div>' : '') +
      '<div class="acc"></div>' +
      '<div class="top"><div class="marca"><img class="logo" src="' + esc(d.logo) + '" onerror="this.remove()"><div><div class="neg">' + esc(d.negocio) + '</div>' +
      '<div class="mut">Sucursal ' + esc(d.loc) + (d.dir ? '<br>' + esc(d.dir) : '') + (d.tel ? '<br>Tel. ' + esc(d.tel) : '') + (d.wa ? '<br>WhatsApp ' + esc(d.wa) : '') + '</div></div></div>' +
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
      (garantias(d).length ? '<div class="gars">' + garHtml(d, 'garc') + '</div>' : '') +
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
  function copias() { var n = parseInt(lsGet(LS_COP) || '1', 10); return n >= 1 && n <= 3 ? n : 1; }
  // Para la ventana del navegador: repite el cuerpo del ticket N veces con salto de página (la ventana no sabe de «copias»).
  function conCopias(html, n) {
    if (n <= 1) return html;
    var m = html.match(/<body>([\s\S]*?)(<script>window\.onload[\s\S]*?<\/script>)?<\/body>/); if (!m) return html;
    var cuerpo = m[1], script = m[2] || '', rep = [];
    for (var i = 0; i < n; i++) rep.push('<div class="copia-n">' + cuerpo + '</div>');
    return html.replace(m[0], '<body>' + rep.join('<div style="page-break-after:always;break-after:page"></div>') + script + '</body>');
  }
  function imprimir(modo) {
    var p = typeof _prefUltima !== 'undefined' ? _prefUltima : null; if (!p) return;
    var d = datos(p), copia = yaImpresa(d.num);
    if (modo === 'pdf') { try { return _htmlAPdf(htmlCarta(d, copia, true), 'Prefactura_' + (d.num || 'SN'), { ancho: 760 }); } catch (e) { return; } }
    if (modo !== 'ticket' && modo !== 'carta') modo = formato();
    if (modo === 'ticket' && qzListo()) {
      // 23-oct-2026 (dueño: «no hace el corte para dividir»): cada copia va como un trabajo aparte, para que la
      // impresora corte entre una y otra. Con copies: N en un solo trabajo solo cortaba al final.
      var htmlQz = sinAutoPrint(htmlTicket(d, copia)), n = copias();
      var cadena = Promise.resolve(true);
      for (var i = 0; i < n; i++) cadena = cadena.then(function (ok) { return ok ? qzImprimirHtml(htmlQz, 76, null, 1, 'tickets') : false; });
      return cadena.then(function (ok) {
        if (ok) { marcarImpresa(d.num); try { toast('Prefactura Nº ' + d.num + ' impresa en ' + qzImpresoraTickets() + '.'); } catch (e) {} return true; }
        if (abrir(htmlTicket(d, copia))) marcarImpresa(d.num); return false;
      }, function () { if (abrir(htmlTicket(d, copia))) marcarImpresa(d.num); return false; });
    }
    if (abrir(modo === 'ticket' ? conCopias(htmlTicket(d, copia), copias()) : htmlCarta(d, copia))) marcarImpresa(d.num);
  }

  // 21-oct-2026 (dueño): no se pregunta al imprimir; el papel se escoge una vez en «Config. Impresora» (cada PC).
  function formato() { return lsGet(LS_FMT) === 'carta' ? 'carta' : 'ticket'; }
  function pintarConfig() {
    var v = doc.getElementById('v-configImpresora'); if (!v) return false;
    var c = doc.getElementById('bcPfFmtCard');
    if (!c) {
      // 23-oct-2026 (dueño: «así no, hazlo más profesional»; eligió la opción B): fichas con el dibujo del papel y
      // contador − n + para las copias. La explicación larga va detrás de la ⓘ del título (regla en taller-info.js).
      c = doc.createElement('div'); c.id = 'bcPfFmtCard'; c.className = 'card';
      c.innerHTML = '<div class="bcpf-hd"><span class="bcpf-ic"><i class="ti ti-file-invoice"></i></span><h3>Prefactura</h3>' +
        '<span class="bcpf-pc"><i class="ti ti-device-desktop"></i> Esta computadora</span></div>' +
        '<div class="bcpffmt-mut">Papel con el que sale la prefactura en esta computadora. Con QZ Tray conectado y una impresora de tickets elegida arriba, el ticket sale directo, sin ventana. Las copias solo aplican al ticket.</div>' +
        '<div class="bcpffmt" role="radiogroup" aria-label="Papel de la prefactura">' +
        '<button type="button" role="radio" data-f="ticket"><span class="bcpf-chk"><i class="ti ti-check"></i></span>' +
        '<span class="bcpf-paper t"><i style="top:10px"></i><i style="top:18px;right:14px"></i><i style="top:26px"></i><i style="top:40px;left:12px"></i><i style="top:48px"></i></span>' +
        '<span class="nm">Ticket</span><span class="ds">80 mm · directo</span></button>' +
        '<button type="button" role="radio" data-f="carta"><span class="bcpf-chk"><i class="ti ti-check"></i></span>' +
        '<span class="bcpf-paper"><i style="top:10px"></i><i style="top:18px;right:18px"></i><i style="top:30px"></i><i style="top:38px"></i><i style="top:50px;right:20px"></i></span>' +
        '<span class="nm">Hoja carta</span><span class="ds">Impresora normal</span></button></div>' +
        '<div class="bcpfcop"><span class="lab">Copias del ticket</span><span class="ctl" role="group" aria-label="Copias del ticket">' +
        '<button type="button" data-c="-1" aria-label="Una copia menos">−</button><b aria-live="polite">1</b><button type="button" data-c="1" aria-label="Una copia más">+</button></span></div>';
      var h2 = v.querySelector('h2'); if (h2 && h2.nextSibling) v.insertBefore(c, h2.nextSibling); else v.appendChild(c);
      c.addEventListener('click', function (e) {
        var bc = e.target.closest('[data-c]');
        if (bc) {
          var n = Math.max(1, Math.min(3, copias() + Number(bc.dataset.c))); if (n === copias()) return;
          lsSet(LS_COP, String(n)); marcar();
          try { toast('Ticket de la prefactura: ' + n + (n === 1 ? ' copia' : ' copias') + ' en esta computadora.'); } catch (er) {}
          return;
        }
        var b = e.target.closest('[data-f]'); if (!b) return;
        lsSet(LS_FMT, b.dataset.f); marcar();
        try { toast('Prefactura: ' + (b.dataset.f === 'ticket' ? 'ticket 80 mm' : 'hoja carta') + ' en esta computadora.'); } catch (er) {}
      });
    }
    function marcar() {
      [].forEach.call(c.querySelectorAll('[data-f]'), function (b) { var on = b.dataset.f === formato(); b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      var n = copias(), num = c.querySelector('.bcpfcop b'); if (num) num.textContent = String(n);
      var menos = c.querySelector('[data-c="-1"]'), mas = c.querySelector('[data-c="1"]');
      if (menos) menos.disabled = n <= 1; if (mas) mas.disabled = n >= 3;
      c.classList.toggle('sin-copias', formato() !== 'ticket');
    }
    marcar(); return true;
  }

  var css = doc.createElement('style');
  css.textContent = '#bcPfFmtCard{border-top:4px solid #ea580c}#bcPfFmtCard .bcpffmt-mut{color:#64748b;font-size:14px;margin:0 0 12px}' +
    '#bcPfFmtCard .bcpf-hd{display:flex;align-items:center;gap:10px;margin-bottom:12px}#bcPfFmtCard .bcpf-hd h3{margin:0;font-size:17px;font-weight:800;display:flex;align-items:center;gap:6px}' +
    '#bcPfFmtCard .bcpf-ic{width:36px;height:36px;border-radius:10px;background:#fff7ed;color:#ea580c;display:grid;place-items:center;font-size:20px;flex:0 0 auto}' +
    '#bcPfFmtCard .bcpf-pc{margin-left:auto;font-size:12px;color:#64748b;background:#f8fafc;border:1px solid rgba(15,23,42,.08);border-radius:999px;padding:5px 10px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}' +
    '#bcPfFmtCard .bcpffmt{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:520px}' +
    '#bcPfFmtCard .bcpffmt button{position:relative;min-height:44px;padding:14px 12px!important;border-radius:14px;border:1.5px solid rgba(15,23,42,.1);background:#fff;display:flex;flex-direction:column;align-items:center;gap:8px;font-size:15px;font-weight:700;color:#0f172a;cursor:pointer;transition:transform .16s ease-out,border-color .16s,background .16s}' +
    '#bcPfFmtCard .bcpffmt button .ds{font-size:13px;color:#64748b;font-weight:500;margin-top:-4px}#bcPfFmtCard .bcpffmt button:hover{border-color:rgba(15,23,42,.2)}' +
    '#bcPfFmtCard .bcpffmt button.on{border-color:#ea580c;background:#fff7ed;box-shadow:0 0 0 3px rgba(234,88,12,.14)}' +
    '#bcPfFmtCard .bcpf-chk{position:absolute;top:10px;right:10px;width:22px;height:22px;border-radius:50%;border:1.5px solid #cbd5e1;background:#fff;display:grid;place-items:center;color:#fff;font-size:14px}' +
    '#bcPfFmtCard .bcpf-chk i{display:none}#bcPfFmtCard button.on .bcpf-chk{background:#ea580c;border-color:#ea580c}#bcPfFmtCard button.on .bcpf-chk i{display:block}' +
    '#bcPfFmtCard .bcpf-paper{display:block;width:46px;height:70px;border:1.5px solid #cbd5e1;border-radius:3px;background:#fff;position:relative;overflow:hidden}' +
    '#bcPfFmtCard .bcpf-paper.t{width:34px;height:74px;border-bottom:0;border-radius:3px 3px 0 0}' +
    '#bcPfFmtCard .bcpf-paper.t:after{content:"";position:absolute;left:-2px;right:-2px;bottom:0;height:6px;background:repeating-linear-gradient(90deg,#cbd5e1 0 4px,transparent 4px 8px)}' +
    '#bcPfFmtCard .bcpf-paper i{position:absolute;left:6px;right:6px;height:3px;background:#e2e8f0;border-radius:2px}' +
    '#bcPfFmtCard .bcpfcop{display:flex;align-items:center;gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(15,23,42,.06);max-width:520px}' +
    '#bcPfFmtCard .bcpfcop .lab{font-size:15px;font-weight:600}#bcPfFmtCard.sin-copias .bcpfcop{opacity:.45;pointer-events:none}' +
    '#bcPfFmtCard .bcpfcop .ctl{margin-left:auto;display:inline-flex;align-items:center;border:1.5px solid rgba(15,23,42,.1);border-radius:12px;overflow:hidden}' +
    '#bcPfFmtCard .bcpfcop .ctl button{width:48px;min-width:48px;height:48px;min-height:48px!important;padding:0!important;border:0;border-radius:0;background:#fff;font-size:22px;line-height:1;color:#0f172a;cursor:pointer}' +
    '#bcPfFmtCard .bcpfcop .ctl button:disabled{color:#cbd5e1;cursor:default}' +
    '#bcPfFmtCard .bcpfcop .ctl b{width:52px;text-align:center;font-size:18px;font-variant-numeric:tabular-nums;border-left:1.5px solid rgba(15,23,42,.1);border-right:1.5px solid rgba(15,23,42,.1);height:48px;line-height:48px;background:#f8fafc}' +
    '#bcPfFmtCard .bcpffmt button:active,#bcPfFmtCard .bcpfcop .ctl button:not(:disabled):active{transform:scale(.97)}' +
    '#bcPfFmtCard button:focus-visible{outline:3px solid #ea580c;outline-offset:2px}' +
    '@media(max-width:480px){#bcPfFmtCard .bcpf-pc{display:none}}';
  doc.head.appendChild(css);
  if (!pintarConfig()) {
    var mo = new MutationObserver(function () { if (pintarConfig()) mo.disconnect(); });
    mo.observe(doc.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 20000);
  }

  window.imprimirPrefactura = imprimir;
  window.bcPfImprimirHtml = { ticket: htmlTicket, carta: htmlCarta, datos: datos, sucursales: function (a) { _sucs = a; } }; // para pruebas
})();
