/* BAYOL CELL · Recepción organizada (19-oct-2026, pedido del dueño: «organizar la ventana de recepción y prefactura»).
   Decisiones del dueño: orden según el trabajo, prefactura siempre a la vista, Herramientas rápidas se quedan arriba.
   · Orden: 1 Cliente → 2 Equipo → 3 Falla y diagnóstico (con «Fallas del equipo» y «Seguridad del dispositivo» dentro)
     → 4 Artículos y servicios → 5 Datos adicionales (plegado, con un resumen de lo elegido).
   · Celular/tablet: barra fija abajo con el total, «Guardar» y «Guardar e imprimir» (tocan los mismos botones de la
     prefactura, así que la lógica es la de siempre); «Ver detalle» baja a la prefactura. Se oculta mientras se escribe.
   · Solo mueve elementos que ya existen (mismos id, mismos onclick). No toca _rpGuardar ni Info Plus.
   · Capa reversible: sin html.bc-rx no hace nada. Apagar: BC_RX=false, o localStorage bc_rx_off='1' en un equipo. */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-rx')) return;

  function q(sel, root) { return (root || doc).querySelector(sel); }
  function txt(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  // Con la pantalla «Prefactura» estilo STUDIO (html.bc-pf, taller-prefactura.js) esta capa solo presta su buscador.
  var PF = doc.documentElement.classList.contains('bc-pf');
  function organizar() {
    if (PF) return true;
    var v = doc.getElementById('v-recepcion');
    if (!v || v.dataset.bcRx === '1') return !!v;
    var cols = q('.rx-cols', v);
    var cards = cols ? Array.prototype.slice.call(cols.children).filter(function (c) { return c.classList.contains('rx-card'); }) : [];
    if (cards.length < 4) return false;
    var cli = cards[0], equ = cards[1], adi = cards[2], fal = cards[3];
    var art = cols.parentElement && Array.prototype.slice.call(cols.parentElement.children).filter(function (c) { return c !== cols && c.classList.contains('rx-card'); })[0];
    if (!art) return false;
    v.dataset.bcRx = '1';

    cli.classList.add('bcrx-cli'); equ.classList.add('bcrx-equ'); fal.classList.add('bcrx-fal');
    art.classList.add('bcrx-art'); adi.classList.add('bcrx-adi');

    // 3 · Falla y diagnóstico: título nuevo y, dentro, las fallas marcables y la seguridad del dispositivo
    var hf = q('.rx-head', fal);
    if (hf) { var n = hf.childNodes; for (var i = 0; i < n.length; i++) { if (n[i].nodeType === 3 && /Diagn/.test(n[i].nodeValue)) { n[i].nodeValue = ' Falla y diagnóstico'; break; } } }
    var bodyF = q('.rx-body', fal);
    var seg = q('.rx-seg', v);
    var chk = doc.getElementById('checksFisico');
    var fallasCard = chk ? chk.closest('.card') : null;
    [fallasCard, seg].forEach(function (c) { if (c && bodyF) { c.classList.add('bcrx-dentro'); bodyF.appendChild(c); } });

    // 5 · Datos adicionales: va después de Artículos y queda plegado con un resumen
    art.parentNode.insertBefore(adi, art.nextSibling);
    adi.classList.add('bcrx-plegada');
    var ha = q('.rx-head', adi);
    if (ha) {
      var res = doc.createElement('span'); res.className = 'bcrx-resumen'; ha.insertBefore(res, q('.rx-num', ha));
      ha.setAttribute('role', 'button'); ha.setAttribute('tabindex', '0'); ha.setAttribute('aria-expanded', 'false');
      var alternar = function () { var p = adi.classList.toggle('bcrx-plegada'); ha.setAttribute('aria-expanded', p ? 'false' : 'true'); };
      ha.addEventListener('click', alternar);
      ha.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } });
      var pintar = function () {
        var sel = function (id) { var s = doc.getElementById(id); return s && s.selectedIndex >= 0 ? txt(s.options[s.selectedIndex]) : ''; };
        var tec = sel('rxTecnico').replace(/^[—–-]\s*|\s*[—–-]$/g, '');
        if (/^sin asignar$/i.test(tec)) tec = 'Sin técnico';
        var alm = doc.getElementById('rxAlmacen'), almFuera = alm && alm.parentElement.classList.contains('bcrx-alm');
        var partes = [tec, sel('o_prioridad'), almFuera ? '' : sel('rxAlmacen'), sel('rxVendedor')].filter(Boolean);
        res.textContent = partes.join(' · ');
      };
      adi.addEventListener('change', pintar); pintar(); setTimeout(pintar, 1500);
    }

    // Números de los pasos
    [[cli, 1], [equ, 2], [fal, 3], [art, 4], [adi, 5]].forEach(function (p) { var b = q('.rx-num', p[0]); if (b) b.textContent = p[1]; });

    barra(v);
    buscadorArticulos(v, art);
    almacenAdmin();
    return true;
  }

  // El administrador trabaja en distintas sucursales (dueño 19-oct-2026): para él, el «Almacén» sale de «Datos
  // adicionales» y va arriba de «Artículos», a la vista (la existencia que se ve depende de ese almacén).
  // Las empleadas lo siguen teniendo automático según su sucursal. Lo llama también _rpInit (por si se entra después).
  function almacenAdmin() {
    if (PF) return;
    var v = doc.getElementById('v-recepcion'), s = doc.getElementById('rxAlmacen');
    var art = v && q('.bcrx-art', v); if (!s || !art) return;
    var campo = s.parentElement, admin = false;
    try { admin = typeof isAdminUser === 'function' && isAdminUser(); } catch (e) {}
    var arriba = campo.classList.contains('bcrx-alm');
    if (admin && !arriba) {
      campo._casa = campo.parentElement; campo._sig = campo.nextSibling;
      var ref = q('.bcrx-ppk-slot', art) || q('.rx-art-search', art); if (!ref) return;
      campo.classList.add('bcrx-alm'); ref.parentNode.insertBefore(campo, ref);
    } else if (!admin && arriba && campo._casa) {
      campo.classList.remove('bcrx-alm'); campo._casa.insertBefore(campo, campo._sig);
    }
  }
  window.bcRxAlmacenAdmin = almacenAdmin;

  // ── Pestaña «Buscar o escanear» (igual a la de Prefactura en STUDIO) ──
  // Una barra que, al tocarla, se convierte en un panel en línea con buscador y lista Código · Artículo · Existencia ·
  // Precio · «+». Agregar usa _rpAgregarArticulo (la misma función del buscador grande: precio por nivel, existencia
  // en vivo, IMEI para celulares). «Catálogo completo» abre el buscador grande de siempre (filtros y sincronizar).
  var MAXF = 60;
  function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { try { return money(n); } catch (e) { return 'RD$ ' + Number(n || 0).toFixed(2); } }
  function buscadorArticulos(v, art) {
    var zona = q('.rx-art-search', art); if (!zona || typeof _rpAgregarArticulo !== 'function') return;
    var bArt = zona.querySelector('button[onclick^="_rpAgregar()"]');
    var bSrv = zona.querySelector('button[onclick^="_rpAgregarServicio"]');
    if (bArt) bArt.classList.add('bcrx-oculto');
    if (bSrv) { bSrv.classList.add('bcrx-srv'); bSrv.innerHTML = '<i class="ti ti-tool"></i> Servicio / falla'; }
    var slot = doc.createElement('div'); slot.className = 'bcrx-ppk-slot';
    zona.parentNode.insertBefore(slot, zona);
    var estado = { q: '', hl: 0, lista: [], det: -1 };
    function barraHTML() {
      return '<button type="button" class="bcrx-scan" aria-label="Buscar artículo"><i class="ti ti-scan" aria-hidden="true"></i>' +
        '<span>Buscar o escanear por nombre, código o IMEI</span><kbd>F2</kbd></button>';
    }
    function cerrarPanel() { slot.innerHTML = barraHTML(); q('.bcrx-scan', slot).addEventListener('click', abrirPanel); }
    function nivel() { try { return String((_rpState && _rpState.nivel) || 1); } catch (e) { return '1'; } }
    function almacen() { var s = doc.getElementById('rxAlmacen'); return (s && s.value) || '1'; }
    function precioDe(a) { var nv = nivel(); if (a.niveles && a.niveles[nv] != null) return Number(a.niveles[nv]); if (a.niveles && a.niveles['1'] != null) return Number(a.niveles['1']); return Number(a.precio || 0); }
    function esServ(a) { return String(a.codigo) === '1121' || /^SERVICIO\b/i.test(String(a.descripcion || '').trim()); }
    function existe(a) { if (esServ(a)) return null; var ex = (a.existencias && typeof a.existencias === 'object') ? a.existencias : null; return ex ? (Number(ex[almacen()]) || 0) : null; }
    // Detalle del artículo al tocar la fila, igual que STUDIO (dueño 19-oct-2026: «qué formato tenemos en studio, podemos
    // usar lo mismo»): recuadros con los precios de cada nivel lado a lado (el del cliente resaltado), existencia y
    // «Elegir — RD$ …». El mínimo no se puede mostrar: la API de Info Plus solo entrega el precio de cada nivel.
    var NIV = [['1', 'Cliente final'], ['2', 'Por mayor'], ['3', 'Extremo']];
    // 20-oct-2026 (dueño: «como STUDIO exactamente»): un recuadro por cada nivel (— si no tiene precio) y la existencia
    // de cada almacén en fichas, como ppkDetailHTML de STUDIO.
    function detalleHTML(a, i) {
      var nv = a.niveles || {}, act = nivel(), pr = precioDe(a);
      var cajas = NIV.map(function (n) {
        var v = Number(nv[n[0]]) || 0;
        return '<div class="pk-nv' + (n[0] === act ? ' act' : '') + (v > 0 ? '' : ' no') + '"><small>' + n[1] + '</small><b>' + (v > 0 ? plata(v) : '—') + '</b></div>';
      }).join('');
      var ex = (a.existencias && typeof a.existencias === 'object') ? a.existencias : {};
      var alms = (typeof INFOPLUS_ALMACENES !== 'undefined') ? INFOPLUS_ALMACENES : {};
      var fichas = esServ(a) ? '<span class="pk-ex">Servicio</span>' : Object.keys(alms).map(function (c) {
        var n = Number(ex[c]) || 0;
        return '<span class="pk-ex' + (n > 0 ? '' : ' out') + (c === almacen() ? ' aqui' : '') + '">' + esc(alms[c]) + ': <b>' + n + '</b></span>';
      }).join('');
      return '<div class="bcrx-ppk-det" data-det="' + i + '">' +
        '<div class="pk-nvs">' + cajas + '</div>' +
        '<div class="pk-dex"><span>Existencia</span>' + fichas + '</div>' +
        '<button type="button" class="pk-elegir" data-i="' + i + '"><i class="ti ti-circle-plus" aria-hidden="true"></i> Elegir — ' + (pr > 0 ? plata(pr) : 'sin precio') + '</button></div>';
    }
    function clienteHTML() {
      try {
        if (!_rpState || !_rpState.codcliente || String(_rpState.codcliente) === '1') return '';
        var nom = (doc.getElementById('c_nombre') || {}).value || _rpState.infoNombre || ('Cliente ' + _rpState.codcliente);
        var n = NIV.filter(function (x) { return x[0] === nivel(); })[0];
        return '<div class="bcrx-ppk-cli"><i class="ti ti-user" aria-hidden="true"></i> ' + esc(nom) + ' — ' + esc(n ? n[1] : 'Nivel ' + nivel()) + ' (se carga solo)</div>';
      } catch (e) { return ''; }
    }
    function esCel(a) { try { return _abCat(a.descripcion) === 'celular'; } catch (e) { return false; } }
    function filtrar() {
      var arts = (typeof cache !== 'undefined' && cache.infoplusArticulos) || [];
      var qq = norm(estado.q).trim(), pal = qq.split(/\s+/).filter(Boolean);
      var l = arts;
      if (pal.length) l = arts.filter(function (a) { var h = norm([a.codigo, a.descripcion, a.marca, a.referencia, a.referencia_fabrica].filter(Boolean).join(' ')); return pal.every(function (p) { return h.indexOf(p) >= 0; }); });
      l = l.slice().sort(function (x, y) {
        if (qq) { var cx = String(x.codigo) === qq, cy = String(y.codigo) === qq; if (cx !== cy) return cx ? -1 : 1; }
        var ex = (existe(x) || 0) > 0, ey = (existe(y) || 0) > 0; if (ex !== ey) return ex ? -1 : 1;
        return String(x.descripcion || '').localeCompare(String(y.descripcion || ''));
      });
      estado.lista = l; estado.hl = 0; estado.det = -1;
    }
    function pintar() {
      var cont = q('.bcrx-ppk-list', slot); if (!cont) return;
      var arts = (typeof cache !== 'undefined' && cache.infoplusArticulos) || [];
      if (!arts.length) { cont.innerHTML = '<div class="bcrx-ppk-vacio">' + ((typeof _infoplusCargando !== 'undefined' && _infoplusCargando) ? 'Cargando artículos de Info Plus…' : 'No hay artículos cargados. Use «Catálogo completo» para sincronizar.') + '</div>'; return; }
      var l = estado.lista, show = l.slice(0, MAXF);
      var filas = show.map(function (a, i) {
        var ex = existe(a), pr = precioDe(a);
        var chip = esServ(a) ? '<span class="bcrx-stk srv">Servicio</span>' : ex === null ? '<span class="bcrx-stk">—</span>' : ex <= 0 ? '<span class="bcrx-stk out">Sin stock</span>' : '<span class="bcrx-stk">Stock: ' + ex + '</span>';
        // Como STUDIO: si al cliente le toca otro nivel, el precio de lista (nivel 1) sale tachado encima
        var lis = a.niveles && a.niveles['1'] != null ? Number(a.niveles['1']) : Number(a.precio || 0);
        var preH = pr > 0 ? ((lis > 0 && Math.abs(lis - pr) > 0.5) ? '<s>' + plata(lis) + '</s>' : '') + plata(pr) : '<span class="bcrx-stk out">Sin precio</span>';
        return '<div class="bcrx-ppk-row' + (i === estado.hl ? ' hl' : '') + (estado.det === i ? ' abierta' : '') + (ex !== null && ex <= 0 ? ' sin' : '') + '" role="option" data-fila="' + i + '" aria-expanded="' + (estado.det === i) + '" title="Ver precios y existencia">' +
          '<span class="pk-cod">' + esc(a.codigo) + '</span>' +
          '<span class="pk-nom"><span class="pk-dtx">' + esc((a.descripcion || '').trim()) + (esCel(a) ? ' <span class="pk-tag">IMEI</span>' : '') + '</span>' + (a.marca ? '<small>' + esc(a.marca) + '</small>' : '') + '</span>' +
          '<span class="pk-stk">' + chip + '</span>' +
          '<span class="pk-pre">' + preH + '</span>' +
          '<button type="button" class="pk-add" data-i="' + i + '" aria-label="Agregar ' + esc((a.descripcion || '').trim()) + '"><i class="ti ti-plus" aria-hidden="true"></i></button></div>' +
          (estado.det === i ? detalleHTML(a, i) : '');
      }).join('');
      cont.innerHTML = (l.length > MAXF ? '<div class="bcrx-ppk-mas">Mostrando ' + MAXF + ' de ' + l.length.toLocaleString('es-DO') + ' — escriba para afinar</div>' : '') +
        (filas ? '<div class="bcrx-ppk-head" aria-hidden="true"><span>Código</span><span>Artículo</span><span>Existencia</span><span>Precio</span><span></span></div>' + filas
          : '<div class="bcrx-ppk-vacio">Sin resultados para «' + esc(estado.q) + '».</div>');
    }
    var agregando = false;
    function agregar(i) {
      var a = estado.lista[i]; if (!a || agregando) return;
      agregando = true;
      Promise.resolve(_rpAgregarArticulo(a)).then(function (ok) { agregando = false; if (ok) cerrarPanel(); }, function () { agregando = false; });
    }
    function abrirPanel() {
      slot.innerHTML = '<div class="bcrx-ppk" role="dialog" aria-label="Buscar artículo">' +
        '<div class="bcrx-ppk-top"><span class="t"><i class="ti ti-search" aria-hidden="true"></i> Buscar artículo</span>' +
        '<button type="button" class="bcrx-ppk-cat">Catálogo completo</button><button type="button" class="bcrx-ppk-x" aria-label="Cerrar"><i class="ti ti-arrow-left" aria-hidden="true"></i> Cerrar</button></div>' +
        '<div class="bcrx-ppk-inp"><i class="ti ti-scan" aria-hidden="true"></i><input type="search" data-bcbp-no autocomplete="off" enterkeyhint="search" placeholder="Nombre, código, marca o IMEI…" aria-label="Buscar artículo"></div>' + clienteHTML() +
        '<div class="bcrx-ppk-list" role="listbox"></div></div>';
      var inp = q('input', slot);
      inp.value = estado.q;
      inp.addEventListener('input', function () { estado.q = inp.value; filtrar(); pintar(); });
      inp.addEventListener('keydown', function (e) {
        var n = Math.min(estado.lista.length, MAXF);
        if (e.key === 'ArrowDown') { e.preventDefault(); estado.hl = Math.min(estado.hl + 1, n - 1); pintar(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); estado.hl = Math.max(estado.hl - 1, 0); pintar(); }
        else if (e.key === 'Enter') { e.preventDefault(); if (n) agregar(estado.hl); }
        else if (e.key === 'Escape') { e.preventDefault(); cerrarPanel(); }
      });
      q('.bcrx-ppk-x', slot).addEventListener('click', cerrarPanel);
      q('.bcrx-ppk-cat', slot).addEventListener('click', function () { cerrarPanel(); try { _rpAgregar(); } catch (e) {} });
      q('.bcrx-ppk-list', slot).addEventListener('click', function (e) {
        var b = e.target.closest('.pk-add, .pk-elegir'); if (b) { agregar(Number(b.getAttribute('data-i'))); return; }
        var f = e.target.closest('[data-fila]'); if (!f) return;
        var i = Number(f.getAttribute('data-fila')); estado.det = estado.det === i ? -1 : i; estado.hl = i; pintar();
      });
      filtrar(); pintar();
      setTimeout(function () { inp.focus(); }, 40);
      if (typeof _ensureInfoplusArticulos === 'function') Promise.resolve(_ensureInfoplusArticulos()).then(function () { if (q('.bcrx-ppk', slot)) { filtrar(); pintar(); } });
    }
    cerrarPanel();
    // Si cambia el precio del cliente con el panel abierto, se repinta (precio y nivel resaltado)
    doc.addEventListener('change', function (e) { if (e.target && e.target.id === 'rxNivel' && q('.bcrx-ppk', slot)) setTimeout(pintar, 0); });
    // Tocar fuera del panel lo cierra (el texto buscado se recuerda)
    doc.addEventListener('click', function (e) { if (q('.bcrx-ppk', slot) && !slot.contains(e.target) && doc.contains(e.target)) cerrarPanel(); }, true);
    // F2 abre la búsqueda (como en STUDIO), solo con Recepción en pantalla
    doc.addEventListener('keydown', function (e) { if (e.key === 'F2' && v.classList.contains('active')) { e.preventDefault(); if (!q('.bcrx-ppk', slot)) abrirPanel(); else q('input', slot).focus(); } });
  }

  window.bcRxBuscador = buscadorArticulos;

  // Barra fija de la prefactura (celular y tablet)
  function barra(v) {
    var res = doc.getElementById('rxResumen'); if (!res) return;
    var b = doc.createElement('div'); b.className = 'bcrx-barra'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Prefactura');
    b.innerHTML = '<button type="button" class="bcrx-total" aria-label="Ver el detalle de la prefactura"><span class="bcrx-total-lbl">Total</span><b class="bcrx-total-num">RD$ 0.00</b><span class="bcrx-ver">Ver detalle</span></button>' +
      '<div class="bcrx-acc"><button type="button" class="bcrx-g">Guardar</button><button type="button" class="bcrx-gi" aria-label="Guardar e imprimir">Imprimir</button></div>' +
      '<div class="bcrx-nota" hidden></div>';
    v.appendChild(b); v.classList.add('bcrx-con-barra');
    var num = q('.bcrx-total-num', b), acc = q('.bcrx-acc', b), nota = q('.bcrx-nota', b);
    function copiar() {
      var filas = res.querySelectorAll('.rx-sum-row'), tot = null;
      for (var i = 0; i < filas.length; i++) { if (txt(filas[i].firstElementChild) === 'Total') tot = filas[i]; }
      num.textContent = tot ? txt(tot.lastElementChild) || 'RD$ 0.00' : 'RD$ 0.00';
      var g = res.querySelector('.rx-btn-red');
      acc.hidden = !g; nota.hidden = !!g;
      if (!g) nota.textContent = 'Ya facturada';
    }
    new MutationObserver(copiar).observe(res, { childList: true, subtree: true, characterData: true });
    copiar();
    q('.bcrx-g', b).addEventListener('click', function () { var x = res.querySelector('.rx-btn-red'); if (x) x.click(); });
    q('.bcrx-gi', b).addEventListener('click', function () { var x = res.querySelector('.rx-btn-dark'); if (x) x.click(); });
    q('.bcrx-total', b).addEventListener('click', function () {
      var side = q('.rx-side', v); if (!side) return;
      var r = matchMedia('(prefers-reduced-motion: reduce)').matches;
      side.scrollIntoView({ behavior: r ? 'auto' : 'smooth', block: 'start' });
    });
    // Mientras se escribe (teclado del celular abierto) la barra se esconde para no tapar el campo
    v.addEventListener('focusin', function (e) { if (e.target.matches('input,textarea,select')) b.classList.add('bcrx-oculta'); });
    v.addEventListener('focusout', function () { setTimeout(function () { var a = doc.activeElement; if (!a || !v.contains(a) || !a.matches('input,textarea,select')) b.classList.remove('bcrx-oculta'); }, 60); });
  }

  if (!organizar()) {
    var mo = new MutationObserver(function () { if (organizar()) mo.disconnect(); });
    mo.observe(doc.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 20000);
  }
})();
