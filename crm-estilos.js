/* =====================================================================
   BAYOL CELL — CRM rápido: clases de estado en vez de :has() (10-nov-2026)
   Pedido del dueño: «que el CRM sea más rápido e instantáneo».

   Qué pasaba: 14 reglas CSS del CRM usaban :has() («el cuerpo que tiene dentro
   un chat abierto», «la columna que NO tiene #waDetalle»…). Con esas reglas,
   Chrome marca al <body>, a .content y a #v-crmLinea como «dependen de lo que
   tienen dentro», y cada cambio pequeño (una burbuja nueva) volvía a calcular
   el estilo de miles de elementos.

   Qué hace esta capa: copia esos mismos estados a clases normales, que el CSS
   lee sin :has(). No decide nada: solo refleja lo que ya marcan las demás
   capas (taller-app.js, crm-social-hub.js, crm-facebook-chat.js, bc-busqueda.js).

     Estado original (lo que miraba el :has)              Clase espejo
     #v-crmLinea.active                                → .content.bc-crm-activo
     #v-crmLinea.chat-abierto                          → body.bc-crm-chat-abierto
     #v-crmLinea.bc-ig-chat-open                       → body.bc-crm-ig-abierto
     #bcSocialFacebookPanel.bc-fb-open                 → #v-crmLinea.bc-crm-fb-abierto
     .crm-busq-row con .bcbp-marco.open dentro         → .crm-busq-row.bc-crm-busq-abierta
                                                         y #v-crmLinea.bc-crm-busq-abierta
     .wa-chat-col SIN #waDetalle dentro                → .wa-chat-col.bc-crm-sin-detalle
     .bc-ig-chat / .bc-social-generic-chat SIN
       #bcIgMessages / #bcFbMessages dentro            → .bc-crm-sin-mensajes

   Cuándo se actualiza: un vigilante (MutationObserver) sobre #v-crmLinea corre
   antes de que la pantalla se pinte, así que no hay parpadeo. Además se llama
   al instante desde los sitios que miden la pantalla justo después de cambiar
   el estado (_crmActualizarClaseChatAbierto, y resize() del chat de Facebook).

   Cómo apagar: localStorage.bc_crm_estilos_off = '1' (o BC_CRM_CLASES = false en
   taller.html) y recargar. Entonces esta capa no pone ninguna clase: solo vuelve
   a encender las reglas :has() originales, que siguen escritas en cada archivo
   dentro de «@media not all and (min-width:1px)» (un bloque que nunca aplica
   hasta que aquí se le cambia la condición a «all»).

   Pestañas abiertas desde antes de esta entrega (taller.html viejo en memoria):
   no traen html.bc-crm-clases ni este archivo. crm-wa-identico.js lo carga al
   entrar al CRM y, como falta la marca, queda en modo apagado: todo como antes.
   ===================================================================== */
(function(){
  'use strict';
  if (window.__bcCrmEstilos) return;
  window.__bcCrmEstilos = '20261110-c1';

  // ---------- Apagado: vuelven las reglas :has() originales ----------
  if (!document.documentElement.classList.contains('bc-crm-clases')){
    var vistas = new WeakSet();
    var recorrer = function(cont){
      var r; try { r = cont.cssRules; } catch(e){ return; } if (!r) return;
      for (var i = 0; i < r.length; i++){
        var x = r[i]; if (!x.media || !x.cssRules) continue;
        if (x.media.mediaText.replace(/\s+/g, '') === 'notalland(min-width:1px)') x.media.mediaText = 'all';
        else recorrer(x);
      }
    };
    var encender = function(){
      var s = document.styleSheets;
      for (var i = 0; i < s.length; i++){ if (vistas.has(s[i])) continue; vistas.add(s[i]); recorrer(s[i]); }
    };
    window.bcCrmHasEncender = encender;
    encender();
    // Las hojas del CRM cargan al entrar al CRM (y crm-wa-identico.js las vuelve a colocar): se revisa cada hoja que llega.
    document.addEventListener('load', function(e){ var t = e.target; if (t && t.tagName === 'LINK') encender(); }, true);
    document.addEventListener('DOMContentLoaded', encender);
    window.addEventListener('load', encender);
    return;
  }

  // ---------- Encendido: clases espejo ----------

  var vista = null, filas = null, columnas = null, chatsIg = null, chatsFb = null, vigilante = null;

  function pon(el, clase, si){ if (el && el.classList.contains(clase) !== si) el.classList.toggle(clase, si); }
  // ¿«cont» tiene dentro algún elemento con ese id? (soporta ids repetidos, igual que el selector CSS)
  function tieneId(cont, id){
    var l = document.querySelectorAll('#' + id);
    for (var i = 0; i < l.length; i++) if (l[i] !== cont && cont.contains(l[i])) return true;
    return false;
  }

  function sincronizar(){
    if (!vista || !vista.isConnected){
      vista = document.getElementById('v-crmLinea'); if (!vista) return;
      filas = vista.getElementsByClassName('crm-busq-row');
      columnas = vista.getElementsByClassName('wa-chat-col');
      chatsIg = vista.getElementsByClassName('bc-ig-chat');
      chatsFb = vista.getElementsByClassName('bc-social-generic-chat');
      vigilar();
    }
    var cl = vista.classList, i, el, abierta, alguna = false;
    // 1) La vista del CRM está en pantalla → su contenedor .content
    var cont = vista.parentElement;
    if (cont && cont.classList.contains('content')) pon(cont, 'bc-crm-activo', cl.contains('active'));
    // 2) Chat abierto (WhatsApp o Instagram viejo) y chat de Instagram abierto → body
    pon(document.body, 'bc-crm-chat-abierto', cl.contains('chat-abierto'));
    pon(document.body, 'bc-crm-ig-abierto', cl.contains('bc-ig-chat-open'));
    // 3) Chat de Facebook abierto → la vista
    var fb = document.getElementById('bcSocialFacebookPanel');
    pon(vista, 'bc-crm-fb-abierto', !!(fb && fb.classList.contains('bc-fb-open') && vista.contains(fb)));
    // 4) Buscador abierto → su fila y la vista
    for (i = 0; i < filas.length; i++){ el = filas[i]; abierta = !!el.querySelector('.bcbp-marco.open'); pon(el, 'bc-crm-busq-abierta', abierta); if (abierta) alguna = true; }
    pon(vista, 'bc-crm-busq-abierta', alguna);
    // 5) Columna de chat sin #waDetalle dentro
    for (i = 0; i < columnas.length; i++) pon(columnas[i], 'bc-crm-sin-detalle', !tieneId(columnas[i], 'waDetalle'));
    // 6) Panel de chat de Instagram / Facebook sin mensajes dentro (ningún chat elegido)
    for (i = 0; i < chatsIg.length; i++) pon(chatsIg[i], 'bc-crm-sin-mensajes', !tieneId(chatsIg[i], 'bcIgMessages') && !tieneId(chatsIg[i], 'bcFbMessages'));
    for (i = 0; i < chatsFb.length; i++) pon(chatsFb[i], 'bc-crm-sin-mensajes', !tieneId(chatsFb[i], 'bcIgMessages') && !tieneId(chatsFb[i], 'bcFbMessages'));
  }

  function vigilar(){
    if (vigilante || !vista || typeof MutationObserver !== 'function') return;
    vigilante = new MutationObserver(sincronizar);
    // Clases (active, chat-abierto, bc-fb-open, .open del buscador…) y nodos que entran o salen (#waDetalle, #bcIgMessages…).
    vigilante.observe(vista, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
  }

  window.bcCrmEstilosSync = sincronizar;

  // taller-app.js cambia .chat-abierto y enseguida mide la pantalla (_waActualizarAltoVisual): la clase espejo tiene que
  // estar puesta en ese mismo instante, no un momento después. Se envuelve la función (misma técnica que las demás capas).
  function envolver(){
    var orig = window._crmActualizarClaseChatAbierto;
    if (typeof orig !== 'function' || orig.__bcCrmEstilos) return;
    var nueva = function(){ var r = orig.apply(this, arguments); try { sincronizar(); } catch(e){} return r; };
    nueva.__bcCrmEstilos = true;
    window._crmActualizarClaseChatAbierto = nueva;
  }

  // Esta capa carga justo después de taller-app.min.js (las dos con «defer»): la función ya existe. Se reintenta al
  // terminar de cargar por si el orden cambiara algún día.
  function iniciar(){ try { envolver(); sincronizar(); } catch(e){} }
  iniciar();
  document.addEventListener('DOMContentLoaded', iniciar);
  window.addEventListener('load', iniciar);
})();
