/* taller-reponer.js · «Reponer y quieto» (26-nov-2026).
   Dueño: «5 · Qué reponer y qué está muerto», opción C (ventana + «Traer» + aviso cada lunes); quieto = 60 días.
   Datos: rpc inv_reponer (solo lectura; migración 20261126130000). «Traer» usa el despacho que ya existe
   (_ejecutarDespachoReal + _despGuardarHistorial) con confirmación y candado contra el doble toque.
   Los artículos con IMEI no se traen desde aquí: se despachan con «Despachar teléfonos» (llevan sus seriales).
   El aviso del lunes abre esta ventana: taller.html?abrir=reponer o mensaje del sw.js { tipo:'abrir-ventana', u:'reponer' }. */
(function () {
  'use strict';
  if (window.__bcReponer) return;
  window.__bcReponer = true;

  var C = { datos: null, tab: 'agota', suc: 0, q: '', alm: 0, comprar: false, sel: {}, cant: {}, desde: {}, hecho: {}, ocupado: false };
  // «Hazlo smart»: recuerda la pestaña y el filtro que usó la última vez (solo en este equipo).
  try { var pf = JSON.parse(localStorage.getItem('bc_rep_pref') || '{}'); ['tab', 'suc', 'alm', 'comprar'].forEach(function (k) { if (pf[k] != null) C[k] = pf[k]; }); } catch (e) {}
  function guardarPref() { try { localStorage.setItem('bc_rep_pref', JSON.stringify({ tab: C.tab, suc: C.suc, alm: C.alm, comprar: C.comprar })); } catch (e) {} }
  function aComprar(r) { return !C.hecho[clave(r)] && (r.imei || !(r.fuentes || []).length); }
  var esc = function (s) { return (typeof escapeHtml === 'function') ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var rd = function (n) { return 'RD$ ' + Math.round(Number(n || 0)).toLocaleString('es-DO'); };
  var nu = function (n) { return Number(n || 0).toLocaleString('es-DO', { maximumFractionDigits: 0 }); };
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var aviso = function (m, t) { try { toast(m, t); } catch (e) {} };
  var SUC = [[0, 'Todas'], [1, 'Oficina Santiago'], [4, 'Moca'], [7, 'Navarrete']];
  var corto = function (c) { return ({ 1: 'Santiago', 3: 'Garantía', 4: 'Moca', 5: '2do Nivel', 6: 'Taller', 7: 'Navarrete' })[c] || ('Alm. ' + c); };
  var clave = function (r) { return r.alm + ':' + r.cod; };

  try {
    if (typeof AYUDAS !== 'undefined') AYUDAS.reponer = { titulo: 'Reponer y quieto', html: '\
      <ul style="padding-left:18px; margin:6px 0;">\
        <li><b>Se agota:</b> se vendió en los últimos 30 días en esa sucursal y lo que hay no alcanza para 2 semanas. <b>Sugerido</b> = un mes de venta menos lo que hay.</li>\
        <li><b>Traer:</b> lo que se agota y sobra en otro almacén (2do Nivel y Oficina primero; de una sucursal, solo lo que le sobra tras su propio mes). Nunca de Garantía China ni del Taller. Se hace un despacho en Info Plus por cada ruta, después de confirmar.</li>\
        <li>Antes de despachar se revisa Info Plus <b>en vivo</b>: si en el origen hay menos, se trae lo que hay; si no hay, se salta.</li>\
        <li><b>Para comprar:</b> lo que no sobra en ningún almacén. Dice a quién se le compró la última vez y a qué costo. <b>Copiar pedido</b> lo agrupa por proveedor para pegarlo en WhatsApp.</li>\
        <li>Los celulares con IMEI se mueven con <b>Despachar teléfonos</b>.</li>\
        <li><b>Quieto:</b> hay existencia y no se vendió ni se compró en 60 días. El valor es a costo. Garantía China no cuenta.</li>\
        <li>Existencias de Info Plus: se actualizan cada 30 minutos. Ventas: cada hora.</li>\
      </ul>' };
  } catch (e) {}

  var css = document.createElement('style');
  css.id = 'bcRepCSS';
  css.textContent =
    '#bcRep .modal-box{max-width:980px;width:calc(100vw - 24px);max-height:calc(100dvh - 24px);display:flex;flex-direction:column}' +
    '#bcRep .rp-body{flex:1;overflow:auto;padding:12px 16px}' +
    '#bcRep .rp-tabs{display:flex;gap:6px;padding:0 16px 8px;flex-wrap:wrap}' +
    '#bcRep .rp-tab{min-height:44px;padding:0 14px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;font-size:14px;font-weight:700;color:#334155;cursor:pointer;display:inline-flex;align-items:center;gap:6px}' +
    '#bcRep .rp-tab.on{background:#0f172a;border-color:#0f172a;color:#fff}' +
    '#bcRep .rp-tab b{font-size:12px;background:rgba(148,163,184,.25);border-radius:9px;padding:2px 7px}' +
    '#bcRep .rp-fil{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}' +
    '#bcRep .rp-chips{display:flex;gap:8px;flex-wrap:wrap}' +
    '#bcRep .rp-chip{min-height:44px;padding:0 12px;border-radius:22px;border:1px solid #cbd5e1;background:#fff;font-size:13px;font-weight:700;color:#475569;cursor:pointer}' +
    '#bcRep .rp-chip.on{background:#e0f2fe;border-color:#0284c7;color:#075985}' +
    '#bcRep .rp-busca{flex:1;min-width:200px;position:relative}' +
    '#bcRep .rp-busca i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#64748b}' +
    '#bcRep .rp-busca input{width:100%;height:48px;font-size:16px;padding:0 12px 0 36px;border:1px solid #cbd5e1;border-radius:12px;box-sizing:border-box}' +
    '#bcRep .rp-res{font-size:13px;color:#475569;margin-bottom:8px}' +
    '#bcRep .rp-res b{color:#0f172a}' +
    '#bcRep .rp-fila{display:flex;gap:10px;align-items:center;padding:10px 4px;border-bottom:1px solid #e2e8f0}' +
    '#bcRep .rp-fila[hidden]{display:none!important}' +
    '#bcRep .rp-tx{flex:1;min-width:0}' +
    '#bcRep .rp-n{font-size:14px;font-weight:700;color:#0f172a;line-height:1.3}' +
    '#bcRep .rp-s{font-size:13px;color:#475569;margin-top:2px;line-height:1.35}' +
    '#bcRep .rp-num{text-align:right;font-size:13px;color:#475569;white-space:nowrap}' +
    '#bcRep .rp-num b{display:block;font-size:15px;color:#0f172a}' +
    '#bcRep .rp-pill{display:inline-block;font-size:12px;font-weight:700;border-radius:9px;padding:2px 8px;margin:2px 4px 0 0;background:#f1f5f9;color:#334155}' +
    '#bcRep .rp-pill.r{background:#fee2e2;color:#991b1b}' +
    '#bcRep .rp-pill.v{background:#dcfce7;color:#166534}' +
    '#bcRep .rp-pill.a{background:#e0f2fe;color:#075985}' +
    '#bcRep .rp-chk{width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;cursor:pointer}' +
    '#bcRep .rp-chk input{width:22px;height:22px;cursor:pointer}' +
    '#bcRep .rp-ctl{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}' +
    '#bcRep .rp-ctl select,#bcRep .rp-ctl input{height:44px;font-size:16px;border:1px solid #cbd5e1;border-radius:10px;padding:0 8px;background:#fff}' +
    '#bcRep .rp-ctl input{width:84px;text-align:right}' +
    '#bcRep .rp-vacio{padding:30px 10px;text-align:center;color:#64748b;font-size:14px}' +
    '#bcRep .rp-pie{display:flex;gap:8px;align-items:center;padding:10px 16px;border-top:1px solid #e2e8f0;flex-wrap:wrap}' +
    '#bcRep .rp-pie .btn{min-height:44px}' +
    '#bcRep .rp-pie .btn-blue{min-height:54px;font-size:15px;padding:0 18px}' +
    '#bcRep .rp-mas{min-height:44px;width:100%;margin-top:10px}' +
    '@media (max-width:600px){#bcRep .modal-box{width:100vw;max-height:100dvh;border-radius:0}#bcRep .rp-num{min-width:72px}' +
    '#bcRep .rp-tabs{flex-wrap:nowrap;padding-top:8px}#bcRep .rp-tab{flex:1 1 0;justify-content:center;padding:0 6px;font-size:13px;gap:4px}#bcRep .rp-tab b{padding:2px 5px}' +
    '#bcRep .rp-fil{flex-direction:column;align-items:stretch}#bcRep .rp-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:0 16px}' +
    '#bcRep .rp-chips::-webkit-scrollbar{display:none}#bcRep .rp-chip{flex:0 0 auto}#bcRep .rp-busca{flex:none;width:100%;min-width:0}#bcRep .rp-chips{min-width:0;max-width:calc(100% + 32px)}}';
  (document.head || document.documentElement).appendChild(css);

  function lista() { var d = C.datos || {}; return C.tab === 'quieto' ? (d.quieto || []) : (d.agota || []); }
  function puedeTraer(r) { return !r.imei && (r.fuentes || []).length > 0 && !C.hecho[clave(r)]; }

  function filtrar() {
    var q = norm(C.q).trim().split(/\s+/).filter(Boolean);
    var okQ = function (r) { if (!q.length) return true; var t = norm(r.desc + ' ' + r.cod); return q.every(function (p) { return t.indexOf(p) >= 0; }); };
    if (C.tab === 'quieto') return (C.datos.quieto || []).filter(function (r) { return okQ(r) && (!C.alm || Number((r.por_alm || {})[C.alm] || 0) > 0); });
    return (C.datos.agota || []).filter(function (r) {
      if (C.suc && r.alm !== C.suc) return false;
      if (C.tab === 'agota' && C.comprar && !aComprar(r)) return false;
      if (C.tab === 'traer' && !((r.fuentes || []).length && !r.imei) && !C.hecho[clave(r)]) return false;
      return okQ(r);
    });
  }

  var LIM = 150, verMas = LIM;
  function pintar() {
    var box = document.getElementById('bcRep'); if (!box) return;
    var d = C.datos;
    var cuerpo = box.querySelector('.rp-body'), pie = box.querySelector('.rp-pie');
    if (!d) { cuerpo.innerHTML = '<div class="rp-vacio">Cargando…</div>'; pie.innerHTML = ''; return; }
    if (d.error) { cuerpo.innerHTML = '<div class="rp-vacio">No se pudo cargar.<br><button type="button" class="btn btn-light rp-mas" onclick="bcRepCargar()">Reintentar</button></div>'; pie.innerHTML = ''; return; }
    var nTraer = (d.agota || []).filter(function (r) { return (r.fuentes || []).length && !r.imei; }).length;
    box.querySelector('.rp-tabs').innerHTML =
      tab('agota', 'ti-alert-triangle', 'Se agota', (d.agota || []).length) + tab('traer', 'ti-truck-delivery', 'Traer', nTraer) + tab('quieto', 'ti-zzz', 'Quieto', (d.quieto || []).length);
    var fil = filtrar(), html = '';
    var chips = C.tab === 'quieto'
      ? [[0, 'Todos'], [1, 'Santiago'], [4, 'Moca'], [7, 'Navarrete'], [5, '2do Nivel'], [6, 'Taller']].map(function (s) { return '<button type="button" class="rp-chip' + (C.alm === s[0] ? ' on' : '') + '" onclick="bcRepAlm(' + s[0] + ')">' + s[1] + '</button>'; }).join('')
      : SUC.map(function (s) { return '<button type="button" class="rp-chip' + (C.suc === s[0] ? ' on' : '') + '" onclick="bcRepSuc(' + s[0] + ')">' + s[1] + '</button>'; }).join('') +
        (C.tab === 'agota' ? '<button type="button" class="rp-chip' + (C.comprar ? ' on' : '') + '" onclick="bcRepComprar()"><i class="ti ti-shopping-cart"></i> Para comprar</button>' : '');
    html += '<div class="rp-fil"><div class="rp-chips">' + chips + '</div><div class="rp-busca"><i class="ti ti-search"></i><input id="bcRepQ" data-bcbp-no autocomplete="off" placeholder="Buscar artículo o código" value="' + esc(C.q) + '" oninput="bcRepBuscar(this.value)"></div></div>';
    if (C.tab === 'quieto') {
      var val = fil.reduce(function (s, r) { return s + (C.alm ? Number((r.por_alm || {})[C.alm] || 0) * (r.costo || 0) : Number(r.valor || 0)); }, 0);
      html += '<div class="rp-res"><b>' + nu(fil.length) + '</b> artículos · <b>' + rd(val) + '</b> a costo · sin venta ni compra en ' + d.dias + ' días</div>';
    } else if (C.tab === 'traer') {
      var libres = fil.filter(puedeTraer), todos = libres.length && libres.every(function (r) { return C.sel[clave(r)]; });
      html += '<div class="rp-res" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="flex:1;min-width:180px">Se hace un despacho por ruta. Antes se revisa Info Plus en vivo.</span>' +
        (libres.length ? '<button type="button" class="rp-chip" onclick="bcRepTodos(' + (todos ? 'false' : 'true') + ')">' + (todos ? 'Quitar todos' : 'Marcar todo (' + nu(libres.length) + ')') + '</button>' : '') + '</div>';
    } else {
      html += '<div class="rp-res"><b>' + nu(fil.length) + '</b> ' + (C.comprar ? 'para comprar (no sobra en otro almacén)' : 'no alcanzan para 2 semanas · lo más urgente arriba') + '</div>';
    }
    if (!fil.length) html += '<div class="rp-vacio">' + (C.q ? 'Nada con esa búsqueda.' : 'Nada por aquí.') + '</div>';
    fil.slice(0, verMas).forEach(function (r) { html += C.tab === 'quieto' ? filaQuieto(r) : filaAgota(r); });
    if (fil.length > verMas) html += '<button type="button" class="btn btn-light rp-mas" onclick="bcRepMas()">Ver ' + nu(Math.min(LIM, fil.length - verMas)) + ' más (' + nu(fil.length - verMas) + ' quedan)</button>';
    var foco = document.activeElement && document.activeElement.id === 'bcRepQ', pos = foco ? document.activeElement.selectionStart : 0;
    cuerpo.innerHTML = html;
    if (foco) { var inp = document.getElementById('bcRepQ'); if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (e) {} } }
    var nSel = Object.keys(C.sel).filter(function (k) { return C.sel[k]; }).length;
    var nCompra = C.tab === 'agota' ? fil.filter(aComprar).length : 0;
    pie.innerHTML = '<button type="button" class="btn btn-light" onclick="bcRepCerrar()">Cerrar</button><span style="flex:1"></span>' +
      (C.tab === 'quieto' ? '' : C.tab === 'agota'
        ? '<button type="button" class="btn btn-blue" onclick="bcRepCopiarPedido()"' + (nCompra ? '' : ' disabled') + '><i class="ti ti-copy"></i> Copiar pedido' + (nCompra ? ' (' + nCompra + ')' : '') + '</button>' : '<button type="button" class="btn btn-blue" id="bcRepTraer" onclick="bcRepTraer()"' + (nSel && !C.ocupado ? '' : ' disabled') + '><i class="ti ti-truck-delivery"></i> ' + (C.ocupado ? 'Despachando…' : 'Traer' + (nSel ? ' (' + nSel + ')' : '')) + '</button>');
  }
  function tab(k, ic, t, n) { return '<button type="button" class="rp-tab' + (C.tab === k ? ' on' : '') + '" onclick="bcRepTab(\'' + k + '\')"><i class="ti ' + ic + '"></i>' + t + ' <b>' + nu(n) + '</b></button>'; }

  function filaAgota(r) {
    var k = clave(r), h = C.hecho[k];
    var dias = r.vendidas > 0 ? Math.floor(r.hay * 30 / r.vendidas) : null;
    var s = '<span class="rp-pill a">' + esc(corto(r.alm)) + '</span><span class="rp-pill' + (r.hay > 0 ? '' : ' r') + '">Hay ' + nu(r.hay) + '</span>' +
      '<span class="rp-pill">Vendió ' + nu(r.vendidas) + ' en 30 días</span>' + (dias != null && r.hay > 0 ? '<span class="rp-pill">≈ ' + dias + ' días</span>' : '');
    var fu = (r.fuentes || []).map(function (f) { return corto(f.alm) + ' ' + nu(f.sobra); }).join(' · ');
    var compra = r.prov ? 'Comprar a ' + esc(r.prov) + (r.prov_costo ? ' · último ' + rd(r.prov_costo) : '') + (r.prov_fecha ? ' · ' + fecha(r.prov_fecha) : '') : 'Comprar · sin proveedor anterior';
    var sub = r.imei ? (fu ? 'Con IMEI · sobra en ' + esc(fu) + ' · use Despachar teléfonos' : '<i class="ti ti-shopping-cart"></i> ' + compra)
      : (fu ? '<i class="ti ti-truck-delivery"></i> Traer de ' + esc(fu) : '<i class="ti ti-shopping-cart"></i> ' + compra);
    var chk = '', ctl = '';
    if (h) chk = '<div class="rp-chk"><i class="ti ti-circle-check" style="color:#16a34a;font-size:24px"></i></div>';
    else if (puedeTraer(r)) {
      chk = '<label class="rp-chk" title="Traer"><input type="checkbox" ' + (C.sel[k] ? 'checked ' : '') + 'onchange="bcRepMarcar(\'' + k + '\',this.checked)" aria-label="Traer ' + esc(r.desc) + '"></label>';
      if (C.sel[k]) {
        var f0 = desdeDe(r), max = Math.max(1, Math.floor(f0 ? f0.sobra : 1));
        ctl = '<div class="rp-ctl"><select onchange="bcRepDesde(\'' + k + '\',this.value)" aria-label="Desde">' + r.fuentes.map(function (f) { return '<option value="' + f.alm + '"' + (f0 && f0.alm === f.alm ? ' selected' : '') + '>Desde ' + esc(corto(f.alm)) + ' (' + nu(f.sobra) + ')</option>'; }).join('') + '</select>' +
          '<input type="number" inputmode="numeric" min="1" max="' + max + '" value="' + cantDe(r) + '" onchange="bcRepCant(\'' + k + '\',this.value)" aria-label="Cantidad"> u.</div>';
      }
    } else chk = '<div class="rp-chk"></div>';
    return '<div class="rp-fila">' + chk + '<div class="rp-tx"><div class="rp-n">' + esc(r.desc || r.cod) + ' <span style="color:#64748b;font-weight:600">· ' + esc(r.cod) + '</span></div>' +
      '<div class="rp-s">' + s + '</div><div class="rp-s">' + (h ? '<b style="color:#166534">' + esc(h) + '</b>' : sub) + '</div>' + ctl + '</div>' +
      '<div class="rp-num"><b>' + nu(r.sugerido) + '</b>sugerido</div></div>';
  }
  function filaQuieto(r) {
    var pa = r.por_alm || {}, alms = Object.keys(pa).filter(function (a) { return Number(pa[a]) > 0; });
    var s = alms.map(function (a) { return '<span class="rp-pill">' + esc(corto(Number(a))) + ' ' + nu(pa[a]) + '</span>'; }).join('');
    var ult = r.ult_venta ? 'Última venta ' + fecha(r.ult_venta) : 'Sin ventas registradas';
    return '<div class="rp-fila"><div class="rp-tx"><div class="rp-n">' + esc(r.desc || r.cod) + ' <span style="color:#64748b;font-weight:600">· ' + esc(r.cod) + '</span></div>' +
      '<div class="rp-s">' + s + (r.imei ? '<span class="rp-pill a">IMEI</span>' : '') + '</div><div class="rp-s">' + ult + (r.ult_compra ? ' · compra ' + fecha(r.ult_compra) : '') + '</div></div>' +
      '<div class="rp-num"><b>' + rd(r.valor) + '</b>' + nu(r.unidades) + ' u.</div></div>';
  }
  function fecha(f) { try { var p = String(f).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return f; } }
  function buscar(k) { return (C.datos.agota || []).find(function (r) { return clave(r) === k; }); }
  function desdeDe(r) { var k = clave(r), a = Number(C.desde[k] || 0); return (r.fuentes || []).find(function (f) { return f.alm === a; }) || (r.fuentes || [])[0]; }
  function cantDe(r) { var k = clave(r), f = desdeDe(r), max = Math.max(1, Math.floor(f ? f.sobra : 1)); var c = Number(C.cant[k] || Math.min(r.sugerido, max)); return Math.max(1, Math.min(c, max)); }

  window.bcRepTab = function (t) { C.tab = t; verMas = LIM; guardarPref(); pintar(); var b = document.querySelector('#bcRep .rp-body'); if (b) b.scrollTop = 0; };
  window.bcRepSuc = function (s) { C.suc = s; verMas = LIM; guardarPref(); pintar(); };
  window.bcRepAlm = function (a) { C.alm = a; verMas = LIM; guardarPref(); pintar(); };
  window.bcRepComprar = function () { C.comprar = !C.comprar; verMas = LIM; guardarPref(); pintar(); };
  window.bcRepTodos = function (on) { filtrar().filter(puedeTraer).forEach(function (r) { C.sel[clave(r)] = !!on; }); pintar(); };

  // «Copiar pedido»: lo que hay que comprar, agrupado por el último proveedor, listo para pegar en WhatsApp.
  window.bcRepCopiarPedido = async function () {
    var porCod = {};
    filtrar().filter(aComprar).forEach(function (r) {
      var x = porCod[r.cod] || (porCod[r.cod] = { r: r, cant: 0, suc: [] });
      x.cant += Number(r.sugerido) || 0; x.suc.push(corto(r.alm));
    });
    var grupos = {};
    Object.keys(porCod).forEach(function (k) { var x = porCod[k], p = x.r.prov || 'Sin proveedor anterior'; (grupos[p] = grupos[p] || []).push(x); });
    var nombres = Object.keys(grupos).sort(function (a, b) { return a === 'Sin proveedor anterior' ? 1 : b === 'Sin proveedor anterior' ? -1 : grupos[b].length - grupos[a].length; });
    if (!nombres.length) return;
    var hoy = new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
    var txt = 'Pedido Bayol Cell · ' + hoy + '\n' + nombres.map(function (p) {
      return '\n*' + p + '*\n' + grupos[p].map(function (x) { return '• ' + x.cant + ' × ' + (x.r.desc || x.r.cod).trim() + ' (' + x.r.cod + ')'; }).join('\n');
    }).join('\n');
    var ok = false;
    try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) {
      try { var ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch (x) {}
    }
    window.__bcRepPedido = txt;
    aviso(ok ? '📋 Pedido copiado · ' + Object.keys(porCod).length + ' artículos, ' + nombres.length + ' proveedor(es)' : 'No se pudo copiar', ok ? undefined : 'error');
  };

  // Antes de despachar se pregunta a Info Plus cuánto hay de verdad en el origen (las existencias guardadas pueden
  // tener hasta 30 min). Si hay menos, se ajusta la cantidad; si no hay, se salta y se avisa.
  async function revisarEnVivo(lst) {
    var notas = [];
    await Promise.all(lst.map(function (x) {
      return Promise.all(x.items.map(async function (it) {
        try {
          var res = await supabaseClient.functions.invoke('infoplus-existencia-art', { body: { codarticulo: Number(it.r.cod) } });
          var ex = res && res.data && res.data.ok && res.data.existencias;
          if (!ex) return;
          var hay = Math.floor(Number(ex[String(x.origen)] || 0));
          if (hay < it.cant) { notas.push((it.r.desc || it.r.cod).trim() + ': en ' + corto(x.origen) + ' hay ' + hay + (hay > 0 ? ', se traen ' + hay : ', se salta')); it.cant = hay; }
        } catch (e) {}
      }));
    }));
    lst.forEach(function (x) { x.items = x.items.filter(function (it) { return it.cant > 0; }); });
    return { lst: lst.filter(function (x) { return x.items.length; }), notas: notas };
  }
  window.bcRepMas = function () { verMas += LIM; pintar(); };
  var tq = null;
  window.bcRepBuscar = function (v) { C.q = v; clearTimeout(tq); tq = setTimeout(function () { verMas = LIM; pintar(); }, 120); };
  window.bcRepMarcar = function (k, on) { C.sel[k] = !!on; pintar(); };
  window.bcRepDesde = function (k, v) { C.desde[k] = Number(v); delete C.cant[k]; pintar(); };
  window.bcRepCant = function (k, v) { C.cant[k] = Math.max(1, parseInt(v, 10) || 1); pintar(); };
  window.bcRepCerrar = function () { if (C.ocupado) return aviso('Espere: hay un despacho en curso.', 'error'); var b = document.getElementById('bcRep'); if (b) b.remove(); };

  window.bcRepCargar = async function () {
    C.datos = null; pintar();
    try {
      var r = await supabaseClient.rpc('inv_reponer', { p_dias: 60 });
      if (r.error) throw r.error;
      C.datos = r.data || { agota: [], quieto: [] };
    } catch (e) { try { logError('Reponer y quieto', e); } catch (x) {} C.datos = { error: true }; }
    pintar();
  };

  // «Traer»: un despacho por ruta (desde → hacia), con una sola confirmación y candado.
  window.bcRepTraer = async function () {
    if (C.ocupado) return;
    if (typeof tienePermiso === 'function' && !tienePermiso('despacho_ver')) return aviso('🔒 No tiene permiso de Despacho.', 'error');
    var elegidos = Object.keys(C.sel).filter(function (k) { return C.sel[k]; }).map(buscar).filter(function (r) { return r && puedeTraer(r); });
    if (!elegidos.length) return;
    var rutas = {};
    elegidos.forEach(function (r) { var f = desdeDe(r); if (!f) return; var key = f.alm + '>' + r.alm; (rutas[key] = rutas[key] || { origen: f.alm, destino: r.alm, items: [] }).items.push({ r: r, cant: cantDe(r) }); });
    var lst = Object.keys(rutas).map(function (k) { return rutas[k]; });
    C.ocupado = true; pintar();
    try {
      var rev = await revisarEnVivo(lst); lst = rev.lst;
      var aj = rev.notas.length ? '\n\nRevisado en Info Plus:\n' + rev.notas.map(function (n) { return '• ' + n; }).join('\n') : '';
      if (!lst.length) { aviso('Ya no hay existencia en el origen. No se despachó nada.' + aj, 'error'); return; }
      var txt = lst.map(function (x) { return '• ' + corto(x.origen) + ' → ' + corto(x.destino) + ': ' + x.items.length + ' artículo(s), ' + x.items.reduce(function (s, i) { return s + i.cant; }, 0) + ' u.'; }).join('\n');
      if (!await confirmar('¿Hacer ' + (lst.length === 1 ? 'este despacho' : 'estos ' + lst.length + ' despachos') + ' en Info Plus?\n\n' + txt + aj, { ok: 'Despachar', peligro: false })) return;
      var bien = 0, mal = [];
      for (var i = 0; i < lst.length; i++) {
        var x = lst[i];
        var items = x.items.map(function (it) { return { codigo: String(it.r.cod), descripcion: it.r.desc || String(it.r.cod), cantidad: it.cant, costo: Number(it.r.costo) || 0 }; });
        var nota = 'Reponer: ' + _nombreAlmacen(x.origen) + ' → ' + _nombreAlmacen(x.destino);
        var res = await _ejecutarDespachoReal({ origen: x.origen, destino: x.destino, items: items, nota: nota });
        await _despGuardarHistorial({ origen: x.origen, destino: x.destino, items: items, nota: nota, r: res });
        if (res.ok) { bien++; x.items.forEach(function (it) { var k = clave(it.r); C.hecho[k] = 'Despacho #' + (res.numero || '') + ' · ' + it.cant + ' u. desde ' + corto(x.origen); C.sel[k] = false; }); }
        else mal.push(corto(x.origen) + ' → ' + corto(x.destino) + ': ' + (res.error || 'error'));
      }
      if (bien) aviso('✅ ' + bien + ' despacho(s) hecho(s)');
      if (mal.length) aviso('❌ No se pudo:\n' + mal.join('\n'), 'error');
      try { if (typeof _ensureInfoplusArticulos === 'function') _ensureInfoplusArticulos(true); } catch (e) {}
    } finally { C.ocupado = false; pintar(); }
  };

  window.abrirReponerQuieto = function () {
    var prev = document.getElementById('bcRep'); if (prev) prev.remove();
    C.sel = {}; C.cant = {}; C.desde = {}; C.q = ''; verMas = LIM;
    var box = document.createElement('div');
    box.className = 'modal-backdrop active'; box.id = 'bcRep'; box.style.zIndex = '600';
    box.onclick = function (ev) { if (ev.target === box) window.bcRepCerrar(); };
    box.innerHTML = '<div class="modal-box"><div class="modal-header" style="display:flex;align-items:center;gap:8px"><h3 style="margin:0;flex:1"><i class="ti ti-package"></i> Reponer y quieto</h3>' +
      (typeof _iAyuda === 'function' ? _iAyuda('reponer') : '') + '</div><div class="rp-tabs"></div><div class="rp-body"></div><div class="rp-pie"></div></div>';
    document.body.appendChild(box);
    window.bcRepCargar();
  };

  // Abrir desde el aviso del lunes (dirección o mensaje del sw.js), cuando ya hay sesión.
  function abrirCuandoListo() {
    var n = 0;
    (function ir() {
      var listo = typeof supabaseClient !== 'undefined' && typeof sessionUser !== 'undefined' && sessionUser && typeof _ejecutarDespachoReal === 'function';
      if (listo) return window.abrirReponerQuieto();
      if (n++ < 120) setTimeout(ir, 500);
    })();
  }
  try {
    var qs = new URLSearchParams(location.search);
    if (qs.get('abrir') === 'reponer') {
      qs.delete('abrir');
      history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs.toString() : '') + location.hash);
      abrirCuandoListo();
    }
  } catch (e) {}
  try {
    if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.tipo === 'abrir-ventana' && e.data.u === 'reponer') abrirCuandoListo(); });
  } catch (e) {}
})();
