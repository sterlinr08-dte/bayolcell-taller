/* BAYOL CELL · CRM: «Precios» — consultar un artículo mientras se atiende un chat (20-oct-2026).
   Dueño: «un botón en el CRM de consultar los artículos para los clientes que pregunten por el precio de algo,
   darle la info al instante» y «parecido al botón de consultar de prefactura». Decisiones del dueño: SOLO CONSULTA
   (no escribe ni envía nada al cliente), precio de cliente final (nivel 1 de Info Plus) y dónde hay existencia.
   · Botón «Precios» en la cabecera de cada chat (WhatsApp e Instagram). Abre el mismo panel «Buscar artículo» de la
     Prefactura (Código · Artículo · Existencia · Precio; tocar la fila muestra el detalle), sin el «+» de agregar.
   · Datos: el mismo catálogo de Info Plus que usa la Prefactura (cache.infoplusArticulos / _ensureInfoplusArticulos).
   · No toca Zernio, mensajes, IA ni la base. Apagar: localStorage bc_crmprecio_off='1'. */
(function () {
  'use strict';
  var doc = document;
  try { if (localStorage.getItem('bc_crmprecio_off') === '1') return; } catch (e) {}

  var MAXF = 60;
  var ALM = [['1', 'Santiago'], ['4', 'Moca'], ['7', 'Navarrete'], ['6', 'Taller'], ['3', 'Garantía China'], ['5', '2do Nivel']];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function plata(n) { return 'RD$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function precio1(a) { var n = a.niveles && a.niveles['1']; return Number(n != null && n !== '' ? n : a.precio) || 0; }
  function esServ(a) { return String(a.codigo) === '1121' || /^SERVICIO\b/i.test(String(a.descripcion || '').trim()); }
  function esCel(a) { try { return _abCat(a.descripcion) === 'celular'; } catch (e) { return /^CELULAR\b/i.test(String(a.descripcion || '').trim()); } }
  function dondeHay(a) { var ex = (a.existencias && typeof a.existencias === 'object') ? a.existencias : {}; return ALM.filter(function (x) { return Number(ex[x[0]]) > 0; }).map(function (x) { return x[1]; }); }
  // 20-oct-2026 (dueño: «pero no salen las cantidades»): almacén + cantidad, por ejemplo «Santiago 160»
  function conCant(a) { var ex = (a.existencias && typeof a.existencias === 'object') ? a.existencias : {}; return ALM.filter(function (x) { return Number(ex[x[0]]) > 0; }).map(function (x) { return [x[1], Math.round(Number(ex[x[0]]))]; }); }
  // Dueño 20-oct: «a los artículos les faltan detalles: no dicen si son de 128 y si son con aviso». Ese dato está en la
  // «referencia» de Info Plus (256GB, 64GB, AVISO…): se muestra junto al nombre si no está ya en la descripción.
  function refTag(a) {
    var r = String(a.referencia || '').trim(), d = String(a.descripcion || '').toUpperCase();
    if (!r || d.indexOf(r.toUpperCase()) >= 0) return '';
    var aviso = /^AVISO$/i.test(r);
    return ' <span class="cp-ref' + (aviso ? ' aviso' : '') + '">' + esc(aviso ? 'Con aviso' : r) + '</span>';
  }
  function pildora(c, cls) { return '<span class="' + cls + '">' + esc(c[0]) + ' <b>' + c[1].toLocaleString('es-DO') + '</b></span>'; }
  function arts() { try { return (typeof cache !== 'undefined' && cache.infoplusArticulos) || []; } catch (e) { return []; } }

  var velo = null, estado = { q: '', det: -1, hl: 0, lista: [] };
  function filtrar() {
    var qq = norm(estado.q).trim(), pal = qq.split(/\s+/).filter(Boolean);
    var l = arts();
    if (pal.length) l = l.filter(function (a) { var h = norm([a.codigo, a.descripcion, a.marca, a.referencia].filter(Boolean).join(' ')); return pal.every(function (p) { return h.indexOf(p) >= 0; }); });
    estado.lista = l.slice().sort(function (x, y) {
      if (qq) { var cx = String(x.codigo) === qq, cy = String(y.codigo) === qq; if (cx !== cy) return cx ? -1 : 1; }
      var hx = dondeHay(x).length > 0 || esServ(x), hy = dondeHay(y).length > 0 || esServ(y); if (hx !== hy) return hx ? -1 : 1;
      return String(x.descripcion || '').localeCompare(String(y.descripcion || ''));
    });
    estado.det = -1; estado.hl = 0;
  }
  function chip(a) {
    if (esServ(a)) return '<span class="cp-stk srv">Servicio</span>';
    // Dueño 20-oct: en la fila, el TOTAL de existencia (los almacenes van abajo, en la línea «Existencia»); si no hay, «Sin stock»
    var tot = conCant(a).reduce(function (s2, c) { return s2 + c[1]; }, 0);
    return tot > 0 ? '<span class="cp-stk cp-num">' + tot.toLocaleString('es-DO') + '</span>' : '<span class="cp-stk out">Sin stock</span>';
  }
  function detalle(a) {
    var hay = conCant(a), pr = precio1(a), tot = hay.reduce(function (s2, c) { return s2 + c[1]; }, 0);
    // Dueño: «ponlo mejor en la parte inferior, en la línea donde dice Existencia» (una sola vez, con cantidades y total)
    var fichas = esServ(a) ? '<span class="cp-ex">Servicio</span>' : hay.length ? hay.map(function (c) { return pildora(c, 'cp-ex'); }).join('') + '<span class="cp-ex cp-tot">Total <b>' + tot.toLocaleString('es-DO') + '</b></span>' : '<span class="cp-ex out">Sin existencia en ningún almacén</span>';
    return '<div class="cp-det"><div class="cp-nv"><small>Cliente final</small><b>' + (pr > 0 ? plata(pr) : '—') + '</b></div>' +
      '<div class="cp-dex"><span>Existencia</span>' + fichas + '</div></div>';
  }
  function pintar() {
    if (!velo) return;
    var cont = velo.querySelector('.cp-list');
    if (!arts().length) { cont.innerHTML = '<div class="cp-vacio">' + ((typeof _infoplusCargando !== 'undefined' && _infoplusCargando) ? 'Cargando artículos de Info Plus…' : 'No hay artículos cargados todavía.') + '</div>'; return; }
    var l = estado.lista, show = l.slice(0, MAXF);
    var filas = show.map(function (a, i) {
      var pr = precio1(a), sin = !esServ(a) && !dondeHay(a).length;
      return '<div class="cp-row' + (i === estado.hl ? ' hl' : '') + (estado.det === i ? ' abierta' : '') + (sin ? ' sin' : '') + '" data-fila="' + i + '" role="button" tabindex="0" aria-expanded="' + (estado.det === i) + '">' +
        '<span class="cp-cod">' + esc(a.codigo) + '</span>' +
        '<span class="cp-nom">' + esc(String(a.descripcion || '').trim()) + refTag(a) + (esCel(a) ? ' <span class="cp-tag">IMEI</span>' : '') + '</span>' +
        '<span class="cp-stkc">' + chip(a) + '</span>' +
        '<span class="cp-pre">' + (pr > 0 ? plata(pr) : '<span class="cp-stk out">Sin precio</span>') + '</span></div>' +
        (estado.det === i ? detalle(a) : '');
    }).join('');
    cont.innerHTML = (l.length > MAXF ? '<div class="cp-mas">Mostrando ' + MAXF + ' de ' + l.length.toLocaleString('es-DO') + ' — escriba para afinar</div>' : '') +
      (filas ? '<div class="cp-head" aria-hidden="true"><span>Código</span><span>Artículo</span><span>Existencia</span><span>Precio</span></div>' + filas
        : '<div class="cp-vacio">Sin resultados para «' + esc(estado.q) + '».</div>');
  }
  // Salida rápida como en NEXUS (140 ms); con «reducir movimiento» se quita al instante.
  function cerrar() {
    if (!velo) return;
    var v = velo; velo = null;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { v.remove(); return; }
    v.classList.add('saliendo'); setTimeout(function () { v.remove(); }, 150);
  }
  function abrir() {
    cerrar();
    velo = doc.createElement('div');
    velo.className = 'cp-velo';
    velo.innerHTML = '<div class="cp-ppk" role="dialog" aria-modal="true" aria-label="Consultar precio">' +
      '<div class="cp-top" title="Arrastre para mover la ventana"><span class="t"><i class="ti ti-search" aria-hidden="true"></i> Consulta de artículos</span><span class="cp-sub">Precio cliente final</span>' +
      '<button type="button" class="cp-x" aria-label="Cerrar"><i class="ti ti-x" aria-hidden="true"></i></button></div>' +
      '<div class="cp-inp"><i class="ti ti-scan" aria-hidden="true"></i><input type="search" autocomplete="off" enterkeyhint="search" placeholder="Nombre, código, marca o IMEI…" aria-label="Buscar artículo"></div>' +
      '<div class="cp-list"></div></div>';
    doc.body.appendChild(velo);
    var inp = velo.querySelector('input');
    inp.value = estado.q;
    inp.addEventListener('input', function () { estado.q = inp.value; velo.classList.remove('quieto'); filtrar(); pintar(); });
    inp.addEventListener('keydown', function (e) {
      var n = Math.min(estado.lista.length, MAXF);
      if (e.key === 'ArrowDown') { e.preventDefault(); velo.classList.add('quieto'); estado.hl = Math.min(estado.hl + 1, n - 1); pintar(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); velo.classList.add('quieto'); estado.hl = Math.max(estado.hl - 1, 0); pintar(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (n) { estado.det = estado.det === estado.hl ? -1 : estado.hl; pintar(); } }
    });
    velo.addEventListener('click', function (e) {
      if (e.target === velo || e.target.closest('.cp-x')) { cerrar(); return; }
      var f = e.target.closest('[data-fila]'); if (!f) return;
      var i = Number(f.getAttribute('data-fila')); estado.det = estado.det === i ? -1 : i; estado.hl = i; velo.classList.add('quieto'); pintar();
    });
    velo.addEventListener('keydown', function (e) { var f = e.target.closest && e.target.closest('[data-fila]'); if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); f.click(); } });
    // Ventana emergente (dueño: «como emergente», igual que la consulta de Info Plus): en la PC se mueve arrastrando la barra.
    var win = velo.querySelector('.cp-ppk'), top = velo.querySelector('.cp-top'), dx = 0, dy = 0;
    top.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('button') || matchMedia('(max-width: 640px)').matches) return;
      e.preventDefault(); top.setPointerCapture(e.pointerId);
      var x0 = e.clientX - dx, y0 = e.clientY - dy, r = win.getBoundingClientRect(), bx = r.left - dx, by = r.top - dy;
      function mover(ev) {
        dx = Math.min(innerWidth - 80 - bx, Math.max(-bx - r.width + 120, ev.clientX - x0));
        dy = Math.min(innerHeight - 60 - by, Math.max(-by, ev.clientY - y0));
        win.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      }
      function soltar() { top.removeEventListener('pointermove', mover); top.removeEventListener('pointerup', soltar); top.removeEventListener('pointercancel', soltar); top.classList.remove('arr'); }
      top.classList.add('arr'); top.addEventListener('pointermove', mover); top.addEventListener('pointerup', soltar); top.addEventListener('pointercancel', soltar);
    });
    filtrar(); pintar();
    setTimeout(function () { inp.focus(); inp.select(); }, 60);
    if (typeof _ensureInfoplusArticulos === 'function') Promise.resolve(_ensureInfoplusArticulos()).then(function () { if (velo) { filtrar(); pintar(); } }, function () {});
  }
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && velo) cerrar(); });

  // Botón en la cabecera de cada chat (se vuelve a poner cada vez que el chat se repinta)
  function poner() {
    Array.prototype.forEach.call(doc.querySelectorAll('.wa-chat-head'), function (h) {
      if (h.querySelector(':scope > .cp-btn')) return;
      var b = doc.createElement('button');
      b.type = 'button'; b.className = 'cp-btn'; b.title = 'Consultar precio y existencia de un artículo';
      b.innerHTML = '<i class="ti ti-search" aria-hidden="true"></i><span>Consulta</span>'; // dueño 20-oct: «cambiar el nombre Precios y poner Consulta»
      b.addEventListener('click', abrir);
      var antes = h.querySelector(':scope > .wa-focus-btn, :scope > .wa-call-btn, :scope > span, :scope > button.wa-tab-btn:last-child');
      h.insertBefore(b, antes && antes !== h.firstElementChild ? antes : null);
    });
  }
  var pend = false;
  new MutationObserver(function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; poner(); }); }).observe(doc.documentElement, { childList: true, subtree: true });
  poner();
  window.bcCrmPrecios = abrir;
})();
