/* CRM — Fase 2 (29 sep 2026): las 3 ventanas de chat (WhatsApp, Instagram, Facebook) con el mismo diseño.
   - Separadores de fecha "Hoy / Ayer / Lunes / 12 de septiembre" (fijos arriba al desplazarse, como WhatsApp),
     calculados con data-ts de cada mensaje (WhatsApp lo recibe aquí; Instagram/Facebook ya lo traen en su HTML).
   - Carga crm-chat-unificado.css (burbujas, cabecera, barra de escribir y listas iguales, cada canal con su color).
   No cambia datos ni envíos: solo presentación. */
(function(){
  'use strict';
  if(window.__bcChatUnificado) return;
  window.__bcChatUnificado = true;
  var VERSION = '20260929-f3';

  // 1) Hoja de estilos al final del <head> para que gane a las capas anteriores.
  function cargarCss(){
    var id = 'bcChatUnificadoCss';
    var l = document.getElementById(id);
    if(!l){ l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; l.href = 'crm-chat-unificado.css?v=' + VERSION; }
    document.head.appendChild(l); // appendChild de un nodo existente lo mueve al final
  }
  cargarCss();
  setTimeout(cargarCss, 1500); // por si otra hoja se agregó después (crm-social-hub.css se agrega al iniciar)

  // 2) WhatsApp: cada burbuja lleva su fecha (data-ts) para los separadores.
  function envolverWhatsApp(){
    if(typeof window._waBurbujaRowHTML !== 'function' || window._waBurbujaRowHTML.__bcTs) return !!(window._waBurbujaRowHTML && window._waBurbujaRowHTML.__bcTs);
    var orig = window._waBurbujaRowHTML;
    var nuevo = function(m){
      var html = orig.apply(this, arguments);
      if(!m || !m.creado_en || typeof html !== 'string') return html;
      return html.replace('<div class="wa-brow', '<div data-ts="' + String(m.creado_en).replace(/"/g, '') + '" class="wa-brow');
    };
    nuevo.__bcTs = true;
    window._waBurbujaRowHTML = nuevo;
    return true;
  }
  if(!envolverWhatsApp()){
    var intentos = 0, t = setInterval(function(){ if(envolverWhatsApp() || ++intentos > 60) clearInterval(t); }, 250);
  }

  // 3) Separadores de fecha.
  var DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  function claveDia(d){ return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
  function etiqueta(d){
    var hoy = new Date(); hoy.setHours(0,0,0,0);
    var dia = new Date(d); dia.setHours(0,0,0,0);
    var diff = Math.round((hoy - dia) / 86400000);
    if(diff === 0) return 'Hoy';
    if(diff === 1) return 'Ayer';
    if(diff > 1 && diff < 7) return DIAS[dia.getDay()];
    var opts = { day: 'numeric', month: 'long' };
    if(dia.getFullYear() !== hoy.getFullYear()) opts.year = 'numeric';
    try { return dia.toLocaleDateString('es-DO', opts); } catch(e) { return dia.toLocaleDateString(); }
  }
  var CANALES = [
    { scroller: '#waMessagesScroll', fila: '.wa-brow[data-ts]' },
    { scroller: '#bcIgMessages', fila: '.bc-ig-msg-row[data-ts]' },
    { scroller: '#bcFbMessages', fila: '.bc-fb-row[data-ts]' }
  ];
  function esSep(el){ return el && el.classList && el.classList.contains('bc-date-sep'); }
  function procesar(sc, filaSel){
    var filas = sc.querySelectorAll(filaSel);
    var previa = null, validos = new Set();
    for(var i = 0; i < filas.length; i++){
      var f = filas[i], d = new Date(f.getAttribute('data-ts'));
      if(isNaN(d)) continue;
      var k = claveDia(d);
      if(k !== previa){
        var ant = f.previousElementSibling;
        if(esSep(ant) && ant.getAttribute('data-dia') === k){ validos.add(ant); }
        else {
          var sep = document.createElement('div');
          sep.className = 'bc-date-sep'; sep.setAttribute('data-dia', k); sep.setAttribute('role', 'separator');
          sep.innerHTML = '<span></span>'; sep.firstChild.textContent = etiqueta(d);
          f.parentNode.insertBefore(sep, f); validos.add(sep);
        }
        previa = k;
      }
    }
    sc.querySelectorAll('.bc-date-sep').forEach(function(s){ if(!validos.has(s)) s.remove(); });
  }
  var ocupado = false;
  function procesarTodo(){
    if(ocupado) return;
    ocupado = true;
    try {
      CANALES.forEach(function(c){ var sc = document.querySelector(c.scroller); if(sc) procesar(sc, c.fila); });
    } catch(e) {} finally { ocupado = false; }
  }
  // Se procesa en el mismo "microtask" del cambio (antes de que el chat se desplace al fondo) para no mover el scroll.
  function observar(){
    var raiz = document.getElementById('v-crmLinea');
    if(!raiz){ setTimeout(observar, 500); return; }
    var mo = new MutationObserver(function(muts){
      for(var i = 0; i < muts.length; i++){
        var m = muts[i];
        if(m.type !== 'childList') continue;
        var solosSep = true;
        m.addedNodes.forEach(function(n){ if(!esSep(n)) solosSep = false; });
        m.removedNodes.forEach(function(n){ if(!esSep(n)) solosSep = false; });
        if(!solosSep){ procesarTodo(); return; }
      }
    });
    mo.observe(raiz, { childList: true, subtree: true });
    procesarTodo();
    // A medianoche "Hoy" pasa a ser "Ayer".
    setInterval(function(){ document.querySelectorAll('.bc-date-sep').forEach(function(s){ s.remove(); }); procesarTodo(); }, 30 * 60 * 1000);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observar, { once: true });
  else observar();

  // 4) Selector de emojis COMPLETO (el mismo de WhatsApp) para Instagram y Facebook.
  var EMOJIS_RESPALDO = ['😀','😁','😂','🤣','😊','😍','😘','😉','😎','🤩','🙂','🤔','😮','😢','😭','😡','🥳','🙏','👍','👎','👏','🙌','👋','🤝','💪','👌','❤️','💙','💚','🔥','✨','✅','❌','⭐','🎉','📱','💻','🔋','🔧','🛠️','📦','🚚','💵','💳','📍','📞','⏰','🙋','🤷'];
  function listaEmojis(){ try { if(typeof _WA_EMOJIS !== 'undefined' && _WA_EMOJIS && _WA_EMOJIS.length) return _WA_EMOJIS; } catch(e) {} return EMOJIS_RESPALDO; }
  function cerrarEmojis(){ var p = document.getElementById('bcEmojiPicker'); if(p) p.remove(); document.removeEventListener('mousedown', fueraEmojis, true); }
  function fueraEmojis(ev){ var p = document.getElementById('bcEmojiPicker'); if(p && !p.contains(ev.target) && !(ev.target.closest && ev.target.closest('[data-bc-emoji-btn]'))) cerrarEmojis(); }
  function abrirEmojis(boton, textarea){
    if(document.getElementById('bcEmojiPicker')){ cerrarEmojis(); return; }
    if(!boton || !textarea) return;
    boton.setAttribute('data-bc-emoji-btn', '1');
    var p = document.createElement('div');
    p.id = 'bcEmojiPicker'; p.className = 'bc-emoji-picker'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Emojis');
    p.innerHTML = listaEmojis().map(function(e){ return '<button type="button" data-e="' + e + '" aria-label="' + e + '">' + e + '</button>'; }).join('');
    p.addEventListener('mousedown', function(ev){ ev.preventDefault(); }); // no quita el foco de la caja de escribir
    p.addEventListener('click', function(ev){
      var e = ev.target.closest && ev.target.closest('[data-e]'); if(!e) return;
      var t = textarea, ini = t.selectionStart != null ? t.selectionStart : t.value.length, fin = t.selectionEnd != null ? t.selectionEnd : ini;
      t.setRangeText(e.getAttribute('data-e'), ini, fin, 'end');
      t.dispatchEvent(new Event('input', { bubbles: true }));
      t.focus();
    });
    document.body.appendChild(p);
    var r = boton.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 16), h = p.offsetHeight || 260;
    p.style.width = w + 'px';
    p.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
    p.style.top = Math.max(8, r.top - h - 8) + 'px';
    setTimeout(function(){ document.addEventListener('mousedown', fueraEmojis, true); }, 0);
  }
  document.addEventListener('keydown', function(ev){ if(ev.key === 'Escape') cerrarEmojis(); });

  // 5) WhatsApp: "Copiar" en el menú de cada mensaje (Instagram y Facebook ya lo tenían).
  function copiarTexto(txt){
    if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } finally { ta.remove(); }
    return Promise.resolve();
  }
  window._bcWaCopiarMensaje = function(){
    var id = null, lista = [];
    try { id = _waMenuAccionesMsgId; lista = _waMensajes || []; } catch(e) {}
    var m = lista.find(function(x){ return x.id === id; });
    try { _waCerrarMenuAcciones(); } catch(e) {}
    if(!m || !m.cuerpo){ try { toast('Este mensaje no tiene texto para copiar.'); } catch(e) {} return; }
    copiarTexto(m.cuerpo).then(function(){ try { toast('Texto copiado.'); } catch(e) {} });
  };
  function envolverMenuWa(){
    if(typeof window._waAsegurarMenuAcciones !== 'function') return false;
    if(window._waAsegurarMenuAcciones.__bcCopiar) return true;
    var orig = window._waAsegurarMenuAcciones;
    var nuevo = function(){
      var menu = orig.apply(this, arguments);
      if(menu && !menu.querySelector('#waMenuCopiar')){
        var b = document.createElement('button');
        b.id = 'waMenuCopiar'; b.innerHTML = '<i class="ti ti-copy"></i> Copiar';
        b.setAttribute('onclick', '_bcWaCopiarMensaje()');
        menu.appendChild(b);
      }
      return menu;
    };
    nuevo.__bcCopiar = true;
    window._waAsegurarMenuAcciones = nuevo;
    return true;
  }
  if(!envolverMenuWa()){ var n2 = 0, t2 = setInterval(function(){ if(envolverMenuWa() || ++n2 > 60) clearInterval(t2); }, 250); }

  // 6) Sonido al recibir un mensaje nuevo (WhatsApp, Instagram y Facebook). Respeta la opción de sonidos del sistema.
  var vistos = new Set(), ultimoSonido = 0, arranque = Date.now();
  function tonoEntrante(){
    var ahora = Date.now(); if(ahora - ultimoSonido < 2500) return; ultimoSonido = ahora;
    try {
      if(typeof _audioHabilitado === 'undefined' || !_audioHabilitado || !_audioCtx || !_notifConfig || !_notifConfig.activadas) return;
      var ctx = _audioCtx;
      [{ f: 587, t: 0 }, { f: 880, t: .09 }].forEach(function(n){
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = n.f;
        g.gain.setValueAtTime(.0001, ctx.currentTime + n.t);
        g.gain.exponentialRampToValueAtTime(.12, ctx.currentTime + n.t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + n.t + .22);
        o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + n.t); o.stop(ctx.currentTime + n.t + .24);
      });
    } catch(e) {}
  }
  var FILAS_ENTRANTES = [
    { sel: '#waMessagesScroll .wa-brow.in[data-msgid]', id: 'data-msgid' },
    { sel: '#bcIgMessages .bc-ig-msg-row.in[data-igmsgid]', id: 'data-igmsgid' },
    { sel: '#bcFbMessages .bc-fb-row.in[data-message]', id: 'data-message' }
  ];
  function revisarEntrantes(){
    var sonar = false, ahora = Date.now();
    FILAS_ENTRANTES.forEach(function(c){
      document.querySelectorAll(c.sel).forEach(function(f){
        var id = f.getAttribute(c.id); if(!id || vistos.has(id)) return;
        vistos.add(id);
        var ts = Date.parse(f.getAttribute('data-ts') || '');
        // Solo mensajes que llegaron hace poco y después de abrir el sistema (no al cargar historial ni mensajes viejos).
        if(!isNaN(ts) && ahora - ts < 90000 && ts > arranque - 5000) sonar = true;
      });
    });
    if(sonar) tonoEntrante();
  }
  var procesarBase = procesarTodo;
  procesarTodo = function(){ procesarBase(); try { revisarEntrantes(); } catch(e) {} };

  // 7) WhatsApp: el botón de fotos también acepta VIDEO (whatsapp-enviar ya lo soporta; límite 16 MB).
  function habilitarVideoWa(){
    var inp = document.getElementById('waFileFoto');
    if(inp && !/video/.test(inp.accept || '')) inp.accept = 'image/*,video/mp4,video/3gpp,video/quicktime';
    if(typeof window._waAdjuntoSeleccionado === 'function' && !window._waAdjuntoSeleccionado.__bcVideo){
      var orig = window._waAdjuntoSeleccionado;
      var nuevo = function(input, tipo){
        var f = input && input.files && input.files[0];
        if(tipo === 'imagen' && f && /^video\//.test(f.type || '')) tipo = 'video';
        return orig.call(this, input, tipo);
      };
      nuevo.__bcVideo = true;
      window._waAdjuntoSeleccionado = nuevo;
    }
    var b = document.querySelector('button[onclick="_waAdjuntarAccion(\'foto\')"]');
    if(b && !b.__bcVideo){ b.__bcVideo = true; b.innerHTML = '<i class="ti ti-photo" style="color:#7c3aed;"></i> Foto o video'; }
  }
  habilitarVideoWa();
  document.addEventListener('click', function(){ setTimeout(habilitarVideoWa, 0); }, true);

  window.BayolChatUnificado = { version: VERSION, refrescar: procesarTodo, emojis: abrirEmojis, cerrarEmojis: cerrarEmojis, copiar: copiarTexto };
})();
