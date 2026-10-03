/* =====================================================================
   BAYOL CELL — Barra de navegación de las ventanas, estilo Apple
   (2 oct 2026, capa aislada y reversible: borrar este archivo y la línea
   que lo carga en crm-marketing-consent.js lo deja todo como antes).

   QUÉ HACE (solo presentación; NO cambia el onclick de ningún botón):
   - Ventanas cubiertas: .modal-backdrop.active > .modal-box > .modal-header
     (fijas en taller.html y las que arma taller-app.js) y #modalGenerico.
   - Una sola salida por ventana:
       · suelta (abierta desde una pantalla)  -> ✕ a la DERECHA
       · apilada (encima de otra ventana)      -> ‹ a la IZQUIERDA (vuelve a la de abajo)
     "← Volver" que hace lo mismo que la ✕ (lo inyecta inyectarBotonesVolver)
     se oculta; si la ventana no tiene salida se le da una ✕ que usa el
     botón Cerrar/Cancelar/Listo del pie, o la cierra como lo hace Esc.
   - Título centrado (espaciador del tamaño del botón en el lado vacío).
   - Círculo de cristal 44 px (celular) / 36 px (PC), área táctil +6 px.
   - Resortes reales (fórmula de Apple) en linear(); respaldo cubic-bezier.
   - Pulsado en pointer-down (≥90 ms), arrastrar fuera cancela.
   - Esc = salida de la ventana de arriba (respeta a quien ya usa Esc).
   - Celular: deslizar la cabecera hacia abajo para cerrar.
   - prefers-reduced-motion / -reduced-transparency / -contrast.
   ===================================================================== */
(function(){
  'use strict';
  if (window.__bcNavApple) return;
  window.__bcNavApple = true;

  // ---------- Resortes (fórmula de Apple: response + dampingRatio) ----------
  function resorte(response, zeta){
    var w0 = 2 * Math.PI / response, fin = 0, x, t;
    var f = function(t){
      if (zeta >= 1) return 1 - (1 + w0 * t) * Math.exp(-w0 * t);
      var wd = w0 * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
    };
    for (t = 0; t < 3; t += 0.002){ x = f(t); if (Math.abs(1 - x) > 0.001) fin = t; }
    var dur = Math.ceil((fin + 0.002) * 1000), pts = [], n = 48;
    for (var i = 0; i <= n; i++){ var v = i === n ? 1 : f(fin * i / n); pts.push(+v.toFixed(4)); }
    return { dur: dur, linear: 'linear(' + pts.join(', ') + ')' };
  }
  var R = 0.35, S10 = resorte(R, 1.0), S08 = resorte(R, 0.8), S07 = resorte(R, 0.7);
  var soportaLinear = !!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)'));
  var EASE = {
    s10: soportaLinear ? S10.linear : 'cubic-bezier(.25,.9,.3,1)',
    s08: soportaLinear ? S08.linear : 'cubic-bezier(.3,1.25,.4,1)',
    s07: soportaLinear ? S07.linear : 'cubic-bezier(.3,1.45,.45,1)'
  };
  window.BayolNav = { resortes: { s10: S10, s08: S08, s07: S07 }, soportaLinear: soportaLinear };

  // ---------- Estilos ----------
  var css = '' +
  ':root{--bcn-ease10:' + EASE.s10 + ';--bcn-ease08:' + EASE.s08 + ';--bcn-ease07:' + EASE.s07 + ';' +
    '--bcn-d10:' + S10.dur + 'ms;--bcn-d08:' + S08.dur + 'ms;--bcn-d07:' + S07.dur + 'ms;--bcn-s:36px;}' +
  '@media (max-width:768px){:root{--bcn-s:44px;}}' +
  /* Cabecera: 3 columnas (salida izq · título · salida der) => título centrado */
  'html body .bcn-head{display:grid !important;grid-template-columns:var(--bcn-s) minmax(0,1fr) var(--bcn-s) !important;align-items:center !important;column-gap:10px !important;position:relative;}' +
  'html body .bcn-head > .bcn-mid{grid-column:2;grid-row:1;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;min-width:0;text-align:center;}' +
  'html body .bcn-head > .bcn-mid > *{margin-left:0 !important;margin-right:0 !important;}' +
  'html body .bcn-head > .bcn-mid .modal-header-left{flex:0 1 auto !important;justify-content:center;}' +
  'html body .bcn-head > .bcn-mid h3, html body .bcn-head > .bcn-mid b{text-align:center;}' +
  'html body .bcn-head > .bcn-esp{grid-row:1;width:var(--bcn-s);height:1px;}' +
  'html body .bcn-head > .bcn-esp.izq{grid-column:1;} html body .bcn-head > .bcn-esp.der{grid-column:3;}' +
  'html body .bcn-head > .bcn-oculto, html body .bcn-head .bcn-oculto{display:none !important;}' +
  /* Botón (mismo componente para ‹ y ✕) */
  'html body .bcn-head > .bcn-btn{grid-row:1;width:var(--bcn-s) !important;height:var(--bcn-s) !important;min-width:0 !important;min-height:0 !important;' +
    'padding:0 !important;margin:0 !important;border-radius:50% !important;display:grid !important;place-items:center !important;position:relative;' +
    'font-size:0 !important;line-height:0 !important;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation;' +
    'color:#fff !important;background:var(--bcn-vidrio,rgba(15,23,42,.30)) !important;border:1px solid rgba(255,255,255,.34) !important;' +
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.30),0 4px 12px -6px rgba(15,23,42,.45) !important;' +
    '-webkit-backdrop-filter:blur(14px) saturate(160%);backdrop-filter:blur(14px) saturate(160%);' +
    'transform:scale(1);transition:transform var(--bcn-d07) var(--bcn-ease07),background-color .2s ease,box-shadow .2s ease !important;}' +
  'html body .bcn-head > .bcn-btn.bcn-der{grid-column:3;} html body .bcn-head > .bcn-btn.bcn-izq{grid-column:1;}' +
  'html body .bcn-head > .bcn-btn::after{content:"";position:absolute;inset:-6px;border-radius:50%;}' +   /* área táctil ampliada */
  'html body .bcn-head > .bcn-btn > .bcn-ico{font-size:calc(var(--bcn-s) * .5) !important;line-height:1 !important;display:block;pointer-events:none;' +
    'transition:transform var(--bcn-d07) var(--bcn-ease07) !important;}' +
  'html body .bcn-head > .bcn-btn > .bcn-txt{position:absolute !important;width:1px !important;height:1px !important;overflow:hidden !important;clip:rect(0 0 0 0) !important;white-space:nowrap !important;}' +
  /* Variante clara (cabecera blanca: ventana genérica) */
  'html body .bcn-head.bcn-claro > .bcn-btn{color:#1e293b !important;background:rgba(15,23,42,.07) !important;border-color:rgba(15,23,42,.10) !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 3px 10px -6px rgba(15,23,42,.35) !important;}' +
  'html body .bcn-head > .bcn-btn:focus-visible{outline:3px solid rgba(255,255,255,.95) !important;outline-offset:2px !important;box-shadow:0 0 0 6px rgba(255,107,53,.55) !important;}' +
  'html body .bcn-head.bcn-claro > .bcn-btn:focus-visible{outline-color:#FF6B35 !important;}' +
  /* Pulsado (clase vía JS: en iOS :active no basta) */
  'html body .bcn-head > .bcn-btn.bcn-press{transform:scale(.86);transition:transform 90ms cubic-bezier(.3,0,.5,1),background-color .1s ease !important;background:var(--bcn-vidrio2,rgba(15,23,42,.44)) !important;}' +
  'html body .bcn-head.bcn-claro > .bcn-btn.bcn-press{background:rgba(15,23,42,.14) !important;}' +
  /* Micro-gestos: con mouse y al tocar */
  '@media (hover:hover) and (pointer:fine){html body .bcn-head > .bcn-btn.bcn-x:hover > .bcn-ico{transform:rotate(90deg);}' +
    'html body .bcn-head > .bcn-btn.bcn-back:hover > .bcn-ico{transform:translateX(-2px);}' +
    'html body .bcn-head > .bcn-btn:hover{background:var(--bcn-vidrio2,rgba(15,23,42,.38)) !important;} html body .bcn-head.bcn-claro > .bcn-btn:hover{background:rgba(15,23,42,.11) !important;}}' +
  'html body .bcn-head > .bcn-btn.bcn-x.bcn-press > .bcn-ico{transform:rotate(90deg);} html body .bcn-head > .bcn-btn.bcn-back.bcn-press > .bcn-ico{transform:translateX(-2px);}' +
  /* Entrada: se materializa con la ventana; la ✕ entra 50 ms después girando */
  '@keyframes bcnIn{from{opacity:0;transform:scale(.4);filter:blur(6px);}to{opacity:1;transform:scale(1);filter:blur(0);}}' +
  '@keyframes bcnInIco{from{transform:rotate(-90deg);}to{transform:rotate(0);}}' +
  'html body .bcn-head > .bcn-btn.bcn-in{animation:bcnIn var(--bcn-d08) var(--bcn-ease08) both;}' +
  'html body .bcn-head > .bcn-btn.bcn-x.bcn-in{animation-delay:50ms;}' +
  'html body .bcn-head > .bcn-btn.bcn-x.bcn-in > .bcn-ico{animation:bcnInIco var(--bcn-d08) var(--bcn-ease08) 50ms both;}' +
  /* Agarradera para deslizar (celular) */
  'html body .bcn-head > .bcn-grab{display:none;}' +
  '@media (max-width:768px){html body .bcn-head{touch-action:none;padding-top:16px !important;}' +
    'html body .bcn-head > .bcn-grab{display:block;position:absolute;top:6px;left:50%;width:36px;height:5px;margin-left:-18px;border-radius:3px;background:rgba(255,255,255,.55);pointer-events:none;}' +
    'html body .bcn-head.bcn-claro > .bcn-grab{background:rgba(15,23,42,.22);}}' +
  /* Accesibilidad */
  '@keyframes bcnFade{from{opacity:0;}to{opacity:1;}}' +
  '@media (prefers-reduced-motion:reduce){html body .bcn-head > .bcn-btn,html body .bcn-head > .bcn-btn > .bcn-ico{transition:opacity .15s ease !important;}' +
    'html body .bcn-head > .bcn-btn.bcn-in{animation:bcnFade .2s ease both !important;} html body .bcn-head > .bcn-btn.bcn-in > .bcn-ico{animation:none !important;}' +
    'html body .bcn-head > .bcn-btn.bcn-press{transform:none;opacity:.7;} html body .bcn-head > .bcn-btn > .bcn-ico{transform:none !important;}}' +
  '@media (prefers-reduced-transparency:reduce){html body .bcn-head > .bcn-btn{-webkit-backdrop-filter:none;backdrop-filter:none;background:#334155 !important;}' +
    'html body .bcn-head.bcn-claro > .bcn-btn{background:#e2e8f0 !important;}}' +
  '@media (prefers-contrast:more){html body .bcn-head > .bcn-btn{border:2px solid #fff !important;background:#0f172a !important;}' +
    'html body .bcn-head.bcn-claro > .bcn-btn{border:2px solid #0f172a !important;background:#fff !important;color:#0f172a !important;}}';
  function ponerCss(){
    if (document.getElementById('bcNavAppleCss')) return;
    var st = document.createElement('style'); st.id = 'bcNavAppleCss'; st.textContent = css;
    document.head.appendChild(st);
  }

  // ---------- Utilidades ----------
  var esEscritorio = function(){ return window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches; };
  var esMovil = function(){ return window.matchMedia && matchMedia('(max-width:768px)').matches; };
  var visible = function(el){ if (!el) return false; var s = getComputedStyle(el); var r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  function ventanasAbiertas(){
    var l = [];
    document.querySelectorAll('.modal-backdrop.active').forEach(function(m){ if (m.querySelector('.modal-box > .modal-header') && visible(m)) l.push(m); });
    var g = document.getElementById('modalGenerico'); if (g && g.isConnected && visible(g)) l.push(g);
    var orden = function(a){ return parseInt(getComputedStyle(a).zIndex, 10) || 0; };
    l.sort(function(a, b){ var d = orden(a) - orden(b); if (d) return d; return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    return l;
  }
  function cabeceraDe(win){
    if (win.id === 'modalGenerico'){ var b = win.querySelector('#modalGenericoBody'); return b && b.firstElementChild && b.firstElementChild.tagName === 'DIV' ? b.firstElementChild : null; }
    return win.querySelector('.modal-box > .modal-header');
  }
  function cajaDe(win){ return win.id === 'modalGenerico' ? win.querySelector('#modalGenericoBody') : win.querySelector('.modal-box'); }
  function esSalida(b){
    if (b.classList.contains('bcn-fab')) return true;
    if (b.classList.contains('modal-close') || b.classList.contains('modal-back-btn')) return true;
    var t = (b.textContent || '').trim();
    if (/^(✕|×|x|volver|cerrar|atrás|atras)$/i.test(t)) return true;
    if (b.querySelector('.ti-x, .ti-arrow-left, .ti-chevron-left') && t.length <= 8) return true;
    return false;
  }
  function esClaro(head){
    var c = getComputedStyle(head), m = (c.backgroundImage.match(/rgba?\([^)]+\)/) || [c.backgroundColor])[0];
    var p = (m || '').match(/([\d.]+)/g); if (!p) return true;
    var a = p[3] === undefined ? 1 : +p[3]; if (a < .4) return true;
    var lum = (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255; return lum > 0.72;
  }
  // Cristal adaptable: opacidad mínima del vidrio oscuro para que el ícono blanco
  // tenga contraste >= 4.6:1 sobre el color MÁS claro de la cabecera (peor caso).
  function lumRel(c){ var f = function(v){ v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); }
  function alfaVidrio(head){
    var c = getComputedStyle(head), cols = (c.backgroundImage.match(/rgba?\([^)]+\)/g) || []).concat([c.backgroundColor]);
    var peor = null;
    cols.forEach(function(s){ var p = (s.match(/[\d.]+/g) || []).map(Number); if (p.length < 3 || (p[3] !== undefined && p[3] < .4)) return; if (!peor || lumRel(p) > lumRel(peor)) peor = p; });
    if (!peor) return .30;
    for (var a = .30; a <= .80; a += .02){
      var m = [peor[0] * (1 - a) + 15 * a, peor[1] * (1 - a) + 23 * a, peor[2] * (1 - a) + 42 * a];
      if (1.05 / (lumRel(m) + .05) >= 4.6) return +a.toFixed(2);
    }
    return .80;
  }
  function cierreRespaldo(win){
    // Ventana sin salida: usar el botón Cerrar/Cancelar/Listo del pie (su propio handler)
    var pie = [].slice.call(win.querySelectorAll('.modal-footer button, button')).filter(function(b){ return /^(cerrar|cancelar|listo|salir|entendido)\b/i.test((b.textContent || '').trim()); });
    if (pie.length){ pie[0].click(); return; }
    if (win.id === 'modalGenerico' || win.id === 'modalAyuda') win.remove();
    else if (win.classList.contains('modal-backdrop')) win.classList.remove('active');
  }

  // ---------- Arreglo de una cabecera ----------
  function arreglar(win, apilada){
    var head = cabeceraDe(win); if (!head) return null;
    var modo = apilada ? 'back' : 'x';
    var salidas = [].slice.call(head.querySelectorAll(':scope > button, :scope > .modal-header-left > button, :scope > div > button')).filter(esSalida);
    // Elegir UNA salida principal: la ✕ (.modal-close) gana; las demás con el mismo onclick se ocultan
    var principal = salidas.filter(function(b){ return b.classList.contains('bcn-fab'); })[0] ||
                    salidas.filter(function(b){ return b.classList.contains('modal-close'); })[0] ||
                    salidas.filter(function(b){ return !b.classList.contains('modal-back-btn'); })[0] || salidas[0];
    if (!principal){
      principal = document.createElement('button'); principal.type = 'button'; principal.className = 'bcn-fab';
      principal.addEventListener('click', function(){ cierreRespaldo(win); });
      head.appendChild(principal);
    }
    var accion = principal.getAttribute('onclick') || '';
    salidas.forEach(function(b){
      if (b === principal) return;
      var mismo = (b.getAttribute('onclick') || '') === accion || b.classList.contains('modal-back-btn');
      if (mismo) b.classList.add('bcn-oculto');
    });
    // Estructura: [‹|esp] [centro] [✕|esp]
    if (!head.classList.contains('bcn-head')){
      head.classList.add('bcn-head');
      var mid = document.createElement('div'); mid.className = 'bcn-mid';
      [].slice.call(head.childNodes).forEach(function(n){
        if (n === principal || (n.nodeType === 1 && n.classList.contains('bcn-oculto'))) return;
        if (n.nodeType === 3 && !n.textContent.trim()) return;
        mid.appendChild(n);
      });
      head.appendChild(mid);
      var g = document.createElement('span'); g.className = 'bcn-grab'; g.setAttribute('aria-hidden', 'true'); head.appendChild(g);
      var ei = document.createElement('span'); ei.className = 'bcn-esp izq'; head.appendChild(ei);
      var ed = document.createElement('span'); ed.className = 'bcn-esp der'; head.appendChild(ed);
    }
    var claro = esClaro(head); head.classList.toggle('bcn-claro', claro);
    if (!claro){ var al = alfaVidrio(head); head.style.setProperty('--bcn-vidrio', 'rgba(15,23,42,' + al + ')'); head.style.setProperty('--bcn-vidrio2', 'rgba(15,23,42,' + Math.min(.9, al + .14).toFixed(2) + ')'); }
    // Botón principal: mismo handler, nuevo ícono/lugar/aspecto
    if (!principal.classList.contains('bcn-btn')){
      var txt = document.createElement('span'); txt.className = 'bcn-txt';
      while (principal.firstChild) txt.appendChild(principal.firstChild);   // el texto viejo se conserva, oculto
      var ico = document.createElement('i'); ico.className = 'ti bcn-ico'; ico.setAttribute('aria-hidden', 'true');
      principal.appendChild(ico); principal.appendChild(txt);
      principal.classList.add('bcn-btn');
      principal.type = principal.type || 'button';
      engancharPulsado(principal);
    }
    if (principal.dataset.bcnModo !== modo){
      principal.dataset.bcnModo = modo;
      principal.classList.toggle('bcn-x', modo === 'x'); principal.classList.toggle('bcn-back', modo === 'back');
      principal.classList.toggle('bcn-der', modo === 'x'); principal.classList.toggle('bcn-izq', modo === 'back');
      var ic = principal.querySelector('.bcn-ico'); ic.className = 'ti bcn-ico ' + (modo === 'x' ? 'ti-x' : 'ti-chevron-left');
      principal.setAttribute('aria-label', modo === 'x' ? 'Cerrar' : 'Volver');
      if (esEscritorio()) principal.title = modo === 'x' ? 'Cerrar (Esc)' : 'Volver (Esc)'; else principal.removeAttribute('title');
      var ei2 = head.querySelector(':scope > .bcn-esp.izq'), ed2 = head.querySelector(':scope > .bcn-esp.der');
      if (ei2) ei2.style.display = modo === 'back' ? 'none' : '';
      if (ed2) ed2.style.display = modo === 'x' ? 'none' : '';
      head.appendChild(principal);
    }
    head.__bcnWin = win;
    return principal;
  }

  // ---------- Pulsado (pointer-down, visible ≥90 ms; arrastrar fuera cancela) ----------
  function engancharPulsado(b){
    var t0 = 0, quitar = function(){ var falta = Math.max(0, 90 - (performance.now() - t0)); setTimeout(function(){ b.classList.remove('bcn-press'); }, falta); };
    b.addEventListener('pointerdown', function(e){ if (e.button > 0) return; t0 = performance.now(); b.classList.add('bcn-press'); });
    b.addEventListener('pointerup', quitar);
    b.addEventListener('pointercancel', quitar);
    b.addEventListener('pointerleave', quitar);   // el click nativo no ocurre si se suelta fuera
  }

  // ---------- Entrada (cada vez que la ventana se abre) ----------
  function animarEntrada(btn){
    if (!btn) return;
    btn.classList.remove('bcn-in'); void btn.offsetWidth; btn.classList.add('bcn-in');
    clearTimeout(btn.__bcnT); btn.__bcnT = setTimeout(function(){ btn.classList.remove('bcn-in'); }, S08.dur + 120);
  }

  // ---------- Procesar todas las ventanas abiertas ----------
  var abiertasAntes = new Set(), procesando = false;
  function procesar(){
    if (procesando) return; procesando = true;
    try {
      var l = ventanasAbiertas(), ahora = new Set();
      l.forEach(function(win, i){
        var head = cabeceraDe(win), nueva = !abiertasAntes.has(win) || (head && !head.classList.contains('bcn-head'));
        var btn = arreglar(win, i > 0);
        if (head && !head.__bcnSwipe) engancharDeslizar(head);
        if (nueva) animarEntrada(btn);
        ahora.add(win);
      });
      abiertasAntes = ahora;
    } finally { procesando = false; }
  }
  // MutationObserver: corre en microtarea, antes del pintado => sin parpadeo
  var SEL_VENTANA = '.modal-backdrop, #modalGenerico';
  var tocaVentana = function(n){
    if (!n || n.nodeType !== 1) return false;
    if (n.matches(SEL_VENTANA) || (n.closest && n.closest(SEL_VENTANA))) return true;
    return !!(n.querySelector && n.querySelector(SEL_VENTANA));
  };
  var obs = new MutationObserver(function(muts){
    for (var i = 0; i < muts.length; i++){
      var m = muts[i], j;
      if (m.type === 'attributes'){ if (m.target.classList && m.target.classList.contains('modal-backdrop')){ procesar(); return; } continue; }
      if (tocaVentana(m.target) && m.target !== document.body){ procesar(); return; }
      for (j = 0; j < m.addedNodes.length; j++) if (tocaVentana(m.addedNodes[j])){ procesar(); return; }
      for (j = 0; j < m.removedNodes.length; j++){ var r = m.removedNodes[j]; if (r.nodeType === 1 && (r.matches(SEL_VENTANA) || r.querySelector(SEL_VENTANA))){ procesar(); return; } }
    }
  });

  // ---------- Esc = salida de la ventana de arriba ----------
  function escManejadoPorOtro(ev){
    if (ev && ev.defaultPrevented) return true;
    var ae = document.activeElement;
    if (ae && ae.closest && ae.closest('.smart-select.open, [aria-expanded="true"], [role="listbox"], [role="combobox"][aria-expanded="true"], .dropdown.open, .open > .dropdown-menu, .ss-dropdown')) return true;
    if (document.querySelector('.bc-emoji-picker.open, .menu-flotante.open, [data-menu-abierto="1"]')) return true;
    return false;
  }
  function instalarEsc(){
    var orig = window._cerrarVentanaTop;
    if (typeof orig !== 'function' || orig.__bcn) return;
    var nuevo = function(){
      var ev = window.event;
      var l = ventanasAbiertas();
      if (!l.length) return orig.apply(this, arguments);
      // Si hay una capa ajena por encima (buscador de artículos, ficha, diálogos), la maneja el Esc de siempre
      var top = l[l.length - 1], zTop = parseInt(getComputedStyle(top).zIndex, 10) || 0, ajena = false;
      document.querySelectorAll('body > div').forEach(function(el){
        if (el === top || l.indexOf(el) >= 0 || !visible(el)) return;
        var cs = getComputedStyle(el); if (cs.position !== 'fixed') return;
        var r = el.getBoundingClientRect(); if (r.width < innerWidth * .9 || r.height < innerHeight * .9) return;
        if ((parseInt(cs.zIndex, 10) || 0) > zTop) ajena = true;
      });
      if (ajena) return orig.apply(this, arguments);
      if (escManejadoPorOtro(ev)) return false;
      var head = cabeceraDe(top), btn = head && head.querySelector(':scope > .bcn-btn');
      if (btn){ btn.click(); return true; }
      return orig.apply(this, arguments);
    };
    nuevo.__bcn = true;
    window._cerrarVentanaTop = nuevo;
  }

  // ---------- Deslizar hacia abajo para cerrar (celular) ----------
  function engancharDeslizar(head){
    head.__bcnSwipe = true;
    var st = null;
    var caja = function(){ var w = head.__bcnWin; return w ? cajaDe(w) : null; };
    head.addEventListener('pointerdown', function(e){
      if (!esMovil() || e.button > 0) return;
      if (e.target.closest('button, a, input, select, textarea, [onclick]')) return;
      var c = caja(); if (!c) return;
      st = { x: e.clientX, y: e.clientY, id: e.pointerId, eje: null, c: c, h: c.getBoundingClientRect().height, muestras: [{ t: performance.now(), y: 0 }], dy: 0 };
    });
    head.addEventListener('pointermove', function(e){
      if (!st || e.pointerId !== st.id) return;
      var dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.eje){
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;          // histéresis
        st.eje = Math.abs(dy) >= Math.abs(dx) ? 'v' : 'h';
        if (st.eje === 'h'){ st = null; return; }
        try { head.setPointerCapture(e.pointerId); } catch(_){}
        st.c.style.transition = 'none';
      }
      // 1:1 hacia abajo desde donde se apoyó; hacia arriba, resistencia progresiva
      var d = st.h, y = dy >= 0 ? dy : -(Math.abs(dy) * d * 0.55 / (d + 0.55 * Math.abs(dy)));
      st.dy = y; st.c.style.transform = 'translate3d(0,' + y + 'px,0)';
      st.muestras.push({ t: performance.now(), y: dy }); if (st.muestras.length > 6) st.muestras.shift();
      e.preventDefault();
    });
    var soltar = function(e){
      if (!st || e.pointerId !== st.id) return;
      var s = st; st = null;
      if (!s.eje) return;
      var a = s.muestras[0], b = s.muestras[s.muestras.length - 1];
      var v = (b.t - a.t) > 0 ? (b.y - a.y) / (b.t - a.t) : 0;                 // px/ms
      var proyeccion = s.dy + v * 0.998 / (1 - 0.998);                         // impulso (fórmula de Apple)
      var umbral = Math.min(220, Math.max(120, s.h / 2));
      var win = head.__bcnWin, btn = head.querySelector(':scope > .bcn-btn');
      if (proyeccion > umbral && btn){
        if (navigator.vibrate) { try { navigator.vibrate(10); } catch(_){} }
        s.c.style.transition = 'transform 160ms cubic-bezier(.3,0,.8,.6)';
        s.c.style.transform = 'translate3d(0,' + Math.max(s.dy, s.h * 0.6) + 'px,0)';
        setTimeout(function(){
          btn.click();                                                         // mismo handler del botón real
          s.c.style.transition = ''; s.c.style.transform = '';                  // limpio para la próxima vez
        }, 150);
      } else {
        s.c.style.transition = 'transform var(--bcn-d10) var(--bcn-ease10)';
        s.c.style.transform = 'translate3d(0,0,0)';
        setTimeout(function(){ if (!st){ s.c.style.transition = ''; s.c.style.transform = ''; } }, S10.dur + 40);
      }
    };
    head.addEventListener('pointerup', soltar);
    head.addEventListener('pointercancel', soltar);
  }

  function iniciar(){
    ponerCss();
    procesar();
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    instalarEsc();
    window.BayolNav.procesar = procesar;
  }
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);
})();
