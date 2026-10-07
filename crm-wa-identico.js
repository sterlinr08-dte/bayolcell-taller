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
  var VERSION = '20261007-w13';

  // ---------- CSS (siempre de último) ----------
  function css(){
    var l = document.getElementById('bcWaIdenticoCss');
    if (!l){ l = document.createElement('link'); l.id = 'bcWaIdenticoCss'; l.rel = 'stylesheet'; l.href = 'crm-wa-identico.css?v=' + VERSION; }
    document.head.appendChild(l);
    // Instagram y Facebook con el mismo formato que WhatsApp (3 oct 2026)
    var c = document.getElementById('bcCanalesIgualesCss');
    if (!c){ c = document.createElement('link'); c.id = 'bcCanalesIgualesCss'; c.rel = 'stylesheet'; c.href = 'crm-canales-iguales.css?v=' + VERSION; }
    document.head.appendChild(c);
    // PC más compacto: el chat crece (7 oct 2026). Capa aislada, va de última.
    var k = document.getElementById('bcWaCompactoCss');
    if (!k){ k = document.createElement('link'); k.id = 'bcWaCompactoCss'; k.rel = 'stylesheet'; k.href = 'crm-wa-compacto.css?v=' + VERSION; }
    document.head.appendChild(k);
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
      // Borrar el borrador ANTES de enviar: el chat se redibuja durante el envío y, si el
      // borrador seguía guardado, se volvía a escribir en la caja (el mensaje quedaba ahí).
      if (id) ls.set(KB + id, '');
      var r;
      try { r = await orig.apply(this, arguments); }
      finally {
        // Si el envío falló y el texto quedó en la caja, se conserva como borrador.
        try { var t = document.getElementById('waTexto'); if (id && t && t.value.trim() && hiloId() === id) ls.set(KB + id, t.value); } catch(e){}
      }
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
    cuerpo.innerHTML = '<div class="bcwa-info-top"><div class="bcwa-info-av">' + esc(ini) + '</div><h3>' + esc(nombre) + ' <button type="button" class="bcwa-info-edit" data-a="nombre" title="' + (h.cliente_id ? 'Editar nombre' : 'Guardar contacto') + '" aria-label="' + (h.cliente_id ? 'Editar nombre' : 'Guardar contacto') + '"><i class="ti ti-' + (h.cliente_id ? 'pencil' : 'user-plus') + '"></i></button></h3><p>' + esc(tel) + '</p>' +
      (h._nombreWa && h._nombreWa !== nombre ? '<p class="bcwa-info-wa">~ ' + esc(h._nombreWa) + ' <span>(nombre en WhatsApp)</span></p>' : '') +
      '<div class="bcwa-info-btns">' + (tel ? '<a href="tel:' + esc(tel) + '"><i class="ti ti-phone"></i><span>Llamar</span></a>' : '') +
      '<button type="button" data-a="buscar"><i class="ti ti-search"></i><span>Buscar</span></button>' +
      (tel ? '<button type="button" data-a="copiar"><i class="ti ti-copy"></i><span>Copiar</span></button>' : '') + '</div></div>' +
      '<div class="bcwa-info-sec"><div class="bcwa-info-t">Datos del CRM</div>' +
      '<div class="bcwa-info-fila"><i class="ti ti-user-check"></i><div><small>Cliente vinculado</small>' + (cli ? esc(((cli.nombre || '') + ' ' + (cli.apellido || '')).trim()) : '<em>Sin vincular</em>') + '</div></div>' +
      '<div class="bcwa-info-fila"><i class="ti ti-user"></i><div><small>Atendido por</small>' + (asignado ? esc(asignado) : '<em>Sin asignar</em>') + '</div></div></div>' +
      '<div class="bcwa-info-sec bcwa-info-media"><div class="bcwa-info-t">Archivos, enlaces y documentos <span class="cnt"></span></div><div class="bcwa-info-grid"><div class="vacio">Cargando…</div></div><div class="bcwa-info-docs"></div><div class="bcwa-info-links"></div></div>' +
      '<div class="bcwa-info-sec bcwa-info-dest"><div class="bcwa-info-t"><i class="ti ti-star"></i> Mensajes destacados <span class="cnt"></span></div><div class="bcwa-info-destlist"><div class="vacio">Cargando…</div></div></div>';
    cuerpo.querySelector('[data-a="buscar"]').addEventListener('click', function(){ cerrarInfo(); abrirBuscar(); });
    cuerpo.querySelector('[data-a="nombre"]').addEventListener('click', function(){ editarNombreContacto(); });
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
  // FASE 3 — FIJAR, ARCHIVAR, NO LEÍDO, SILENCIAR, ETIQUETAS
  // (columnas whatsapp_hilos.fijado_en/silenciado/etiquetas + tabla whatsapp_etiquetas)
  // =====================================================================
  var etiquetas = [], etiquetasCargadas = false, modoArchivados = false, filtroEtiqueta = null;
  var extras = [], extrasDeLinea = null, cargandoExtras = false;
  var lineaId = function(){ try { return (typeof _crmLineaActualId !== 'undefined') ? _crmLineaActualId : null; } catch(e){ return null; } };
  var admin = function(){ try { return typeof isAdminUser === 'function' && isAdminUser(); } catch(e){ return false; } };
  var hilos = function(){ try { return _waHilos || []; } catch(e){ return []; } };
  var hiloPorId = function(id){ return hilos().find(function(h){ return h.id === id; }) || extras.find(function(h){ return h.id === id; }) || null; };
  var etqDe = function(h){ var a = h && h.etiquetas; return Array.isArray(a) ? a : []; };
  var repintarLista = function(){ try { if (typeof _pintarWhatsappLista === 'function') _pintarWhatsappLista(); } catch(e){} };

  async function cargarEtiquetas(forzar){
    if (etiquetasCargadas && !forzar) return etiquetas;
    try { var r = await supabaseClient.from('whatsapp_etiquetas').select('id,nombre,color,orden').order('orden').order('nombre'); if (!r.error){ etiquetas = r.data || []; etiquetasCargadas = true; } } catch(e){}
    return etiquetas;
  }
  // Conversaciones fijadas o archivadas que pueden no estar en la página cargada de la lista.
  // Sin las copias 'duplicado:' de la unión del 3-oct (2,478): no son chats reales, solo respaldo.
  async function cargarExtras(){
    var lid = lineaId(); if (!lid || cargandoExtras) return;
    cargandoExtras = true;
    try {
      var r = await supabaseClient.from('whatsapp_hilos').select('*, whatsapp_lineas(nombre)').eq('linea_id', lid).or('fijado_en.not.is.null,estado.eq.archivado').not('telefono_e164', 'like', 'duplicado:%').limit(300);
      if (r.error || lid !== lineaId()) return;
      var yo = null; try { yo = _crmMiIdentidad(); } catch(e){}
      extras = (r.data || []).filter(function(h){ return admin() || !h.asignado_id || (yo && String(h.asignado_id) === String(yo.id)); });
      extrasDeLinea = lid;
      repintarLista();
    } catch(e){} finally { cargandoExtras = false; }
  }
  function mezclarExtras(){
    var base = hilos(); if (!Array.isArray(base)) return;
    var ids = new Set(base.map(function(h){ return h.id; }));
    extras.forEach(function(h){ if (!ids.has(h.id)) base.push(h); });
  }
  function envolverFiltro(){
    if (typeof window._crmHilosFiltrados !== 'function' || window._crmHilosFiltrados.__bcwaF3) return;
    var orig = window._crmHilosFiltrados;
    var nuevo = function(){
      if (extrasDeLinea === lineaId()) mezclarExtras();
      try { nombresGuardados(); } catch(e){}
      var lista = orig.apply(this, arguments) || [];
      if (!esWaCanal()) return lista;
      lista = lista.filter(function(h){
        var arch = h.estado === 'archivado';
        if (modoArchivados ? !arch : arch) return false;
        if (filtroEtiqueta && etqDe(h).indexOf(filtroEtiqueta) < 0) return false;
        return true;
      });
      if (!modoArchivados){
        var fij = lista.filter(function(h){ return h.fijado_en; }).sort(function(a, b){ return String(b.fijado_en).localeCompare(String(a.fijado_en)); });
        lista = fij.concat(lista.filter(function(h){ return !h.fijado_en; }));
      }
      return lista;
    };
    nuevo.__bcwaF3 = true; window._crmHilosFiltrados = nuevo;
  }
  // Contacto guardado: si el chat está ligado a un cliente, se muestra el nombre guardado (como la agenda del teléfono).
  // El nombre que el cliente puso en su WhatsApp se conserva en h._nombreWa (se ve en la Info. del contacto).
  function nombreCliente(c){ return c ? ((c.nombre || '') + ' ' + (c.apellido || '')).trim() : ''; }
  function nombresGuardados(){
    if (typeof cache === 'undefined' || !cache || !cache.clientes || !cache.clientes.length) return;
    var hilos = []; try { hilos = _waHilos || []; } catch(e){}
    var mapa = {}; cache.clientes.forEach(function(c){ mapa[c.id] = c; });
    hilos.concat(extras || []).forEach(function(h){
      if (!h || !h.cliente_id) return;
      var n = nombreCliente(mapa[h.cliente_id]); if (!n) return;
      if (h.nombre_perfil !== n){ if (h._nombreWa === undefined || h.nombre_perfil !== h._nombreGuardado) h._nombreWa = h.nombre_perfil; h.nombre_perfil = n; }
      h._nombreGuardado = n;
    });
  }
  async function editarNombreContacto(){
    var h = hiloActual(); if (!h) return;
    if (!h.cliente_id){ cerrarInfo(); if (typeof window._waCrearYVincular === 'function') await window._waCrearYVincular('whatsapp_hilos', h.id); return; }
    var cli = (cache.clientes || []).find(function(c){ return c.id === h.cliente_id; }); if (!cli) return;
    var nuevo = await pedirTexto('Nombre del contacto' + (h.telefono_e164 ? '\n' + h.telefono_e164 : ''), { valor: nombreCliente(cli), placeholder: 'Nombre y apellido' });
    if (nuevo === null) return; nuevo = nuevo.trim(); if (!nuevo || nuevo === nombreCliente(cli)) return;
    var r = await supabaseClient.from('clientes').update({ nombre: nuevo, apellido: null }).eq('id', cli.id);
    if (r.error){ try { toastError('No se pudo guardar el nombre.'); } catch(e){} return; }
    cli.nombre = nuevo; cli.apellido = null;
    nombresGuardados();
    try { toast('Nombre guardado'); } catch(e){}
    refrescarNombreVisible(h);
    if (panelInfo() && panelInfo().classList.contains('ver')) pintarInfo();
  }
  // Redibuja la lista y el nombre de la cabecera (la recarga "silenciosa" del CRM no repinta nombres)
  function refrescarNombreVisible(h){
    try { if (typeof _pintarWhatsappLista === 'function' && document.getElementById('waLista')) _pintarWhatsappLista(); } catch(e){}
    try {
      if (!h || hiloId() !== h.id) return;
      var n = document.querySelector('#waDetalle .wa-chat-head > div:not(.wa-avatar) > div');
      if (n && n.textContent !== h.nombre_perfil) n.textContent = h.nombre_perfil;
      var av = document.querySelector('#waDetalle .wa-chat-head .wa-avatar');
      if (av){ var ini = ''; try { ini = _waIniciales(h.nombre_perfil); } catch(e){} if (ini && av.textContent !== ini) av.textContent = ini; }
    } catch(e){}
  }
  // Al ligar un chat a un cliente (o crear uno nuevo), mostrar enseguida el nombre guardado
  function envolverVincular(){
    if (typeof window._waVincularCliente !== 'function' || window._waVincularCliente.__bcwaN) return;
    var orig = window._waVincularCliente;
    var nuevo = async function(tabla, id){
      var r = await orig.apply(this, arguments);
      if (tabla === 'whatsapp_hilos'){ try { nombresGuardados(); if (hiloId() === id && typeof _pintarWhatsappDetalle === 'function') _pintarWhatsappDetalle(); refrescarNombreVisible(hiloPorId(id)); if (panelInfo() && panelInfo().classList.contains('ver')) pintarInfo(); } catch(e){} }
      return r;
    };
    nuevo.__bcwaN = true; window._waVincularCliente = nuevo;
  }
  window._bcWaEditarNombre = editarNombreContacto;
  var esWaCanal = function(){ var v = vista(); return !v || v.dataset.socialChannel === 'whatsapp' || !v.dataset.socialChannel; };

  async function actualizarHilo(id, cambios, msgOk){
    var h = hiloPorId(id); if (!h) return false;
    var antes = {}; Object.keys(cambios).forEach(function(k){ antes[k] = h[k]; h[k] = cambios[k]; });
    var x = extras.find(function(e){ return e.id === id; }); if (x && x !== h) Object.assign(x, cambios);
    if ((cambios.fijado_en || cambios.estado === 'archivado') && !extras.some(function(e){ return e.id === id; })) extras.push(h);
    repintarLista();
    try {
      var r = await supabaseClient.from('whatsapp_hilos').update(cambios).eq('id', id);
      if (r.error) throw r.error;
      if (msgOk) try { toast(msgOk); } catch(e){}
      return true;
    } catch(e){
      Object.assign(h, antes); repintarLista();
      try { toastError('No se pudo guardar el cambio.'); } catch(_){}
      return false;
    }
  }
  var acciones = {
    fijar: function(id){
      var h = hiloPorId(id); if (!h) return;
      if (!h.fijado_en){
        var n = hilos().filter(function(x){ return x.fijado_en && x.linea_id === h.linea_id; }).length;
        if (n >= 3){ try { toastError('Solo puedes fijar 3 chats. Desfija uno primero.'); } catch(e){} return; }
      }
      actualizarHilo(id, { fijado_en: h.fijado_en ? null : new Date().toISOString() }, h.fijado_en ? 'Chat desfijado' : 'Chat fijado');
    },
    archivar: function(id){
      var h = hiloPorId(id); if (!h) return;
      var arch = h.estado === 'archivado';
      if (!arch && hiloId() === id){ try { volverListaWhatsapp(); } catch(e){} }
      actualizarHilo(id, { estado: arch ? 'abierto' : 'archivado' }, arch ? 'Chat desarchivado' : 'Chat archivado');
    },
    silenciar: function(id){
      var h = hiloPorId(id); if (!h) return;
      actualizarHilo(id, { silenciado: !h.silenciado }, h.silenciado ? 'Notificaciones activadas' : 'Chat silenciado');
    },
    noLeido: function(id){
      var h = hiloPorId(id); if (!h) return;
      var leer = (h.no_leidos_count || 0) > 0;
      if (!leer && hiloId() === id){ try { volverListaWhatsapp(); } catch(e){} }
      actualizarHilo(id, { no_leidos_count: leer ? 0 : 1 }, leer ? 'Marcado como leído' : 'Marcado como no leído');
    },
    etiquetar: function(id){ abrirEtiquetas(id); },
    info: function(id){ if (hiloId() !== id){ try { abrirHiloWhatsapp(id); } catch(e){} setTimeout(abrirInfo, 900); } else abrirInfo(); },
    buscar: function(){ abrirBuscar(); }
  };
  window._bcWaChatAccion = function(accion, id){ cerrarMenuChat(); if (acciones[accion]) acciones[accion](id || hiloId()); };

  // ---------- Menú de chat (chevron en la fila, ⋮ en la cabecera, mantener presionado en el celular) ----------
  function opcionesChat(h, enCabecera){
    if (!h) return [];
    var o = [];
    if (enCabecera){ o.push(['info', 'info-circle', 'Info. del contacto']); o.push(['buscar', 'search', 'Buscar']); }
    o.push(['archivar', h.estado === 'archivado' ? 'archive-off' : 'archive', h.estado === 'archivado' ? 'Desarchivar chat' : 'Archivar chat']);
    o.push(['silenciar', h.silenciado ? 'bell' : 'bell-off', h.silenciado ? 'Activar notificaciones' : 'Silenciar notificaciones']);
    if (h.estado !== 'archivado') o.push(['fijar', h.fijado_en ? 'pinned-off' : 'pin', h.fijado_en ? 'Desfijar chat' : 'Fijar chat']);
    o.push(['noLeido', (h.no_leidos_count || 0) > 0 ? 'message-check' : 'message-dots', (h.no_leidos_count || 0) > 0 ? 'Marcar como leído' : 'Marcar como no leído']);
    o.push(['etiquetar', 'tag', 'Etiquetar chat']);
    return o;
  }
  function cerrarMenuChat(){ var m = document.getElementById('bcwaMenuChat'); if (m) m.remove(); var s = document.getElementById('bcwaHoja'); if (s) s.remove(); }
  function abrirMenuChat(id, anclaEl, enCabecera){
    cerrarMenuChat();
    var h = hiloPorId(id); if (!h) return;
    var ops = opcionesChat(h, enCabecera);
    if (movil()){
      var hoja = document.createElement('div'); hoja.id = 'bcwaHoja'; hoja.className = 'bcwa-hoja';
      hoja.innerHTML = '<div class="bcwa-hoja-caja" role="menu"><div class="bcwa-hoja-agarre"></div><div class="bcwa-hoja-tit">' + esc(h.nombre_perfil || h.telefono_e164 || '') + '</div>' +
        ops.map(function(o){ return '<button type="button" role="menuitem" data-a="' + o[0] + '"><i class="ti ti-' + o[1] + '"></i>' + esc(o[2]) + '</button>'; }).join('') + '</div>';
      document.body.appendChild(hoja);
      var abierta = Date.now();
      // El toque que abrió la hoja (mantener presionado) puede soltar un clic justo después: ignorarlo.
      hoja.addEventListener('click', function(e){ if (Date.now() - abierta < 450) return; var b = e.target.closest('button[data-a]'); if (b) window._bcWaChatAccion(b.dataset.a, id); else if (e.target === hoja) cerrarMenuChat(); });
      return;
    }
    var m = document.createElement('div'); m.id = 'bcwaMenuChat'; m.className = 'bcwa-menu-chat'; m.setAttribute('role', 'menu');
    m.innerHTML = ops.map(function(o){ return '<button type="button" role="menuitem" data-a="' + o[0] + '"><i class="ti ti-' + o[1] + '"></i>' + esc(o[2]) + '</button>'; }).join('');
    document.body.appendChild(m);
    var r = anclaEl.getBoundingClientRect(), w = m.offsetWidth, hgt = m.offsetHeight;
    var left = Math.min(window.innerWidth - w - 8, Math.max(8, r.right - w)), top = r.bottom + 4;
    if (top + hgt > window.innerHeight - 8) top = Math.max(8, r.top - hgt - 4);
    m.style.left = left + 'px'; m.style.top = top + 'px';
    m.addEventListener('click', function(e){ var b = e.target.closest('button[data-a]'); if (b) window._bcWaChatAccion(b.dataset.a, id); });
  }
  document.addEventListener('click', function(e){
    var mc = document.getElementById('bcwaMenuChat');
    if (mc && !mc.contains(e.target) && !(e.target.closest && e.target.closest('.bcwa-row-menu, .bcwa-mas'))) cerrarMenuChat();
  }, true);
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    if (document.getElementById('bcwaMenuChat') || document.getElementById('bcwaHoja') || document.getElementById('bcwaEtq')){ e.preventDefault(); e.stopImmediatePropagation(); cerrarMenuChat(); cerrarEtiquetas(); }
  }, true);

  // Mantener presionado (celular) sobre una fila
  var lp = null;
  document.addEventListener('pointerdown', function(e){
    if (!movil() || !esWa()) return;
    var row = e.target.closest && e.target.closest('#waLista .wa-row[data-hiloid]'); if (!row) return;
    var x0 = e.clientX, y0 = e.clientY;
    lp = { row: row, t: setTimeout(function(){ lp && (lp.hecho = true); if (navigator.vibrate) try { navigator.vibrate(12); } catch(_){} row.classList.add('bcwa-presionada'); abrirMenuChat(row.dataset.hiloid, row, false); setTimeout(function(){ row.classList.remove('bcwa-presionada'); }, 300); }, 520), x0: x0, y0: y0 };
  }, true);
  var cancelarLp = function(e){ if (!lp) return; if (e && e.type === 'pointermove' && Math.hypot(e.clientX - lp.x0, e.clientY - lp.y0) < 10) return; clearTimeout(lp.t); if (e && e.type !== 'pointermove' && lp.hecho){ var r = lp.row; r.__bcwaSinClick = true; setTimeout(function(){ r.__bcwaSinClick = false; }, 450); } if (!e || e.type !== 'pointermove' || !lp.hecho) lp = (e && e.type === 'pointermove') ? null : null; };
  document.addEventListener('pointerup', cancelarLp, true);
  document.addEventListener('pointercancel', cancelarLp, true);
  document.addEventListener('pointermove', cancelarLp, true);
  document.addEventListener('click', function(e){ var row = e.target.closest && e.target.closest('#waLista .wa-row'); if (row && row.__bcwaSinClick){ e.preventDefault(); e.stopPropagation(); row.__bcwaSinClick = false; } }, true);
  document.addEventListener('contextmenu', function(e){ if (movil() && e.target.closest && e.target.closest('#waLista .wa-row')) e.preventDefault(); }, true);

  // ---------- Etiquetas ----------
  function cerrarEtiquetas(){ var x = document.getElementById('bcwaEtq'); if (x) x.remove(); }
  async function abrirEtiquetas(id){
    cerrarMenuChat(); cerrarEtiquetas();
    var h = hiloPorId(id); if (!h) return;
    await cargarEtiquetas(true);
    var sel = new Set(etqDe(h));
    var cap = document.createElement('div'); cap.id = 'bcwaEtq'; cap.className = 'bcwa-hoja bcwa-etq';
    var pintar = function(){
      cap.innerHTML = '<div class="bcwa-hoja-caja" role="dialog" aria-label="Etiquetar chat"><div class="bcwa-hoja-agarre"></div><div class="bcwa-hoja-tit">Etiquetar chat</div>' +
        (etiquetas.length ? etiquetas.map(function(t){ return '<label class="bcwa-etq-fila"><i class="ti ti-circle-filled" style="color:' + esc(t.color) + '"></i><span>' + esc(t.nombre) + '</span><input type="checkbox" data-id="' + esc(t.id) + '"' + (sel.has(t.id) ? ' checked' : '') + '>' + (admin() ? '<button type="button" class="bcwa-etq-del" data-del="' + esc(t.id) + '" title="Borrar etiqueta" aria-label="Borrar etiqueta"><i class="ti ti-trash"></i></button>' : '') + '</label>'; }).join('') : '<div class="vacio">Todavía no hay etiquetas.</div>') +
        (admin() ? '<div class="bcwa-etq-nueva"><input type="text" maxlength="30" placeholder="Nueva etiqueta" aria-label="Nombre de la nueva etiqueta"><input type="color" value="#25d366" aria-label="Color"><button type="button" class="bcwa-etq-crear">Agregar</button></div>' : '') +
        '<div class="bcwa-etq-pie"><button type="button" class="bcwa-etq-cancelar">Cancelar</button><button type="button" class="bcwa-etq-guardar">Guardar</button></div></div>';
    };
    pintar(); document.body.appendChild(cap);
    cap.addEventListener('change', function(e){ var c = e.target; if (c.matches('input[type=checkbox][data-id]')){ if (c.checked) sel.add(c.dataset.id); else sel.delete(c.dataset.id); } });
    cap.addEventListener('click', async function(e){
      if (e.target === cap || e.target.closest('.bcwa-etq-cancelar')){ cerrarEtiquetas(); return; }
      if (e.target.closest('.bcwa-etq-guardar')){ var lista = Array.from(sel).filter(function(x){ return etiquetas.some(function(t){ return t.id === x; }); }); cerrarEtiquetas(); var hm = (_waHilos || []).find(function(x){ return x.id === id; }); if (hm) hm.etiquetas = lista; actualizarHilo(id, { etiquetas: lista }, 'Etiquetas guardadas'); setTimeout(botonEtiquetasCabecera, 50); setTimeout(botonEtiquetasCabecera, 1200); return; }
      var del = e.target.closest('.bcwa-etq-del');
      if (del){ e.preventDefault(); var t = etiquetas.find(function(x){ return x.id === del.dataset.del; }); var okb = true; try { okb = await confirmar('¿Borrar la etiqueta "' + (t ? t.nombre : '') + '"? Se quita de todos los chats.'); } catch(_){}
        if (!okb) return; var r = await supabaseClient.from('whatsapp_etiquetas').delete().eq('id', del.dataset.del); if (!r.error){ sel.delete(del.dataset.del); await cargarEtiquetas(true); pintar(); } return; }
      if (e.target.closest('.bcwa-etq-crear')){
        var nom = cap.querySelector('.bcwa-etq-nueva input[type=text]').value.trim(), col = cap.querySelector('.bcwa-etq-nueva input[type=color]').value;
        if (!nom) return;
        var r2 = await supabaseClient.from('whatsapp_etiquetas').insert({ nombre: nom, color: col, orden: etiquetas.length + 1 }).select('id').single();
        if (!r2.error){ sel.add(r2.data.id); await cargarEtiquetas(true); pintar(); } else { try { toastError('No se pudo crear la etiqueta.'); } catch(_){} }
      }
    });
  }

  // ---------- Pintar indicadores en la lista + fila "Archivados" + chips de etiqueta ----------
  function decorarLista(){
    var lista = document.getElementById('waLista'); if (!lista) return;
    // Fila "Archivados" (arriba, como WhatsApp) o cabecera de vuelta en modo archivados
    var nArch = extras.filter(function(h){ return h.estado === 'archivado'; }).length;
    var fila = lista.querySelector(':scope > .bcwa-archivados');
    var html = modoArchivados ? '<i class="ti ti-arrow-left"></i><b>Archivados</b><span></span>' : '<i class="ti ti-archive"></i><b>Archivados</b><span>' + (nArch || '') + '</span>';
    if (!modoArchivados && !nArch){ if (fila) fila.remove(); }
    else {
      if (!fila){ fila = document.createElement('button'); fila.type = 'button'; fila.className = 'bcwa-archivados'; fila.addEventListener('click', function(){ modoArchivados = !modoArchivados; repintarLista(); var l = document.getElementById('waLista'); if (l) l.scrollTop = 0; }); }
      if (lista.firstElementChild !== fila) lista.insertBefore(fila, lista.firstChild);
      if (fila.innerHTML !== html) fila.innerHTML = html;
    }
    lista.querySelectorAll('.wa-row[data-hiloid]').forEach(function(row){
      var h = hiloPorId(row.dataset.hiloid); if (!h) return;
      // chevron (PC)
      if (!row.querySelector('.bcwa-row-menu')){
        var b = document.createElement('button'); b.type = 'button'; b.className = 'bcwa-row-menu'; b.setAttribute('aria-label', 'Opciones del chat'); b.innerHTML = '<i class="ti ti-chevron-down"></i>';
        b.addEventListener('click', function(ev){ ev.stopPropagation(); ev.preventDefault(); abrirMenuChat(row.dataset.hiloid, b, false); });
        var der = row.querySelector('.fila-badge, .fila-pendiente'); var cont = der ? der.parentNode : row.lastElementChild; cont.appendChild(b);
      }
      var iconos = (h.fijado_en ? '<i class="ti ti-pin-filled" title="Fijado"></i>' : '') + (h.silenciado ? '<i class="ti ti-volume-off" title="Silenciado"></i>' : '');
      var ic = row.querySelector('.bcwa-row-ic');
      if (iconos){ if (!ic){ ic = document.createElement('span'); ic.className = 'bcwa-row-ic'; var p = row.querySelector('.fila-badge, .fila-pendiente, .bcwa-row-menu'); p.parentNode.insertBefore(ic, p); } if (ic.innerHTML !== iconos) ic.innerHTML = iconos; }
      else if (ic) ic.remove();
      var tags = etqDe(h).map(function(id){ var t = etiquetas.find(function(x){ return x.id === id; }); return t ? '<i class="ti ti-circle-filled" style="color:' + esc(t.color) + '" title="' + esc(t.nombre) + '"></i>' : ''; }).join('');
      var tg = row.querySelector('.bcwa-row-tags');
      if (tags){ if (!tg){ tg = document.createElement('span'); tg.className = 'bcwa-row-tags'; var nom = row.querySelector('.fila-nombre'); nom.parentNode.insertBefore(tg, nom.nextSibling); } if (tg.innerHTML !== tags) tg.innerHTML = tags; }
      else if (tg) tg.remove();
    });
    // Filtro por etiqueta: UN solo botón "Etiquetas ▾" (antes 6 chips que hacían saltar la barra a otra línea)
    var chips = document.getElementById('crmChipsRow');
    var viejo = chips && chips.querySelector(':scope > .bcwa-chips-etq'); if (viejo) viejo.remove();
    if (chips && etiquetas.length){
      var btn = chips.querySelector(':scope > .bcwa-etq-filtro');
      var sel = filtroEtiqueta && etiquetas.find(function(t){ return t.id === filtroEtiqueta; });
      var bhtml = '<i class="ti ti-' + (sel ? 'circle-filled' : 'tag') + '"' + (sel ? ' style="color:' + esc(sel.color) + '"' : '') + '></i> ' + esc(sel ? sel.nombre : 'Etiquetas') + ' <i class="ti ti-chevron-down"></i>';
      if (!btn){ btn = document.createElement('button'); btn.type = 'button'; btn.className = 'crm-chip bcwa-etq-filtro'; btn.setAttribute('aria-haspopup', 'menu'); chips.appendChild(btn);
        btn.addEventListener('click', function(e){ e.stopPropagation(); abrirMenuEtiquetaFiltro(btn); }); }
      btn.classList.toggle('on', !!sel);
      if (btn.innerHTML !== bhtml) btn.innerHTML = bhtml;
    }
  }
  function abrirMenuEtiquetaFiltro(ancla){
    var ya = document.getElementById('bcwaMenuEtq'); if (ya){ ya.remove(); return; }
    var m = document.createElement('div'); m.id = 'bcwaMenuEtq'; m.className = 'bcwa-menu-chat'; m.setAttribute('role', 'menu');
    m.innerHTML = '<button type="button" role="menuitem" data-etq=""><i class="ti ti-tags-off"></i>Todas las etiquetas</button>' +
      etiquetas.map(function(t){ return '<button type="button" role="menuitem" data-etq="' + esc(t.id) + '"' + (filtroEtiqueta === t.id ? ' class="on"' : '') + '><i class="ti ti-circle-filled" style="color:' + esc(t.color) + '"></i>' + esc(t.nombre) + '</button>'; }).join('');
    document.body.appendChild(m);
    var r = ancla.getBoundingClientRect();
    m.style.left = Math.min(window.innerWidth - m.offsetWidth - 8, Math.max(8, r.left)) + 'px'; m.style.top = (r.bottom + 4) + 'px';
    m.addEventListener('click', function(e){ var b = e.target.closest('[data-etq]'); if (!b) return; filtroEtiqueta = b.dataset.etq || null; m.remove(); repintarLista(); decorarLista(); });
    setTimeout(function(){ document.addEventListener('click', function cerrar(ev){ if (!m.contains(ev.target)){ m.remove(); document.removeEventListener('click', cerrar, true); } }, true); }, 0);
  }
  // =====================================================================
  // CONTACTOS (3 oct 2026): botón en las acciones rápidas del CRM, como "Nuevo chat"
  // de WhatsApp. Busca por nombre o número entre los chats (todas las líneas que el
  // usuario puede ver, RLS) y los clientes del taller; al tocar abre ese chat
  // (cambiando de sucursal/línea si hace falta).
  // =====================================================================
  var lineasInfo = null;
  async function cargarLineasInfo(){
    if (lineasInfo) return lineasInfo;
    var r = await supabaseClient.from('whatsapp_lineas').select('id,nombre,sucursal_id,sucursales(nombre)');
    lineasInfo = {}; (r.data || []).forEach(function(l){ lineasInfo[l.id] = { linea: l.nombre || '', sucursal: (l.sucursales && l.sucursales.nombre) || '' }; });
    return lineasInfo;
  }
  function botonContactos(){
    // 3 oct 2026: junto a Buscar y Filtros (antes era un iconito suelto en las acciones rápidas y no se veía)
    var cont = document.querySelector('#v-crmLinea .crm-busq-row'); if (!cont || document.getElementById('bcwaContactosBtn')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'bcwaContactosBtn'; b.className = 'crm-filtros-btn pill-elevado bcwa-contactos-btn';
    b.title = 'Buscar contactos de todas las sucursales'; b.setAttribute('aria-label', 'Contactos'); b.innerHTML = '<i class="ti ti-address-book"></i> <span>Contactos</span>';
    b.addEventListener('click', abrirContactos);
    var filtros = document.getElementById('crmFiltrosBtn');
    cont.insertBefore(b, filtros || null);
  }
  function cerrarContactos(){ var m = document.getElementById('bcwaContactos'); if (m) m.remove(); }
  function abrirContactos(){
    cerrarContactos();
    var m = document.createElement('div'); m.id = 'bcwaContactos'; m.className = 'bcwa-hoja bcwa-contactos';
    m.innerHTML = '<div class="bcwa-hoja-caja" role="dialog" aria-label="Contactos"><div class="bcwa-hoja-agarre"></div>' +
      '<div class="bcwa-ct-head"><b>Contactos</b><button type="button" class="bcwa-ct-x" aria-label="Cerrar"><i class="ti ti-x"></i></button></div>' +
      '<div class="bcwa-ct-busq"><i class="ti ti-search"></i><input type="search" placeholder="Buscar por nombre o número" aria-label="Buscar contacto" autocomplete="off"></div>' +
      '<div class="bcwa-ct-res"><div class="vacio">Escribe un nombre o un número para buscar en todos los chats y clientes del taller.</div></div></div>';
    document.body.appendChild(m);
    var inp = m.querySelector('input'), res = m.querySelector('.bcwa-ct-res'), t = null, tok = 0;
    m.addEventListener('click', function(e){
      if (e.target === m || e.target.closest('.bcwa-ct-x')){ cerrarContactos(); return; }
      var f = e.target.closest('[data-hilo]'); if (f){ cerrarContactos(); irAHilo(f.dataset.hilo, f.dataset.linea); }
    });
    inp.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ e.stopPropagation(); cerrarContactos(); } if (e.key === 'Enter'){ var p = res.querySelector('[data-hilo]'); if (p) p.click(); } });
    inp.addEventListener('input', function(){ clearTimeout(t); t = setTimeout(function(){ buscarContactos(inp.value, res, ++tok, function(){ return tok; }); }, 250); });
    setTimeout(function(){ inp.focus(); }, 50);
  }
  async function buscarContactos(q, res, miTok, tokActual){
    q = (q || '').trim();
    if (q.length < 2){ res.innerHTML = '<div class="vacio">Escribe al menos 2 letras o números.</div>'; return; }
    res.innerHTML = '<div class="vacio">Buscando…</div>';
    try {
      var lineas = await cargarLineasInfo();
      var dig = q.replace(/\D/g, ''), texto = q.replace(/[%,()]/g, ' ').trim();
      var clis = (cache.clientes || []).filter(function(c){
        var n = (((c.nombre || '') + ' ' + (c.apellido || '')).toLowerCase());
        var tel = String(c.whatsapp_e164 || c.whatsapp || '').replace(/\D/g, '');
        return n.indexOf(q.toLowerCase()) >= 0 || (dig.length >= 3 && tel.indexOf(dig) >= 0);
      }).slice(0, 40);
      var filtros = [];
      if (texto && !/^\d+$/.test(texto)) filtros.push('nombre_perfil.ilike.%' + texto + '%');
      if (dig.length >= 3) filtros.push('telefono_e164.ilike.%' + dig + '%');
      if (clis.length) filtros.push('cliente_id.in.(' + clis.map(function(c){ return c.id; }).join(',') + ')');
      var hilos = [];
      if (filtros.length){
        var r = await supabaseClient.from('whatsapp_hilos').select('id,linea_id,telefono_e164,nombre_perfil,cliente_id,ultimo_mensaje_at,estado')
          .or(filtros.join(',')).not('telefono_e164', 'like', 'duplicado:%').order('ultimo_mensaje_at', { ascending: false }).limit(40);
        hilos = r.data || [];
      }
      if (tokActual() !== miTok) return;
      var mapaCli = {}; (cache.clientes || []).forEach(function(c){ mapaCli[c.id] = c; });
      var conChat = {};
      var filas = hilos.map(function(h){
        if (h.cliente_id) conChat[h.cliente_id] = true;
        var c = h.cliente_id && mapaCli[h.cliente_id];
        var nombre = c ? nombreCliente(c) : (h.nombre_perfil || h.telefono_e164 || 'Sin nombre');
        var li = lineas[h.linea_id] || {};
        var ini = ''; try { ini = _waIniciales(nombre); } catch(e){ ini = nombre.slice(0, 2).toUpperCase(); }
        return '<button type="button" class="bcwa-ct-fila" data-hilo="' + esc(h.id) + '" data-linea="' + esc(h.linea_id) + '"><span class="bcwa-ct-av">' + esc(ini) + '</span><span class="bcwa-ct-tx"><b>' + esc(nombre) + (c ? ' <i class="ti ti-user-check" title="Cliente del taller"></i>' : '') + '</b><small>' + esc((h.telefono_e164 || '').replace(/^bsid:.*/, 'Contacto de anuncio')) + ' · ' + esc((li.sucursal ? li.sucursal + ' · ' : '') + (li.linea || '')) + (h.estado === 'archivado' ? ' · archivado' : '') + '</small></span><i class="ti ti-chevron-right"></i></button>';
      });
      var sinChat = clis.filter(function(c){ return !conChat[c.id]; }).slice(0, 15).map(function(c){
        var tel = c.whatsapp_e164 || c.whatsapp || '';
        return '<div class="bcwa-ct-fila off"><span class="bcwa-ct-av">' + esc((function(){ try { return _waIniciales(nombreCliente(c)); } catch(e){ return '?'; } })()) + '</span><span class="bcwa-ct-tx"><b>' + esc(nombreCliente(c)) + '</b><small>' + esc(tel || 'Sin número') + ' · sin chat de WhatsApp todavía</small></span></div>';
      });
      res.innerHTML = (filas.length ? '<div class="bcwa-ct-t">Chats</div>' + filas.join('') : '') +
        (sinChat.length ? '<div class="bcwa-ct-t">Clientes del taller sin chat</div>' + sinChat.join('') : '') ||
        '<div class="vacio">No se encontró ningún contacto con “' + esc(q) + '”.</div>';
    } catch(e){
      if (tokActual() === miTok) res.innerHTML = '<div class="vacio">No se pudo buscar. Revisa la conexión e intenta de nuevo.</div>';
    }
  }
  async function irAHilo(hiloIdDest, lineaDest){
    try {
      if (lineaId() !== lineaDest){
        var li = (await cargarLineasInfo())[lineaDest] || {};
        seleccionarLineaCRM(lineaDest, li.sucursal || '', li.linea || '');
        try { localStorage.setItem('bayol_subtab_crmlinea', 'mensajes'); } catch(e){}
        for (var k = 0; k < 30 && !(_waHilos || []).some(function(h){ return h.linea_id === lineaDest; }); k++) await new Promise(function(r){ setTimeout(r, 200); });
      }
      if (!(_waHilos || []).some(function(h){ return h.id === hiloIdDest; })){
        var r = await supabaseClient.from('whatsapp_hilos').select('*, whatsapp_lineas(nombre)').eq('id', hiloIdDest).maybeSingle();
        if (r.data){ _waHilos.unshift(r.data); try { _crmRtOrdenarHilos(); } catch(e){} }
      }
      await abrirHiloWhatsapp(hiloIdDest);
    } catch(e){ try { toastError('No se pudo abrir el chat.'); } catch(_){} }
  }
  window._bcWaAbrirContactos = abrirContactos;

  function botonMasCabecera(){
    var head = document.querySelector('#waDetalle .wa-chat-head'); if (!head || head.querySelector('.bcwa-mas')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'bcwa-hbtn bcwa-mas'; b.title = 'Menú'; b.setAttribute('aria-label', 'Menú del chat');
    b.innerHTML = '<i class="ti ti-dots-vertical"></i>';
    b.addEventListener('click', function(e){ e.stopPropagation(); abrirMenuChat(hiloId(), b, true); });
    var lupa = head.querySelector('.bcwa-lupa'); head.insertBefore(b, lupa ? lupa.nextSibling : null);
  }

  // Chat REFERIDO desde otra sucursal (3 oct 2026): aviso arriba de los mensajes con quién lo pasó, la nota y un botón
  // "Escribirle desde mi WhatsApp" (abre el WhatsApp de este teléfono/computadora con el número del cliente; así la
  // vendedora le escribe desde su número aunque el cliente nunca le haya escrito a esta línea).
  var referidoCache = {};
  async function cargarReferido(id){
    if (!id || referidoCache.hasOwnProperty(id)) return;
    referidoCache[id] = null;
    try {
      var r = await supabaseClient.from('whatsapp_referidos').select('id,de_nombre,nota,creado_en,linea_origen').eq('hilo_destino', id).order('creado_en', { ascending: false }).limit(1);
      var ref = r.data && r.data[0];
      if (ref){
        var li = (await cargarLineasInfo())[ref.linea_origen] || {};
        ref._linea = (li.sucursal ? li.sucursal + ' · ' : '') + (li.linea || '');
        referidoCache[id] = ref; avisoReferido();
      }
    } catch(e){}
  }
  function avisoReferido(){
    var id = hiloId(), ref = id && referidoCache[id];
    var det = document.getElementById('waDetalle'); if (!det) return;
    var ya = det.querySelector('.bcwa-referido');
    if (!ref){ if (ya) ya.remove(); return; }
    if (ya && ya.dataset.hilo === id) return;
    if (ya) ya.remove();
    var h = hiloActual(), tel = String((h && h.telefono_e164) || '').replace(/\D/g, '');
    var box = document.createElement('div'); box.className = 'bcwa-referido'; box.dataset.hilo = id;
    var cuando = ''; try { cuando = new Date(ref.creado_en).toLocaleString('es-DO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); } catch(e){}
    box.innerHTML = '<i class="ti ti-arrow-forward-up"></i><div class="tx"><b>Cliente referido' + (ref._linea ? ' desde ' + esc(ref._linea) : '') + '</b>' +
      '<span>Lo pasó ' + esc(ref.de_nombre || 'un compañero') + (cuando ? ' · ' + esc(cuando) : '') + '</span>' +
      (ref.nota ? '<em>“' + esc(ref.nota) + '”</em>' : '') + '</div>' +
      (tel ? '<a class="bcwa-referido-btn" href="https://wa.me/' + tel + '" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i> Escribirle desde mi WhatsApp</a>' : '');
    var scroll = det.querySelector('#waMessagesScroll');
    if (scroll && scroll.parentNode) scroll.parentNode.insertBefore(box, scroll); else det.appendChild(box);
  }

  // Botón "Etiquetas" en la barra del nombre del cliente (3 oct 2026): un toque abre
  // "Etiquetar chat"; muestra los puntos de color de las etiquetas que ya tiene.
  function botonEtiquetasCabecera(){
    var head = document.querySelector('#waDetalle .wa-chat-head'); if (!head) return;
    var b = head.querySelector('.bcwa-etq-btn');
    if (!b){
      b = document.createElement('button'); b.type = 'button'; b.className = 'bcwa-hbtn bcwa-etq-btn'; b.setAttribute('aria-label', 'Etiquetas del chat');
      b.addEventListener('click', function(e){ e.stopPropagation(); abrirEtiquetas(hiloId()); });
      var lupa = head.querySelector('.bcwa-lupa'); head.insertBefore(b, lupa || null);
    }
    var h = hiloActual(), ids = (h && Array.isArray(h.etiquetas)) ? h.etiquetas : [];
    var tags = ids.map(function(id){ return etiquetas.find(function(t){ return t.id === id; }); }).filter(Boolean);
    var html = '<i class="ti ti-tag"></i>' + (tags.length ? '<span class="bcwa-etq-dots">' + tags.slice(0, 3).map(function(t){ return '<i style="background:' + esc(t.color || '#8696a0') + '"></i>'; }).join('') + '</span>' : '');
    var tit = tags.length ? 'Etiquetas: ' + tags.map(function(t){ return t.nombre; }).join(', ') : 'Poner etiqueta';
    if (b.innerHTML !== html) b.innerHTML = html;
    if (b.title !== tit) b.title = tit;
    b.classList.toggle('on', tags.length > 0);
  }


  // Asignarme / Reasignar / Transferir dentro de la barra del nombre (solo PC ≥1025 px, 7 oct 2026).
  // Se MUEVEN los mismos botones (conservan su onclick); en pantallas chicas vuelven a su fila de siempre.
  var pcAncho = function(){ return window.matchMedia && matchMedia('(min-width:1025px)').matches; };
  function asignacionEnCabecera(){
    var head = document.querySelector('#waDetalle .wa-chat-head'); if (!head) return;
    var enCab = head.querySelector(':scope > .bcwa-asig-cab');
    var fila = null, abajo = head.nextElementSibling;
    if (abajo){ var c = abajo.querySelectorAll(':scope > div'); for (var i = 0; i < c.length; i++){ if (c[i].querySelector('[id^="reasignBox_"]')){ fila = c[i]; break; } } }
    if (!fila) return;
    if (!pcAncho()){
      if (enCab){ enCab.classList.remove('bcwa-asig-cab'); fila.insertBefore(enCab, fila.firstChild); }
      fila.classList.remove('bcwa-asig-fila');
      return;
    }
    if (enCab) return;
    var span = fila.querySelector(':scope > span'); if (!span) return;
    span.classList.add('bcwa-asig-cab');
    var ref = head.querySelector('.bcwa-etq-btn') || head.querySelector('.bcwa-lupa') || head.querySelector('.wa-focus-btn');
    head.insertBefore(span, ref || null);
    fila.classList.add('bcwa-asig-fila');
  }

  // =====================================================================
  // Aplicar todo al pintarse el CRM
  // =====================================================================
  var hiloAntes = null;
  function aplicar(){
    if (!document.getElementById('waWrap')) return;
    envolverEnviar(); envolverMenu(); botonContactos(); envolverVincular(); envolverFiltro();
    if (!etiquetasCargadas) cargarEtiquetas().then(function(){ decorarLista(); });
    if (lineaId() && extrasDeLinea !== lineaId()){ extrasDeLinea = lineaId(); modoArchivados = false; filtroEtiqueta = null; cargarExtras(); }
    var id = hiloId();
    if (id !== hiloAntes){
      hiloAntes = id; cerrarBuscar(); cerrarInfo(); if (id) cargarDestacados(id);
      var p = document.querySelector('#waDetalleCol > .bcwa-buscar'); if (p){ var i = p.querySelector('input'); if (i) i.value = ''; p.querySelector('.bcwa-buscar-res').innerHTML = '<div class="vacio">Buscar mensajes de este chat.</div>'; }
    }
    decorarLista();
    if (id){ cargarReferido(id); avisoReferido(); botonLupa(); botonEtiquetasCabecera(); botonMasCabecera(); asignacionEnCabecera(); cabeceraClicable(); restaurarBorrador(); pildoraMovil(); engancharScroll(); contarNuevos(); marcarDestacados(); }
    borradoresEnLista();
  }
  var pendiente = false;
  var obs = new MutationObserver(function(muts){
    if (pendiente) return;
    for (var i = 0; i < muts.length; i++){
      var t = muts[i].target;
      if (t && t.nodeType === 1 && t.closest && t.closest('.bcwa-bajar, .bcwa-fecha, .bcwa-buscar, .bcwa-soltar, .bcwa-info, .bcwa-row-ic, .bcwa-row-tags, .bcwa-archivados, .bcwa-chips-etq, .bcwa-etq-filtro, #bcwaContactosBtn')) continue;
      if (t && t.nodeType === 1 && (t.id === 'waWrap' || (t.closest && t.closest('#waWrap')))){
        pendiente = true;
        Promise.resolve().then(function(){ pendiente = false; try { aplicar(); } catch(e){} });
        return;
      }
    }
  });
  function iniciar(){
    obs.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', function(){ try { pildoraMovil(); } catch(e){} try { asignacionEnCabecera(); } catch(e){} });
    aplicar();
  }
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);
  window.BayolWaIdentico = { version: VERSION, aplicar: aplicar, buscar: abrirBuscar, irA: irA, info: abrirInfo, visor: abrirVisor, destacados: function(){ return Array.from(destacados); }, accion: function(a, id){ window._bcWaChatAccion(a, id); }, etiquetas: function(){ return etiquetas; }, estado: function(){ return { modoArchivados: modoArchivados, filtroEtiqueta: filtroEtiqueta, extras: extras.length }; }, archivados: function(on){ modoArchivados = !!on; repintarLista(); } };
})();
