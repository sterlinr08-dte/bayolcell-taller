/* BAYOL CELL · Capa global de interfaz (26-oct-2026, agente 6 de 10). Va con taller-ui-global.css.
   1) Ayudas detrás de una ⓘ en Configuración, Reportes y Estadísticas (regla del dueño, 23-oct: nada de texto
      explicativo en pantalla). Usa la misma ⓘ y la misma burbuja que taller-info.js (clases bcInfoI / #bcInfoTip),
      así taller-info.js también la cierra al tocar fuera, con Escape o al desplazar.
      Solo se esconden notas que EXPLICAN; avisos, errores, cifras y estados vacíos se quedan a la vista.
   2) Menú del celular: Escape lo cierra y el botón ☰ dice si está abierto (aria-expanded).
   No cambia ningún dato ni función. Apagar: BC_UI=false o localStorage bc_ui_off='1'. */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-ui')) return;

  function todos(sel) { return Array.prototype.slice.call(doc.querySelectorAll(sel)); }
  function limpio(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function empieza(sel, inicio) { return todos(sel).filter(function (e) { return limpio(e.textContent).indexOf(inicio) === 0; }); }
  function tituloTarjeta(n) { var c = n.closest('.card'); return c && c.querySelector('h2, h3'); }

  // Cada regla: notas() → elementos a esconder; titulo(nota) → dónde va la ⓘ; texto opcional para la burbuja.
  var REGLAS = [
    // Configuración
    { notas: function () { return empieza('#cfgContentRoles .card > div', 'Cree roles personalizados'); }, titulo: tituloTarjeta },
    { notas: function () { return empieza('#cfgContentCatalogos .card > div', 'Categorías generales'); }, titulo: tituloTarjeta },
    { notas: function () { return empieza('#cfgContentCatalogos .card > div', 'Marcas (Apple'); }, titulo: tituloTarjeta },
    { notas: function () { return empieza('#cfgContentGeneral .card > p', 'Estos datos aparecen en el recibo'); }, titulo: tituloTarjeta },
    { notas: function () { return empieza('#cfgContentGeneral .card > p', 'Arrastre los íconos'); }, titulo: tituloTarjeta },
    { notas: function () { return empieza('#cfgContentFallas .card > p', 'Estas son las fallas'); }, titulo: tituloTarjeta },
    { notas: function () { return empieza('#cfgContentGeneral .card > div', 'Tope para el %'); },
      titulo: function (n) { var l = n.previousElementSibling; while (l && l.tagName !== 'LABEL') l = l.previousElementSibling; return l; } },
    // Reportes: la definición de «Trabajo» y «Total cliente»
    { notas: function () { return empieza('#v-reportes #reporteContenido .card > div', 'Trabajo = desde que'); },
      titulo: tituloTarjeta, texto: function () { return 'Trabajo: desde que el técnico lo toma hasta que lo finaliza.\nTotal cliente: desde la recepción hasta la entrega.'; },
      // si todavía no hay trabajos, ese aviso sí se queda a la vista
      soloSi: function (n) { return !/Aún no hay trabajos/.test(n.textContent); } },
    // Estadísticas
    { notas: function () { return empieza('#v-estadisticas > .card > p', 'Módulo interno'); }, titulo: tituloTarjeta },
    { notas: function () { return empieza('#v-estadisticas p, #v-estadisticas div', 'Las compras a proveedores se activarán').filter(function (e) { return !e.querySelector('p, div'); }); }, titulo: tituloTarjeta }
  ];
  // Etiquetas de Configuración con una aclaración larga entre paréntesis: la etiqueta queda corta y el paréntesis va a la ⓘ
  var PAREN = '#cfgContentGeneral label';

  function boton(t) {
    var b = t.querySelector(':scope > .bcInfoI');
    if (!b) {
      b = doc.createElement('button'); b.type = 'button'; b.className = 'bcInfoI bcUiI';
      b.setAttribute('aria-label', 'Más información'); b.setAttribute('aria-expanded', 'false');
      b.innerHTML = '<span aria-hidden="true">i</span>';
      t.appendChild(doc.createTextNode(' ')); t.appendChild(b);
    }
    // La ⓘ ya la puso taller-info.js: se le suman las notas a la suya (su clic las muestra) y no se agrega otro clic
    if (b.classList.contains('bcUiI') && !b._uiClic) { b._uiClic = true; b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); abrir(b); }); }
    return b;
  }
  function anotar(b, n, texto) {
    var k = b.classList.contains('bcUiI') ? '_uiNotas' : '_notas';
    b[k] = b[k] || [];
    if (!b[k].some(function (x) { return x.el === n; })) b[k].push({ el: n, texto: texto });
  }
  function aplicarParen(lbl) {
    if (lbl.querySelector(':scope > .bcInfoParen')) return;
    var nodos = Array.prototype.slice.call(lbl.childNodes);
    for (var i = 0; i < nodos.length; i++) {
      var t = nodos[i]; if (t.nodeType !== 3) continue;
      var m = /^(.*?)\s*\(([^()]{10,})\)\s*:?\s*$/.exec(t.textContent); if (!m) continue;
      t.textContent = m[1];
      var s = doc.createElement('span'); s.className = 'bcInfoParen bcInfoOculto';
      s.textContent = m[2].charAt(0).toUpperCase() + m[2].slice(1) + '.';
      lbl.appendChild(s); anotar(boton(lbl), s); return;
    }
  }
  function aplicar() {
    REGLAS.forEach(function (r) {
      var ns; try { ns = r.notas() || []; } catch (e) { return; }
      ns.forEach(function (n) {
        if (!n || !limpio(n.textContent) || n.classList.contains('bcInfoOculto')) return;
        if (r.soloSi && !r.soloSi(n)) return;
        var t; try { t = r.titulo(n); } catch (e) { t = null; }
        if (!t || t === n || n.contains(t)) return;
        n.classList.add('bcInfoOculto');
        anotar(boton(t), n, r.texto ? r.texto(n) : null);
      });
    });
    todos(PAREN).forEach(aplicarParen);
  }

  function cerrar() { var t = doc.getElementById('bcInfoTip'); if (t) { if (t._b) t._b.setAttribute('aria-expanded', 'false'); t.remove(); } }
  function abrir(b) {
    var ya = doc.getElementById('bcInfoTip'); if (ya && ya._b === b) { cerrar(); return; } cerrar();
    var txt = (b._uiNotas || []).filter(function (x) { return doc.contains(x.el); })
      .map(function (x) { return x.texto || limpio(x.el.textContent); }).filter(Boolean).join('\n\n');
    if (!txt) return;
    var t = doc.createElement('div'); t.id = 'bcInfoTip'; t.setAttribute('role', 'tooltip'); t.textContent = txt; t._b = b;
    doc.body.appendChild(t); b.setAttribute('aria-expanded', 'true');
    var br = b.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight, vw = innerWidth, vh = innerHeight;
    var x = Math.max(16, Math.min(vw - w - 16, br.left + br.width / 2 - w / 2)), y = br.bottom + 4;
    if (y + h > vh - 12 && br.top - h - 4 > 12) { y = br.top - h - 4; t.classList.add('arriba'); }
    t.style.left = x + 'px'; t.style.top = y + 'px'; t.style.setProperty('--fx', (br.left + br.width / 2 - x) + 'px');
  }
  // Si taller-info.js está apagado, esta capa cierra su propia burbuja
  if (!doc.documentElement.classList.contains('bc-info')) {
    doc.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('#bcInfoTip,.bcInfoI')) cerrar(); }, true);
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); }, true);
  }

  // Menú del celular: Escape lo cierra; el ☰ anuncia si está abierto
  function menuEstado() {
    var sb = doc.getElementById('sidebar'), bt = doc.querySelector('.top-bar .menu-toggle');
    if (sb && bt) bt.setAttribute('aria-expanded', sb.classList.contains('open') ? 'true' : 'false');
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || doc.getElementById('bcInfoTip')) return;
    var sb = doc.getElementById('sidebar');
    if (sb && sb.classList.contains('open') && typeof window.closeSidebar === 'function') { window.closeSidebar(); menuEstado(); }
  });

  var pend = false;
  function programar() { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; try { aplicar(); menuEstado(); } catch (e) {} }); }
  function iniciar() {
    aplicar(); menuEstado();
    var bt = doc.querySelector('.top-bar .menu-toggle'); if (bt) bt.setAttribute('aria-controls', 'sidebar');
    new MutationObserver(programar).observe(doc.body, { childList: true, subtree: true });
    var sb = doc.getElementById('sidebar'); if (sb) new MutationObserver(menuEstado).observe(sb, { attributes: true, attributeFilter: ['class'] });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.bcUiAplicar = aplicar;
})();
