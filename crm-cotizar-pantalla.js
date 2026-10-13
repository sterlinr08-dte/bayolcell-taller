/* Cotizar pantalla (13-oct-2026, pedido del dueño: «sin tener que enviarle el catálogo completo a los clientes
   sino el precio del modelo que busca»).
   En el chat de WhatsApp: «Cotizar pantalla» (menú del clip y botón de la barra en PC) → buscar el modelo →
   tarjeta con el precio de NIVEL 1 (cliente final) → se manda por el envío de fotos de siempre, con texto editable.
   - Nunca usa costo, nivel 2 (por mayor) ni nivel 3: la cotización se arma con una lista blanca {codigo, nombre, tipo, precio}.
   - No envía nada solo: abre la vista previa de adjunto de siempre y el empleado toca «Enviar».
   Capa aislada: se quita borrando este archivo y su línea en crm-marketing-consent.js. */
(function () {
  'use strict';
  if (window.__bcCotizarPantalla) return;
  window.__bcCotizarPantalla = true;

  var V = '20261013-c1';
  var LOGO = 'assets/logo.png';
  var FUENTES = [
    ['BC Barlow', 'assets/cotizar/barlow-condensed-800.woff2', '800'],
    ['BC Inter', 'assets/cotizar/inter-var.woff2', '100 900']
  ];
  var CAMPOS_PERMITIDOS = ['codigo', 'nombre', 'tipo', 'precio'];
  var NO_PANTALLA = /\b(MICA|MICAS|GLASS|VIDRIO|CRISTAL|PROTECTOR|BISEL|MARCO SOLO|MOLDE|TAPA|HUELLA|FLEX|LENTE|CAMARA|BATERIA|PEGAMENTO|ADHESIVO|HERRAMIENTA|SEPARADOR|PLANCHA)\b/;
  var ES_PANTALLA = /\b(PANTALLA|DISPLAY|LCD)\b/;

  // ---------- utilidades ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function dinero(n) { return Math.round(Number(n) || 0).toLocaleString('en-US'); }
  function aviso(msg, error) {
    try { if (error && typeof toastError === 'function') return toastError(msg); if (typeof toast === 'function') return toast(msg); } catch (e) {}
    console.log('[Cotizar]', msg);
  }
  function hiloActual() { try { return typeof _waHiloId === 'undefined' ? null : _waHiloId; } catch (e) { return null; } }
  function articulos() { try { return (typeof cache !== 'undefined' && cache && Array.isArray(cache.infoplusArticulos)) ? cache.infoplusArticulos : []; } catch (e) { return []; } }
  function precioNivel1(a) {
    // Mismo criterio que _catPrecioN1: nivel 1; si no hay niveles, el precio base. Nunca costo ni nivel 2/3.
    if (typeof _catPrecioN1 === 'function') { try { return Number(_catPrecioN1(a.codigo)) || 0; } catch (e) {} }
    if (a.niveles && a.niveles['1'] != null && a.niveles['1'] !== '') return Number(a.niveles['1']) || 0;
    return Number(a.precio) || 0;
  }

  // Nombre para el cliente: «PANTALLA IPHONE 11 PRO MAX ZY INCELL» → «iPhone 11 Pro Max» + tipo «Incell».
  var MARCAS = { IPHONE: 'iPhone', IPAD: 'iPad', SAMSUNG: 'Samsung', GALAXY: 'Galaxy', MOTO: 'Moto', MOTOROLA: 'Motorola', REDMI: 'Redmi', XIAOMI: 'Xiaomi', POCO: 'Poco', HUAWEI: 'Huawei', HONOR: 'Honor', ALCATEL: 'Alcatel', ZTE: 'ZTE', TCL: 'TCL', LG: 'LG', NOKIA: 'Nokia', TECNO: 'Tecno', INFINIX: 'Infinix', ITEL: 'Itel', OPPO: 'Oppo', VIVO: 'Vivo', REALME: 'Realme', COOLPAD: 'Coolpad', BLADE: 'Blade', NOTE: 'Note', PLUS: 'Plus', PRO: 'Pro', MAX: 'Max', MINI: 'Mini', LITE: 'Lite', ULTRA: 'Ultra', PRIME: 'Prime', PLAY: 'Play', POWER: 'Power', STYLUS: 'Stylus', EDGE: 'Edge', SPARK: 'Spark', HOT: 'Hot', SMART: 'Smart' };
  var RUIDO = /^(PANTALLA|PANT\.?|DISPLAY|LCD|COMPLETA|CON|SIN|MARCO|JK|ZY|GX|RJ|HE|PREMIUM|CALIDAD|ORIGINAL|ORIG|OLED|INCELL|IN-CELL|TFT|AMOLED|HARD|SOFT|NEGRA|NEGRO|BLANCA|BLANCO|DORADA|DORADO|AZUL|ROJA|ROJO|VERDE|MORADO|ROSADA|GRIS|PLATEADA|COLOR|NUEVA|NUEVO|Y|DE|PARA|TOUCH|TACTIL|MODULO|\/)$/;
  function tipoDe(desc) {
    var d = String(desc || '').toUpperCase();
    if (/\bOLED\b|\bAMOLED\b/.test(d)) return 'OLED';
    if (/\bIN-?CELL\b/.test(d)) return 'Incell';
    if (/\bORIGINAL\b|\bORIG\b/.test(d)) return 'Original';
    return '';
  }
  function nombreLimpio(desc) {
    var palabras = String(desc || '').toUpperCase().replace(/[(),]/g, ' ').split(/\s+/).filter(Boolean);
    var out = [], codigos = 0;
    for (var i = 0; i < palabras.length && out.length < 6; i++) {
      var w = palabras[i];
      if (RUIDO.test(w)) continue;
      // Corta las listas de códigos de modelo: «1X 5059 5059Y 5059D» → «1X 5059»; «A10S SM-A107» → «A10S».
      if (/\d{3,}/.test(w) && out.length >= 2) { codigos++; if (codigos > 1 || /^[A-Z]{1,3}-/.test(w) || /^XT\d/.test(w)) break; }
      out.push(MARCAS[w] || (/^[A-Z]\d+[A-Z]$/.test(w) ? w.slice(0, -1) + w.slice(-1).toLowerCase() : /\d/.test(w) ? w : w.charAt(0) + w.slice(1).toLowerCase()));
    }
    if (out.length && out[0] !== 'iPhone' && /^(\d|X|XR|XS|SE)/.test(out[0]) && /IPHONE/.test(String(desc).toUpperCase())) out.unshift('iPhone');
    return out.join(' ').replace(/\s+/g, ' ').trim() || String(desc || '').trim();
  }
  function marcaDe(nombre) {
    var n = norm(nombre);
    if (/^iphone|^ipad/.test(n)) return 'iPhone';
    if (/^samsung|^galaxy|^sm-/.test(n)) return 'Samsung';
    if (/^moto/.test(n)) return 'Motorola';
    if (/^redmi|^xiaomi|^poco|^mi /.test(n)) return 'Xiaomi';
    return 'Otras';
  }
  // Lista blanca: lo único que puede salir hacia la tarjeta o el texto.
  function cotizacionSegura(c) {
    var o = {};
    CAMPOS_PERMITIDOS.forEach(function (k) { o[k] = c[k]; });
    Object.keys(c).forEach(function (k) { if (CAMPOS_PERMITIDOS.indexOf(k) < 0) throw new Error('Campo no permitido en la cotización: ' + k); });
    if (!(o.precio > 0)) throw new Error('Sin precio de nivel 1');
    return o;
  }
  function pantallasDisponibles() {
    var vistos = {};
    return articulos().filter(function (a) {
      var d = String(a.descripcion || '').toUpperCase();
      return ES_PANTALLA.test(d) && !NO_PANTALLA.test(d);
    }).map(function (a) {
      var nombre = nombreLimpio(a.descripcion);
      return { codigo: String(a.codigo), nombre: nombre, tipo: tipoDe(a.descripcion), precio: precioNivel1(a), _busca: norm(a.descripcion + ' ' + nombre + ' ' + a.codigo), _marca: marcaDe(nombre) };
    }).filter(function (x) {
      if (!(x.precio > 0)) return false;
      var k = x.nombre + '|' + x.tipo + '|' + x.precio;
      if (vistos[k]) return false; vistos[k] = true; return true;
    }).sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es', { numeric: true }); });
  }

  // ---------- fuentes y logo para la tarjeta ----------
  var listoRecursos = null;
  function cargarRecursos() {
    if (listoRecursos) return listoRecursos;
    var fuentes = FUENTES.map(function (f) {
      try { var ff = new FontFace(f[0], 'url(' + f[1] + ')', { weight: f[2] }); return ff.load().then(function (x) { document.fonts.add(x); }).catch(function () {}); } catch (e) { return Promise.resolve(); }
    });
    var logo = new Promise(function (res) { var img = new Image(); img.onload = function () { res(img); }; img.onerror = function () { res(null); }; img.src = LOGO; });
    listoRecursos = Promise.all([Promise.all(fuentes), logo]).then(function (r) { return { logo: r[1] }; });
    return listoRecursos;
  }

  // ---------- tarjeta (canvas 1080×1350, estilo del flyer de pantallas) ----------
  function ajustarTexto(ctx, texto, maxAncho, tamMax, tamMin, familia) {
    var t = tamMax;
    while (t > tamMin) { ctx.font = '800 ' + t + 'px ' + familia; if (ctx.measureText(texto).width <= maxAncho) break; t -= 4; }
    return t;
  }
  function partirEnDos(ctx, texto, maxAncho) {
    if (ctx.measureText(texto).width <= maxAncho) return [texto];
    var w = texto.split(' '), mejor = [texto], dif = Infinity;
    for (var i = 1; i < w.length; i++) {
      var a = w.slice(0, i).join(' '), b = w.slice(i).join(' ');
      var d = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
      if (ctx.measureText(a).width <= maxAncho && ctx.measureText(b).width <= maxAncho && d < dif) { dif = d; mejor = [a, b]; }
    }
    return mejor;
  }
  function pintarTarjeta(canvas, c, recursos) {
    c = cotizacionSegura(c);
    var W = 1080, H = 1350, ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    var FB = '"BC Barlow", "Barlow Condensed", Impact, "Arial Narrow", sans-serif';
    var FI = '"BC Inter", Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
    // fondo
    ctx.fillStyle = '#0A0A0C'; ctx.fillRect(0, 0, W, H);
    var g1 = ctx.createRadialGradient(900, -60, 40, 900, -60, 900); g1.addColorStop(0, 'rgba(227,30,36,.42)'); g1.addColorStop(1, 'rgba(227,30,36,0)');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    var g2 = ctx.createRadialGradient(-80, H + 60, 40, -80, H + 60, 760); g2.addColorStop(0, 'rgba(227,30,36,.22)'); g2.addColorStop(1, 'rgba(227,30,36,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    // logo y etiqueta
    if (recursos && recursos.logo) {
      // assets/logo.png (700×700) trae mucho aire alrededor: se dibuja solo la parte con el logo.
      var L = recursos.logo, k = L.width / 700, sx = 40 * k, sy = 198 * k, sw = 622 * k, sh = 270 * k;
      ctx.drawImage(L, sx, sy, sw, sh, 52, 48, 330, 330 * sh / sw);
    }
    ctx.font = '700 26px ' + FI; ctx.textBaseline = 'middle';
    var etiqueta = 'COTIZACIÓN', ew = ctx.measureText(etiqueta).width + 56;
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2;
    redondo(ctx, W - 60 - ew, 86, ew, 52, 26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#F5F5F7'; ctx.letterSpacing = '4px'; ctx.fillText(etiqueta, W - 60 - ew + 28, 113); ctx.letterSpacing = '0px';
    // kicker
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#E31E24'; ctx.font = '800 44px ' + FB; ctx.letterSpacing = '8px';
    ctx.fillText('CAMBIO DE PANTALLA', 60, 330); ctx.letterSpacing = '0px';
    // modelo (1 o 2 líneas, ajustado al ancho)
    var nombre = c.nombre.toUpperCase();
    var t = ajustarTexto(ctx, nombre, W - 120, 168, 96, FB);
    ctx.font = '800 ' + t + 'px ' + FB; ctx.fillStyle = '#F5F5F7';
    var lineas = t <= 100 ? partirEnDos(ctx, nombre, W - 120) : [nombre];
    if (lineas.length === 2) { t = Math.min(150, ajustarTexto(ctx, lineas[0].length > lineas[1].length ? lineas[0] : lineas[1], W - 120, 150, 80, FB)); ctx.font = '800 ' + t + 'px ' + FB; }
    var y = 330 + t * 0.95 + 14;
    lineas.forEach(function (ln, i) { ctx.fillText(ln, 56, y + i * t * 0.92); });
    y += (lineas.length - 1) * t * 0.92;
    // tipo
    if (c.tipo) {
      ctx.font = '700 34px ' + FI; var tw = ctx.measureText(c.tipo).width + 60;
      ctx.strokeStyle = 'rgba(245,245,247,.35)'; ctx.lineWidth = 2; redondo(ctx, 60, y + 36, tw, 64, 32); ctx.stroke();
      ctx.fillStyle = '#F5F5F7'; ctx.textBaseline = 'middle'; ctx.fillText(c.tipo, 90, y + 69); ctx.textBaseline = 'alphabetic';
      y += 100;
    }
    // precio
    var py = Math.max(y + 260, H - 300);
    ctx.fillStyle = '#9A9AA3'; ctx.font = '700 40px ' + FB; ctx.letterSpacing = '4px'; ctx.fillText('PRECIO CON INSTALACIÓN', 60, py - 236); ctx.letterSpacing = '0px';
    ctx.fillStyle = '#E31E24'; ctx.font = '800 92px ' + FB; ctx.fillText('RD$', 56, py - 18);
    var rw = ctx.measureText('RD$').width + 14;
    ctx.fillStyle = '#F5F5F7'; var tp = ajustarTexto(ctx, dinero(c.precio), W - 120 - rw, 290, 150, FB); ctx.font = '800 ' + tp + 'px ' + FB;
    ctx.fillText(dinero(c.precio), 56 + rw, py);
    // pie
    ctx.fillStyle = '#25D366'; redondo(ctx, 60, H - 168, W - 120, 104, 52); ctx.fill();
    ctx.fillStyle = '#04210f'; ctx.font = '800 38px ' + FI; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillText('Responde este mensaje para agendar', W / 2, H - 116);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9A9AA3'; ctx.font = '500 24px ' + FI;
    ctx.fillText('Sujeto a disponibilidad · Válido al ' + new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }), 60, H - 196);
    // línea fina entre el modelo y el precio
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(60, py - 300, W - 120, 2);
    ctx.textBaseline = 'alphabetic';
    return canvas;
  }
  function redondo(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function textoCliente(c) {
    var tipo = c.tipo ? ' (' + c.tipo + ')' : '';
    return 'Hola 👋 El cambio de pantalla de tu ' + c.nombre + tipo + ' te sale en RD$' + dinero(c.precio) + ' con instalación. ¿Quieres que te la reservemos?';
  }

  // ---------- interfaz ----------
  var estado = { lista: [], filtro: 'Todas', q: '', elegido: null, hilo: null };
  function css() {
    if ($('bcCotStyle')) return;
    var s = document.createElement('style'); s.id = 'bcCotStyle';
    s.textContent = [
      '#bcCot{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.42);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}',
      '#bcCot.on{display:flex}',
      '#bcCot .cs{width:min(560px,94vw);max-height:min(760px,92vh);background:#fff;border-radius:24px;box-shadow:0 30px 80px rgba(15,23,42,.35);display:flex;flex-direction:column;overflow:hidden;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#1e293b;animation:bcCotIn .22s cubic-bezier(.23,1,.32,1)}',
      '@keyframes bcCotIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}',
      '@media (prefers-reduced-motion:reduce){#bcCot .cs{animation:none}}',
      '#bcCot .ch{display:flex;align-items:center;gap:12px;padding:18px 20px 12px}',
      '#bcCot .ch h3{flex:1;margin:0;font-size:18px;font-weight:800;letter-spacing:-.2px}',
      '#bcCot .ch small{display:block;font-size:12px;font-weight:600;color:#64748b;margin-top:2px}',
      '#bcCot .ic{width:40px;height:40px;border-radius:12px;background:#fef2f2;color:#e31e24;display:grid;place-items:center;font-size:21px;flex:none}',
      '#bcCot .x{width:38px;height:38px;border:0;border-radius:12px;background:#f1f5f9;color:#475569;font-size:19px;cursor:pointer;display:grid;place-items:center}',
      '#bcCot .x:hover{background:#e2e8f0}',
      '#bcCot .sb{margin:0 20px;display:flex;align-items:center;gap:10px;background:#f1f5f9;border-radius:14px;padding:0 14px;border:2px solid transparent}',
      '#bcCot .sb:focus-within{border-color:#e31e24;background:#fff}',
      '#bcCot .sb input{flex:1;border:0;background:transparent;font:600 16px "Plus Jakarta Sans",system-ui;padding:13px 0;outline:0;color:#0f172a;min-width:0}',
      '#bcCot .chips{display:flex;gap:8px;padding:12px 20px 4px;overflow-x:auto;scrollbar-width:none}',
      '#bcCot .chips button{flex:none;border:1px solid #e2e8f0;background:#fff;border-radius:999px;padding:7px 14px;font:700 13px "Plus Jakarta Sans",system-ui;color:#475569;cursor:pointer}',
      '#bcCot .chips button.on{background:#0f172a;border-color:#0f172a;color:#fff}',
      '#bcCot .ls{flex:1;overflow:auto;padding:6px 12px 14px;min-height:180px}',
      '#bcCot .it{width:100%;display:flex;align-items:center;gap:12px;border:0;background:transparent;text-align:left;padding:12px;border-radius:14px;cursor:pointer;font-family:inherit;color:inherit}',
      '#bcCot .it:hover,#bcCot .it:focus-visible{background:#f8fafc;outline:0}',
      '#bcCot .it .n{flex:1;min-width:0;font-weight:700;font-size:15px;line-height:1.25}',
      '#bcCot .it .n em{font-style:normal;display:inline-block;margin-left:6px;font-size:11px;font-weight:800;letter-spacing:.4px;color:#475569;background:#f1f5f9;border-radius:999px;padding:2px 8px;vertical-align:2px}',
      '#bcCot .it .p{font-weight:800;font-size:16px;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '#bcCot .it .p span{color:#e31e24;font-size:12px;margin-right:2px}',
      '#bcCot .vacio{padding:36px 16px;text-align:center;color:#64748b;font-weight:600;font-size:14px}',
      '#bcCot .pv{flex:1;overflow:auto;padding:4px 20px 16px;display:flex;flex-direction:column;gap:14px}',
      '#bcCot .pv canvas{width:min(100%,330px);height:auto;align-self:center;border-radius:18px;box-shadow:0 14px 40px rgba(15,23,42,.28)}',
      '#bcCot .pv label{font-size:12px;font-weight:800;color:#64748b;letter-spacing:.3px;text-transform:uppercase}',
      '#bcCot .pv input{width:100%;box-sizing:border-box;margin-top:6px;border:2px solid #e2e8f0;border-radius:12px;padding:11px 12px;font:700 15px "Plus Jakarta Sans",system-ui;color:#0f172a;outline:0}',
      '#bcCot .pv input:focus{border-color:#e31e24}',
      '#bcCot .nota{font-size:12px;color:#64748b;font-weight:600;line-height:1.4}',
      '#bcCot .ac{display:flex;gap:10px;padding:14px 20px 18px;border-top:1px solid #f1f5f9}',
      '#bcCot .ac button{flex:1;border:0;border-radius:14px;padding:13px 14px;font:800 14.5px "Plus Jakarta Sans",system-ui;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .12s ease-out}',
      '#bcCot .ac button:active{transform:scale(.97)}',
      '#bcCot .b1{background:#25D366;color:#04210f}',
      '#bcCot .b2{background:#f1f5f9;color:#0f172a}',
      '#bcCot .b3{flex:0 0 auto!important;background:transparent;color:#475569}',
      '#bcCot .pie{padding:8px 20px 14px;font-size:11.5px;color:#94a3b8;font-weight:600}',
      '@media (max-width:640px){#bcCot{align-items:flex-end}#bcCot .cs{width:100vw;max-height:94vh;border-radius:24px 24px 0 0;padding-bottom:env(safe-area-inset-bottom)}#bcCot .ac{flex-wrap:wrap}}',
      '#btnWaCotizar i{color:#e31e24}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function abrir() {
    var h = hiloActual();
    if (!h) { aviso('Abre primero el chat del cliente.', true); return; }
    css();
    if (typeof _waCerrarFlotantesDelChat === 'function') { try { _waCerrarFlotantesDelChat(); } catch (e) {} }
    estado.hilo = h; estado.elegido = null; estado.q = ''; estado.filtro = 'Todas';
    var m = $('bcCot');
    if (!m) {
      m = document.createElement('div'); m.id = 'bcCot'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Cotizar pantalla');
      m.addEventListener('click', function (e) { if (e.target === m) cerrar(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('bcCot') && $('bcCot').classList.contains('on')) { e.stopPropagation(); cerrar(); } }, true);
      document.body.appendChild(m);
    }
    m.classList.add('on');
    pintarBuscador(true);
    cargarRecursos();
    Promise.resolve().then(function () { return typeof _ensureInfoplusArticulos === 'function' ? _ensureInfoplusArticulos(false) : null; })
      .catch(function () {}).then(function () { estado.lista = pantallasDisponibles(); if (!estado.elegido) pintarBuscador(false); });
  }
  function cerrar() { var m = $('bcCot'); if (m) m.classList.remove('on'); }
  function pintarBuscador(cargando) {
    var m = $('bcCot'); if (!m) return;
    var marcas = ['Todas', 'iPhone', 'Samsung', 'Motorola', 'Xiaomi', 'Otras'];
    m.innerHTML = '<div class="cs">' +
      '<div class="ch"><div class="ic"><i class="ti ti-device-mobile"></i></div><div style="flex:1"><h3>Cotizar pantalla</h3><small>Precio de nivel 1 (cliente final) desde Info Plus</small></div><button class="x" type="button" aria-label="Cerrar" data-a="cerrar"><i class="ti ti-x"></i></button></div>' +
      '<div class="sb"><i class="ti ti-search" style="color:#94a3b8"></i><input id="bcCotQ" type="search" placeholder="Busca el modelo: 11 pro max, a10s, g8…" autocomplete="off" value="' + esc(estado.q) + '"></div>' +
      '<div class="chips">' + marcas.map(function (k) { return '<button type="button" data-f="' + k + '" class="' + (estado.filtro === k ? 'on' : '') + '">' + k + '</button>'; }).join('') + '</div>' +
      '<div class="ls" id="bcCotLs">' + (cargando ? '<div class="vacio">Cargando precios…</div>' : '') + '</div>' +
      '<div class="pie">Solo muestra pantallas con precio. Las micas, flex y biseles no salen aquí.</div></div>';
    m.querySelector('[data-a="cerrar"]').onclick = cerrar;
    m.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { estado.filtro = b.dataset.f; m.querySelectorAll('[data-f]').forEach(function (x) { x.classList.toggle('on', x === b); }); pintarLista(); }; });
    var q = $('bcCotQ'); q.oninput = function () { estado.q = q.value; pintarLista(); };
    q.onkeydown = function (e) { if (e.key === 'Enter') { var p = m.querySelector('.it'); if (p) p.click(); } };
    setTimeout(function () { try { q.focus(); } catch (e) {} }, 30);
    if (!cargando) pintarLista();
  }
  function pintarLista() {
    var ls = $('bcCotLs'); if (!ls) return;
    var palabras = norm(estado.q).split(/\s+/).filter(Boolean);
    var res = estado.lista.filter(function (x) {
      if (estado.filtro !== 'Todas' && x._marca !== estado.filtro) return false;
      return palabras.every(function (p) { return x._busca.indexOf(p) >= 0; });
    });
    if (!estado.lista.length) { ls.innerHTML = '<div class="vacio">No hay pantallas con precio cargadas. Sincroniza Info Plus desde el buscador de artículos y vuelve a intentar.</div>'; return; }
    if (!res.length) { ls.innerHTML = '<div class="vacio">Ningún modelo coincide con «' + esc(estado.q) + '».</div>'; return; }
    ls.innerHTML = res.slice(0, 80).map(function (x, i) {
      return '<button type="button" class="it" data-i="' + i + '"><span class="n">' + esc(x.nombre) + (x.tipo ? '<em>' + esc(x.tipo) + '</em>' : '') + '</span><span class="p"><span>RD$</span>' + dinero(x.precio) + '</span></button>';
    }).join('') + (res.length > 80 ? '<div class="vacio">Hay ' + res.length + ' resultados: escribe más del modelo para ver menos.</div>' : '');
    ls.querySelectorAll('.it').forEach(function (b) { b.onclick = function () { var x = res[+b.dataset.i]; elegir({ codigo: x.codigo, nombre: x.nombre, tipo: x.tipo, precio: x.precio }); }; });
  }
  function elegir(c) {
    c = cotizacionSegura(c);
    estado.elegido = c;
    var m = $('bcCot'); if (!m) return;
    m.innerHTML = '<div class="cs">' +
      '<div class="ch"><button class="x" type="button" aria-label="Volver" data-a="volver"><i class="ti ti-arrow-left"></i></button><div style="flex:1"><h3>Tarjeta para el cliente</h3><small>RD$' + dinero(c.precio) + ' · nivel 1 · código ' + esc(c.codigo) + '</small></div><button class="x" type="button" aria-label="Cerrar" data-a="cerrar"><i class="ti ti-x"></i></button></div>' +
      '<div class="pv"><canvas id="bcCotCv" width="1080" height="1350" aria-label="Vista previa de la tarjeta"></canvas>' +
      '<div><label for="bcCotNom">Nombre que ve el cliente</label><input id="bcCotNom" maxlength="40" value="' + esc(c.nombre) + '"></div>' +
      '<div class="nota">El precio sale de Info Plus (nivel 1) y no se puede cambiar aquí. Al tocar «Enviar tarjeta» se abre la vista previa de siempre con el texto listo para revisar.</div></div>' +
      '<div class="ac"><button type="button" class="b3" data-a="volver">Volver</button><button type="button" class="b2" data-a="texto"><i class="ti ti-message"></i> Solo texto</button><button type="button" class="b1" data-a="enviar"><i class="ti ti-send"></i> Enviar tarjeta</button></div></div>';
    m.querySelectorAll('[data-a="volver"]').forEach(function (b) { b.onclick = function () { estado.elegido = null; pintarBuscador(false); }; });
    m.querySelector('[data-a="cerrar"]').onclick = cerrar;
    var nom = $('bcCotNom'), cv = $('bcCotCv');
    var redibujar = function () { cargarRecursos().then(function (r) { if (estado.elegido) pintarTarjeta(cv, estado.elegido, r); }); };
    nom.oninput = function () { estado.elegido = cotizacionSegura({ codigo: c.codigo, nombre: nom.value.trim() || c.nombre, tipo: c.tipo, precio: c.precio }); redibujar(); };
    redibujar();
    m.querySelector('[data-a="texto"]').onclick = function () { ponerTexto(textoCliente(estado.elegido)); cerrar(); };
    m.querySelector('[data-a="enviar"]').onclick = function () { enviarTarjeta(cv); };
  }
  function ponerTexto(txt) {
    var t = $('waTexto');
    if (!t) { aviso('La ventana de 24 h está cerrada: hace falta una plantilla aprobada.', true); return false; }
    t.value = txt; t.dispatchEvent(new Event('input', { bubbles: true }));
    try { if (typeof _waActualizarBotonEnvio === 'function') _waActualizarBotonEnvio(); } catch (e) {}
    t.focus(); return true;
  }
  function enviarTarjeta(cv) {
    if (hiloActual() !== estado.hilo) { aviso('Cambiaste de chat: vuelve a abrir Cotizar en el chat correcto.', true); cerrar(); return; }
    if (!$('waTexto')) { aviso('La ventana de 24 h está cerrada: hace falta una plantilla aprobada.', true); return; }
    if (typeof window._waAdjuntoSeleccionado !== 'function') { aviso('No se encontró el envío de fotos del chat.', true); return; }
    var c = estado.elegido;
    cargarRecursos().then(function (r) {
      pintarTarjeta(cv, c, r);
      cv.toBlob(function (blob) {
        if (!blob) { aviso('No se pudo crear la imagen.', true); return; }
        var limpio = norm(c.nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        var file = new File([blob], 'cotizacion-pantalla-' + limpio + '.jpg', { type: 'image/jpeg' });
        ponerTexto(textoCliente(c)); // el texto va como pie de la foto (la vista previa lo toma de la caja de texto)
        cerrar();
        window._waAdjuntoSeleccionado({ files: [file], value: '' }, 'imagen');
      }, 'image/jpeg', 0.9);
    });
  }

  // ---------- puntos de entrada ----------
  function botonMenuAdjuntar() {
    var menu = $('waAdjuntarMenu'); if (!menu || menu.querySelector('[data-bc-cotizar]')) return;
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-bc-cotizar', '1');
    b.innerHTML = '<i class="ti ti-device-mobile" style="color:#e31e24;"></i> Cotizar pantalla';
    b.onclick = function () { menu.style.display = 'none'; abrir(); };
    menu.insertBefore(b, menu.firstChild);
  }
  var abrirMenuOriginal = window._waAbrirMenuAdjuntar;
  if (typeof abrirMenuOriginal === 'function') {
    window._waAbrirMenuAdjuntar = function (ev) {
      var r = abrirMenuOriginal.apply(this, arguments);
      try {
        botonMenuAdjuntar();
        var menu = $('waAdjuntarMenu');
        if (menu && menu.style.display === 'flex' && ev && ev.currentTarget) {
          var rect = ev.currentTarget.getBoundingClientRect(), alto = menu.offsetHeight || (8 * 38 + 12);
          var top = rect.top - alto - 6; if (top < 8) top = rect.bottom + 6;
          menu.style.top = top + 'px';
        }
      } catch (e) {}
      return r;
    };
  }
  function botonBarra() {
    var bar = $('waInputBar'); if (!bar || $('btnWaCotizar')) return;
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return; // en el celular va en el menú del clip
    var ref = $('btnWaUbicacion') || $('btnWaAdjuntar'); if (!ref || ref.parentNode !== bar) return;
    var b = document.createElement('button'); b.className = 'wa-icon-btn'; b.id = 'btnWaCotizar'; b.type = 'button';
    b.title = 'Cotizar pantalla (precio de nivel 1)'; b.setAttribute('aria-label', 'Cotizar pantalla');
    b.innerHTML = '<i class="ti ti-device-mobile"></i>';
    b.onclick = function (e) { e.stopPropagation(); abrir(); };
    ref.insertAdjacentElement('afterend', b);
  }
  function observar() {
    var wrap = $('waWrap') || document.body;
    var pend = false;
    new MutationObserver(function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; botonBarra(); }); }).observe(wrap, { childList: true, subtree: true });
    botonBarra();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observar); else observar();

  // Para pruebas y para otras capas.
  window.BcCotizarPantalla = { abrir: abrir, nombreLimpio: nombreLimpio, tipoDe: tipoDe, pantallas: pantallasDisponibles, pintarTarjeta: pintarTarjeta, recursos: cargarRecursos, textoCliente: textoCliente, version: V };
})();
