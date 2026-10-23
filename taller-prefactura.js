/* BAYOL CELL · Pantalla «Prefactura» con el diseño de la Prefactura de STUDIO (19-oct-2026).
   Dueño: «vamos a cambiar donde dice recepción … ponerle prefactura … rediseñar esa parte para que se parezca a la de
   estudio … que se vea igual … reestructurarla».
   · Un solo documento (como STUDIO): cabecera (BAYOL CELL · PREFACTURA · Nº · fecha) → «Facturar a» + «Condiciones»
     → «Equipo recibido» + «Falla reportada» → buscador → artículos en 2 líneas → accesos + totales → barra fija abajo.
   · Solo MUEVE los campos que ya existen (mismos id, mismos onchange) y vuelve a pintar el carrito con las mismas funciones
     (_rpCant, _rpPrecio, _rpQuitar, _rpDesc, _rpImeiKey, _rpQuitarImei). Guardar sigue siendo _rpGuardar.
     No toca Info Plus, la base ni los cálculos.
   · 20-oct-2026: pantalla limpia como STUDIO. Lo que no es de la prefactura (equipo, falla, datos del cliente,
     técnico, seguridad, rifa) queda plegado en «Equipo, falla y más datos (opcional)». Comentario al pie.
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
  function num2(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function tot(items) { try { return _rpTotales(items); } catch (e) { var t = (items || []).reduce(function (a, it) { return a + Number(it.precio) * Number(it.cant); }, 0); return { subtotal: t, descuento: 0, total: t }; } }
  function importe(it) { try { return _rpImporte(it); } catch (e) { return Number(it.precio) * Number(it.cant); } }
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
      '' +
      '<button type="button" class="ibtn" aria-label="Buscar prefacturas" title="Buscar prefacturas"><i class="ti ti-search" aria-hidden="true"></i></button>' +
      '<span class="dno">Nº</span><span class="dnum">Nueva</span><span class="dfec">' + fechaHoy() + '</span></div>' +
      '<div class="dest"></div>');
    pad.appendChild(dh);
    R.num = q('.dnum', dh); R.est = q('.dest', dh); q('.dhl', dh).appendChild(R.est); // estado debajo de «Prefactura de Info Plus», sin fila propia
    // Lupa de arriba (dueño: «no es copiar, es una lupa»): busca las prefacturas guardadas. Es la única entrada.
    q('.ibtn', dh).addEventListener('click', function () { try { _rpHistorial(); } catch (e) {} });

    // Facturar a + Condiciones. 20-oct-2026 (dueño): «ponerla como la tenemos en estudio y quitar todo lo otro … para
    // irle agregando». En «Facturar a» queda solo la tarjeta del cliente; los campos del cliente bajan a «Más datos».
    var p1 = el('div', 'bcpf-partes');
    var cCli = el('div', 'pcol', '<div class="plab">Facturar a</div>');
    var tarjeta = el('button', 'pcli', '<span class="pav" aria-hidden="true"><i class="ti ti-user"></i></span>' +
      '<span class="pinfo"><span class="pnom">CONTADO: 1</span><span class="pdet"></span></span>' +
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
    // 20-oct-2026 (dueño: «ahorrar espacio»): una sola franja con 4 casillas en PC: Facturar a · Precio del cliente · Almacén · Vendedor
    p1.classList.add('bcpf-franja');
    var nivel = doc.getElementById('rxNivel');
    var fNivel = null;
    if (nivel) { fNivel = el('div', 'pcol bcpf-campos'); var fN = el('div', '', '<label for="rxNivel">Precio del cliente</label>'); fN.appendChild(nivel); fNivel.appendChild(fN); }
    // «Tipo de cliente» y «Precio» decían lo mismo (dueño: «veo que se repite»): queda solo «Precio del cliente».
    // El tipo (final / tienda) se sigue guardando igual: se deriva del precio elegido.
    var selTipo = q('#c_tipo', camposCli), fTipo = selTipo && selTipo.parentElement; if (fTipo) fTipo.classList.add('bcpf-oculto'); // (aún fuera del documento: se busca dentro del bloque)
    if (nivel) nivel.addEventListener('change', tipoDesdeNivel);
    p1.appendChild(cCli); if (fNivel) p1.appendChild(fNivel);
    ['rxAlmacen', 'rxVendedor'].forEach(function (id) { var l = doc.querySelector('label[for="' + id + '"]') || (campo(id) && campo(id).querySelector('label')); if (l) Array.prototype.slice.call(l.childNodes).forEach(function (n) { if (n.nodeType === 3) n.nodeValue = n.nodeValue.replace(/\s*\(Info Plus\)/i, ''); }); });
    var fAlm = campo('rxAlmacen'); if (fAlm) { var cAlm = el('div', 'pcol bcpf-campos'); cAlm.appendChild(fAlm); p1.appendChild(cAlm); }
    // 20-oct-2026 (dueño): el «Vendedor» va al pie, al lado de «Pedir reseña» (fijo para cada empleada; lo decide _rpInit)
    var fVen = campo('rxVendedor'), avisoV = doc.getElementById('rxVendAviso');
    pad.appendChild(p1);

    // Equipo, falla y lo demás: opcional (dueño: «la falla … opcional, no obligatorio. Y … los equipos también»).
    var camposEq = el('div', 'bcpf-campos');
    Array.prototype.slice.call(q('.rx-body', equ).children).forEach(function (c) { camposEq.appendChild(c); });
    var camposFa = el('div', 'bcpf-campos');
    var fComent = campo('o_observaciones'); // el comentario sube al pie del documento (como la nota de STUDIO)
    Array.prototype.slice.call(q('.rx-body', fal).children).forEach(function (c) { if (c !== fComent) camposFa.appendChild(c); });
    var chk = doc.getElementById('checksFisico');
    var fallasCard = chk ? chk.closest('.card') : null;
    var seg = q('.rx-seg', v);
    var camposAd = el('div', 'bcpf-campos');
    Array.prototype.slice.call(q('.rx-body', adi).children).forEach(function (c) { camposAd.appendChild(c); });
    // Sin asteriscos: ya nada de esto es obligatorio para la prefactura
    [camposCli, camposEq].forEach(function (b) {
      Array.prototype.slice.call(b.querySelectorAll('label')).forEach(function (l) {
        Array.prototype.slice.call(l.childNodes).forEach(function (n) { if (n.nodeType === 3) n.nodeValue = n.nodeValue.replace(/\s*\*\s*$/, ' ').replace(/\s+$/, ''); });
      });
    });

    // Buscador de artículos (el de STUDIO que ya existía) + Servicio / falla
    var zona = q('.rx-art-search', art);
    var busc = el('div', 'bcpf-busc');
    if (zona) busc.appendChild(zona);
    pad.appendChild(busc);
    if (typeof window.bcRxBuscador === 'function') window.bcRxBuscador(v, busc);
    var nota = q('.rx-art-search > span', busc); if (nota) nota.classList.add('bcpf-oculto');
    busc.classList.add('bcpf-busc-fila'); // «Servicio / falla» en la misma línea del buscador
    // Texto corto del buscador para que se lea completo en el celular (antes «Buscar o escanear por nombre, c…»)
    var bScan = q('.bcrx-scan > span', busc); if (bScan) bScan.textContent = 'Buscar artículo';
    var bSrv = q('.bcrx-srv', busc); if (bSrv) { bSrv.innerHTML = '<i class="ti ti-tool" aria-hidden="true"></i><span>Servicio</span>'; bSrv.setAttribute('aria-label', 'Agregar servicio o falla'); }

    // Artículos
    var lista = doc.getElementById('rxArticulos');
    var envLista = lista.parentElement; // el div con overflow-x
    pad.appendChild(lista);
    R.cnt = el('div', 'bcpf-cnt'); pad.appendChild(R.cnt);

    // Pie: accesos + comentario | totales
    var pie = el('div', 'bcpf-pie');
    var otras = el('div', 'bcpf-otras');
    var qs = el('div', 'bcpf-qs');
    function pildora(ic, txt, fn) { var b = el('button', 'bcpf-q', '<i class="ti ' + ic + '" aria-hidden="true"></i><span>' + txt + '</span>'); b.type = 'button'; b.addEventListener('click', fn); qs.appendChild(b); return b; }
    pildora('ti-file-plus', 'Nueva', function () { nueva(); });
    // Herramientas rápidas: queda solo «Pedir reseña» a mano (dueño: «puede dejar el asunto de la reseña»); la rifa baja a «Más datos».
    var tools = q('.rx-toolsbox', v);
    var resCard = doc.getElementById('resenaWa') && doc.getElementById('resenaWa').closest('.card');
    var rifaCard = doc.getElementById('rifaNombre') && doc.getElementById('rifaNombre').closest('.card');
    var detRes = null;
    if (resCard) {
      detRes = el('details', 'bcpf-det bcpf-resena');
      detRes.innerHTML = '<summary hidden></summary>';
      detRes.appendChild(resCard);
      pildora('ti-star', 'Pedir reseña', function () { detRes.open = !detRes.open; if (detRes.open) { var i = doc.getElementById('resenaWa'); if (i) i.focus(); } });
    }
    var qrow = el('div', 'bcpf-qrow'); qrow.appendChild(qs);
    if (fVen) { var cVen = el('div', 'bcpf-campos bcpf-vend'); cVen.appendChild(fVen); qrow.appendChild(cVen); if (avisoV) { avisoV.classList.add('bcpf-vaviso'); qrow.appendChild(avisoV); } }
    otras.appendChild(qrow);
    R.qrow = qrow;
    if (detRes) otras.appendChild(detRes);
    // Comentario (como «Agregar nota o condiciones al documento» de STUDIO)
    var detCom = el('details', 'bcpf-det bcpf-coment');
    detCom.innerHTML = '<summary><i class="ti ti-note" aria-hidden="true"></i><span>Agregar comentario a la prefactura</span><i class="ti ti-chevron-down bcpf-chev" aria-hidden="true"></i></summary>';
    if (fComent) {
      var lCom = q('label', fComent); if (lCom) lCom.innerHTML = 'Comentario';
      var tCom = doc.getElementById('o_observaciones'); if (tCom) tCom.placeholder = 'Ej. cliente pasa a buscarlo el viernes; trae su propio cargador…';
      detCom.appendChild(fComent);
      detCom.appendChild(el('p', 'bcpf-nota', 'Se guarda en el taller, sale al imprimir y se manda a Info Plus como comentario de la prefactura.'));
    }
    otras.appendChild(detCom);
    R.com = detCom;
    var tot = el('div', 'bcpf-tot',
      '<div class="tr"><span>Artículos</span><b class="t-art">0</b></div>' +
      '<div class="tr"><span>Subtotal</span><b class="t-sub">RD$ 0.00</b></div>' +
      '<div class="tr td" hidden><span>Descuento por línea</span><b class="t-des">RD$ 0.00</b></div>' +
      '<div class="tr tdm"><label><span>Descuento RD$</span><span class="dmw"><i>RD$</i><input class="dm" inputmode="decimal" autocomplete="off" placeholder="0.00" enterkeyhint="done" aria-label="Descuento en pesos sobre toda la prefactura" onfocus="this.select()" onkeydown="if(event.key===&quot;Enter&quot;){event.preventDefault();this.blur();}" onchange="this.blur();_rpDescMonto(this.value)"></span></label></div>' +
      '<div class="tr tt"><span>Total</span><b class="t-tot">RD$ 0.00</b></div>' +
      '<div class="t-info"></div>');
    R.tArt = q('.t-art', tot); R.tSub = q('.t-sub', tot); R.tDes = q('.t-des', tot); R.tDesF = q('.td', tot); R.tTot = q('.t-tot', tot); R.tInfo = q('.t-info', tot); R.tDm = q('.dm', tot); R.tDmF = q('.tdm', tot);
    pie.appendChild(otras); pie.appendChild(tot);
    pad.appendChild(pie);

    // «Equipo, falla y más datos (opcional)»: todo lo que salió de la pantalla principal, plegado
    var mas = el('details', 'bcpf-mas');
    mas.innerHTML = '<summary><i class="ti ti-device-mobile" aria-hidden="true"></i><span class="mt">Equipo, falla y más datos <em>(opcional)</em></span>' +
      '<span class="bcpf-res"></span><i class="ti ti-chevron-down bcpf-chev" aria-hidden="true"></i></summary>';
    var cuerpo = el('div', 'bcpf-mas-body');
    cuerpo.appendChild(el('p', 'bcpf-nota', 'Si llena el equipo, al guardar también se crea la orden de reparación para el técnico (pide nombre, WhatsApp y modelo). Si lo deja vacío, solo se crea la prefactura.'));
    function seccion(tit, nodos) { var s = el('section', 'bcpf-sec', '<h4>' + tit + '</h4>'); nodos.forEach(function (n) { if (n) s.appendChild(n); }); cuerpo.appendChild(s); return s; }
    seccion('Equipo recibido', [camposEq]);
    var sFa = seccion('Falla reportada', [camposFa]);
    [fallasCard, seg].forEach(function (c) { if (c) { c.classList.add('bcpf-plegable'); sFa.appendChild(c); } });
    seccion('Datos del cliente', [camposCli]);
    seccion('Orden de reparación', [camposAd]);
    if (rifaCard) seccion('Otras herramientas', [rifaCard]);
    mas.appendChild(cuerpo);
    pad.appendChild(mas);
    docu.appendChild(el('div', 'bcpf-keys', '<span><kbd>F2</kbd> Buscar artículo</span><span><kbd>F9</kbd> Guardar</span><span><kbd>F10</kbd> Nueva prefactura</span>'));
    doc.addEventListener('keydown', function (e) {
      if (!v.classList.contains('active')) return;
      if (e.key === 'F9') { e.preventDefault(); try { _rpGuardar(false); } catch (er) {} }
      else if (e.key === 'F10') { e.preventDefault(); nueva(); }
    });
    R.mas = mas; R.res = q('.bcpf-res', mas);
    q('summary', mas).addEventListener('click', function () { mas.dataset.tocado = '1'; }); // solo el toque del usuario (no cuando el sistema la abre)
    if (tools) tools.classList.add('bcpf-oculto');

    // Armar: el documento, y la lista de prefacturas realizadas debajo
    layout.parentNode.insertBefore(docu, layout);
    layout.classList.add('bcpf-oculto'); // queda #rxResumen dentro (lo usa _rpRenderResumen); no se ve
    [cli, equ, adi, fal, art].forEach(function (c) { c.classList.add('bcpf-oculto'); });
    if (envLista && envLista !== lista && !envLista.children.length) envLista.classList.add('bcpf-oculto');
    var titLista = q('#recepcionesLista') && q('#recepcionesLista').closest('.card');
    if (titLista) { titLista.classList.add('bcpf-hist'); var h = q('h3', titLista); if (h) h.lastChild.nodeValue = ' Prefacturas realizadas'; var hb = q('button[onclick*="_rpHistorial"]', titLista); if (hb) hb.classList.add('bcpf-oculto'); } // «Historial de prefacturas» repetía la píldora «Prefacturas»

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
    ['c_nombre', 'c_whatsapp', 'c_cedula', 'c_rnc', 'e_marca', 'e_modelo', 'e_imei', 'o_falla', 'o_observaciones'].forEach(function (id) { var e = doc.getElementById(id); if (e) e.addEventListener('input', pintarDoc); });
    mas.addEventListener('change', pintarDoc);
    enganchar();
    pintarCarrito(); pintarDoc();
    setTimeout(pintarDoc, 1500);
    return true;
  }

  // ── Carrito en 2 líneas (como STUDIO) con las mismas funciones de siempre ──
  // 20-oct-2026 (dueño: «en STUDIO los artículos con IMEI tienen un ícono, es mejor»): en la línea va un botón «IMEI n»
  // (como `nxFacSerial` de STUDIO) que abre una ventanita para escanear o escribir los IMEI; la cantidad se ajusta sola.
  // Usa las mismas funciones de siempre (_rpImeiKey → _rpAgregarImei, _rpQuitarImei).
  function filaImeis(it, i) {
    if (!it.serial) return '<div class="bcpf-imei nada" aria-hidden="true">—</div>';
    var n = (it.imeis || []).length;
    return '<div class="bcpf-imei"><button type="button" class="bcpf-imeib' + (n ? '' : ' falta') + '" data-imei="' + i + '" title="Escanear o ver los IMEI">' +
      '<i class="ti ti-barcode" aria-hidden="true"></i><span>' + (n ? 'IMEI ' + n : 'Escanear IMEI') + '</span></button></div>';
  }
  function imvLista(i) {
    var s = st(), it = s && s.items[i]; if (!it) return '';
    var ims = it.imeis || [];
    return ims.length ? ims.map(function (m, k) {
      return '<span class="imc">' + esc(m) + '<button type="button" aria-label="Quitar IMEI ' + esc(m) + '" onclick="_rpQuitarImei(' + i + ',' + k + ')"><i class="ti ti-x" aria-hidden="true"></i></button></span>';
    }).join('') : '<span class="imf">Sin IMEI: no se puede facturar este equipo.</span>';
  }
  function cerrarImei() { var o = doc.getElementById('bcpfImv'); if (o) o.remove(); }
  function abrirImei(i) {
    cerrarImei();
    var s = st(), it = s && s.items[i]; if (!it || !it.serial) return;
    var o = el('div', 'bcpf-imv');
    o.id = 'bcpfImv'; o.setAttribute('data-i', i);
    o.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-label="IMEI de ' + esc(it.desc) + '">' +
      '<div class="hd"><b><i class="ti ti-barcode" aria-hidden="true"></i> IMEI · ' + esc(it.desc) + '</b><button type="button" class="vol"><i class="ti ti-arrow-left" aria-hidden="true"></i> Volver</button></div>' +
      '<p>Escanee o escriba el IMEI y presione Enter, o tóquelo en la lista. <b>La cantidad se ajusta sola.</b> El IMEI escrito se comprueba en Info Plus: tiene que existir en ' + esc(almNom()) + ' y ser de este artículo.</p>' +
      '<input id="rpImei_' + i + '" inputmode="numeric" autocomplete="off" placeholder="IMEI del equipo" aria-label="IMEI" onkeydown="_rpImeiKey(event,' + i + ')">' +
      '<div class="lst">' + imvLista(i) + '</div>' +
      '<div class="ims"><div class="imsh">Elegir de la lista</div><div class="imsl"><span class="imsv">Cargando IMEI…</span></div></div>' +
      '<div class="ft"><button type="button" class="ok">Listo</button></div></div>';
    doc.body.appendChild(o);
    cargarElegibles(i);
    o.querySelector('input').addEventListener('input', function () { pintarElegibles(); });
    o.addEventListener('click', function (e) {
      var b = e.target.closest('[data-elegir]'); if (!b) return;
      try { _rpAgregarImei(i, b.getAttribute('data-elegir'), true); } catch (er) {} // viene de Info Plus: ya comprobado
    });
    o.addEventListener('click', function (e) { if (e.target === o || e.target.closest('.vol, .ok')) cerrarImei(); });
    setTimeout(function () { var x = doc.getElementById('rpImei_' + i); if (x) x.focus(); }, 40);
  }
  function refrescarImei() {
    var o = doc.getElementById('bcpfImv'); if (!o) return;
    var l = o.querySelector('.lst'); if (l) l.innerHTML = imvLista(Number(o.getAttribute('data-i')));
    var x = o.querySelector('input'); if (x) { x.value = ''; x.focus(); } // listo para el próximo IMEI
    pintarElegibles();
  }
  // 20-oct-2026 · «Elegir de la lista». Regla del dueño: «7 almacenes, 7 iPhone, uno en cada almacén: la empleada del
  // almacén 1 solo ve el IMEI del iPhone que está en el almacén 1». La lista viene de Info Plus por la función
  // infoplus-imei-almacen (artículo + almacén de la prefactura; para las empleadas, el fijo de su sucursal). Solo trae
  // IMEI que Info Plus confirme de ESE almacén; si no lo confirma, la lista sale vacía y se escanea o escribe.
  var eleg = { clave: null, lista: [], error: '' };
  function almPf() { var a = doc.getElementById('rxAlmacen'); return a ? String(a.value || '') : ''; }
  function almNom() { try { return _rpAlmNombre(); } catch (e) { return 'este almacén'; } }
  function cargarElegibles(i) {
    var s = st(), it = s && s.items[i]; if (!it) return;
    var cod = String(it.cod), alm = almPf(), clave = cod + '@' + alm;
    if (eleg.clave === clave && !eleg.cargando && !eleg.error) { pintarElegibles(); return; }
    eleg = { clave: clave, lista: [], error: '', cargando: true };
    pintarElegibles();
    try {
      supabaseClient.functions.invoke('infoplus-imei-almacen', { body: { codarticulo: cod, codalmacen: alm } }).then(function (r) {
        if (eleg.clave !== clave) return;
        eleg.cargando = false;
        var d = r && r.data;
        if (!d || !d.ok) eleg.error = 'No se pudo consultar Info Plus. Escanee o escriba el IMEI.';
        // 22-oct-2026 · «Lista prudente»: si los IMEI de Info Plus no cuadran con la existencia por tienda, no se listan.
        else if (d.prudente === 'no_cuadra') eleg.error = 'Este equipo se ha movido entre tiendas y Info Plus no confirma cuáles IMEI están aquí. Escanee o escriba el IMEI.';
        else eleg.lista = (d.imeis || []).map(function (m) { return String(m).trim(); }).filter(Boolean);
        pintarElegibles();
      }, function () { if (eleg.clave !== clave) return; eleg.cargando = false; eleg.error = 'No se pudo consultar Info Plus. Escanee o escriba el IMEI.'; pintarElegibles(); });
    } catch (e) { eleg.cargando = false; eleg.error = 'No se pudo consultar Info Plus. Escanee o escriba el IMEI.'; pintarElegibles(); }
  }
  function pintarElegibles() {
    var o = doc.getElementById('bcpfImv'); if (!o) return;
    var box = o.querySelector('.imsl'); if (!box) return;
    var h = o.querySelector('.imsh'); if (h) h.textContent = 'IMEI en ' + almNom();
    if (eleg.cargando) { box.innerHTML = '<span class="imsv">Buscando los IMEI en ' + esc(almNom()) + '…</span>'; return; }
    if (eleg.error) { box.innerHTML = '<span class="imsv">' + esc(eleg.error) + '</span>'; return; }
    var s = st(), usados = {}; ((s && s.items) || []).forEach(function (x) { (x.imeis || []).forEach(function (m) { usados[m] = 1; }); });
    var f = ((o.querySelector('input') || {}).value || '').replace(/\D/g, '');
    var l = eleg.lista.filter(function (m) { return !usados[m] && (!f || m.indexOf(f) >= 0); });
    if (!eleg.lista.length) { box.innerHTML = '<span class="imsv">Info Plus no dio IMEI de este artículo en ' + esc(almNom()) + '. Escanee o escriba el IMEI.</span>'; return; }
    if (!l.length) { box.innerHTML = '<span class="imsv">' + (f ? 'Ningún IMEI de la lista tiene «' + esc(f) + '».' : 'Ya agregó todos los IMEI de la lista.') + '</span>'; return; }
    box.innerHTML = l.slice(0, 60).map(function (m) {
      return '<button type="button" class="imse" data-elegir="' + esc(m) + '" aria-label="Agregar IMEI ' + esc(m) + '"><i class="ti ti-plus" aria-hidden="true"></i>' + esc(m) + '</button>';
    }).join('') + (l.length > 60 ? '<span class="imsv">Mostrando 60 de ' + l.length + '. Escriba los últimos números para afinar.</span>' : '');
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#v-recepcion .bcpf-imeib');
    if (b) abrirImei(Number(b.getAttribute('data-imei')));
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarImei(); });
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
    c.innerHTML = '<div class="bcpf-items"><div class="bcpf-ith" aria-hidden="true"><span>#</span><span>Artículo</span><span>IMEI / serie</span><span>Precio</span><span>Desc.</span><span>Cant.</span><span>Importe</span><span></span></div>' + s.items.map(function (it, i) {
      var cant = it.serial
        ? '<span class="stp fijo" title="La cantidad sale del número de IMEI">' + it.cant + '</span>'
        : '<span class="stp"><button type="button" aria-label="Quitar una unidad" onclick="_rpCant(' + i + ',' + (Number(it.cant) - 1) + ')">−</button>' +
          '<input type="number" min="1" step="1" value="' + it.cant + '" aria-label="Cantidad" onchange="_rpCant(' + i + ',this.value)">' +
          '<button type="button" aria-label="Agregar una unidad" onclick="_rpCant(' + i + ',' + (Number(it.cant) + 1) + ')">+</button></span>';
      return '<div class="bcpf-it">' +
        '<span class="n">' + ('0' + (i + 1)).slice(-2) + '</span>' +
        '<div class="d"><button type="button" class="dnb" data-ver="' + i + '" title="Ver precios y cambiar la descripción">' + esc(it.desc) + '</button>' +
        '<div class="dsub"><span class="cod">' + esc(it.cod) + '</span>' + (it.servicio ? '<span class="srv">Servicio</span>' : '') + '</div></div>' +
        '<b class="imp">' + plata(importe(it)) + (Number(it.descPct) ? '<s>' + plata(Number(it.precio) * Number(it.cant)) + '</s>' : '') + '</b>' +
        '<button type="button" class="del" aria-label="Quitar ' + esc(it.desc) + '" onclick="_rpQuitar(' + i + ')"><i class="ti ti-trash" aria-hidden="true"></i></button>' +
        '<div class="l2"><label><span>Precio</span><input class="pin" inputmode="decimal" autocomplete="off" value="' + num2(it.precio) + '" aria-label="Precio" onfocus="this.select()" onchange="_rpPrecio(' + i + ',this.value)"></label>' +
        '<label class="ldc"><span>Desc.</span><span class="dcw"><input class="dc" inputmode="decimal" autocomplete="off" value="' + (Number(it.descPct) || 0) + '" aria-label="Descuento en por ciento" onfocus="this.select()" onchange="_rpDescPct(' + i + ',this.value)"><i>%</i></span></label>' +
        '<div class="lq"><span>Cant.</span>' + cant + '</div></div>' +
        filaImeis(it, i) + filaStock(it) + '</div>';
    }).join('') + '</div>';
  }

  // Clic en el nombre del artículo: sus precios por nivel (Cliente final · Por mayor · Extremo); tocar uno lo usa.
  // Aquí también se cambia la descripción (antes el nombre era un campo de texto).
  var NIV = [['1', 'Cliente final'], ['2', 'Por mayor'], ['3', 'Extremo']];
  function cerrarPop() { var p = doc.querySelector('#v-recepcion .bcpf-pop'); if (p) p.remove(); }
  function abrirPop(i, btn) {
    cerrarPop();
    var s = st(); var it = s && s.items[i]; if (!it) return;
    var nv = it.niveles || {}, act = String((s && s.nivel) || 1);
    var filas = NIV.map(function (n) {
      var v = Number(nv[n[0]]) || 0;
      return '<tr' + (n[0] === act ? ' class="act"' : '') + '><td>' + n[1] + '</td><td>' + (v > 0 ? '<button type="button" data-usar="' + v + '" aria-label="Usar ' + plata(v) + '">' + plata(v) + '</button>' : '—') + '</td></tr>';
    }).join('');
    var pop = el('div', 'bcpf-pop', '<div class="pph"><b>' + esc(it.desc) + '</b><span>' + esc(it.cod) + '</span></div>' +
      (it.niveles ? '<table><tbody>' + filas + '</tbody></table><p class="ppx">Toque un precio para usarlo en esta línea.</p>' : '') +
      '<label class="ppd"><span>Descripción</span><input value="' + esc(it.desc) + '" autocomplete="off"></label>');
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Precios de ' + it.desc);
    btn.parentElement.appendChild(pop);
    pop.addEventListener('click', function (e) {
      var u = e.target.closest('[data-usar]'); if (!u) return;
      cerrarPop(); try { _rpPrecio(i, u.getAttribute('data-usar')); } catch (er) {}
    });
    var inp = q('.ppd input', pop);
    inp.addEventListener('change', function () { try { _rpDesc(i, inp.value); } catch (er) {} pintarCarrito(); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#v-recepcion .dnb');
    if (b) { var abierta = b.parentElement.querySelector('.bcpf-pop'); if (abierta) cerrarPop(); else abrirPop(Number(b.getAttribute('data-ver')), b); return; }
    if (!(e.target.closest && e.target.closest('.bcpf-pop'))) cerrarPop();
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarPop(); });

  // ── Cabecera, cliente, totales y barra ──
  function iniciales(n) { var p = String(n || '').trim().split(/\s+/).filter(Boolean); return ((p[0] || '')[0] || '').toUpperCase() + ((p[1] || '')[0] || '').toUpperCase(); }
  function pintarDoc() {
    var s = st(); if (!R.num) return;
    // El aviso «usuario no enlazado» lo crea _rpInit junto al vendedor: va debajo, a todo el ancho
    var av = doc.getElementById('rxVendAviso'); if (av && R.qrow && av.parentElement !== R.qrow) { av.classList.add('bcpf-vaviso'); R.qrow.appendChild(av); }
    var items = (s && s.items) || [];
    var tt = tot(items), total = tt.total;
    var unidades = items.reduce(function (a, it) { return a + Number(it.cant); }, 0);
    // Nº y estado
    R.num.textContent = (s && s.codprefactura) ? String(s.codprefactura) : 'Nueva';
    R.num.classList.toggle('nueva', !(s && s.codprefactura));
    // Estado corto (dueño: «quitar "pendiente de crear", solo "crear", y ponlo smart»): punto de color + una palabra
    var est = (s && s.estado) || 'pendiente';
    var EST = { pendiente: ['crear', 'Crear'], cambios: ['cambios', 'Cambios sin enviar'], sincronizada: ['ok', 'En Info Plus'], actualizando: ['act', 'Actualizando…'], error: ['err', 'Error'], facturada: ['fact', 'Facturada'] };
    var e2 = EST[est] || EST.pendiente;
    R.est.innerHTML = '<span class="bcpf-est ' + e2[0] + '"><i aria-hidden="true"></i>' + e2[1] + '</span>';
    // Cliente
    var info = s && s.codcliente && String(s.codcliente) !== '1';
    var nombre = val('c_nombre') || (info ? s.infoNombre : '') || 'CONTADO: 1';
    R.pnom.textContent = nombre;
    // Como STUDIO: código y documento en una línea; teléfono y dirección (de Info Plus) en otra
    var ip = info ? ((cache && cache.infoplusClientes) || []).find(function (c) { return String(c.codcliente) === String(s.codcliente); }) || {} : {};
    var l1 = [info ? 'Cód. ' + s.codcliente : '', (val('c_cedula') || ip.cedula) ? 'Céd. ' + (val('c_cedula') || ip.cedula) : ((val('c_rnc') || ip.rnc) ? 'RNC ' + (val('c_rnc') || ip.rnc) : '')].filter(Boolean).join(' · ');
    var l2 = [val('c_whatsapp') || ip.telefono, ip.direccion].filter(Boolean).join(' · ');
    R.pdet.innerHTML = esc(l1) + (l2 ? '<span class="pdet2">' + esc(l2) + '</span>' : '');
    var ini = (val('c_nombre') || info) ? iniciales(nombre) : '';
    R.pav.innerHTML = ini ? esc(ini) : '<i class="ti ti-user"></i>';
    // Datos adicionales (resumen en una línea)
    var sel = function (id) { var e = doc.getElementById(id); return e && e.selectedIndex >= 0 ? (e.options[e.selectedIndex].textContent || '').trim() : ''; };
    var tec = sel('rxTecnico').replace(/^[—–-]\s*|\s*[—–-]$/g, ''); if (/^sin asignar$/i.test(tec)) tec = 'Sin técnico';
    var equipo = [val('e_marca'), val('e_modelo')].filter(Boolean).join(' ');
    var falla = val('o_falla');
    // Si se empezó a llenar el equipo, la orden pide nombre, WhatsApp y modelo: se marcan y se dice qué falta
    var conEq = !!(val('e_marca') || val('e_modelo') || val('e_imei'));
    ['c_nombre', 'c_whatsapp', 'e_modelo'].forEach(function (id) { var e = doc.getElementById(id), d = e && (e.closest('.bcpf-campos > div') || e.parentElement), l = d && d.querySelector('label'); if (l) l.classList.toggle('bcpf-req', conEq); });
    var faltan = conEq ? [!val('c_nombre') && 'nombre', !val('c_whatsapp') && 'WhatsApp', !val('e_modelo') && 'modelo'].filter(Boolean) : [];
    if (R.res) {
      R.res.classList.toggle('falta', faltan.length > 0);
      R.res.textContent = faltan.length ? 'Para la orden falta: ' + faltan.join(', ') : (equipo || falla ? [equipo, falla, tec !== 'Sin técnico' ? tec : ''].filter(Boolean).join(' · ') : '');
    }
    // Se abre solo si ya trae equipo o falla (por ejemplo, al crear la prefactura desde una orden)
    if (R.mas && !R.mas.dataset.tocado && (equipo || falla || val('e_imei'))) R.mas.open = true;
    if (R.com && !R.com.dataset.abierto && val('o_observaciones')) { R.com.open = true; R.com.dataset.abierto = '1'; }
    // Totales
    R.cnt.textContent = items.length ? items.length + (items.length === 1 ? ' artículo' : ' artículos') + ' · ' + unidades + (unidades === 1 ? ' unidad' : ' unidades') : '';
    R.tArt.textContent = String(unidades);
    R.tSub.textContent = plata(tt.subtotal); R.tTot.textContent = plata(total); R.bn.textContent = plata(total);
    var dl = tt.descLineas != null ? tt.descLineas : tt.descuento, dm = tt.descMonto || 0;
    R.tDesF.hidden = !(dl > 0); R.tDes.textContent = '− ' + plata(dl);
    var facturada = s && s.estado === 'facturada';
    if (R.tDm && doc.activeElement !== R.tDm) R.tDm.value = dm > 0 ? num2(dm) : '';
    if (R.tDmF) R.tDmF.hidden = !!facturada && !(dm > 0);
    R.tInfo.innerHTML = facturada ? '<div class="t-fac">Esta prefactura ya fue convertida en factura y no puede modificarse.</div>'
      : (s && s.codprefactura ? 'Prefactura Nº <b>' + esc(s.codprefactura) + '</b> en Info Plus' +
        // 22-oct-2026 (dueño): Info Plus no toma cambios de descuento ni de comentario en una prefactura ya enviada.
        '<div class="t-aviso"><i class="ti ti-alert-triangle" aria-hidden="true"></i> Esta prefactura no se modificará en Info Plus. Los cambios quedan solo en este sistema.</div>'
        : 'No cobra ni descuenta inventario: se factura en Info Plus.');
    R.bar.querySelector('.bimp').hidden = !(s && s.codprefactura);
    R.bar.querySelector('.bg').hidden = !!facturada; R.bar.querySelector('.bgi').hidden = !!facturada;
    // 23-oct-2026 (dueño: «cuando pongo descuento el botón de guardar e imprimir desaparece»): al cambiar precio,
    // cantidad o descuento se redibuja el carrito y el campo con el foco desaparece sin avisar (el navegador no manda
    // focusout), así que la barra se quedaba escondida. Después de cada pintado se vuelve a mirar quién tiene el foco.
    if (R.bar.classList.contains('bcpf-oculta')) { var af = doc.activeElement; if (!af || !doc.getElementById('v-recepcion').contains(af) || !af.matches('input,textarea,select')) R.bar.classList.remove('bcpf-oculta'); }
    R.bar.querySelector('.bfin').hidden = !facturada;
  }

  // «Nueva» / F10: empieza otra prefactura (pregunta si hay algo escrito)
  async function nueva() {
    var s = st();
    var hay = (s && s.items && s.items.length) || ['c_nombre', 'c_whatsapp', 'e_marca', 'e_modelo', 'e_imei', 'o_falla', 'o_observaciones'].some(val);
    if (hay && !(s && s.codprefactura && s.estado === 'sincronizada')) {
      var ok = true; try { ok = await confirmar('¿Empezar una prefactura nueva?\n\nSe borra lo que no se ha guardado.'); } catch (e) { ok = confirm('¿Empezar una prefactura nueva?'); }
      if (!ok) return;
    }
    try { limpiarRecepcion(); } catch (e) {}
    try { _rpInit(); } catch (e) {}
    if (R.mas) { R.mas.open = false; delete R.mas.dataset.tocado; }
    if (R.com) { R.com.open = false; delete R.com.dataset.abierto; }
    pintarCarrito(); pintarDoc();
    var sc = doc.querySelector('#v-recepcion .bcpf-doc'); if (sc) sc.scrollIntoView({ block: 'start' });
  }

  // 21-oct-2026 (dueño, «Limpiar sola»): al guardar una prefactura SOLO de artículos, la pantalla queda lista para la siguiente.
  // Se conservan el almacén y el vendedor; «Facturar a» vuelve a CONTADO (1). La guardada se vuelve a ver con la lupa.
  // Con equipo no se toca: guardarRecepcion ya limpia y lleva a Órdenes.
  function limpiarTrasGuardar(num, eraUpdate) {
    var alm = val('rxAlmacen'), ven = val('rxVendedor');
    try { limpiarRecepcion(); } catch (e) {}
    try { _rpInit(); } catch (e) {}
    [['rxAlmacen', alm], ['rxVendedor', ven]].forEach(function (p) {
      var el = doc.getElementById(p[0]); if (!el || !p[1] || el.value === p[1]) return;
      if (![].some.call(el.options || [], function (o) { return o.value === p[1]; })) return;
      el.value = p[1]; el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (R.mas) { R.mas.open = false; delete R.mas.dataset.tocado; }
    if (R.com) { R.com.open = false; delete R.com.dataset.abierto; }
    pintarCarrito(); pintarDoc();
    var sc = doc.querySelector('#v-recepcion .bcpf-doc'); if (sc) sc.scrollIntoView({ block: 'start' });
    try { toast('✅ Prefactura Nº ' + num + ' ' + (eraUpdate ? 'actualizada' : 'creada') + ' en Info Plus. Lista para la siguiente.'); } catch (e) {}
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
      var envC = function () { pintarCarrito(); pintarDoc(); refrescarImei(); };
      envC._bcpf = true; window._rpRenderCart = envC;
    }
    if (typeof window._rpGuardar === 'function' && !window._rpGuardar._bcpf) {
      var origG = window._rpGuardar;
      var envG = async function (imp) {
        var s0 = st(), antes = s0 && s0.codprefactura, conEquipo = !!(val('e_marca') || val('e_modelo') || val('e_imei'));
        var soloPref = !!(s0 && s0.soloPrefactura);
        var r = await origG.apply(this, arguments);
        try {
          var s = st();
          if ((soloPref || !conEquipo) && s && s.estado === 'sincronizada' && s.codprefactura && (s.items || []).length) {
            var num = s.codprefactura, eraUpdate = !!antes;
            setTimeout(function () { limpiarTrasGuardar(num, eraUpdate); }, imp ? 600 : 0); // deja salir la impresión primero
          }
        } catch (e) {}
        return r;
      };
      envG._bcpf = true; window._rpGuardar = envG;
    }
    if (typeof window._rpRenderResumen === 'function' && !window._rpRenderResumen._bcpf) {
      var orig = window._rpRenderResumen;
      var envR = function () { var r = orig.apply(this, arguments); try { pintarDoc(); } catch (e) {} return r; };
      envR._bcpf = true; window._rpRenderResumen = envR;
    }
    if (typeof window._rpAgregarArticulo === 'function' && !window._rpAgregarArticulo._bcpf) {
      var origA = window._rpAgregarArticulo;
      var envA = async function (a) {
        var r = await origA.apply(this, arguments);
        try {
          var s = st(), i = s && a ? s.items.findIndex(function (x) { return String(x.cod) === String(a.codigo) && !x.servicio; }) : -1;
          if (i >= 0 && s.items[i].serial) setTimeout(function () { abrirImei(i); }, 80);
        } catch (e) {}
        return r;
      };
      envA._bcpf = true; window._rpAgregarArticulo = envA;
    }
    if (typeof window._rpCliElegir === 'function' && !window._rpCliElegir._bcpf) {
      var origC = window._rpCliElegir;
      var envE = function (cod) { var r = origC.apply(this, arguments); try { nivelDesdeCliente(cod); pintarDoc(); } catch (e) {} return r; };
      envE._bcpf = true; window._rpCliElegir = envE;
    }
  }

  // Buscador como ventana emergente: la ✕ con ícono de cerrar, tocar el fondo cierra y en la PC se mueve arrastrando la barra.
  new MutationObserver(function () {
    var x = doc.querySelector('#v-recepcion .bcrx-ppk-x:not([data-bcpf])');
    if (x) { x.setAttribute('data-bcpf', '1'); x.innerHTML = '<i class="ti ti-x" aria-hidden="true"></i>'; x.setAttribute('aria-label', 'Cerrar'); }
  }).observe(doc.documentElement, { childList: true, subtree: true });
  doc.addEventListener('click', function (e) {
    var s = e.target && e.target.classList && e.target.classList.contains('bcrx-ppk-slot') ? e.target : null;
    if (s && s.closest('#v-recepcion') && s.querySelector('.bcrx-ppk')) { var x = s.querySelector('.bcrx-ppk-x'); if (x) x.click(); }
  });
  // Temática NEXUS: las filas entran en cascada al escribir, no al moverse con flechas ni al tocar una fila.
  doc.addEventListener('keydown', function (e) {
    var w = e.target.closest && e.target.closest('#v-recepcion .bcrx-ppk'); if (!w) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') w.classList.add('quieto');
  }, true);
  doc.addEventListener('input', function (e) { var w = e.target.closest && e.target.closest('#v-recepcion .bcrx-ppk'); if (w) w.classList.remove('quieto'); }, true);
  doc.addEventListener('pointerdown', function (e) { var r = e.target.closest && e.target.closest('#v-recepcion .bcrx-ppk-row'); if (r) r.closest('.bcrx-ppk').classList.add('quieto'); }, true);
  doc.addEventListener('pointerdown', function (e) {
    var top = e.target.closest && e.target.closest('#v-recepcion .bcrx-ppk-top');
    if (!top || e.button !== 0 || e.target.closest('button') || matchMedia('(max-width: 760px)').matches) return;
    var win = top.closest('.bcrx-ppk'); if (!win) return;
    e.preventDefault(); top.setPointerCapture(e.pointerId);
    var dx = Number(win.dataset.dx || 0), dy = Number(win.dataset.dy || 0), x0 = e.clientX - dx, y0 = e.clientY - dy;
    var r = win.getBoundingClientRect(), bx = r.left - dx, by = r.top - dy;
    function mover(ev) {
      dx = Math.min(innerWidth - 80 - bx, Math.max(-bx - r.width + 120, ev.clientX - x0));
      dy = Math.min(innerHeight - 60 - by, Math.max(-by, ev.clientY - y0));
      win.dataset.dx = dx; win.dataset.dy = dy; win.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    }
    function soltar() { top.removeEventListener('pointermove', mover); top.removeEventListener('pointerup', soltar); top.removeEventListener('pointercancel', soltar); top.classList.remove('arr'); }
    top.classList.add('arr'); top.addEventListener('pointermove', mover); top.addEventListener('pointerup', soltar); top.addEventListener('pointercancel', soltar);
  });

  window.bcPfPintar = function () { pintarCarrito(); pintarDoc(); };
  if (!organizar()) {
    var mo = new MutationObserver(function () { if (organizar()) mo.disconnect(); });
    mo.observe(doc.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 20000);
  }
})();
