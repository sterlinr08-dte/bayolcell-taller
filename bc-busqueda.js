/* BAYOL CELL · BUSCADOR «Premium» (4 oct 2026) — réplica del de NEXUS PRO (parches-busqueda-premium.js v58.94,
   reel «Search Toggle UI Upgrade»), adaptada al taller con el naranja de la marca del taller.
   Una lupa redonda con borde naranja; al tocarla se estira con resorte (leve sobrepaso) hasta una píldora con «Buscar…»,
   una ✕, halo naranja, puntitos flotantes y, en la computadora, el aviso «Esc · Pulsa Esc para cerrar».
   · Envuelve el <input> que ya existe SIN cambiar su id, su oninput ni la lógica de filtrado (solo lo mueve a un marco).
   · Se monta solo (MutationObserver) en TODOS los buscadores del taller: campos de texto cuyo placeholder dice «Buscar»,
     «Escanear» o «Escribe IMEI». Fuera: el CRM de WhatsApp (tiene su propio buscador), el buscador grande de artículos
     (.ab-modal) y el de direcciones del mapa. Excluir otro: atributo data-bcbp-no en el campo o en un contenedor.
   · Extra de Bayol: si el sistema pone el cursor en el campo (ventana que abre y enfoca el buscador, escáner), la píldora
     se abre sola; así se puede escanear un IMEI sin tocar la lupa antes.
   · Cerrar: ✕ (si hay texto primero limpia), Esc, o tocar fuera (el texto se conserva y la lupa muestra un punto).
   · «Reducir movimiento»: sin resorte ni puntitos, solo fundidos. Estilos en bc-busqueda.css. API: window.bcBusquedaPremium. */
(function () {
  'use strict';
  if (window.bcBusquedaPremium && typeof window.bcBusquedaPremium.montar === 'function') return;   // (un elemento con id igual también «existe» en window: se comprueba la API)
  var doc = document;
  // estilos (bc-busqueda.css), con la misma versión que este archivo
  (function () {
    if (doc.getElementById('bcBusquedaCss')) return;
    var l = doc.createElement('link'); l.id = 'bcBusquedaCss'; l.rel = 'stylesheet';
    var src = (doc.currentScript && doc.currentScript.src) || '', v = (/[?&]v=([^&]+)/.exec(src) || [])[1] || '1';
    l.href = 'bc-busqueda.css?v=' + v; (doc.head || doc.documentElement).appendChild(l);
  })();
  var MQ = {};
  function mq(q) { if (!MQ[q]) { try { MQ[q] = window.matchMedia(q); } catch (e) { MQ[q] = { matches: false }; } } return MQ[q].matches; }
  function reducir() { return mq('(prefers-reduced-motion: reduce)'); }
  function movil() { return mq('(max-width: 768px)'); }

  var API = {
    SELECTORES: ['input[type="text"][placeholder]', 'input[type="search"][placeholder]', 'input:not([type])[placeholder]'],
    // Todo el sistema: «Buscar…», «Filtrar…», los que empiezan con la lupa (🔍/🔎), los de escanear/buscar IMEI y los
    // buscadores de clientes («Nombre, cédula…» / «Nombre, teléfono…»).
    FILTRO: /(^\s*(🔍|🔎))|buscar|busca |escanear|escribe imei|filtrar|^\s*nombre, (c[eé]dula|tel[eé]fono)/i,
    // Fuera solo lo que NO es un buscador: los selectores de los formularios (.smart-select: muestran lo elegido, ej. el
    // técnico o el artículo), el login y lo de imprimir.
    EXCLUIR: '[data-bcbp-no], .smart-select, #login, .print-only',
    // Botón propio que abría el buscador (lo reemplaza la lupa): se esconde mientras la lupa está montada.
    BOTON_PROPIO: { crmBuscarInput: '#crmBuscarBtn' },
    // Ajustes por campo: el del CRM vive en una casilla angosta de la cuadrícula → flota por encima a un ancho útil;
    // el buscador grande de artículos puede crecer más que el resto.
    OPCIONES: { crmBuscarInput: { flotar: true, anchoFlotante: 420 }, artBuscModal: { anchoMax: 900 } },
    escalaTiempo: 1
  };
  var reg = (typeof WeakMap === 'function') ? new WeakMap() : null;
  var vivas = [];       // instancias montadas (Esc / toque afuera)
  var estadoId = {};    // id del campo → {abierto, t0}: sobrevive al repintado del módulo (CRM reconstruye el campo por tecla)
  var seq = 0;

  function el(tag, cls) { var e = doc.createElement(tag); if (cls) e.className = cls; return e; }
  function boton(cls, ico) { var b = el('button', cls); b.type = 'button'; b.innerHTML = '<i class="ti ' + ico + '"></i>'; return b; }

  /* ── resorte amortiguado: resp = segundos aprox. para llegar; zeta = razón de amortiguación (1 = sin sobrepaso) ── */
  function Resorte(x) { this.x = x; this.v = 0; this.obj = x; this.raf = 0; this.t = 0; }
  Resorte.prototype.ir = function (obj, resp, zeta, alPaso, alFin) {
    var s = this;
    s.obj = obj; s.k = Math.pow(2 * Math.PI / resp, 2); s.c = 2 * zeta * Math.sqrt(s.k); s.alPaso = alPaso; s.alFin = alFin;
    if (s.raf) return;          // ya está corriendo: solo cambió el objetivo (interrumpible, conserva la velocidad)
    s.t = 0;
    var paso = function (t) {
      s.raf = 0;
      var esc = Math.max(0.05, +API.escalaTiempo || 1);
      var dt = s.t ? Math.min(0.048, (t - s.t) / 1000) : 1 / 60; s.t = t; dt = dt / esc;
      var n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;   // sub-pasos de ≤4 ms: estable aunque un cuadro llegue tarde
      for (var i = 0; i < n; i++) { var a = -s.k * (s.x - s.obj) - s.c * s.v; s.v += a * h; s.x += s.v * h; }
      var listo = Math.abs(s.x - s.obj) < 0.4 && Math.abs(s.v) < 12;
      if (listo) { s.x = s.obj; s.v = 0; }
      try { s.alPaso(s.x); } catch (e) {}
      if (listo) { var f = s.alFin; s.alFin = null; if (f) { try { f(); } catch (e) {} } }
      else s.raf = requestAnimationFrame(paso);
    };
    s.raf = requestAnimationFrame(paso);
  };
  Resorte.prototype.parar = function () { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; this.v = 0; };

  function resolver(x) { if (!x) return null; if (typeof x === 'string') { try { return doc.querySelector(x); } catch (e) { return null; } } return x.nodeType === 1 ? x : null; }
  // Contenedor real: sube por los <span> que solo sostienen la lupa (ej. span#cliQLupa dentro de .frow).
  function contAuto(marco) {
    var p = marco.parentElement;
    while (p && p.tagName === 'SPAN' && p.children.length <= 2) p = p.parentElement;
    return p || marco.parentElement;
  }

  // Marco decorativo propio del módulo (lupa pintada + campo, ej. CRM, Instagram, buscador de artículos): solo contiene
  // el campo, una lupa <i> y a lo sumo un aviso de tecla. Se esconde para no dejar una píldora dentro de otra.
  function soloAdorno(p, input) {
    if (!p || p === doc.body || p.id === 'app' || p.classList.contains('view') || p.children.length > 4) return false;
    var lupa = false;
    for (var i = 0; i < p.children.length; i++) {
      var h = p.children[i];
      if (h === input) continue;
      if (h.matches('i.ti-search, i.ti-search + *:empty')) { lupa = true; continue; }
      if (h.matches('kbd, .ab-kbd')) continue;
      return false;
    }
    return lupa;
  }

  /* ───────────────────────────── instancia ───────────────────────────── */
  function Instancia(input, o) {
    this.input = input; this.o = o || {}; this.abierto = false; this.id = ++seq;
    this.res = null; this.hermanos = []; this.hueco = null; this.superpuesto = false; this.contRel = false; this.ocultos = [];
    this.construir();
  }
  var P = Instancia.prototype;

  P.construir = function () {
    var input = this.input, o = this.o, self = this;
    var wrap = input.closest('.bcBusca'), creado = false, lupa = null, x = null;
    var padre = input.parentElement;
    var enfocado = doc.activeElement === input, sel = null;
    try { sel = [input.selectionStart, input.selectionEnd]; } catch (e) {}
    this.orig = { padre: padre, sig: input.nextSibling };
    var botonExt = resolver(o.boton);
    if (wrap) {
      var propia = wrap.querySelector('.bcBusca-lupa');
      lupa = botonExt || propia;
      if (botonExt && propia && propia !== botonExt) this.ocultos.push(propia);   // se reutiliza la lupa externa; la interna se esconde
      x = wrap.querySelector('.bcBusca-x');
      wrap.classList.add('bcBusca-c');
    } else {
      creado = true;
      wrap = el('div', 'bcBusca bcBusca-c bcbp-creado');
      lupa = botonExt;
    }
    if (lupa && lupa.parentElement !== wrap) { this.orig.lupaPadre = lupa.parentElement; this.orig.lupaSig = lupa.nextSibling; this.orig.lupaCls = lupa.className; }
    if (!lupa) lupa = boton('bcBusca-lupa', 'ti-search');
    if (!x) x = boton('bcBusca-x', 'ti-x');
    lupa.classList.add('bcBusca-lupa'); x.classList.add('bcBusca-x');
    this.orig.inCls = input.classList.contains('bcBusca-in');
    input.classList.add('bcBusca-in');   // mismo estilo de campo que el componente compacto (transparente, 16 px, sin ✕ nativa)
    // Los onclick en línea del componente viejo (bcBuscaLupa / bcBuscaClear) se retiran: esta capa maneja abrir/limpiar/cerrar.
    this.orig.onLupa = lupa.getAttribute('onclick'); this.orig.onX = x.getAttribute('onclick');
    lupa.removeAttribute('onclick'); x.removeAttribute('onclick');

    var marco = el('span', 'bcbp-marco'); marco.setAttribute('role', 'search');
    if (!creado) {
      wrap.parentNode.insertBefore(marco, wrap); marco.appendChild(wrap);
      if (lupa.parentElement !== wrap) wrap.insertBefore(lupa, wrap.firstChild);
      if (x.parentElement !== wrap) wrap.appendChild(x);
    } else {
      // El campo vive suelto (Cliente 360, CRM…): el marco ocupa su sitio; si estaba dentro de un <label> con marco
      // propio (label.nxCrmSearch) el marco va delante del label y el label se esconde (sin píldora dentro de píldora).
      var ancla = input;
      if (padre && (padre.tagName === 'LABEL' || soloAdorno(padre, input))) { ancla = padre; this.ocultos.push(padre); }
      var propio = API.BOTON_PROPIO[input.id] && resolver(API.BOTON_PROPIO[input.id]);
      if (propio) this.ocultos.push(propio);
      ancla.parentNode.insertBefore(marco, ancla);
      wrap.appendChild(lupa); wrap.appendChild(input); wrap.appendChild(x); marco.appendChild(wrap);
      if (ancla === input && padre) Array.prototype.forEach.call(padre.children, function (h) { if (h !== marco && h.matches && h.matches('i.ti-search')) self.ocultos.push(h); });
    }
    this.ocultos.forEach(function (h) { h.classList.add('bcbp-oculto'); });
    var brillo = el('span', 'bcbp-brillo'); brillo.setAttribute('aria-hidden', 'true');
    var aura = el('span', 'bcbp-aura'); aura.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 5; i++) aura.appendChild(doc.createElement('i'));
    var escH = el('span', 'bcbp-esc'); escH.setAttribute('aria-hidden', 'true'); escH.innerHTML = '<kbd>Esc</kbd><span>Pulsa Esc para cerrar</span>';
    marco.appendChild(brillo); marco.appendChild(aura); marco.appendChild(escH);

    wrap.classList.add('bcbp'); wrap.classList.remove('open');
    if (o.placeholder) input.placeholder = o.placeholder;
    else if (/^\s*(🔍|🔎)\s*/.test(input.placeholder || '')) input.placeholder = input.placeholder.replace(/^\s*(🔍|🔎)\s*/, '');
    if (!input.id) input.id = 'bcbp-' + this.id;
    if (!input.getAttribute('aria-label')) input.setAttribute('aria-label', input.placeholder || 'Buscar');
    lupa.setAttribute('aria-expanded', 'false'); lupa.setAttribute('aria-controls', input.id);
    if (!lupa.getAttribute('aria-label')) lupa.setAttribute('aria-label', 'Abrir búsqueda');

    this.wrap = wrap; this.marco = marco; this.lupa = lupa; this.x = x; this.aura = aura; this.creado = creado;
    this.cont = resolver(o.contenedor) || contAuto(marco);

    this.hs = [
      [lupa, 'click', function (ev) { ev.preventDefault(); self.alternar(); }],
      [x, 'click', function (ev) { ev.preventDefault(); self.xClick(); }],
      [input, 'input', function () { self.refrescarX(); if (self.o.alBuscar) { try { self.o.alBuscar(input.value, self); } catch (e) {} } }],
      [input, 'focus', function () { if (!self.abierto) self.abrir({ foco: false }); }]   // Bayol: el sistema o el escáner enfocan el campo → se abre solo
    ];
    this.hs.forEach(function (h) { h[0].addEventListener(h[1], h[2]); });
    // Sincronía con la clase .open por si otro código la pone o la quita (ej. el clic-afuera global de index.html).
    this.mo = new MutationObserver(function () { var ab = wrap.classList.contains('open'); if (ab !== self.abierto) { if (ab) self.abrir({ foco: false }); else self.cerrar(); } });
    this.mo.observe(wrap, { attributes: true, attributeFilter: ['class'] });
    this.refrescarX();
    if (reg) reg.set(input, this);
    vivas.push(this);

    var prev = input.id && estadoId[input.id];
    if (prev && prev.abierto) {
      // El módulo repintó el campo mientras estaba abierto (CRM lo reconstruye en cada tecla): se restaura abierto sin
      // animación, y los puntos siguen su ciclo donde iban (retardo negativo desde t0) para que no salten.
      aura.style.setProperty('--bcbp-t0', (-(Date.now() - (prev.t0 || Date.now())) / 1000).toFixed(2) + 's');
      this.abrir({ instantaneo: true, foco: enfocado, t0: prev.t0 });
    } else if (enfocado) { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } }
    if (enfocado && sel) { try { input.setSelectionRange(sel[0], sel[1]); } catch (e) {} }
  };

  P.refrescarX = function () {
    var hay = !!this.input.value;
    this.x.setAttribute('aria-label', hay ? 'Limpiar búsqueda' : 'Cerrar búsqueda');
    this.marco.classList.toggle('bcbp-con-texto', hay);
  };

  P.medir = function () {
    var marco = this.marco, cont = this.cont;
    this.D = parseFloat(getComputedStyle(marco).getPropertyValue('--bcbp-d')) || 46;
    if (!cont || !cont.isConnected) cont = this.cont = contAuto(marco);
    var ccs = getComputedStyle(cont), padL = parseFloat(ccs.paddingLeft) || 0, padR = parseFloat(ccs.paddingRight) || 0;
    // Flota (en vez de crecer en línea) en el celular y también cuando la fila es una cuadrícula CSS (sus celdas no
    // crecen con el contenido: la píldora quedaría atrapada en la celda, ej. filtros de Auditoría).
    var superponer = !!this.o.flotar || (!this.o.enLinea && (movil() || /grid/.test(ccs.display)));
    if (!this.superpuesto) {
      var mr = marco.getBoundingClientRect(), cr = cont.getBoundingClientRect();
      this.x0 = mr.left - cr.left - (parseFloat(ccs.borderLeftWidth) || 0);
      this.y0 = mr.top - cr.top - (parseFloat(ccs.borderTopWidth) || 0);
    }
    var ancho = cont.clientWidth;
    if (superponer) {
      var util = ancho - padL - padR;
      this.xObj = padL; this.wObj = movil() ? util : Math.min(util, this.o.anchoMax || 640); this.superponer = true;
      if (this.o.anchoFlotante) {   // puede salir de su casilla (cubre lo de al lado) sin pasar del borde de la pantalla
        var crf = cont.getBoundingClientRect(), maxW = (window.innerWidth || doc.documentElement.clientWidth) - (crf.left + padL) - 12;
        this.wObj = Math.max(this.D, Math.min(this.o.anchoFlotante, maxW));
      }
    }
    else {
      // En línea (escritorio): crece hasta el sitio libre de su propia línea (así los filtros no bajan de fila); si en
      // esa línea no cabe una píldora útil (3 diámetros), crece hasta el borde del contenedor (los hermanos se acomodan).
      var disp = ancho - padR - this.x0, libre = disp;
      try {
        var mr2 = marco.getBoundingClientRect(), cr2 = cont.getBoundingClientRect(), der = mr2.right, self = this;
        Array.prototype.forEach.call(cont.children, function (h) {
          if (h === marco || h.contains(marco)) return;
          var r = h.getBoundingClientRect(); if (!r.width && !r.height) return;
          if (r.bottom > mr2.top + 2 && r.top < mr2.bottom - 2 && r.right > der) der = r.right;
        });
        libre = this.D + (cr2.right - (parseFloat(ccs.borderRightWidth) || 0) - padR - der);
      } catch (e) {}
      var minUtil = Math.min(Math.max(this.D * 3, 300), disp);   // menos de esto no es un campo útil: mejor que los hermanos bajen de línea
      if (libre < minUtil) libre = disp;
      this.xObj = this.x0; this.wObj = Math.max(minUtil, Math.min(libre, this.o.anchoMax || 480)); this.superponer = false;
    }
  };

  P.superponerSi = function () {
    var marco = this.marco, cont = this.cont;
    if (getComputedStyle(cont).position === 'static') { cont.classList.add('bcbp-cont-rel'); this.contRel = true; }
    var hueco = el('span', 'bcbp-hueco'); hueco.style.width = hueco.style.height = this.D + 'px';
    marco.parentNode.insertBefore(hueco, marco); this.hueco = hueco;
    marco.style.left = this.x0 + 'px'; marco.style.top = this.y0 + 'px';
    marco.classList.add('bcbp-flotante');
    this.superpuesto = true;
  };

  // Hermanos de la misma línea (título, filtros…): se desvanecen mientras la píldora flota sobre ellos.
  P.desvanecer = function (si) {
    var self = this;
    if (!si) { this.hermanos.forEach(function (h) { h.classList.remove('bcbp-desvanecido'); }); this.hermanos = []; return; }
    if (!this.superpuesto) return;
    var raiz = this.marco; while (raiz.parentElement && raiz.parentElement !== this.cont) raiz = raiz.parentElement;
    var hr = (this.hueco || raiz).getBoundingClientRect(), lista = [];
    Array.prototype.forEach.call(this.cont.children, function (h) {
      if (h === raiz || h === self.hueco || h === self.marco) return;
      var r = h.getBoundingClientRect(); if (!r.width && !r.height) return;
      if (r.bottom > hr.top + 2 && r.top < hr.bottom - 2) lista.push(h);
    });
    if (raiz !== this.marco) Array.prototype.forEach.call(raiz.children, function (h) { if (h !== self.marco && h !== self.hueco) lista.push(h); });
    lista.forEach(function (h) { h.classList.add('bcbp-desvanecido'); });
    this.hermanos = lista;
  };

  P.aplicar = function (x) {
    var D = this.D, w = Math.max(D, x);
    this.marco.style.width = w + 'px';
    var p = this.wObj > D ? Math.min(1, Math.max(0, (x - D) / (this.wObj - D))) : 1;
    if (this.superpuesto) this.marco.style.left = (this.x0 + (this.xObj - this.x0) * p) + 'px';
    // el contenido aparece cuando la píldora ya tiene sitio (25–70 % del recorrido) y se apaga primero al cerrar
    var op = Math.min(1, Math.max(0, (p - 0.25) / 0.45));
    this.input.style.opacity = op; this.x.style.opacity = op;
  };

  P.resorte = function () {
    var w = this.marco.getBoundingClientRect().width || this.D;
    if (!this.res) this.res = new Resorte(w);
    else if (!this.res.raf) this.res.x = w;   // arranca desde el valor que se ve, no desde el lógico
    return this.res;
  };

  P.abrir = function (op) {
    op = op || {}; var self = this, input = this.input;
    if (!this.abierto) {
      this.abierto = true;
      var t0 = op.t0 || Date.now();
      if (input.id) estadoId[input.id] = { abierto: true, t0: t0 };
      this.wrap.classList.add('open'); this.marco.classList.add('open'); this.lupa.setAttribute('aria-expanded', 'true');
      this.medir();
      if (this.superponer && !this.superpuesto) this.superponerSi();
      this.desvanecer(true);
      if (op.instantaneo || reducir()) { if (this.res) this.res.parar(); this.aplicar(this.wObj); if (this.res) this.res.x = this.wObj; }
      else this.resorte().ir(this.wObj, 0.42, 0.72, function (x) { self.aplicar(x); }, null);
      if (this.o.alAbrir) { try { this.o.alAbrir(this); } catch (e) {} }
    }
    if (op.foco !== false) {
      try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
      try { var n = input.value.length; input.setSelectionRange(n, n); } catch (e) {}
    }
    if (movil()) this.vigilarTeclado();
  };

  P.cerrar = function (op) {
    op = op || {}; if (!this.abierto) return; var self = this;
    this.abierto = false;
    if (this.input.id) estadoId[this.input.id] = { abierto: false };
    this.wrap.classList.remove('open'); this.marco.classList.remove('open'); this.lupa.setAttribute('aria-expanded', 'false');
    this.desvanecer(false); this.soltarTeclado();
    if (op.foco && this.marco.contains(doc.activeElement)) { try { this.lupa.focus({ preventScroll: true }); } catch (e) {} }
    else if (doc.activeElement === this.input) this.input.blur();   // toque afuera: baja el teclado
    var fin = function () { self.asentarCerrado(); };
    if (op.instantaneo || reducir()) { if (this.res) this.res.parar(); this.aplicar(this.D); fin(); }
    else this.resorte().ir(this.D, 0.26, 1, function (x) { self.aplicar(x); }, fin);   // salida más rápida que la entrada y sin rebote
    if (this.o.alCerrar) { try { this.o.alCerrar(this); } catch (e) {} }
  };

  P.asentarCerrado = function () {
    if (this.abierto) return;
    if (this.superpuesto) {
      this.marco.classList.remove('bcbp-flotante'); this.marco.style.left = ''; this.marco.style.top = '';
      if (this.hueco) { this.hueco.remove(); this.hueco = null; }
      if (this.contRel) { this.cont.classList.remove('bcbp-cont-rel'); this.contRel = false; }
      this.superpuesto = false;
    }
    this.marco.style.width = ''; this.input.style.opacity = ''; this.x.style.opacity = '';
    if (this.res) this.res.x = this.D;
  };

  P.alternar = function () {
    if (this.abierto) { if (!this.input.value) this.cerrar({ foco: true }); else this.abrir({ foco: true }); }
    else this.abrir({ foco: true });
  };
  P.xClick = function () {
    var input = this.input;
    if (input.value) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));   // el módulo vuelve a filtrar con el mismo evento de siempre
      try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
    } else this.cerrar({ foco: true });
  };

  P.vigilarTeclado = function () {
    var self = this, vv = window.visualViewport;
    clearTimeout(this.vvT);
    this.vvT = setTimeout(function () { try { self.marco.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducir() ? 'auto' : 'smooth' }); } catch (e) {} }, 90);
    if (!vv || this.vv) return;
    this.vv = function () {
      if (!self.abierto) return;
      var r = self.marco.getBoundingClientRect(), top = vv.offsetTop, lim = top + vv.height;
      if (r.bottom > lim - 8 || r.top < top + 8) { try { self.marco.scrollIntoView({ block: 'nearest', behavior: 'auto' }); } catch (e) {} }
    };
    vv.addEventListener('resize', this.vv);
  };
  P.soltarTeclado = function () { clearTimeout(this.vvT); if (this.vv && window.visualViewport) window.visualViewport.removeEventListener('resize', this.vv); this.vv = null; };

  P.limpiar = function () {
    this.hs.forEach(function (h) { h[0].removeEventListener(h[1], h[2]); });
    if (this.mo) this.mo.disconnect();
    if (this.res) this.res.parar();
    this.soltarTeclado();
  };

  P.desmontar = function () {
    this.cerrar({ instantaneo: true }); this.limpiar();
    var marco = this.marco, wrap = this.wrap, input = this.input, o = this.orig;
    if (o.onLupa) this.lupa.setAttribute('onclick', o.onLupa);
    if (o.onX) this.x.setAttribute('onclick', o.onX);
    if (o.lupaPadre) { o.lupaPadre.insertBefore(this.lupa, (o.lupaSig && o.lupaSig.parentNode === o.lupaPadre) ? o.lupaSig : null); this.lupa.className = o.lupaCls || ''; }
    if (!this.creado) {
      if (marco.parentNode) marco.parentNode.insertBefore(wrap, marco);
      wrap.classList.remove('bcbp');
    } else {
      if (o.padre) o.padre.insertBefore(input, (o.sig && o.sig.parentNode === o.padre) ? o.sig : null);
    }
    if (!o.inCls) input.classList.remove('bcBusca-in');
    this.ocultos.forEach(function (h) { h.classList.remove('bcbp-oculto'); });
    marco.remove();
    if (reg) reg.delete(input);
    vivas = vivas.filter(function (i) { return i !== this; }, this);
    if (input.id) delete estadoId[input.id];
  };

  /* ───────────────────────────── montaje ───────────────────────────── */
  function podar() {
    vivas = vivas.filter(function (i) { if (i.marco.isConnected) return true; i.limpiar(); if (reg) reg.delete(i.input); return false; });
  }
  function instancia(input) { input = resolver(input); return (input && reg) ? (reg.get(input) || null) : null; }
  function montar(input, o) {
    input = resolver(input);
    if (!input || input.tagName !== 'INPUT' || input.type === 'hidden') return null;
    var ya = instancia(input); if (ya) return ya;
    podar();
    try { return new Instancia(input, o); } catch (e) { try { console.warn('[bc-busqueda] no se pudo montar', input.id || input, e); } catch (e2) {} return null; }
  }
  function desmontar(input) { var i = instancia(input); if (i) i.desmontar(); return !!i; }
  function montarTodo(raiz) {
    raiz = resolver(raiz) || doc;
    var sel = API.SELECTORES.join(','), lista = [];
    try {
      if (raiz.nodeType === 1 && raiz.matches(sel)) lista.push(raiz);
      if (raiz.querySelectorAll) Array.prototype.push.apply(lista, raiz.querySelectorAll(sel));
    } catch (e) { return; }
    lista.forEach(function (inp) { if (!inp.closest(API.EXCLUIR) && API.FILTRO.test(inp.getAttribute('placeholder') || '')) montar(inp, API.OPCIONES[inp.id]); });   // la exclusión solo aplica al montaje automático
  }

  // 9 oct 2026 (pedido del dueño: «que el buscador no se cierre solo»): la píldora abierta ya NO se cierra al tocar
  // fuera ni con un Esc pensado para otra cosa. Solo se cierra con su ✕ (o con su lupa si está vacía) o con Esc
  // mientras el cursor está DENTRO de ese buscador. Para volver al comportamiento anterior: API.cerrarAlTocarFuera = true.
  API.cerrarAlTocarFuera = false;
  doc.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape' && ev.key !== 'Esc') return;
    var dentro = false;
    vivas.forEach(function (i) { if (i.abierto && i.marco.isConnected && i.marco.contains(doc.activeElement)) { dentro = true; i.cerrar({ foco: true }); } });
    if (dentro) { ev.preventDefault(); ev.stopPropagation(); }
  }, true);
  var evFuera = window.PointerEvent ? 'pointerdown' : 'mousedown';
  doc.addEventListener(evFuera, function (ev) {
    if (!API.cerrarAlTocarFuera) return;
    var t = ev.target; if (!t || t.nodeType !== 1) return;
    vivas.forEach(function (i) { if (i.abierto && i.marco.isConnected && !i.marco.contains(t)) i.cerrar(); });
  }, true);

  var mo = new MutationObserver(function (muts) {
    for (var m = 0; m < muts.length; m++) { var add = muts[m].addedNodes; for (var n = 0; n < add.length; n++) if (add[n].nodeType === 1) montarTodo(add[n]); }
  });
  function arrancar() { montarTodo(doc); try { mo.observe(doc.body, { childList: true, subtree: true }); } catch (e) {} }
  if (doc.body) arrancar(); else doc.addEventListener('DOMContentLoaded', arrancar);

  API.montar = montar; API.desmontar = desmontar; API.instancia = instancia; API.montarTodo = montarTodo;
  API.version = '58.94-bc3';
  window.bcBusquedaPremium = API;
})();
