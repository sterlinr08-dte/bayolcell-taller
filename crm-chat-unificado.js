/* CRM — Fase 2 (29 sep 2026): las 3 ventanas de chat (WhatsApp, Instagram, Facebook) con el mismo diseño.
   - Separadores de fecha "Hoy / Ayer / Lunes / 12 de septiembre" (fijos arriba al desplazarse, como WhatsApp),
     calculados con data-ts de cada mensaje (WhatsApp lo recibe aquí; Instagram/Facebook ya lo traen en su HTML).
   - Carga crm-chat-unificado.css (burbujas, cabecera, barra de escribir y listas iguales, cada canal con su color).
   No cambia datos ni envíos: solo presentación. */
(function(){
  'use strict';
  if(window.__bcChatUnificado) return;
  window.__bcChatUnificado = true;
  var VERSION = '20260929-f2';

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

  window.BayolChatUnificado = { version: VERSION, refrescar: procesarTodo };
})();
