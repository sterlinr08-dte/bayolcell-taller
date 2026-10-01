/* =====================================================================
   BAYOL CELL — Iconografía del taller (1 oct 2026, Fase 2 del afinado)
   Cambia los emojis de la INTERFAZ por íconos Tabler (ti-*) al pintarse.
   Por qué así y no a mano: hay ~1,100 emojis repartidos en taller-app.js;
   editarlos uno por uno es arriesgado. Esto es reversible (borrar este
   archivo) y no cambia textos guardados, mensajes a clientes ni impresiones.
   NO toca: el CRM (chats de clientes y selector de emojis), campos de
   escribir, listas desplegables, ventanas de impresión, caritas de la
   prueba psicométrica, estrellas de calificación ni flechas tipográficas.
   Para excluir algo nuevo: ponerle la clase "no-iconos".
   ===================================================================== */
(function(){
  'use strict';
  if (window.__bcIconosTaller) return;
  window.__bcIconosTaller = true;

  // emoji -> [ícono Tabler 2.47, color opcional]  (todos verificados en 2.47)
  var MAPA = {
    '✅':['circle-check','#16a34a'], '✔':['check'], '✓':['check'], '☐':['square'],
    '❌':['circle-x','#dc2626'], '✗':['x'], '✕':['x'], '🚫':['ban','#dc2626'],
    '⚠':['alert-triangle','#d97706'], '🚨':['alert-octagon','#dc2626'], '❗':['alert-circle','#dc2626'], '❓':['help-circle'],
    'ℹ':['info-circle'], '💡':['bulb','#d97706'], '⚡':['bolt','#d97706'], '✨':['sparkles'],
    '🟢':['point-filled','#16a34a'], '🟡':['point-filled','#d97706'], '🔴':['point-filled','#dc2626'], '●':['point-filled'],
    '📦':['package'], '🔧':['tool'], '🛠':['tools'], '🔨':['hammer'], '⏳':['hourglass'], '⏱':['clock-hour-4'], '🕐':['clock'],
    '⏰':['alarm'], '📅':['calendar'], '🔍':['search'], '🔎':['search'], '🔄':['refresh'], '♻':['recycle'], '↩':['arrow-back-up'],
    '🔒':['lock'], '🔑':['key'], '🛡':['shield-check'], '🗑':['trash'], '✏':['pencil'], '✍':['writing'], '📝':['notes'],
    '📋':['clipboard-list'], '🧾':['receipt'], '📄':['file-text'], '📎':['paperclip'], '📌':['pin'], '📍':['map-pin'],
    '📱':['device-mobile'], '📲':['device-mobile-message'], '💻':['device-laptop'], '🎧':['headphones'], '🔌':['plug'], '🔋':['battery'],
    '📷':['camera'], '📸':['camera'], '🎥':['video'], '🖨':['printer'], '💾':['device-floppy'], '📡':['antenna'],
    '🛒':['shopping-cart'], '🏪':['building-store'], '🏢':['building'], '🚚':['truck'], '🚗':['car'], '📥':['inbox'],
    '💵':['cash'], '💰':['coin'], '💳':['credit-card'], '🧮':['calculator'], '📊':['chart-bar'], '📈':['trending-up'], '📉':['trending-down'],
    '💬':['message-circle'], '🔔':['bell'], '🔕':['bell-off'], '🔊':['volume'], '✉':['mail'], '📞':['phone'], '☎':['phone'],
    '👤':['user'], '🧑':['user'], '👨':['user'], '🧍':['user'], '👥':['users'], '💼':['briefcase'], '🎓':['school'], '🩺':['stethoscope'],
    '🤖':['robot'], '🧠':['brain'], '🔬':['microscope'], '🧩':['puzzle'], '🎨':['palette'], '📐':['ruler'], '⚙':['settings'],
    '👁':['eye'], '🏷':['tag'], '🎟':['ticket'], '🎫':['ticket'], '🎁':['gift'], '🎉':['confetti'], '🎯':['target'],
    '👍':['thumb-up'], '👉':['point'], '➕':['plus'], '🏁':['flag'], '🏖':['beach'], '🍀':['clover']
  };
  var claves = Object.keys(MAPA).sort(function(a,b){ return b.length - a.length; });
  var esc = function(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  var RE = new RegExp('(' + claves.map(esc).join('|') + ')\\uFE0F?', 'g');
  var PRUEBA = new RegExp(claves.map(esc).join('|'));

  // Dónde NO se convierte
  var EXCLUIR = '#v-crmLinea, .no-iconos, [contenteditable], script, style, textarea, option, select, title, svg, input, code, pre';
  var SALTAR_TAG = { SCRIPT:1, STYLE:1, TEXTAREA:1, OPTION:1, SELECT:1, TITLE:1, INPUT:1, CODE:1, PRE:1 };

  function convertirTexto(nodo){
    var txt = nodo.nodeValue;
    if (!txt || !PRUEBA.test(txt)) return;
    var padre = nodo.parentNode;
    if (!padre || padre.nodeType !== 1) return;
    if (SALTAR_TAG[padre.nodeName] || (padre.closest && padre.closest(EXCLUIR))) return;
    var frag = document.createDocumentFragment(), ult = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(txt))){
      if (m.index > ult) frag.appendChild(document.createTextNode(txt.slice(ult, m.index)));
      var def = MAPA[m[1]];
      var i = document.createElement('i');
      i.className = 'ti ti-' + def[0] + ' bc-emo';
      i.setAttribute('aria-hidden', 'true');
      if (def[1]) i.style.color = def[1];
      frag.appendChild(i);
      ult = m.index + m[0].length;
    }
    if (ult < txt.length) frag.appendChild(document.createTextNode(txt.slice(ult)));
    padre.replaceChild(frag, nodo);
  }

  function recorrer(raiz){
    if (!raiz) return;
    if (raiz.nodeType === 3){ convertirTexto(raiz); return; }
    if (raiz.nodeType !== 1 && raiz.nodeType !== 11) return;
    if (raiz.nodeType === 1 && (SALTAR_TAG[raiz.nodeName] || (raiz.closest && raiz.closest(EXCLUIR)))) return;
    if (!PRUEBA.test(raiz.textContent || '')) return; // atajo: nada que cambiar
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null), lista = [], n;
    while ((n = w.nextNode())) if (PRUEBA.test(n.nodeValue)) lista.push(n);
    for (var k = 0; k < lista.length; k++) convertirTexto(lista[k]);
  }

  function estilos(){
    if (document.getElementById('bcIconosCss')) return;
    var st = document.createElement('style');
    st.id = 'bcIconosCss';
    st.textContent = '.bc-emo{font-size:1.08em;line-height:1;vertical-align:-.14em;margin:0 .1em;display:inline-block}';
    document.head.appendChild(st);
  }

  function iniciar(){
    estilos();
    recorrer(document.body);
    var obs = new MutationObserver(function(muts){
      for (var a = 0; a < muts.length; a++){
        var mu = muts[a];
        if (mu.type === 'characterData') convertirTexto(mu.target);
        else for (var b = 0; b < mu.addedNodes.length; b++) recorrer(mu.addedNodes[b]);
      }
    });
    obs.observe(document.body, { childList:true, subtree:true, characterData:true });
    window.BayolIconos = { recorrer: recorrer, mapa: MAPA };
  }
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);
})();
