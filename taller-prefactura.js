/* BAYOL CELL · Pantalla «Prefactura» con el diseño de la Prefactura de STUDIO (19-oct-2026).
   Dueño: «vamos a cambiar donde dice recepción … ponerle prefactura … rediseñar esa parte para que se parezca a la de
   estudio … que se vea igual … reestructurarla».
   · Un solo documento (como STUDIO): cabecera (BAYOL CELL · PREFACTURA · Nº · fecha) → «Facturar a» + «Condiciones»
     → «Equipo recibido» + «Falla reportada» → buscador → artículos en 2 líneas → accesos + totales → barra fija abajo.
   · Solo MUEVE los campos que ya existen (mismos id, mismos onchange) y vuelve a pintar el carrito con las mismas funciones
     (_rpCant, _rpPrecio, _rpQuitar, _rpDesc, _rpImeiKey, _rpQuitarImei). Guardar sigue siendo _rpGuardar.
     No toca Info Plus, la base ni los cálculos.
   · Capa reversible: sin html.bc-pf no hace nada (vuelve la Recepción anterior). Apagar: BC_PF=false o localStorage bc_pf_off='1'. */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-pf')) return;

  function q(sel, root) { return (root || doc).querySelector(sel); }
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { try { return money(n); } catch (e) { return 'RD$ ' + Number(n || 0).toFixed(2); } }
  function val(id) { var e = doc.getElementById(id); return e ? String(e.value || '').trim() : ''; }
  function st() { try { return (typeof _rpState !== 'undefined' && _rpState) || null; } catch (e) { return null; } }
  function campo(id) { var e = doc.getElementById(id); return e ? (e.closest('.rx-body > div') || e.parentElement) : null; }
  function fechaHoy() { var d = new Date(); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }

  var R = {}; // referencias a las piezas del documento

  function organizar() {
    var v = doc.getElementById('v-recepcion');
    if (!v || v.dataset.bcPf === '1') return !!v;
    var cols = q('.rx-cols', v);
    var cards = cols ? Array.prototype.slice.call(cols.children).filter(function (c) { return c.classList.contains('rx-card'); }) : [];
    if (cards.length < 4 || !doc.getElementById('rxArticulos') || !doc.getElementById('rxResumen')) return false;
    var cli = cards[0], equ = cards[1], adi = cards[2], fal = cards[3];
    var layout = q('.rx-layout', v);
    var art = layout && Array.prototype.slice.call(cols.parentElement.children).filter(function (c) { return c !== cols && c.classList.contains('rx-card'); })[0];
    if (!art) return false;
    v.dataset.bcPf = '1';
    v.classList.add('bcpf');

    // ── Documento ──
    var docu = el('div', 'bcpf-doc');
    var pad = el('div', 'bcpf-pad');
    docu.appendChild(pad);

    // Cabecera
    var dh = el('div', 'bcpf-dh',
      '<div class="dhl"><div class="emp">BAYOL CELL</div><div class="empsub">Prefactura de Info Plus</div></div>' +
      '<div class="dhr"><span class="dtit">Prefactura</span>' +
      '<button type="button" class="ibtn" aria-label="Buscar prefacturas guardadas" title="Prefacturas guardadas"><i class="ti ti-search" aria-hidden="true"></i></button>' +
      '<span class="dno">Nº</span><span class="dnum">Nueva</span><span class="dfec">' + fechaHoy() + '</span></div>' +
      '<div class="dest"></div>');
    pad.appendChild(dh);
    R.num = q('.dnum', dh); R.est = q('.dest', dh);
    q('.ibtn', dh).addEventListener('click', function () { try { _rpHistorial(); } catch (e) {} });

    // Facturar a + Condiciones
    var p1 = el('div', 'bcpf-partes');
    var cCli = el('div', 'pcol', '<div class="plab">Facturar a</div>');
    var tarjeta = el('button', 'pcli', '<span class="pav" aria-hidden="true"><i class="ti ti-user"></i></span>' +
      '<span class="pinfo"><span class="pnom">Cliente de contado</span><span class="pdet">Contado · cód. 1</span></span>' +
      '<span class="pchev">Cambiar <i class="ti ti-chevron-right" aria-hidden="true"></i></span>');
    tarjeta.type = 'button'; tarjeta.setAttribute('aria-label', 'Cambiar el cliente de Info Plus');
    tarjeta.addEventListener('click', function () { try { _rpBuscarCliente(); } catch (e) {} });
    cCli.appendChild(tarjeta);
    R.pav = q('.pav', tarjeta); R.pnom = q('.pnom', tarjeta); R.pdet = q('.pdet', tarjeta);
    var camposCli = el('div', 'bcpf-campos');
    var bodyCli = q('.rx-body', cli);
    Array.prototype.slice.call(bodyCli.children).forEach(function (c, i) {
      if (i === 0 || c.id === 'rxClienteChip') { c.classList.add('bcpf-oculto'); return; } // buscador y chip viejos: los reemplaza la tarjeta
      camposCli.appendChild(c);
    });
    cCli.appendChild(camposCli);
    var cCond = el('div', 'pcol', '<div class="plab">Condiciones</div>');
    var condCampos = el('div', 'bcpf-campos');
    var nivel = doc.getElementById('rxNivel');
    if (nivel) { var fNivel = el('div', '', '<label for="rxNivel">Precio del cliente</label>'); fNivel.appendChild(nivel); condCampos.appendChild(fNivel); }
    // «Tipo de cliente» y «Precio» decían lo mismo (dueño: «veo que se repite»): queda solo «Precio del cliente».
    // El tipo (final / tienda) se sigue guardando igual: se deriva del precio elegido.
    var selTipo = q('#c_tipo', camposCli), fTipo = selTipo && selTipo.parentElement; if (fTipo) fTipo.classList.add('bcpf-oculto'); // (aún fuera del documento: se busca dentro del bloque)
    if (nivel) nivel.addEventListener('change', tipoDesdeNivel);
    ['rxAlmacen', 'rxVendedor'].forEach(function (id) { var f = campo(id); if (f) condCampos.appendChild(f); });
    var aviso = doc.getElementById('rxVendAviso'); if (aviso) condCampos.appendChild(aviso);
    cCond.appendChild(condCampos);
    cCond.appendChild(el('p', 'bcpf-nota', 'La prefactura no cobra ni descuenta inventario: se factura en Info Plus.'));
    p1.appendChild(cCli); p1.appendChild(cCond);
    pad.appendChild(p1);

    // Equipo recibido + Falla reportada
    var p2 = el('div', 'bcpf-partes');
    var cEq = el('div', 'pcol', '<div class="plab">Equipo recibido</div>');
    var camposEq = el('div', 'bcpf-campos');
    Array.prototype.slice.call(q('.rx-body', equ).children).forEach(function (c) { camposEq.appendChild(c); });
    cEq.appendChild(camposEq);
    var cFa = el('div', 'pcol', '<div class="plab">Falla reportada</div>');
    var camposFa = el('div', 'bcpf-campos');
    Array.prototype.slice.call(q('.rx-body', fal).children).forEach(function (c) { camposFa.appendChild(c); });
    cFa.appendChild(camposFa);
    var chk = doc.getElementById('checksFisico');
    var fallasCard = chk ? chk.closest('.card') : null;
    var seg = q('.rx-seg', v);
    [fallasCard, seg].forEach(function (c) { if (c) { c.classList.add('bcpf-plegable'); cFa.appendChild(c); } });
    p2.appendChild(cEq); p2.appendChild(cFa);
    pad.appendChild(p2);

    // Buscador de artículos (el de STUDIO que ya existía) + Servicio / falla
    var zona = q('.rx-art-search', art);
    var busc = el('div', 'bcpf-busc');
    if (zona) busc.appendChild(zona);
    pad.appendChild(busc);
    if (typeof window.bcRxBuscador === 'function') window.bcRxBuscador(v, busc);
    var nota = q('.rx-art-search > span', busc); if (nota) nota.classList.add('bcpf-oculto');

    // Artículos
    var lista = doc.getElementById('rxArticulos');
    var envLista = lista.parentElement; // el div con overflow-x
    pad.appendChild(lista);
    R.cnt = el('div', 'bcpf-cnt'); pad.appendChild(R.cnt);

    // Pie: accesos + totales
    var pie = el('div', 'bcpf-pie');
    var otras = el('div', 'bcpf-otras');
    var qs = el('div', 'bcpf-qs');
    function pildora(ic, txt, fn) { var b = el('button', 'bcpf-q', '<i class="ti ' + ic + '" aria-hidden="true"></i><span>' + txt + '</span>'); b.type = 'button'; b.addEventListener('click', fn); qs.appendChild(b); return b; }
    pildora('ti-search', 'Buscar', function () { var s = q('.bcrx-scan', busc); if (s) { s.scrollIntoView({ block: 'center' }); s.click(); } });
    pildora('ti-files', 'Prefacturas', function () { try { _rpHistorial(); } catch (e) {} });
    var tools = q('.rx-toolsbox', v);
    if (tools) pildora('ti-tools', 'Herramientas', function () { tools.open = true; tools.scrollIntoView({ block: 'start' }); });
    otras.appendChild(qs);
    // Datos adicionales (técnico, prioridad, entrega) plegados como la «nota» de STUDIO
    var det = el('details', 'bcpf-det');
    det.innerHTML = '<summary><i class="ti ti-adjustments" aria-hidden="true"></i><span>Datos adicionales</span><span class="bcpf-res"></span><i class="ti ti-chevron-down bcpf-chev" aria-hidden="true"></i></summary>';
    var camposAd = el('div', 'bcpf-campos');
    Array.prototype.slice.call(q('.rx-body', adi).children).forEach(function (c) { camposAd.appendChild(c); });
    det.appendChild(camposAd);
    otras.appendChild(det);
    R.res = q('.bcpf-res', det);
    var tot = el('div', 'bcpf-tot',
      '<div class="tr"><span>Artículos</span><b class="t-art">0</b></div>' +
      '<div class="tr"><span>Subtotal</span><b class="t-sub">RD$ 0.00</b></div>' +
      '<div class="tr tt"><span>Total</span><b class="t-tot">RD$ 0.00</b></div>' +
      '<div class="t-info"></div>');
    R.tArt = q('.t-art', tot); R.tSub = q('.t-sub', tot); R.tTot = q('.t-tot', tot); R.tInfo = q('.t-info', tot);
    pie.appendChild(otras); pie.appendChild(tot);
    pad.appendChild(pie);

    // Armar: herramientas arriba (plegadas), el documento, y la lista de prefacturas realizadas debajo
    layout.parentNode.insertBefore(docu, layout);
    layout.classList.add('bcpf-oculto'); // queda #rxResumen dentro (lo usa _rpRenderResumen); no se ve
    [cli, equ, adi, fal, art].forEach(function (c) { c.classList.add('bcpf-oculto'); });
    if (envLista && envLista !== lista && !envLista.children.length) envLista.classList.add('bcpf-oculto');
    var titLista = q('#recepcionesLista') && q('#recepcionesLista').closest('.card');
    if (titLista) { titLista.classList.add('bcpf-hist'); var h = q('h3', titLista); if (h) h.lastChild.nodeValue = ' Prefacturas realizadas'; }

    // Barra fija abajo (como STUDIO): Total · Imprimir · Guardar e imprimir · Guardar
    var bar = el('div', 'bcpf-bar', '<div class="bt"><span class="bl">Total</span><b class="bn">RD$ 0.00</b></div>' +
      '<button type="button" class="bb bimp" aria-label="Imprimir la prefactura" title="Imprimir"><i class="ti ti-printer" aria-hidden="true"></i></button>' +
      '<button type="button" class="bb bgi"><i class="ti ti-printer" aria-hidden="true"></i><span>Guardar e imprimir</span></button>' +
      '<button type="button" class="bb bg"><i class="ti ti-device-floppy" aria-hidden="true"></i><span>Guardar</span></button>' +
      '<span class="bfin" hidden>Ya facturada</span>');
    v.appendChild(bar); v.classList.add('bcpf-con-barra');
    R.bar = bar; R.bn = q('.bn', bar);
    q('.bg', bar).addEventListener('click', function () { try { _rpGuardar(false); } catch (e) {} });
    q('.bgi', bar).addEventListener('click', function () { try { _rpGuardar(true); } catch (e) {} });
    q('.bimp', bar).addEventListener('click', function () { try { _rpImprimir(); } catch (e) {} });
    v.addEventListener('focusin', function (e) { if (e.target.matches('input,textarea,select') && matchMedia('(max-width: 760px)').matches) bar.classList.add('bcpf-oculta'); });
    v.addEventListener('focusout', function () { setTimeout(function () { var a = doc.activeElement; if (!a || !v.contains(a) || !a.matches('input,textarea,select')) bar.classList.remove('bcpf-oculta'); }, 60); });

    // Repintar al escribir datos del cliente o al cambiar los datos adicionales
    ['c_nombre', 'c_whatsapp', 'c_cedula', 'c_rnc'].forEach(function (id) { var e = doc.getElementById(id); if (e) e.addEventListener('input', pintarDoc); });
    det.addEventListener('change', pintarDoc);
    enganchar();
    pintarCarrito(); pintarDoc();
    setTimeout(pintarDoc, 1500);
    return true;
  }

  // ── Carrito en 2 líneas (como STUDIO) con las mismas funciones de siempre ──
  function filaImeis(it, i) {
    if (!it.serial) return '';
    var ims = it.imeis || [], falta = !ims.length;
    var chips = ims.map(function (m, k) {
      return '<span class="imc">' + esc(m) + '<button type="button" aria-label="Quitar IMEI ' + esc(m) + '" onclick="_rpQuitarImei(' + i + ',' + k + ')"><i class="ti ti-x" aria-hidden="true"></i></button></span>';
    }).join('');
    return '<div class="bcpf-imei' + (falta ? ' falta' : '') + '"><div class="imi"><i class="ti ti-barcode" aria-hidden="true"></i>' +
      '<input id="rpImei_' + i + '" placeholder="Escanee o escriba el IMEI y presione Enter" onkeydown="_rpImeiKey(event,' + i + ')" inputmode="numeric" autocomplete="off"></div>' +
      '<div class="ims">' + (chips || '<span class="imf">Sin IMEI: no se puede facturar este equipo.</span>') + '</div></div>';
  }
  function filaStock(it) {
    var s = null; try { s = _rpStockItem(it); } catch (e) {}
    if (s === null || Number(it.cant) <= s) return '';
    var alm = ''; try { alm = _rpAlmNombre(); } catch (e) {}
    return '<div class="bcpf-stk"><i class="ti ti-alert-triangle" aria-hidden="true"></i> Solo hay ' + s + ' en ' + esc(alm) + '. No se puede facturar esta cantidad.</div>';
  }
  function pintarCarrito() {
    var c = doc.getElementById('rxArticulos'); if (!c) return;
    var s = st();
    if (!s || !s.items.length) { c.innerHTML = '<div class="bcpf-vacio">Sin artículos. Use el buscador o escanee un código para agregarlos.</div>'; return; }
    c.innerHTML = '<div class="bcpf-items">' + s.items.map(function (it, i) {
      var cant = it.serial
        ? '<span class="stp fijo" title="La cantidad sale del número de IMEI">' + it.cant + '</span>'
        : '<span class="stp"><button type="button" aria-label="Quitar una unidad" onclick="_rpCant(' + i + ',' + (Number(it.cant) - 1) + ')">−</button>' +
          '<input type="number" min="1" step="1" value="' + it.cant + '" aria-label="Cantidad" onchange="_rpCant(' + i + ',this.value)">' +
          '<button type="button" aria-label="Agregar una unidad" onclick="_rpCant(' + i + ',' + (Number(it.cant) + 1) + ')">+</button></span>';
      return '<div class="bcpf-it">' +
        '<span class="n">' + ('0' + (i + 1)).slice(-2) + '</span>' +
        '<div class="d"><input class="dnm" value="' + esc(it.desc) + '" aria-label="Descripción" title="Descripción editable (no cambia el artículo maestro)" onchange="_rpDesc(' + i + ',this.value)">' +
        '<div class="dsub"><span class="cod">' + esc(it.cod) + '</span>' + (it.servicio ? '<span class="srv">Servicio</span>' : '') + (it.serial ? '<span class="ime">IMEI ' + (it.imeis || []).length + '/' + it.cant + '</span>' : '') + '</div></div>' +
        '<b class="imp">' + plata(Number(it.precio) * Number(it.cant)) + '</b>' +
        '<button type="button" class="del" aria-label="Quitar ' + esc(it.desc) + '" onclick="_rpQuitar(' + i + ')"><i class="ti ti-minus" aria-hidden="true"></i></button>' +
        '<div class="l2"><label><span>Precio</span><input class="pin" type="number" min="0" step="0.01" value="' + it.precio + '" onchange="_rpPrecio(' + i + ',this.value)"></label>' +
        '<div class="lq"><span>Cant.</span>' + cant + '</div></div>' +
        filaImeis(it, i) + filaStock(it) + '</div>';
    }).join('') + '</div>';
  }

  // ── Cabecera, cliente, totales y barra ──
  function iniciales(n) { var p = String(n || '').trim().split(/\s+/).filter(Boolean); return ((p[0] || '')[0] || '').toUpperCase() + ((p[1] || '')[0] || '').toUpperCase(); }
  function pintarDoc() {
    var s = st(); if (!R.num) return;
    var items = (s && s.items) || [];
    var total = items.reduce(function (a, it) { return a + Number(it.precio) * Number(it.cant); }, 0);
    var unidades = items.reduce(function (a, it) { return a + Number(it.cant); }, 0);
    // Nº y estado
    R.num.textContent = (s && s.codprefactura) ? String(s.codprefactura) : 'Nueva';
    R.num.classList.toggle('nueva', !(s && s.codprefactura));
    var badge = ''; try { badge = _rpEstadoBadge((s && s.estado) || 'pendiente', s && s.codprefactura); } catch (e) {}
    R.est.innerHTML = badge;
    // Cliente
    var info = s && s.codcliente && String(s.codcliente) !== '1';
    var nombre = val('c_nombre') || (info ? s.infoNombre : '') || 'Cliente de contado';
    R.pnom.textContent = nombre;
    var det = [info ? 'Cód. ' + s.codcliente + ' · Info Plus' : 'Contado · cód. 1', val('c_whatsapp'), val('c_cedula') || val('c_rnc')].filter(Boolean).join(' · ');
    R.pdet.textContent = det;
    var ini = (val('c_nombre') || info) ? iniciales(nombre) : '';
    R.pav.innerHTML = ini ? esc(ini) : '<i class="ti ti-user"></i>';
    // Datos adicionales (resumen en una línea)
    var sel = function (id) { var e = doc.getElementById(id); return e && e.selectedIndex >= 0 ? (e.options[e.selectedIndex].textContent || '').trim() : ''; };
    var tec = sel('rxTecnico').replace(/^[—–-]\s*|\s*[—–-]$/g, ''); if (/^sin asignar$/i.test(tec)) tec = 'Sin técnico';
    if (R.res) R.res.textContent = [tec, sel('o_prioridad')].filter(Boolean).join(' · ');
    // Totales
    R.cnt.textContent = items.length ? items.length + (items.length === 1 ? ' artículo' : ' artículos') + ' · ' + unidades + (unidades === 1 ? ' unidad' : ' unidades') : '';
    R.tArt.textContent = String(unidades);
    R.tSub.textContent = plata(total); R.tTot.textContent = plata(total); R.bn.textContent = plata(total);
    var facturada = s && s.estado === 'facturada';
    R.tInfo.innerHTML = facturada ? '<div class="t-fac">Esta prefactura ya fue convertida en factura y no puede modificarse.</div>'
      : (s && s.codprefactura ? 'Prefactura Nº <b>' + esc(s.codprefactura) + '</b> en Info Plus' : '');
    R.bar.querySelector('.bimp').hidden = !(s && s.codprefactura);
    R.bar.querySelector('.bg').hidden = !!facturada; R.bar.querySelector('.bgi').hidden = !!facturada;
    R.bar.querySelector('.bfin').hidden = !facturada;
  }

  // Tipo de cliente según el precio: Por mayor o Extremo → tienda; Cliente final → final
  function tipoDesdeNivel() {
    var n = doc.getElementById('rxNivel'), t = doc.getElementById('c_tipo'); if (!n || !t) return;
    var tipo = Number(n.value) >= 2 ? 'tienda' : 'final';
    if (t.value !== tipo) { t.value = tipo; try { toggleRncRecepcion(); } catch (e) {} }
  }
  // Dueño (19-oct-2026): «en Info Plus el cliente con código viene asignado el código de al por mayor».
  // Al elegir un cliente con código propio, el precio pasa a «Por mayor»; con el de contado (1), a «Cliente final».
  // Se puede cambiar a mano después. (La API de clientes de Info Plus no trae el nivel de cada cliente.)
  function nivelDesdeCliente(cod) {
    var n = doc.getElementById('rxNivel'); if (!n) return;
    var nv = String(cod) === '1' ? '1' : '2';
    if (n.value !== nv) { n.value = nv; try { _rpNivelCambio(); } catch (e) {} }
    tipoDesdeNivel();
  }

  // Envolver las funciones que pintan para que el documento se actualice solo
  function enganchar() {
    if (typeof window._rpRenderCart === 'function' && !window._rpRenderCart._bcpf) {
      var envC = function () { pintarCarrito(); pintarDoc(); };
      envC._bcpf = true; window._rpRenderCart = envC;
    }
    if (typeof window._rpRenderResumen === 'function' && !window._rpRenderResumen._bcpf) {
      var orig = window._rpRenderResumen;
      var envR = function () { var r = orig.apply(this, arguments); try { pintarDoc(); } catch (e) {} return r; };
      envR._bcpf = true; window._rpRenderResumen = envR;
    }
    if (typeof window._rpCliElegir === 'function' && !window._rpCliElegir._bcpf) {
      var origC = window._rpCliElegir;
      var envE = function (cod) { var r = origC.apply(this, arguments); try { nivelDesdeCliente(cod); pintarDoc(); } catch (e) {} return r; };
      envE._bcpf = true; window._rpCliElegir = envE;
    }
  }

  window.bcPfPintar = function () { pintarCarrito(); pintarDoc(); };
  if (!organizar()) {
    var mo = new MutationObserver(function () { if (organizar()) mo.disconnect(); });
    mo.observe(doc.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 20000);
  }
})();
