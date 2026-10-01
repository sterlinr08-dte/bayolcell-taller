/* =====================================================================
   BAYOL CELL — WhatsApp idéntico, Fase 1 (2 oct 2026)
   Solo la pestaña WhatsApp del CRM. Carga crm-wa-identico.css y agrega:
   1) Buscar en el chat (lupa en la cabecera): busca en TODA la conversación
      (base de datos, no solo lo cargado) y salta al mensaje (carga los
      viejos si hace falta).
   2) Botón "bajar al final" con contador de mensajes nuevos.
   3) Fecha flotante mientras se desplaza (como WhatsApp).
   4) Borrador por chat: lo que escribes se guarda si cambias de chat;
      la lista muestra "Borrador:" en verde.
   5) Celular: barra de escribir como la app (píldora blanca + botón verde).
   No cambia ids, onclick ni funciones del CRM; no envía nada ni cambia datos
   (la búsqueda solo LEE whatsapp_mensajes del chat abierto).
   ===================================================================== */
(function(){
  'use strict';
  if (window.__bcWaIdentico) return;
  window.__bcWaIdentico = true;
  var VERSION = '20261002-w2';

  // ---------- CSS (siempre de último) ----------
  function css(){
    var l = document.getElementById('bcWaIdenticoCss');
    if (!l){ l = document.createElement('link'); l.id = 'bcWaIdenticoCss'; l.rel = 'stylesheet'; l.href = 'crm-wa-identico.css?v=' + VERSION; }
    document.head.appendChild(l);
  }
  css(); setTimeout(css, 1600); setTimeout(css, 4000);

  var vista = function(){ return document.getElementById('v-crmLinea'); };
  var esWa = function(){ var v = vista(); return !!(v && v.classList.contains('active') && v.dataset.socialChannel === 'whatsapp'); };
  var movil = function(){ return window.matchMedia && matchMedia('(max-width:768px)').matches; };
  var hiloId = function(){ try { return (typeof _waHiloId !== 'undefined') ? _waHiloId : null; } catch(e){ return null; } };
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); };
  var ls = {
    get: function(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
    set: function(k, v){ try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch(e){} }
  };

  // =====================================================================
  // 4) BORRADOR POR CHAT
  // =====================================================================
  var KB = 'bcwa_borrador_';
  var borradorPintadoDe = null;
  document.addEventListener('input', function(e){
    if (!e.target || e.target.id !== 'waTexto') return;
    var id = hiloId(); if (!id) return;
    ls.set(KB + id, (e.target.value || '').trim() ? e.target.value : '');
  }, true);
  function restaurarBorrador(){
    var t = document.getElementById('waTexto'), id = hiloId();
    if (!t || !id || borradorPintadoDe === t) return;
    borradorPintadoDe = t;
    var b = ls.get(KB + id);
    if (b && !t.value){
      t.value = b;
      try { if (typeof _waActualizarBotonEnvio === 'function') _waActualizarBotonEnvio(); } catch(e){}
      try { if (typeof _waAutoAlto === 'function') _waAutoAlto(t); } catch(e){}
    }
  }
  function envolverEnviar(){
    if (typeof window.enviarMensajeWhatsapp !== 'function' || window.enviarMensajeWhatsapp.__bcwa) return;
    var orig = window.enviarMensajeWhatsapp;
    var nuevo = async function(){
      var id = hiloId();
      var r = await orig.apply(this, arguments);
      try { var t = document.getElementById('waTexto'); if (id && (!t || !t.value.trim())) ls.set(KB + id, ''); } catch(e){}
      return r;
    };
    nuevo.__bcwa = true; window.enviarMensajeWhatsapp = nuevo;
  }
  function borradoresEnLista(){
    var actual = hiloId();
    document.querySelectorAll('#waLista .wa-row[data-hiloid]').forEach(function(row){
      var id = row.getAttribute('data-hiloid'), prev = row.querySelector('.fila-preview'); if (!prev) return;
      var b = id !== actual ? ls.get(KB + id) : null;
      if (b){
        var html = '<span class="bcwa-borrador">Borrador:</span> ' + esc(b.replace(/\s+/g, ' ').slice(0, 80));
        if (prev.dataset.bcwaB !== html){ if (prev.dataset.bcwaOrig === undefined) prev.dataset.bcwaOrig = prev.textContent; prev.innerHTML = html; prev.dataset.bcwaB = html; }
      } else if (prev.dataset.bcwaB){
        prev.textContent = prev.dataset.bcwaOrig || ''; delete prev.dataset.bcwaB; delete prev.dataset.bcwaOrig;
      }
    });
  }

  // =====================================================================
  // 5) CELULAR: barra de escribir como la app (píldora + botón verde)
  // =====================================================================
  function pildoraMovil(){
    var bar = document.getElementById('waInputBar'); if (!bar) return;
    var t = document.getElementById('waTexto'); if (!t) return;
    var pill = bar.querySelector(':scope > .bcwa-pill');
    if (!movil()){
      if (pill){ // volver a la barra de PC (mismo orden de siempre)
        var enfocado = document.activeElement === t;
        while (pill.firstChild) bar.insertBefore(pill.firstChild, pill);
        pill.remove(); if (enfocado) t.focus();
      }
      return;
    }
    if (pill) return;
    var enf = document.activeElement === t, s0 = t.selectionStart, s1 = t.selectionEnd;
    pill = document.createElement('div'); pill.className = 'bcwa-pill';
    bar.insertBefore(pill, t);
    ['btnWaEmoji'].forEach(function(id){ var b = document.getElementById(id); if (b && b.parentNode === bar) pill.appendChild(b); });
    pill.appendChild(t);
    ['btnWaAdjuntar', 'btnWaUbicacion'].forEach(function(id){ var b = document.getElementById(id); if (b && b.parentNode === bar) pill.appendChild(b); });
    if (enf){ t.focus(); try { t.setSelectionRange(s0, s1); } catch(e){} }
  }

  // =====================================================================
  // 2) BOTÓN "BAJAR AL FINAL"   3) FECHA FLOTANTE
  // =====================================================================
  var scrollEl = null, nuevos = 0, ultimoIdVisto = null, tFecha = null;
  function alFinal(el){ return el.scrollHeight - el.scrollTop - el.clientHeight < 120; }
  function asegurarFlotantes(){
    var col = document.getElementById('waDetalleCol'); if (!col) return {};
    var bajar = col.querySelector(':scope > .bcwa-bajar');
    if (!bajar){
      bajar = document.createElement('button'); bajar.type = 'button'; bajar.className = 'bcwa-bajar';
      bajar.setAttribute('aria-label', 'Ir al mensaje más reciente');
      bajar.innerHTML = '<i class="ti ti-chevron-down"></i><b></b>';
      bajar.addEventListener('click', function(){
        var el = document.getElementById('waMessagesScroll'); if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); nuevos = 0; pintarBajar();
      });
      col.appendChild(bajar);
    }
    var fecha = col.querySelector(':scope > .bcwa-fecha');
    if (!fecha){ fecha = document.createElement('div'); fecha.className = 'bcwa-fecha'; fecha.setAttribute('aria-hidden', 'true'); col.appendChild(fecha); }
    return { bajar: bajar, fecha: fecha };
  }
  function pintarBajar(){
    var f = asegurarFlotantes(), el = document.getElementById('waMessagesScroll'); if (!f.bajar || !el) return;
    var ver = !alFinal(el) && el.scrollHeight > el.clientHeight + 200;
    if (!ver) nuevos = 0;
    f.bajar.classList.toggle('ver', ver);
    var b = f.bajar.querySelector('b'), txt = nuevos > 99 ? '99+' : String(nuevos); if (b.textContent !== txt) b.textContent = txt; b.classList.toggle('ver', nuevos > 0);
  }
  function fechaFlotante(el){
    var f = asegurarFlotantes(); if (!f.fecha) return;
    var tope = el.getBoundingClientRect().top + 8, texto = '';
    var seps = el.querySelectorAll('.bc-date-sep');
    for (var i = 0; i < seps.length; i++){ if (seps[i].getBoundingClientRect().top <= tope) texto = seps[i].textContent.trim(); else break; }
    if (!texto && seps.length) texto = seps[0].textContent.trim();
    // si el separador real está a la vista arriba, no duplicar
    var visibleArriba = false;
    for (var j = 0; j < seps.length; j++){ var r = seps[j].getBoundingClientRect(); if (r.top >= tope - 4 && r.top < tope + 40){ visibleArriba = true; break; } }
    if (f.fecha.textContent !== texto) f.fecha.textContent = texto;
    f.fecha.classList.toggle('ver', !!texto && !visibleArriba && el.scrollTop > 40);
    clearTimeout(tFecha); tFecha = setTimeout(function(){ f.fecha.classList.remove('ver'); }, 1100);
  }
  function engancharScroll(){
    var el = document.getElementById('waMessagesScroll');
    if (!el || el === scrollEl) return;
    scrollEl = el; nuevos = 0;
    var todas = el.querySelectorAll('.wa-brow[data-msgid]'); ultimoIdVisto = todas.length ? todas[todas.length - 1].getAttribute('data-msgid') : null;
    el.addEventListener('scroll', function(){ pintarBajar(); fechaFlotante(el); }, { passive: true });
    pintarBajar();
  }
  function contarNuevos(){
    var el = document.getElementById('waMessagesScroll'); if (!el) return;
    var filas = el.querySelectorAll('.wa-brow[data-msgid]'); if (!filas.length) return;
    var ultimoId = filas[filas.length - 1].getAttribute('data-msgid');
    if (ultimoIdVisto && ultimoId !== ultimoIdVisto && !alFinal(el)){
      // contar entrantes nuevos después del último visto
      var vistoIdx = -1;
      for (var i = filas.length - 1; i >= 0; i--){ if (filas[i].getAttribute('data-msgid') === ultimoIdVisto){ vistoIdx = i; break; } }
      if (vistoIdx >= 0) for (var k = vistoIdx + 1; k < filas.length; k++) if (filas[k].classList.contains('in')) nuevos++;
    }
    ultimoIdVisto = ultimoId;
    pintarBajar();
  }

  // =====================================================================
  // 1) BUSCAR EN EL CHAT
  // =====================================================================
  var tBus = null, busToken = 0;
  function botonLupa(){
    var head = document.querySelector('#waDetalle .wa-chat-head'); if (!head || head.querySelector('.bcwa-lupa')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'bcwa-hbtn bcwa-lupa';
    b.title = 'Buscar en el chat'; b.setAttribute('aria-label', 'Buscar en el chat');
    b.innerHTML = '<i class="ti ti-search"></i>';
    b.addEventListener('click', function(e){ e.stopPropagation(); abrirBuscar(); });
    var ref = head.querySelector('.wa-focus-btn, .wa-call-btn, .wa-icon-btn, .wa-tab-btn:last-child');
    head.insertBefore(b, ref || null);
  }
  function panelBuscar(){
    var col = document.getElementById('waDetalleCol'); if (!col) return null;
    var p = col.querySelector(':scope > .bcwa-buscar');
    if (!p){
      p = document.createElement('div'); p.className = 'bcwa-buscar'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Buscar mensajes');
      p.innerHTML = '<div class="bcwa-buscar-head"><button type="button" class="bcwa-buscar-cerrar" aria-label="Cerrar búsqueda"><i class="ti ti-x"></i></button><span>Buscar mensajes</span></div>' +
        '<div class="bcwa-buscar-campo"><input type="search" placeholder="Buscar..." autocomplete="off" aria-label="Buscar en este chat"></div>' +
        '<div class="bcwa-buscar-res"><div class="vacio">Buscar mensajes de este chat.</div></div>';
      col.appendChild(p);
      p.querySelector('.bcwa-buscar-cerrar').addEventListener('click', cerrarBuscar);
      var inp = p.querySelector('input');
      inp.addEventListener('input', function(){ clearTimeout(tBus); var q = inp.value; tBus = setTimeout(function(){ buscar(q); }, 280); });
      inp.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); cerrarBuscar(); } });
    }
    return p;
  }
  function abrirBuscar(){
    var p = panelBuscar(); if (!p) return;
    p.classList.add('ver'); p.dataset.hilo = hiloId() || '';
    var b = document.querySelector('.bcwa-lupa'); if (b) b.classList.add('on');
    setTimeout(function(){ var i = p.querySelector('input'); if (i) i.focus(); }, 60);
  }
  function cerrarBuscar(){
    var p = document.querySelector('#waDetalleCol > .bcwa-buscar'); if (p) p.classList.remove('ver');
    var b = document.querySelector('.bcwa-lupa'); if (b) b.classList.remove('on');
  }
  function fechaCorta(iso){
    var d = new Date(iso); if (isNaN(d)) return '';
    var hoy = new Date(); var ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    var mismo = function(a, b){ return a.toDateString() === b.toDateString(); };
    var hora = d.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit' });
    if (mismo(d, hoy)) return hora;
    if (mismo(d, ayer)) return 'Ayer';
    return d.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function resaltar(texto, q){
    var t = esc(texto), palabras = q.trim().split(/\s+/).filter(Boolean).map(function(w){ return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    if (!palabras.length) return t;
    return t.replace(new RegExp('(' + palabras.map(esc).join('|') + ')', 'gi'), '<mark>$1</mark>');
  }
  async function buscar(q){
    var p = panelBuscar(); if (!p) return;
    var res = p.querySelector('.bcwa-buscar-res'), id = hiloId();
    q = (q || '').trim();
    if (q.length < 2 || !id){ res.innerHTML = '<div class="vacio">Buscar mensajes de este chat.</div>'; return; }
    var tok = ++busToken;
    res.innerHTML = '<div class="vacio">Buscando…</div>';
    try {
      var patron = '%' + q.replace(/[%_\\]/g, function(c){ return '\\' + c; }) + '%';
      var r = await supabaseClient.from('whatsapp_mensajes').select('id,cuerpo,creado_en,direccion').eq('hilo_id', id).ilike('cuerpo', patron).order('creado_en', { ascending: false }).limit(60);
      if (tok !== busToken) return;
      if (r.error) throw r.error;
      var filas = r.data || [];
      if (!filas.length){ res.innerHTML = '<div class="vacio">No se encontraron mensajes.</div>'; return; }
      res.innerHTML = filas.map(function(m){
        return '<div class="bcwa-res" data-id="' + esc(m.id) + '"><small>' + esc(fechaCorta(m.creado_en)) + '</small><div>' + (m.direccion === 'out' ? '<i class="ti ti-checks" style="font-size:14px;color:#53bdeb"></i> ' : '') + resaltar(m.cuerpo || '', q) + '</div></div>';
      }).join('');
      res.querySelectorAll('.bcwa-res').forEach(function(el){ el.addEventListener('click', function(){ irA(el.getAttribute('data-id')); }); });
    } catch(e){
      if (tok === busToken) res.innerHTML = '<div class="vacio">No se pudo buscar. Intenta de nuevo.</div>';
    }
  }
  async function irA(msgId){
    var sel = '.wa-brow[data-msgid="' + msgId + '"] .wa-bubble-wrap', id = hiloId();
    var w = document.querySelector(sel), intentos = 0;
    while (!w && intentos < 30 && id === hiloId() && typeof window._bcWaLoadOlderMessages === 'function'){
      var paging = window.BayolWhatsAppPaging && window.BayolWhatsAppPaging.messages;
      if (paging && paging.hasMore === false) break;
      await window._bcWaLoadOlderMessages();
      await new Promise(function(r){ setTimeout(r, 120); });
      w = document.querySelector(sel); intentos++;
    }
    if (!w) return;
    if (movil()) cerrarBuscar();
    w.scrollIntoView({ behavior: 'smooth', block: 'center' });
    w.classList.remove('bcwa-encontrado'); void w.offsetWidth; w.classList.add('bcwa-encontrado');
    setTimeout(function(){ w.classList.remove('bcwa-encontrado'); }, 1700);
  }
  // Ctrl+F (o Cmd+F) dentro del chat de WhatsApp abre la búsqueda, como WhatsApp Web
  document.addEventListener('keydown', function(e){
    if (!esWa() || !hiloId()) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'f' || e.key === 'F')){ e.preventDefault(); abrirBuscar(); }
  });

  // =====================================================================
  // FASE 2 — 6) DESTACADOS (estrella), 7) VISOR DE FOTOS, 8) ARRASTRAR/PEGAR,
  //          9) INFO DEL CONTACTO
  // =====================================================================
  var destacados = new Set(), destacadosDe = null;
  async function cargarDestacados(id){
    destacadosDe = id; destacados = new Set();
    try {
      var r = await supabaseClient.from('whatsapp_mensajes').select('id').eq('hilo_id', id).eq('destacado', true).limit(500);
      if (destacadosDe !== id || r.error) return;
      (r.data || []).forEach(function(m){ destacados.add(m.id); });
      marcarDestacados();
    } catch(e){}
  }
  function marcarDestacados(){
    document.querySelectorAll('#waMessagesScroll .wa-brow[data-msgid]').forEach(function(row){
      var on = destacados.has(row.getAttribute('data-msgid'));
      var tick = row.querySelector('.wa-tick-line'), star = tick && tick.querySelector('.bcwa-star');
      if (on && tick && !star){ var i = document.createElement('i'); i.className = 'ti ti-star-filled bcwa-star'; i.setAttribute('aria-label', 'Destacado'); tick.insertBefore(i, tick.firstChild); }
      else if (!on && star) star.remove();
    });
  }
  window._bcWaDestacar = async function(){
    var id = null; try { id = _waMenuAccionesMsgId; } catch(e){}
    try { if (typeof _waCerrarMenuAcciones === 'function') _waCerrarMenuAcciones(); } catch(e){}
    if (!id) return;
    var nuevo = !destacados.has(id);
    var quien = ''; try { quien = (sessionUser && sessionUser.nombre) || ''; } catch(e){}
    try {
      var r = await supabaseClient.from('whatsapp_mensajes').update({ destacado: nuevo, destacado_por: nuevo ? quien : null, destacado_en: nuevo ? new Date().toISOString() : null }).eq('id', id);
      if (r.error) throw r.error;
      if (nuevo) destacados.add(id); else destacados.delete(id);
      marcarDestacados();
      try { toast(nuevo ? 'Mensaje destacado' : 'Ya no está destacado'); } catch(e){}
      var info = document.querySelector('#waDetalleCol > .bcwa-info.ver'); if (info) pintarInfo();
    } catch(e){ try { toastError('No se pudo destacar el mensaje.'); } catch(_){} }
  };
  function envolverMenu(){
    if (typeof window._waAsegurarMenuAcciones === 'function' && !window._waAsegurarMenuAcciones.__bcwaStar){
      var origA = window._waAsegurarMenuAcciones;
      var nA = function(){
        var menu = origA.apply(this, arguments);
        if (menu && !menu.querySelector('#waMenuDestacar')){
          var b = document.createElement('button'); b.type = 'button'; b.id = 'waMenuDestacar';
          b.innerHTML = '<i class="ti ti-star"></i> <span>Destacar</span>';
          b.setAttribute('onclick', '_bcWaDestacar()');
          menu.appendChild(b);
        }
        return menu;
      };
      Object.keys(origA).forEach(function(k){ nA[k] = origA[k]; });
      nA.__bcwaStar = true; window._waAsegurarMenuAcciones = nA;
    }
    if (typeof window._waAbrirMenuAcciones === 'function' && !window._waAbrirMenuAcciones.__bcwaStar){
      var origB = window._waAbrirMenuAcciones;
      var nB = function(ev, msgId){
        try { var menu = window._waAsegurarMenuAcciones(); var b = menu && menu.querySelector('#waMenuDestacar');
          if (b){ var on = destacados.has(msgId); b.querySelector('span').textContent = on ? 'Quitar destacado' : 'Destacar'; b.querySelector('.ti').className = 'ti ' + (on ? 'ti-star-off' : 'ti-star'); } } catch(e){}
        return origB.apply(this, arguments);
      };
      nB.__bcwaStar = true; window._waAbrirMenuAcciones = nB;
    }
  }

  // ---------- 7) VISOR DE FOTOS ----------
  var visor = { lista: [], i: 0, el: null, x0: null };
  function quienDe(row){ if (!row) return ''; if (row.classList.contains('out')) return 'Tú'; var h = hiloActual(); return (h && (h.nombre_perfil || h.telefono_e164)) || 'Cliente'; }
  function fechaLarga(iso){ var d = new Date(iso); if (isNaN(d)) return ''; return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit' }); }
  function listaDesdeChat(){
    return [].slice.call(document.querySelectorAll('#waMessagesScroll .wa-brow img')).filter(function(im){ return im.src && !/^data:/.test(im.src); }).map(function(im){
      var row = im.closest('.wa-brow'); return { src: im.src, quien: quienDe(row), ts: row && row.getAttribute('data-ts'), msgid: row && row.getAttribute('data-msgid') };
    });
  }
  function asegurarVisor(){
    if (visor.el) return visor.el;
    var v = document.createElement('div'); v.id = 'bcwaVisor'; v.className = 'bcwa-visor'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-label', 'Visor de fotos');
    v.innerHTML = '<div class="bcwa-v-head"><div class="bcwa-v-quien"><b></b><small></small></div><div class="bcwa-v-acc">' +
      '<button type="button" class="bcwa-v-ir" title="Ir al mensaje" aria-label="Ir al mensaje"><i class="ti ti-message-circle"></i></button>' +
      '<button type="button" class="bcwa-v-bajar" title="Descargar" aria-label="Descargar"><i class="ti ti-download"></i></button>' +
      '<button type="button" class="bcwa-v-cerrar" title="Cerrar" aria-label="Cerrar"><i class="ti ti-x"></i></button></div></div>' +
      '<div class="bcwa-v-centro"><button type="button" class="bcwa-v-prev" aria-label="Anterior"><i class="ti ti-chevron-left"></i></button><img alt="Foto del chat"><button type="button" class="bcwa-v-next" aria-label="Siguiente"><i class="ti ti-chevron-right"></i></button></div>' +
      '<div class="bcwa-v-tiras"></div>';
    document.body.appendChild(v); visor.el = v;
    v.querySelector('.bcwa-v-cerrar').addEventListener('click', cerrarVisor);
    v.querySelector('.bcwa-v-prev').addEventListener('click', function(){ moverVisor(-1); });
    v.querySelector('.bcwa-v-next').addEventListener('click', function(){ moverVisor(1); });
    v.querySelector('.bcwa-v-bajar').addEventListener('click', descargarActual);
    v.querySelector('.bcwa-v-ir').addEventListener('click', function(){ var it = visor.lista[visor.i]; cerrarVisor(); if (it && it.msgid) irA(it.msgid); });
    v.addEventListener('click', function(e){ if (e.target === v || e.target.classList.contains('bcwa-v-centro')) cerrarVisor(); });
    var c = v.querySelector('.bcwa-v-centro');
    c.addEventListener('pointerdown', function(e){ visor.x0 = e.clientX; });
    c.addEventListener('pointerup', function(e){ if (visor.x0 == null) return; var dx = e.clientX - visor.x0; visor.x0 = null; if (Math.abs(dx) > 50) moverVisor(dx < 0 ? 1 : -1); });
    return v;
  }
  function pintarVisor(){
    var v = asegurarVisor(), it = visor.lista[visor.i]; if (!it) return;
    v.querySelector('.bcwa-v-centro img').src = it.src;
    v.querySelector('.bcwa-v-quien b').textContent = it.quien || '';
    v.querySelector('.bcwa-v-quien small').textContent = fechaLarga(it.ts);
    v.querySelector('.bcwa-v-prev').style.visibility = visor.i > 0 ? 'visible' : 'hidden';
    v.querySelector('.bcwa-v-next').style.visibility = visor.i < visor.lista.length - 1 ? 'visible' : 'hidden';
    v.querySelector('.bcwa-v-ir').style.display = it.msgid ? '' : 'none';
    var tiras = v.querySelector('.bcwa-v-tiras');
    tiras.innerHTML = visor.lista.map(function(x, k){ return '<img src="' + esc(x.src) + '" data-k="' + k + '" class="' + (k === visor.i ? 'on' : '') + '" alt="">'; }).join('');
    tiras.querySelectorAll('img').forEach(function(im){ im.addEventListener('click', function(){ visor.i = +im.dataset.k; pintarVisor(); }); });
    var on = tiras.querySelector('img.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function abrirVisor(lista, i){ if (!lista.length) return; visor.lista = lista; visor.i = Math.max(0, Math.min(i, lista.length - 1)); asegurarVisor().classList.add('ver'); pintarVisor(); }
  function cerrarVisor(){ if (visor.el) visor.el.classList.remove('ver'); }
  function moverVisor(d){ var n = visor.i + d; if (n < 0 || n >= visor.lista.length) return; visor.i = n; pintarVisor(); }
  async function descargarActual(){
    var it = visor.lista[visor.i]; if (!it) return;
    try {
      var r = await fetch(it.src); var b = await r.blob(); var u = URL.createObjectURL(b);
      var a = document.createElement('a'); a.href = u; a.download = 'BayolCell_' + (it.ts || Date.now()).toString().slice(0, 19).replace(/[:T]/g, '-') + '.' + ((b.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg'));
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 4000);
    } catch(e){ window.open(it.src, '_blank'); }
  }
  // Clic en una foto del chat: abre el visor en vez de una pestaña nueva
  document.addEventListener('click', function(e){
    var im = e.target && e.target.closest && e.target.closest('#waMessagesScroll .wa-brow img');
    if (!im || !esWa()) return;
    e.preventDefault(); e.stopPropagation();
    var lista = listaDesdeChat(), i = lista.findIndex(function(x){ return x.src === im.src; });
    abrirVisor(lista, i < 0 ? 0 : i);
  }, true);

  // ---------- 8) ARRASTRAR Y SOLTAR / PEGAR ARCHIVOS ----------
  function tipoDe(f){ var t = f.type || ''; if (/^image\//.test(t) || /^video\//.test(t)) return 'imagen'; return 'documento'; }
  function adjuntar(f){
    if (!f || typeof window._waAdjuntoSeleccionado !== 'function') return;
    window._waAdjuntoSeleccionado({ files: [f], value: '' }, tipoDe(f));
  }
  var arrastre = 0;
  function capaSoltar(){
    var col = document.getElementById('waDetalleCol'); if (!col) return null;
    var c = col.querySelector(':scope > .bcwa-soltar');
    if (!c){ c = document.createElement('div'); c.className = 'bcwa-soltar'; c.innerHTML = '<div><i class="ti ti-file-upload"></i><b>Suelta el archivo aquí</b><span>Foto, video o documento</span></div>'; col.appendChild(c); }
    return c;
  }
  var tieneArchivos = function(e){ var t = e.dataTransfer && e.dataTransfer.types; return t && [].indexOf.call(t, 'Files') >= 0; };
  document.addEventListener('dragenter', function(e){ if (!esWa() || !hiloId() || !tieneArchivos(e) || !(e.target.closest && e.target.closest('#waDetalleCol'))) return; arrastre++; var c = capaSoltar(); if (c) c.classList.add('ver'); });
  document.addEventListener('dragover', function(e){ if (esWa() && hiloId() && tieneArchivos(e) && e.target.closest && e.target.closest('#waDetalleCol')) e.preventDefault(); });
  document.addEventListener('dragleave', function(e){ if (!tieneArchivos(e)) return; arrastre = Math.max(0, arrastre - 1); if (!arrastre){ var c = document.querySelector('.bcwa-soltar'); if (c) c.classList.remove('ver'); } });
  document.addEventListener('drop', function(e){
    var c = document.querySelector('.bcwa-soltar'); if (c) c.classList.remove('ver'); arrastre = 0;
    if (!esWa() || !hiloId() || !tieneArchivos(e) || !(e.target.closest && e.target.closest('#waDetalleCol'))) return;
    e.preventDefault(); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) adjuntar(f);
  });
  document.addEventListener('paste', function(e){
    if (!esWa() || !hiloId() || !e.target || !(e.target.closest && e.target.closest('#waDetalleCol'))) return;
    var items = (e.clipboardData && e.clipboardData.files) || []; if (!items.length) return;
    e.preventDefault(); adjuntar(items[0]);
  });

  // ---------- 9) INFO DEL CONTACTO ----------
  function hiloActual(){ var id = hiloId(); try { return (_waHilos || []).find(function(h){ return h.id === id; }) || null; } catch(e){ return null; } }
  function panelInfo(){
    var col = document.getElementById('waDetalleCol'); if (!col) return null;
    var p = col.querySelector(':scope > .bcwa-info');
    if (!p){
      p = document.createElement('div'); p.className = 'bcwa-info'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Info. del contacto');
      p.innerHTML = '<div class="bcwa-buscar-head"><button type="button" class="bcwa-info-cerrar" aria-label="Cerrar"><i class="ti ti-x"></i></button><span>Info. del contacto</span></div><div class="bcwa-info-cuerpo"></div>';
      col.appendChild(p);
      p.querySelector('.bcwa-info-cerrar').addEventListener('click', cerrarInfo);
    }
    return p;
  }
  function abrirInfo(){ cerrarBuscar(); var p = panelInfo(); if (!p) return; p.classList.add('ver'); pintarInfo(); }
  function cerrarInfo(){ var p = document.querySelector('#waDetalleCol > .bcwa-info'); if (p) p.classList.remove('ver'); }
  var infoToken = 0;
  async function pintarInfo(){
    var p = panelInfo(), h = hiloActual(), id = hiloId(); if (!p || !h) return;
    var tok = ++infoToken, cuerpo = p.querySelector('.bcwa-info-cuerpo');
    var nombre = h.nombre_perfil || h.telefono_e164 || 'Sin nombre', tel = h.telefono_e164 || '';
    var ini = ''; try { ini = _waIniciales(nombre); } catch(e){ ini = nombre.slice(0, 2).toUpperCase(); }
    var cli = null; try { if (h.cliente_id && cache && cache.clientes) cli = cache.clientes.find(function(c){ return c.id === h.cliente_id; }); } catch(e){}
    var asignado = ''; try { if (h.asignado_id) asignado = nombreEmpleado(h.asignado_id) || ''; } catch(e){}
    cuerpo.innerHTML = '<div class="bcwa-info-top"><div class="bcwa-info-av">' + esc(ini) + '</div><h3>' + esc(nombre) + '</h3><p>' + esc(tel) + '</p>' +
      '<div class="bcwa-info-btns">' + (tel ? '<a href="tel:' + esc(tel) + '"><i class="ti ti-phone"></i><span>Llamar</span></a>' : '') +
      '<button type="button" data-a="buscar"><i class="ti ti-search"></i><span>Buscar</span></button>' +
      (tel ? '<button type="button" data-a="copiar"><i class="ti ti-copy"></i><span>Copiar</span></button>' : '') + '</div></div>' +
      '<div class="bcwa-info-sec"><div class="bcwa-info-t">Datos del CRM</div>' +
      '<div class="bcwa-info-fila"><i class="ti ti-user-check"></i><div><small>Cliente vinculado</small>' + (cli ? esc(((cli.nombre || '') + ' ' + (cli.apellido || '')).trim()) : '<em>Sin vincular</em>') + '</div></div>' +
      '<div class="bcwa-info-fila"><i class="ti ti-user"></i><div><small>Atendido por</small>' + (asignado ? esc(asignado) : '<em>Sin asignar</em>') + '</div></div></div>' +
      '<div class="bcwa-info-sec bcwa-info-media"><div class="bcwa-info-t">Archivos, enlaces y documentos <span class="cnt"></span></div><div class="bcwa-info-grid"><div class="vacio">Cargando…</div></div><div class="bcwa-info-docs"></div><div class="bcwa-info-links"></div></div>' +
      '<div class="bcwa-info-sec bcwa-info-dest"><div class="bcwa-info-t"><i class="ti ti-star"></i> Mensajes destacados <span class="cnt"></span></div><div class="bcwa-info-destlist"><div class="vacio">Cargando…</div></div></div>';
    cuerpo.querySelector('[data-a="buscar"]').addEventListener('click', function(){ cerrarInfo(); abrirBuscar(); });
    var bc = cuerpo.querySelector('[data-a="copiar"]'); if (bc) bc.addEventListener('click', function(){ try { navigator.clipboard.writeText(tel); toast('Número copiado'); } catch(e){} });
    try {
      var rm = await supabaseClient.from('whatsapp_mensajes').select('id,tipo_contenido,media_path,cuerpo,creado_en,direccion').eq('hilo_id', id).not('media_path', 'is', null).order('creado_en', { ascending: false }).limit(60);
      var rl = await supabaseClient.from('whatsapp_mensajes').select('id,cuerpo,creado_en').eq('hilo_id', id).ilike('cuerpo', '%http%').order('creado_en', { ascending: false }).limit(30);
      var rd = await supabaseClient.from('whatsapp_mensajes').select('id,cuerpo,creado_en,direccion,tipo_contenido').eq('hilo_id', id).eq('destacado', true).order('creado_en', { ascending: false }).limit(100);
      if (tok !== infoToken) return;
      var media = (rm.data || []), imgs = media.filter(function(m){ return m.tipo_contenido === 'imagen'; }), docs = media.filter(function(m){ return m.tipo_contenido === 'documento'; });
      var links = []; (rl.data || []).forEach(function(m){ (String(m.cuerpo || '').match(/https?:\/\/[^\s<>"]+/g) || []).forEach(function(u){ if (links.indexOf(u) < 0) links.push(u); }); });
      cuerpo.querySelector('.bcwa-info-media .cnt').textContent = String(media.length + links.length);
      var grid = cuerpo.querySelector('.bcwa-info-grid');
      if (!imgs.length) grid.innerHTML = '<div class="vacio">Sin fotos en este chat.</div>';
      else {
        var urls = await Promise.all(imgs.slice(0, 12).map(function(m){ try { return _waSignedUrl(m.media_path); } catch(e){ return null; } }));
        if (tok !== infoToken) return;
        var galeria = imgs.slice(0, 12).map(function(m, k){ return { src: urls[k], quien: m.direccion === 'out' ? 'Tú' : nombre, ts: m.creado_en, msgid: m.id }; }).filter(function(x){ return x.src; });
        grid.innerHTML = galeria.map(function(x, k){ return '<img src="' + esc(x.src) + '" data-k="' + k + '" alt="Foto del chat">'; }).join('');
        grid.querySelectorAll('img').forEach(function(im){ im.addEventListener('click', function(){ abrirVisor(galeria, +im.dataset.k); }); });
      }
      cuerpo.querySelector('.bcwa-info-docs').innerHTML = docs.slice(0, 10).map(function(m){ return '<div class="bcwa-info-doc" data-path="' + esc(m.media_path) + '"><i class="ti ti-file-text"></i><span>' + esc((m.cuerpo || m.media_path.split('/').pop() || 'Documento').slice(0, 60)) + '</span><small>' + esc(fechaCorta(m.creado_en)) + '</small></div>'; }).join('');
      cuerpo.querySelectorAll('.bcwa-info-doc').forEach(function(d){ d.addEventListener('click', async function(){ var u = await _waSignedUrl(d.dataset.path); if (u) window.open(u, '_blank'); }); });
      cuerpo.querySelector('.bcwa-info-links').innerHTML = links.slice(0, 10).map(function(u){ return '<a class="bcwa-info-link" href="' + esc(u) + '" target="_blank" rel="noopener"><i class="ti ti-link"></i><span>' + esc(u.replace(/^https?:\/\//, '').slice(0, 60)) + '</span></a>'; }).join('');
      var dest = rd.data || [];
      cuerpo.querySelector('.bcwa-info-dest .cnt').textContent = String(dest.length);
      var dl = cuerpo.querySelector('.bcwa-info-destlist');
      dl.innerHTML = dest.length ? dest.map(function(m){ return '<div class="bcwa-res" data-id="' + esc(m.id) + '"><small>' + (m.direccion === 'out' ? 'Tú' : esc(nombre)) + ' · ' + esc(fechaCorta(m.creado_en)) + '</small><div>' + esc(m.cuerpo || ('[' + (m.tipo_contenido || 'adjunto') + ']')) + '</div></div>'; }).join('') : '<div class="vacio">Sin mensajes destacados. Usa el menú de un mensaje → Destacar.</div>';
      dl.querySelectorAll('.bcwa-res').forEach(function(el){ el.addEventListener('click', function(){ if (movil()) cerrarInfo(); irA(el.getAttribute('data-id')); }); });
    } catch(e){ var g = cuerpo.querySelector('.bcwa-info-grid'); if (g) g.innerHTML = '<div class="vacio">No se pudo cargar.</div>'; }
  }
  function cabeceraClicable(){
    var head = document.querySelector('#waDetalle .wa-chat-head'); if (!head || head.__bcwaInfo) return;
    head.__bcwaInfo = true;
    head.addEventListener('click', function(e){
      if (e.target.closest('button, a')) return;
      if (e.target.closest('.wa-avatar') || e.target.closest('.wa-chat-head > div:not(.wa-avatar)')) abrirInfo();
    });
  }
  // Esc: cierra visor / paneles antes que cualquier otra cosa
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    if (visor.el && visor.el.classList.contains('ver')){ e.preventDefault(); e.stopImmediatePropagation(); cerrarVisor(); return; }
    var info = document.querySelector('#waDetalleCol > .bcwa-info.ver'); if (info){ e.preventDefault(); e.stopImmediatePropagation(); cerrarInfo(); return; }
    var bus = document.querySelector('#waDetalleCol > .bcwa-buscar.ver'); if (bus){ e.preventDefault(); e.stopImmediatePropagation(); cerrarBuscar(); }
  }, true);
  document.addEventListener('keydown', function(e){
    if (!visor.el || !visor.el.classList.contains('ver')) return;
    if (e.key === 'ArrowLeft'){ e.preventDefault(); moverVisor(-1); } else if (e.key === 'ArrowRight'){ e.preventDefault(); moverVisor(1); }
  });

  // =====================================================================
  // Aplicar todo al pintarse el CRM
  // =====================================================================
  var hiloAntes = null;
  function aplicar(){
    if (!document.getElementById('waWrap')) return;
    envolverEnviar(); envolverMenu();
    var id = hiloId();
    if (id !== hiloAntes){
      hiloAntes = id; cerrarBuscar(); cerrarInfo(); if (id) cargarDestacados(id);
      var p = document.querySelector('#waDetalleCol > .bcwa-buscar'); if (p){ var i = p.querySelector('input'); if (i) i.value = ''; p.querySelector('.bcwa-buscar-res').innerHTML = '<div class="vacio">Buscar mensajes de este chat.</div>'; }
    }
    if (id){ botonLupa(); cabeceraClicable(); restaurarBorrador(); pildoraMovil(); engancharScroll(); contarNuevos(); marcarDestacados(); }
    borradoresEnLista();
  }
  var pendiente = false;
  var obs = new MutationObserver(function(muts){
    if (pendiente) return;
    for (var i = 0; i < muts.length; i++){
      var t = muts[i].target;
      if (t && t.nodeType === 1 && t.closest && t.closest('.bcwa-bajar, .bcwa-fecha, .bcwa-buscar, .bcwa-soltar, .bcwa-info')) continue;
      if (t && t.nodeType === 1 && (t.id === 'waWrap' || (t.closest && t.closest('#waWrap')))){
        pendiente = true;
        Promise.resolve().then(function(){ pendiente = false; try { aplicar(); } catch(e){} });
        return;
      }
    }
  });
  function iniciar(){
    obs.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', function(){ try { pildoraMovil(); } catch(e){} });
    aplicar();
  }
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);
  window.BayolWaIdentico = { version: VERSION, aplicar: aplicar, buscar: abrirBuscar, irA: irA, info: abrirInfo, visor: abrirVisor, destacados: function(){ return Array.from(destacados); } };
})();
