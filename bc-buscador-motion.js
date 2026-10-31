/* BAYOL CELL · Buscar artículo con movimiento (dueño, 31-oct-2026, opción C). Estilos en bc-buscador-motion.css.
   No toca la lógica de taller-recepcion.js: mira lo que ese archivo pinta (MutationObserver) y le pone clases.
   · Al escribir o tocar una ficha, las filas entran en cascada (18 ms entre filas, máximo 90 ms). Con flechas, no.
   · Al abrir el detalle de una fila, el panel se despliega y las filas de abajo se corren (FLIP, solo transform).
   · El botón de precio hace un pulso al agregar; la línea nueva de la prefactura entra deslizándose y el total rueda.
   · Las fichas de categoría tienen una píldora azul que se desliza hasta la activa.
   · El campo respira una vez al enfocar. Con «reducir movimiento» no se hace nada.
   Apagar: BC_BMO=false o localStorage bc_bmo_off='1'. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  if (!root.classList.contains('bc-bmo')) return;
  var quieto = false;
  try { var mq = window.matchMedia('(prefers-reduced-motion: reduce)'); quieto = mq.matches; if (mq.addEventListener) mq.addEventListener('change', function (e) { quieto = e.matches; }); } catch (e) {}
  var v = doc.getElementById('v-recepcion'); if (!v) return;

  var razon = '';          // qué hizo el usuario justo antes de que la lista se volviera a pintar
  var codAgregado = '';    // código del artículo que se tocó para agregar
  var posAntes = null;     // posición de cada fila antes de repintar (para el FLIP del detalle)
  var cierre = null;       // copia del panel que se estaba cerrando (para recogerlo hacia arriba)
  var lista = null;

  function limpiar(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  // ---- Números que ruedan: cambia el texto de un elemento con dos capas (vieja sube, nueva entra) ----
  function rodar(el, nuevo) {
    var viejo = el.textContent;
    if (viejo === nuevo) return;
    if (quieto) { el.textContent = nuevo; return; }
    el.textContent = '';
    var w = doc.createElement('span'); w.className = 'bmo-rol';
    var a = doc.createElement('span'); a.className = 'v'; a.textContent = viejo;
    var b = doc.createElement('span'); b.className = 'n'; b.textContent = nuevo;
    w.appendChild(a); w.appendChild(b); el.appendChild(w);
    setTimeout(function () { if (el.firstChild === w) el.textContent = nuevo; }, 300);
  }
  // Vigila un elemento de texto (el total de la barra): cuando taller-prefactura.js le cambia el texto, lo hace rodar.
  var vigilados = new WeakMap();
  function vigilarTexto(el) {
    if (!el || vigilados.has(el)) return;
    var ultimo = el.textContent, dentro = false;
    var mo = new MutationObserver(function () {
      if (dentro) return;
      var t = el.textContent;
      if (el.querySelector('.bmo-rol') || t === ultimo) return;
      dentro = true; var prev = ultimo; ultimo = t;
      // se restaura el texto viejo un instante y se rueda al nuevo
      el.textContent = prev; rodar(el, t);
      setTimeout(function () { dentro = false; }, 320);
    });
    mo.observe(el, { childList: true, characterData: true, subtree: true });
    vigilados.set(el, mo);
  }

  // ---- Lo que hace el usuario (en captura, antes de que taller-recepcion.js repinte) ----
  v.addEventListener('input', function (e) { if (e.target.closest && e.target.closest('.bcrx-ppk-inp')) razon = 'escribir'; }, true);
  v.addEventListener('keydown', function (e) {
    if (!e.target.closest || !e.target.closest('.bcrx-ppk')) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') razon = 'flecha';
  }, true);
  v.addEventListener('pointerdown', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var l = t.closest('.bcrx-ppk-list');
    if (!l) { if (t.closest('.bcrx-ppk-chip')) razon = 'escribir'; return; }
    var add = t.closest('.pk-add');
    if (add) {
      razon = 'agregar';
      var f = add.closest('[data-fila]'), c = f && f.querySelector('.pk-cod');
      codAgregado = c ? c.textContent.trim() : '';
      if (!add.disabled && !quieto) limpiar(add, 'bmo-pulso');
      return;
    }
    if (t.closest('.pk-nv[data-nv]')) { razon = 'nivel'; return; }
    if (t.closest('[data-fila]')) {
      razon = 'detalle'; posAntes = posiciones(l);
      // si la fila tocada ya estaba abierta, se guarda una copia del panel para recogerlo hacia arriba al cerrar
      var det = l.querySelector('.bcrx-ppk-det'); // el panel abierto, sea de esta fila o de otra
      cierre = null;
      if (det) {
        var rl = l.getBoundingClientRect(), rd = det.getBoundingClientRect();
        cierre = { html: det.outerHTML, top: rd.top - rl.top + l.scrollTop, h: rd.height };
      }
    }
  }, true);
  v.addEventListener('focusin', function (e) {
    var inp = e.target.closest && e.target.closest('.bcrx-ppk-inp');
    if (inp && !quieto) limpiar(inp, 'bmo-foco');
  });

  function posiciones(l) {
    var m = {}, base = l.getBoundingClientRect().top;
    Array.prototype.forEach.call(l.querySelectorAll('.bcrx-ppk-row'), function (r) {
      var c = r.querySelector('.pk-cod'); if (c) m[c.textContent.trim()] = r.getBoundingClientRect().top - base;
    });
    return m;
  }

  // ---- Cuando la lista se vuelve a pintar ----
  function alPintar(l) {
    var filas = l.querySelectorAll('.bcrx-ppk-row');
    var r = razon; razon = '';
    if (quieto || !filas.length) return;
    if (r === 'escribir') {
      Array.prototype.forEach.call(filas, function (f, i) {
        f.style.animationDelay = Math.min(i * 18, 90) + 'ms'; f.classList.add('bmo-in');
      });
      return;
    }
    if (r === 'detalle' && posAntes) {
      var ahora = posiciones(l), antes = posAntes; posAntes = null;
      Array.prototype.forEach.call(filas, function (f) {
        var c = f.querySelector('.pk-cod'); if (!c) return;
        var k = c.textContent.trim(), d = (antes[k] != null && ahora[k] != null) ? antes[k] - ahora[k] : 0;
        if (Math.abs(d) < 1 || typeof f.animate !== 'function') return;
        f.classList.add('bmo-flip');
        f.animate([{ transform: 'translateY(' + d + 'px)' }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' })
          .onfinish = function () { f.classList.remove('bmo-flip'); };
      });
      var det = l.querySelector('.bcrx-ppk-det'); if (det) det.classList.add('bmo-abre');
      // cerrar: la copia del panel se recoge hacia arriba mientras las filas suben (FLIP)
      if (cierre) {
        var tmp = doc.createElement('div'); tmp.innerHTML = cierre.html; var copia = tmp.firstElementChild;
        if (copia) {
          copia.classList.remove('bmo-abre'); copia.classList.add('bmo-cierra'); copia.style.top = cierre.top + 'px'; copia.setAttribute('aria-hidden', 'true');
          l.classList.add('bmo-rel'); l.appendChild(copia);
          setTimeout(function () { if (copia.parentNode) copia.parentNode.removeChild(copia); }, 240);
        }
      }
      cierre = null;
      return;
    }
    if (r === 'agregar' && codAgregado) {
      Array.prototype.forEach.call(filas, function (f) {
        var c = f.querySelector('.pk-cod'); if (!c || c.textContent.trim() !== codAgregado) return;
        var ya = f.querySelector('.pk-ya'); if (ya) ya.classList.add('bmo-pop');
      });
    }
  }

  // ---- Píldora que se desliza entre las fichas de categoría ----
  function pildora(chips) {
    var pil = chips.querySelector('.bmo-pil');
    if (!pil) { pil = doc.createElement('span'); pil.className = 'bmo-pil'; pil.setAttribute('aria-hidden', 'true'); chips.insertBefore(pil, chips.firstChild); chips.classList.add('bmo-lista'); }
    var on = chips.querySelector('.bcrx-ppk-chip.on');
    // solo se toca la clase cuando cambia: poner la misma clase otra vez dispararía el observador en bucle
    if (!on) { if (pil.classList.contains('on')) pil.classList.remove('on'); return; }
    var x = on.offsetLeft, y = on.offsetTop, w = on.offsetWidth, h = on.offsetHeight;
    var tr = 'translate(' + x + 'px,' + y + 'px) scale(' + (w / 10) + ',' + (h / 10) + ')';
    if (pil.style.transform !== tr) pil.style.transform = tr;
    if (!pil.classList.contains('on')) { pil.style.transition = 'none'; void pil.offsetWidth; pil.style.transition = ''; pil.classList.add('on'); }
  }

  // ---- Conectar cada vez que se abre el panel (taller-recepcion.js lo arma de cero) ----
  var moLista = new MutationObserver(function () { if (lista) alPintar(lista); });
  var moChips = null;
  function conectar() {
    var l = v.querySelector('.bcrx-ppk-list');
    if (l !== lista) {
      moLista.disconnect(); lista = l;
      if (l) moLista.observe(l, { childList: true });
    }
    var chips = v.querySelector('.bcrx-ppk-chips');
    if (chips && !chips.classList.contains('bmo-lista')) {
      pildora(chips);
      if (moChips) moChips.disconnect();
      moChips = new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) if (ms[i].target.classList && ms[i].target.classList.contains('bcrx-ppk-chip')) { pildora(chips); return; } });
      moChips.observe(chips, { attributes: true, attributeFilter: ['class'], subtree: true });
      chips.addEventListener('scroll', function () { pildora(chips); }, { passive: true });
    }
    // total de la barra (recepción o prefactura) y línea nueva
    vigilarTexto(v.querySelector('.bcrx-total-num'));
    vigilarTexto(v.querySelector('.bcpf-bar .bn'));
  }
  // Línea nueva en la prefactura: entra deslizándose y su importe rueda las próximas veces.
  var nLineas = -1;
  function lineas() {
    var its = v.querySelectorAll('.bcpf-it');
    if (nLineas >= 0 && its.length > nLineas && !quieto) its[its.length - 1].classList.add('bmo-nueva');
    nLineas = its.length;
    Array.prototype.forEach.call(its, function (it) { vigilarTexto(it.querySelector('.imp')); });
  }
  var moV = new MutationObserver(function (ms) {
    // se ignoran los cambios que hace esta misma capa (números que ruedan, píldora)
    for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (!(t.closest && (t.closest('.bmo-rol') || t.classList.contains('bmo-pil')))) { conectar(); lineas(); return; } }
  });
  moV.observe(v, { childList: true, subtree: true });
  conectar(); lineas();
})();
