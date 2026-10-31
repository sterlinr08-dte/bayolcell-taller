/* BAYOL CELL · Ayudas detrás de una ⓘ (19-oct-2026). Réplica de la de NEXUS PRO (59.42).
   Dueño: «lo mismo que hicimos en Nexus Pro … el icono de la I para información … tener la pantalla más limpia».
   Las notas que EXPLICAN (subtítulos largos, aclaraciones entre paréntesis, «toca para abrir») salen de la vista y
   quedan detrás de una ⓘ junto a su título; al tocarla se abre una burbuja con el texto ACTUAL de la nota.
   NO se esconden avisos, errores, estados vacíos, cifras ni datos.
   Reglas en BC_INFO_REGLAS (por pantalla); se aplican al cargar y cada vez que una pantalla se repinta.
   No cambia ningún texto guardado, función ni dato. Apagar: BC_INFO=false o localStorage bc_info_off='1'. */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-info')) return;

  function todos(sel) { return Array.prototype.slice.call(doc.querySelectorAll(sel)); }
  function limpio(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  // nota por el comienzo de su texto, dentro de una raíz
  function porTexto(raiz, sel, inicio) {
    return todos(raiz + ' ' + sel).filter(function (e) { return limpio(e.textContent).indexOf(inicio) === 0; });
  }
  function encabezado(n) { var c = n.closest('.rx-card'); return c ? c.querySelector('.rx-head') : null; }
  // Título más cercano ANTES de la nota (subiendo hasta la pantalla): h1–h4 o .card-title.
  var TIT = 'h1,h2,h3,h4,.card-title';
  function cercano(n) {
    for (var x = n; x && !(x.classList && x.classList.contains('view')); x = x.parentElement) {
      for (var s = x.previousElementSibling; s; s = s.previousElementSibling) {
        if (s.matches(TIT)) return s;
        var hs = s.querySelectorAll(TIT); if (hs.length) return hs[hs.length - 1];
      }
    }
    return null;
  }
  // Atajo para las demás pantallas: nota por su comienzo; la ⓘ va en el título más cercano (o el que se indique).
  function nota(vista, sel, inicio, titulo) {
    return { notas: function () { var ns = porTexto('#v-' + vista, sel, inicio); return ns.filter(function (e) { return !ns.some(function (o) { return o !== e && e.contains(o); }); }); }, titulo: titulo || cercano };
  }

  // Cada regla: notas() → elementos a esconder; titulo(nota) → dónde va la ⓘ; paren: solo el «(…)» de una etiqueta.
  // texto(nota) opcional → cómo se lee en la burbuja (si la nota original es un paréntesis o un «toca para abrir»).
  var BC_INFO_REGLAS = [
    // ── Recepción ──
    { notas: function () { return porTexto('#v-recepcion', '.rx-toolsbox > summary > span', '— pedir reseña'); },
      titulo: function (n) { return n.parentElement; }, texto: function () { return 'Pedir reseña de Google a un cliente y generar boletos de rifa. Toque para abrir.'; } },
    { notas: function () { return porTexto('#v-recepcion', '.card > p', 'Envía el enlace').concat(porTexto('#v-recepcion', '.card > p', 'Número al azar')); },
      titulo: function (n) { var c = n.closest('.card') || n.parentElement; return c.querySelector('h3'); } },
    { notas: function () { return todos('#v-recepcion .rx-head > span[style*="94a3b8"]').filter(function (e) { return /Info Plus/.test(e.textContent); }); },
      titulo: function (n) { return n.parentElement; }, texto: function () { return 'Estos datos se toman de Info Plus y se guardan allí.'; } },
    { notas: function () { return todos('#v-recepcion .bc-mkt-sub'); },
      titulo: function (n) { return n.parentElement.querySelector('.bc-mkt-title'); } },
    { notas: function () { return porTexto('#v-recepcion', 'span', 'se aplica a todos los artículos'); },
      titulo: function (n) { var p = n.parentElement; return p && p.querySelector('label'); }, texto: function () { return 'El precio elegido se aplica a todos los artículos de la prefactura.'; } },
    { notas: function () { return porTexto('#v-recepcion', '.rx-art-search > span', 'Artículo = del catálogo'); },
      titulo: encabezado },
    { notas: function () { return porTexto('#v-recepcion', 'details > summary > span', '(opcional'); },
      titulo: function (n) { return n.parentElement; }, texto: function () { return 'Opcional.'; } },
    { notas: function () { return porTexto('#v-recepcion', 'details div', 'Marque los problemas que reporta').filter(function (e) { return !e.children.length; }); },
      titulo: function (n) { var d = n.closest('details'); return d && d.querySelector('summary'); } },
    { notas: function () { return porTexto('#v-recepcion', 'details > summary > span', '(claves, patrón'); },
      titulo: function (n) { return n.parentElement; }, texto: function () { return 'Claves, PIN, patrón y cuentas del equipo.'; } },
    { notas: function () { return todos('#v-recepcion .access-note'); },
      titulo: function (n) { var d = n.closest('details'); return d && d.querySelector('summary'); } },
    // Etiquetas con una aclaración entre paréntesis: la etiqueta queda corta y el paréntesis va a la ⓘ
    { paren: true, notas: function () { return porTexto('#v-recepcion', 'label', 'Nombre visible (').concat(porTexto('#v-recepcion', 'label', 'Observaciones (')); } },

    // ── Demás pantallas del taller (19-oct-2026, dueño: «sigue con la ⓘ en las demás pantallas») ──
    // Solo notas que EXPLICAN. Se quedan a la vista: avisos (ilustración con IA, zoom), pasos de instalación de QZ Tray,
    // estados vacíos, cifras y totales.
    nota('dashboard', 'p', 'Solo cuenta visitantes reales'),
    nota('contabilidad', 'p', 'Las ventas y el costo salen solos'),
    nota('diagnostico', 'p', 'BITMAP, inteligencia artificial'),
    nota('diagnostico', 'p', 'Describa a la IA el síntoma'),
    nota('diagnostico', 'p.abc-ayuda', 'Escriba la línea'),
    nota('diagnostico', 'p', 'Catálogo privado compartido'),
    nota('articulos', 'p', '"Sincronizar Taller"'),
    nota('despachos', 'p', 'Traspasa mercancía'),
    nota('etiquetas', 'p', 'Modifique los campos del dispositivo'),
    nota('configImpresora', 'div', 'Ajuste el tamaño y verifique'),
    // 23-oct-2026: tarjeta «Prefactura» (papel y copias): la explicación va en la ⓘ del título
    nota('configImpresora', '#bcPfFmtCard .bcpffmt-mut', 'Papel con el que sale', function (n) { return n.parentElement.querySelector('.bcpf-hd h3'); }),
    nota('configImpresora', 'small', 'Más alto = más oscuro', function (n) { return n.parentElement.querySelector('label'); }),
    nota('configImpresora', 'p', 'Esto se imprime EXACTAMENTE'),
    nota('configImpresora', 'p', 'Ajuste el tamaño y seleccione'),
    nota('configImpresora', 'p', 'Los cambios se guardan automáticamente'),
    nota('reportes', 'p', 'Evalúa el trabajo de cada técnico'),
    nota('reportes', 'p', 'Dinero cobrado por reparaciones'),
    nota('configuracion', 'div', 'Aquí se gestionan los técnicos'),
    nota('catalogoWeb', 'div', 'Sale solo de Info Plus', function (n) { var h = n.previousElementSibling; return h && h.querySelector('b'); }),
    nota('catalogoWeb', 'div', 'Los precios salen solos de Info Plus'),
    nota('invfisico', 'p', 'Cuente la mercancía real'),
    nota('invfisico', 'p', 'Cuente primero lo más caro'),
    nota('liquidacion', 'p', 'Los productos van en US$'),
    nota('liquidacion', 'span', 'Clic en el título de una columna'),
    nota('rifaFactura', 'p', 'Registro independiente de la Rifa'),
    // Mis incentivos e Incentivos: «Servicios de este ticket (usa el ＋ …)» queda corto; la aclaración va a su ⓘ
    { notas: function () { return todos('#v-misIncentivos div > span, #v-miTrabajo #miTrabajoIncentivos div > span, #v-incentivos label.inc-lbl > span').filter(function (e) { return /^\(us[ae] (el )?＋/.test(limpio(e.textContent)); }); },
      titulo: function (n) { return n.parentElement; }, texto: function () { return 'Use el ＋ para agregar otra reparación al mismo ticket.'; } },
    nota('misIncentivos', 'div', 'Si el ticket tiene más de una reparación', function () {
      var s = todos('#v-misIncentivos div > span').filter(function (e) { return /^\(us[ae] (el )?＋/.test(limpio(e.textContent)); })[0]; return s && s.parentElement; })
    ,
    // 26-oct-2026: el mismo formulario «Registrar Ticket» dentro de Mi trabajo
    nota('miTrabajo', '#miTrabajoIncentivos div', 'Si el ticket tiene más de una reparación', function () {
      var s = todos('#v-miTrabajo #miTrabajoIncentivos div > span').filter(function (e) { return /^\(us[ae] (el )?＋/.test(limpio(e.textContent)); })[0]; return s && s.parentElement; }),
    // Prefactura (20-oct-2026, dueño: «quítale esas letras y ponlo con la i de información»): el aviso amarillo
    // «usuario no enlazado con Info Plus» queda detrás de una ⓘ junto a «Vendedor».
    { notas: function () { return todos('#v-recepcion #rxVendAviso').filter(function (e) { return e.style.display !== 'none'; }); },
      titulo: function () { var s = doc.getElementById('rxVendedor'), c = s && (s.closest('.bcpf-campos > div') || s.parentElement); return c && c.querySelector('label'); },
      texto: function () { return 'Su usuario todavía no está enlazado con Info Plus: la prefactura sale a nombre del vendedor que elija aquí.\n\nPida al administrador que registre su código en Configuración → Técnicos.'; } },
    // 23-oct-2026 (dueño: «no pongas texto tan explicativo; si es necesario, la ⓘ»): la nota «No cobra ni descuenta
    // inventario: se factura en Info Plus» de los totales queda detrás de una ⓘ junto a «Total».
    // 31-oct-2026 (reglamento de microcopy): las notas de «Comentario» y «Equipo y falla» van detrás de la ⓘ de su título
    { notas: function () { return todos('#v-recepcion .bcpf-nota'); },
      titulo: function (n) { var d = n.closest('details'); return d ? d.querySelector('summary > span') : null; } },
    { notas: function () { return porTexto('#v-recepcion', '.bcpf-tot .t-info', 'No cobra ni descuenta'); },
      titulo: function () { var t = doc.querySelector('#v-recepcion .bcpf-tot .tt > span'); return t; } },
  ];

  function boton(titulo) {
    var b = titulo.querySelector(':scope > .bcInfoI');
    if (!b) {
      b = doc.createElement('button'); b.type = 'button'; b.className = 'bcInfoI';
      b.setAttribute('aria-label', 'Más información'); b.setAttribute('aria-expanded', 'false');
      b.innerHTML = '<span aria-hidden="true">i</span>';
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); abrir(b); });
      // dentro de un <summary>, la ⓘ no debe abrir/cerrar el desplegable
      // junto al título: antes del número del paso o de la flecha del desplegable, si los hay
      var ref = titulo.querySelector(':scope > .rx-num, :scope > i.ti-chevron-down');
      titulo.insertBefore(b, ref); titulo.insertBefore(doc.createTextNode(' '), b);
    }
    return b;
  }
  function anotar(b, n, texto) {
    b._notas = b._notas || [];
    if (!b._notas.some(function (x) { return x.el === n; })) b._notas.push({ el: n, texto: texto });
  }
  function aplicarParen(lbl) {
    if (lbl.querySelector(':scope > .bcInfoParen')) return;
    var nodos = Array.prototype.slice.call(lbl.childNodes);
    for (var i = 0; i < nodos.length; i++) {
      var t = nodos[i]; if (t.nodeType !== 3) continue;
      var m = /^(.*?)\s*\(([^()]{8,})\)\s*(\*?)\s*:?\s*$/.exec(t.textContent); if (!m) continue;
      t.textContent = m[1] + (m[3] ? ' ' + m[3] : '');
      var s = doc.createElement('span'); s.className = 'bcInfoParen bcInfoOculto';
      s.textContent = m[2].charAt(0).toUpperCase() + m[2].slice(1) + '.';
      lbl.appendChild(s); anotar(boton(lbl), s); return;
    }
  }
  function aplicar() {
    BC_INFO_REGLAS.forEach(function (r) {
      var ns; try { ns = r.notas() || []; } catch (e) { return; }
      ns.forEach(function (n) {
        if (!n) return;
        if (r.paren) { aplicarParen(n); return; }
        if (!limpio(n.textContent)) return;
        var t; try { t = r.titulo(n); } catch (e) { t = null; }
        if (!t || t === n || n.contains(t)) return;
        n.classList.add('bcInfoOculto');
        // Si el título ya tiene su botón de ayuda del módulo (ayudaModulo: explica lo mismo y más), no se pone otra ⓘ
        var ay = t.querySelector(':scope > button[onclick^="ayudaModulo"]');
        if (ay) { ay.classList.add('bcInfoAyuda'); return; }
        anotar(boton(t), n, r.texto ? r.texto(n) : null);
      });
    });
  }

  function cerrar() { var t = doc.getElementById('bcInfoTip'); if (t) { if (t._b) t._b.setAttribute('aria-expanded', 'false'); t.remove(); } }
  function abrir(b) {
    var ya = doc.getElementById('bcInfoTip'); if (ya && ya._b === b) { cerrar(); return; } cerrar();
    var txt = (b._notas || []).filter(function (x) { return doc.contains(x.el); })
      .map(function (x) { return x.texto || limpio(x.el.textContent); }).filter(Boolean).join('\n\n');
    if (!txt) return;
    var t = doc.createElement('div'); t.id = 'bcInfoTip'; t.setAttribute('role', 'tooltip'); t.textContent = txt; t._b = b;
    doc.body.appendChild(t); b.setAttribute('aria-expanded', 'true');
    var br = b.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight, vw = innerWidth, vh = innerHeight;
    var x = Math.max(16, Math.min(vw - w - 16, br.left + br.width / 2 - w / 2)), y = br.bottom + 4;
    if (y + h > vh - 12 && br.top - h - 4 > 12) { y = br.top - h - 4; t.classList.add('arriba'); }
    t.style.left = x + 'px'; t.style.top = y + 'px'; t.style.setProperty('--fx', (br.left + br.width / 2 - x) + 'px');
  }
  doc.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('#bcInfoTip,.bcInfoI')) cerrar(); }, true);
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && doc.getElementById('bcInfoTip')) { e.stopPropagation(); cerrar(); } }, true);
  doc.addEventListener('scroll', function (e) {
    var t = doc.getElementById('bcInfoTip'); if (!t) return;
    var el = e.target === doc ? doc.scrollingElement : e.target; if (!el) return;
    t._base = t._base || new Map();
    if (!t._base.has(el)) { t._base.set(el, el.scrollTop); return; }
    if (Math.abs(el.scrollTop - t._base.get(el)) > 40) cerrar();
  }, true);

  var pend = false;
  function programar() { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; try { aplicar(); } catch (e) {} }); }
  function iniciar() { aplicar(); new MutationObserver(programar).observe(doc.body, { childList: true, subtree: true }); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.bcInfoAplicar = aplicar;
})();
