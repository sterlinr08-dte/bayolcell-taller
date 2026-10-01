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
  var VERSION = '20261002-w1';

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
  // Aplicar todo al pintarse el CRM
  // =====================================================================
  var hiloAntes = null;
  function aplicar(){
    if (!document.getElementById('waWrap')) return;
    envolverEnviar();
    var id = hiloId();
    if (id !== hiloAntes){
      hiloAntes = id; cerrarBuscar();
      var p = document.querySelector('#waDetalleCol > .bcwa-buscar'); if (p){ var i = p.querySelector('input'); if (i) i.value = ''; p.querySelector('.bcwa-buscar-res').innerHTML = '<div class="vacio">Buscar mensajes de este chat.</div>'; }
    }
    if (id){ botonLupa(); restaurarBorrador(); pildoraMovil(); engancharScroll(); contarNuevos(); }
    borradoresEnLista();
  }
  var pendiente = false;
  var obs = new MutationObserver(function(muts){
    if (pendiente) return;
    for (var i = 0; i < muts.length; i++){
      var t = muts[i].target;
      if (t && t.nodeType === 1 && t.closest && t.closest('.bcwa-bajar, .bcwa-fecha, .bcwa-buscar')) continue;
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
  window.BayolWaIdentico = { version: VERSION, aplicar: aplicar, buscar: abrirBuscar, irA: irA };
})();
