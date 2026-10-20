/* BAYOL CELL · CRM: «Precios» — consultar un artículo mientras se atiende un chat (20-oct-2026).
   Dueño: «un botón en el CRM de consultar los artículos para los clientes que pregunten por el precio de algo,
   darle la info al instante». Decisiones del dueño: SOLO CONSULTA (no escribe ni envía nada al cliente),
   precio de cliente final (nivel 1 de Info Plus) y dónde hay existencia (por almacén, sin cantidades).
   · Botón «Precios» en la cabecera de cada chat (WhatsApp e Instagram). Abre una hoja con buscador.
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
  function dondeHay(a) { var ex = (a.existencias && typeof a.existencias === 'object') ? a.existencias : {}; return ALM.filter(function (x) { return Number(ex[x[0]]) > 0; }).map(function (x) { return x[1]; }); }
  function arts() { try { return (typeof cache !== 'undefined' && cache.infoplusArticulos) || []; } catch (e) { return []; } }

  var hoja = null, estado = { q: '' };
  function filtrar() {
    var pal = norm(estado.q).trim().split(/\s+/).filter(Boolean);
    var l = arts();
    if (pal.length) l = l.filter(function (a) { var h = norm([a.codigo, a.descripcion, a.marca, a.referencia].filter(Boolean).join(' ')); return pal.every(function (p) { return h.indexOf(p) >= 0; }); });
    return l.slice().sort(function (x, y) {
      var hx = dondeHay(x).length > 0 || esServ(x), hy = dondeHay(y).length > 0 || esServ(y); if (hx !== hy) return hx ? -1 : 1;
      return String(x.descripcion || '').localeCompare(String(y.descripcion || ''));
    });
  }
  function pintar() {
    if (!hoja) return;
    var cont = hoja.querySelector('.cp-lista'), todos = arts();
    if (!todos.length) { cont.innerHTML = '<div class="cp-vacio">' + ((typeof _infoplusCargando !== 'undefined' && _infoplusCargando) ? 'Cargando artículos de Info Plus…' : 'No hay artículos cargados todavía.') + '</div>'; return; }
    if (!estado.q.trim()) { cont.innerHTML = '<div class="cp-vacio">Escriba lo que pregunta el cliente: «pantalla iphone 11», «batería 12», «a17»…</div>'; return; }
    var l = filtrar();
    if (!l.length) { cont.innerHTML = '<div class="cp-vacio">No hay artículos con «' + esc(estado.q) + '».</div>'; return; }
    cont.innerHTML = (l.length > MAXF ? '<div class="cp-mas">' + MAXF + ' de ' + l.length + ' — escriba más para afinar</div>' : '') + l.slice(0, MAXF).map(function (a) {
      var pr = precio1(a), hay = dondeHay(a), serv = esServ(a);
      var ex = serv ? '<span class="cp-srv">Servicio</span>' : hay.length ? hay.map(function (n) { return '<span class="cp-alm">' + esc(n) + '</span>'; }).join('') : '<span class="cp-no">Sin existencia</span>';
      return '<div class="cp-it' + (!serv && !hay.length ? ' sin' : '') + '">' +
        '<div class="cp-d"><div class="cp-n">' + esc(String(a.descripcion || '').trim()) + '</div><div class="cp-c">' + esc(a.codigo) + '</div></div>' +
        '<div class="cp-p">' + (pr > 0 ? plata(pr) : '<span class="cp-no">Sin precio</span>') + '</div>' +
        '<div class="cp-e">' + ex + '</div></div>';
    }).join('');
  }
  function cerrar() { if (hoja) { hoja.remove(); hoja = null; } }
  function abrir() {
    cerrar();
    hoja = doc.createElement('div');
    hoja.className = 'cp-velo';
    hoja.innerHTML = '<div class="cp-hoja" role="dialog" aria-modal="true" aria-label="Consultar precio">' +
      '<div class="cp-top"><b><i class="ti ti-tag" aria-hidden="true"></i> Consultar precio</b><span class="cp-sub">Cliente final · Info Plus</span>' +
      '<button type="button" class="cp-x" aria-label="Cerrar"><i class="ti ti-x" aria-hidden="true"></i></button></div>' +
      '<label class="cp-in"><i class="ti ti-search" aria-hidden="true"></i><input type="search" autocomplete="off" enterkeyhint="search" placeholder="Artículo, modelo o código…" aria-label="Buscar artículo"></label>' +
      '<div class="cp-lista"></div></div>';
    doc.body.appendChild(hoja);
    var inp = hoja.querySelector('input');
    inp.value = estado.q;
    inp.addEventListener('input', function () { estado.q = inp.value; pintar(); });
    hoja.addEventListener('click', function (e) { if (e.target === hoja || e.target.closest('.cp-x')) cerrar(); });
    pintar();
    setTimeout(function () { inp.focus(); inp.select(); }, 60);
    if (typeof _ensureInfoplusArticulos === 'function') Promise.resolve(_ensureInfoplusArticulos()).then(function () { pintar(); }, function () {});
  }
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hoja) cerrar(); });

  // Botón en la cabecera de cada chat (se vuelve a poner cada vez que el chat se repinta)
  function poner() {
    Array.prototype.forEach.call(doc.querySelectorAll('.wa-chat-head'), function (h) {
      if (h.querySelector(':scope > .cp-btn')) return;
      var b = doc.createElement('button');
      b.type = 'button'; b.className = 'cp-btn'; b.title = 'Consultar el precio de un artículo';
      b.innerHTML = '<i class="ti ti-tag" aria-hidden="true"></i><span>Precios</span>';
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
