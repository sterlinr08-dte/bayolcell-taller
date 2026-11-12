/* BAYOL CELL · taller · «Curvo» (12-nov-2026; dueño, tras el reel «Glassy Dashboard V31»: «usemos tal como está
 * actualmente pero con lados curvos como en el video, en el sistema completo»).
 * NO cambia pantallas, colores, tamaños ni funciones: solo redondea más las esquinas de todo el sistema.
 * Cómo: recorre las hojas de estilo del taller y sube cada «border-radius» en px según una tabla (8 → 14, 12 → 18,
 * 16 → 24…); lo que ya es píldora o círculo (999px, 50 %) y las esquinas en 0 no se tocan. Los estilos escritos dentro de
 * las etiquetas (style="…") se cubren con reglas por atributo. Se carga en el <head>, después de los estilos, para que
 * la página se pinte ya curva (sin salto). Las capas que agregan estilos después también se redondean (observador).
 * No toca lo que se imprime (@media print) ni las ventanas de impresión (son otros documentos).
 * Barra lateral (dueño, 12-nov: «la barra lateral ponla curva como en el video»): flota separada del borde, con las cuatro
 * esquinas curvas; igual compacta, abierta, fijada y en el celular. Mismos botones y mismo comportamiento.
 * Apagar: localStorage.bc_curvo_off = '1'  ·  window.BC_CURVO = false
 */
(function(){'use strict';
if (window.BayolCurvo) return;
try { if (window.BC_CURVO === false || localStorage.getItem('bc_curvo_off') === '1') return; } catch(_){}
var VERSION = '20261112b';
var hechas = typeof WeakSet === 'function' ? new WeakSet() : null, cambiadas = 0;
/* Tabla: radio de hoy → radio curvo. Menos de 4 px (líneas, casillas) y 100 px o más (píldoras) quedan igual. */
function nuevo(px){
  if (px < 4 || px >= 100) return px;
  if (px <= 6) return 10;
  if (px <= 9) return 14;
  if (px <= 12) return 18;
  if (px <= 16) return 24;
  if (px <= 22) return 28;
  return Math.max(px, 32);
}
function convertir(v){
  if (!v || v.indexOf('px') < 0 || /var\(|calc\(|%/.test(v)) return v;
  return v.replace(/(\d*\.?\d+)px/g, function(m, n){ var a = parseFloat(n), b = nuevo(a); return (b === a ? n : b) + 'px'; });
}
var PROPS = ['border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius'];
function regla(r){
  if (!r || !r.style || (hechas && hechas.has(r))) return;
  if (hechas) hechas.add(r);
  // Casillas, interruptores, barras finas y fotos se quedan como están (una casilla redonda parece otra cosa; la foto se recortaría)
  try { if (/checkbox|radio|chk|check|switch|toggle|slider|progress|-bar\b|scrollbar|::-webkit|media|\bimg\b|foto|thumb/i.test(r.selectorText || '')) return; } catch(_){}
  // Si la regla trae el atajo «border-radius», se cambia solo ese (las cuatro esquinas salen de él); si no, cada esquina.
  var atajo = r.style.getPropertyValue('border-radius');
  for (var i = atajo ? 0 : 1; i < (atajo ? 1 : PROPS.length); i++) {
    var p = PROPS[i], v = r.style.getPropertyValue(p); if (!v) continue;
    var n = convertir(v); if (n !== v) { r.style.setProperty(p, n, r.style.getPropertyPriority(p)); cambiadas++; }
  }
}
function recorrer(lista){
  if (!lista) return;
  for (var i = 0; i < lista.length; i++) {
    var r = lista[i];
    if (r.type === 1) regla(r);                                   // regla normal
    else if (r.type === 4) { var m = ''; try { m = r.conditionText || (r.media && r.media.mediaText) || ''; } catch(_){} if (/print/i.test(m) && !/screen/i.test(m)) continue; try { recorrer(r.cssRules); } catch(_){} } // @media (no la de imprimir)
    else if (r.cssRules) { try { recorrer(r.cssRules); } catch(_){} } // @supports, @layer…
  }
}
function hoja(s){
  if (!s || (s.ownerNode && /^bcCurvo/.test(s.ownerNode.id || ''))) return;
  var m = ''; try { m = (s.media && s.media.mediaText) || ''; } catch(_){}
  if (/print/i.test(m) && !/screen|all/i.test(m)) return;
  try { recorrer(s.cssRules); } catch(_){} // hojas de otro dominio (fuentes, iconos): no se pueden leer, se saltan
}
function todo(){ try { for (var i = 0; i < document.styleSheets.length; i++) hoja(document.styleSheets[i]); } catch(_){} }

/* Estilos escritos en la etiqueta: style="border-radius:8px" */
function inline(){
  if (document.getElementById('bcCurvoInline')) return;
  var css = '', vistos = {};
  for (var px = 4; px <= 30; px++) {
    var n = nuevo(px); if (n === px) continue;
    // solo cuando es UN valor (termina en «;» o es lo último): «8px 8px 0 0» no se toca
    ['border-radius:', 'border-radius: '].forEach(function(k){ (vistos[n] = vistos[n] || []).push('[style*="' + k + px + 'px;"]', '[style$="' + k + px + 'px"]', '[style*="' + k + px + 'px ;"]'); });
  }
  Object.keys(vistos).forEach(function(n){ css += 'html.bc-curvo body ' + vistos[n].join(',html.bc-curvo body ') + '{border-radius:' + n + 'px !important;}'; });
  var st = document.createElement('style'); st.id = 'bcCurvoInline'; st.media = 'screen'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
}

/* Barra lateral flotante y curva */
function barra(){
  if (document.getElementById('bcCurvoBarra')) return;
  var B = 'html.bc-curvo body #app aside.sidebar', M = 'html.bc-curvo.bcm-mini body #app aside.sidebar';
  var st = document.createElement('style'); st.id = 'bcCurvoBarra'; st.media = 'screen'; st.textContent =
  B + '{border-radius:28px !important;border:1px solid rgba(255,255,255,.10) !important;box-shadow:0 18px 44px -18px rgba(8,13,24,.65),inset 0 1px 0 rgba(255,255,255,.08) !important;}' +
  '@media (min-width:1025px){' +
    B + '{margin:12px 0 12px 12px !important;height:calc(100vh - 24px) !important;align-self:flex-start;position:sticky;top:12px;}' +
    // alto en vh (no top+bottom): la barra fija se mide contra #app, igual que antes de esta capa
    M + '{position:fixed !important;margin:0 !important;left:12px !important;top:12px !important;bottom:auto !important;height:calc(100vh - 24px) !important;}' +
    'html.bc-curvo.bcm-mini body #app .main{margin-left:100px !important;}' +
    'html.bc-curvo.bcm-mini body #bcAmbientOrbSafe{left:100px !important;}' +
  '}' +
  '@media (max-width:1024px){' +
    B + '{top:10px !important;bottom:10px !important;height:auto !important;max-height:calc(100vh - 20px);}' +
    B + '.open{left:10px !important;}' +
  '}';
  (document.head || document.documentElement).appendChild(st);
}

document.documentElement.classList.add('bc-curvo');
inline(); barra(); todo();
document.addEventListener('DOMContentLoaded', todo);
window.addEventListener('load', todo);
/* Capas que agregan <style> o <link> después */
try {
  var t = 0, despues = function(){ t = 0; todo(); };
  new MutationObserver(function(ms){
    for (var i = 0; i < ms.length; i++) { var a = ms[i].addedNodes;
      for (var j = 0; j < a.length; j++) { var n = a[j]; if (n.nodeType === 1 && (n.tagName === 'STYLE' || n.tagName === 'LINK')) {
        if (n.tagName === 'LINK') n.addEventListener('load', despues);
        if (!t) t = setTimeout(despues, 0); } } }
  }).observe(document.documentElement, { childList: true, subtree: true });
} catch(_){}
window.BayolCurvo = { version: VERSION, repasar: todo, cuenta: function(){ return cambiadas; }, nuevo: nuevo };
})();
