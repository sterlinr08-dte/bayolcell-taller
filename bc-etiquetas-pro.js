/* BAYOL CELL · Etiquetas «estudio de etiqueta» (dueño, 30-oct-2026, opción B). Estilos en bc-etiquetas-pro.css.
   Reordena la pantalla «Impresión de Labels» con los MISMOS campos (mismos id y oninput; actualizarLabelLive e
   imprimirLabelAdhesivo no cambian):
   · formulario en 2 columnas: Modelo y color, Marca (se pone sola según el modelo mientras no la toquen), Capacidad con
     botones rápidos, IMEI con aviso (15 dígitos / dígito verificador), Estado con botones rápidos, Papel y «Ajuste fino» plegado;
   · a la derecha la etiqueta en grande, fija al bajar, con Copias (− +) e Imprimir debajo;
   · el engranaje abre la ventana «Impresora de esta computadora» (bc-prefactura-pro.js) si está; si no, la de siempre.
   Apagar: BC_ETQ=false o localStorage bc_etq_off='1'. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  if (!root.classList.contains('bc-etq')) return;
  function $(id) { return doc.getElementById(id); }
  function el(t, c, h) { var e = doc.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function vivo() { try { actualizarLabelLive(); } catch (e) {} }
  var MARCAS = [[/iphone|ipad|apple|airpods|\bwatch\b|macbook/i, 'Apple'], [/samsung|galaxy|\b[asmz]\d{2}\b|\bs2[0-9]\b|note ?\d/i, 'Samsung'],
    [/redmi|xiaomi|poco|\bmi \d/i, 'Xiaomi'], [/motorola|\bmoto\b/i, 'Motorola'], [/pixel/i, 'Google'], [/huawei/i, 'Huawei'],
    [/honor/i, 'Honor'], [/tecno/i, 'Tecno'], [/infinix/i, 'Infinix'], [/\bzte\b|blade/i, 'ZTE'], [/oppo/i, 'Oppo'], [/realme/i, 'Realme'], [/\blg\b/i, 'LG']];
  function luhn(s) { var t = 0; for (var i = 0; i < s.length; i++) { var d = +s[s.length - 1 - i]; if (i % 2) { d *= 2; if (d > 9) d -= 9; } t += d; } return t % 10 === 0; }
  function fila(input, lbl, ancho) { var f = input.closest('.form-row'); if (!f) return null; if (lbl) { var l = f.querySelector('label'); if (l) l.textContent = lbl; } if (ancho) f.classList.add('etq-ancho'); return f; }
  function chips(input, valores, alElegir) {
    var c = el('div', 'etq-chips'); c.setAttribute('role', 'group');
    valores.forEach(function (v) { var b = el('button', 'etq-chip', v); b.type = 'button'; b.dataset.v = v; b.addEventListener('click', function () { input.value = v; alElegir && alElegir(); vivo(); marcar(); }); c.appendChild(b); });
    function marcar() { [].forEach.call(c.children, function (b) { var on = b.dataset.v.toUpperCase() === String(input.value || '').trim().toUpperCase(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
    input.addEventListener('input', marcar); marcar(); return c;
  }

  function armar() {
    var v = $('v-etiquetas'); if (!v || v.dataset.etq) return !!v;
    var lay = v.querySelector('.layout-dashboard'), cards = lay && lay.children; if (!cards || cards.length < 2) return false;
    var izq = cards[0], der = cards[1];
    var marca = $('lbl_marca'), modelo = $('lbl_modelo'), gb = $('lbl_gb'), imei = $('lbl_imei'), est = $('lbl_estado_texto'), cop = $('lbl_copias');
    if (!marca || !modelo || !gb || !imei || !est || !cop || !$('labelCard')) return false;
    v.dataset.etq = '1';
    var h3 = izq.querySelector('h3'); if (h3) h3.firstChild.nodeValue = 'Datos del equipo';
    var p = izq.querySelector('p'); if (p) p.classList.add('etq-oculto');
    var hr = izq.querySelector('hr'); if (hr) hr.classList.add('etq-oculto');

    var form = el('div', 'etq-form');
    form.appendChild(fila(modelo, 'Modelo y color', true));
    var fMarca = fila(marca, 'Marca (se pone sola)'); form.appendChild(fMarca);
    var fImei = fila(imei, 'IMEI o serie'); form.appendChild(fImei);
    imei.setAttribute('inputmode', 'numeric'); imei.setAttribute('autocomplete', 'off');
    var avImei = el('span', 'etq-ayuda'); avImei.setAttribute('aria-live', 'polite'); fImei.appendChild(avImei);
    var fGb = fila(gb, 'Capacidad', true); form.appendChild(fGb);
    fGb.appendChild(chips(gb, ['64GB', '128GB', '256GB', '512GB', '1TB']));
    var fEst = fila(est, 'Estado (sale al pie)', true); form.appendChild(fEst);
    fEst.appendChild(chips(est, ['CLASE A', 'CLASE B', 'NUEVO', 'AVISO BAT', 'AVISO PANT']));
    form.appendChild(el('div', 'etq-sec', 'Papel'));
    var orient = izq.querySelector('.btn-orientacion'); var papel = orient && orient.parentNode;
    if (papel) { papel.classList.add('etq-papel'); papel.style.marginBottom = ''; form.appendChild(papel); }
    // Ajuste fino plegado
    var det = el('details', 'etq-fino'); det.appendChild(el('summary', '', 'Ajuste fino (opcional) · tamaño, letra, código de barras y giro'));
    var cuerpo = el('div', 'etq-fino-cuerpo'); det.appendChild(cuerpo);
    ['cfg_width', 'cfg_height', 'cfg_font', 'cfg_barcode_h', 'cfg_rotacion'].forEach(function (id) { var e = $(id); var f = e && e.closest('.form-row'); if (f) cuerpo.appendChild(f); });
    form.appendChild(det);
    [].forEach.call(izq.querySelectorAll('h4'), function (h) { h.classList.add('etq-oculto'); });

    // Marca automática según el modelo (hasta que la persona la cambie a mano)
    var marcaTocada = false;
    marca.addEventListener('input', function (e) { if (e.isTrusted) marcaTocada = true; });
    modelo.addEventListener('input', function () {
      if (marcaTocada) return;
      for (var i = 0; i < MARCAS.length; i++) if (MARCAS[i][0].test(modelo.value)) { if (marca.value !== MARCAS[i][1]) { marca.value = MARCAS[i][1]; vivo(); } break; }
    });
    // IMEI: solo un aviso, nunca bloquea (puede ser un número de serie)
    function revisarImei() {
      var s = String(imei.value || '').replace(/\s/g, ''); avImei.className = 'etq-ayuda'; avImei.textContent = '';
      if (!s) return;
      if (/^\d+$/.test(s)) {
        if (s.length === 15) { if (luhn(s)) { avImei.classList.add('ok'); avImei.textContent = '✓ IMEI de 15 dígitos'; } else { avImei.classList.add('ojo'); avImei.textContent = 'Revise el IMEI: el último dígito no cuadra'; } }
        else { avImei.classList.add('ojo'); avImei.textContent = 'Tiene ' + s.length + ' dígitos (un IMEI tiene 15). Si es número de serie, está bien.'; }
      } else { avImei.textContent = 'Número de serie'; }
    }
    imei.addEventListener('input', revisarImei); revisarImei();
    izq.insertBefore(form, h3 ? h3.nextSibling : izq.firstChild);

    // Derecha: vista previa grande + copias + imprimir
    der.classList.add('etq-vista');
    var h4 = der.querySelector('h4'); if (h4) h4.textContent = 'Vista previa';
    var lienzo = el('div', 'etq-lienzo'); der.insertBefore(lienzo, $('labelCard')); lienzo.appendChild($('labelCard'));
    var dim = el('div', 'etq-dim'); der.appendChild(dim);
    function pintarDim() { var w = $('cfg_width'), h = $('cfg_height'), r = $('cfg_rotacion'); dim.textContent = 'Papel ' + (w ? w.value : '?') + ' × ' + (h ? h.value : '?') + ' mm' + (r && +r.value ? ' · girada ' + r.value + '°' : ''); }
    ['cfg_width', 'cfg_height', 'cfg_rotacion'].forEach(function (id) { var e = $(id); if (e) { e.addEventListener('input', pintarDim); e.addEventListener('change', pintarDim); } });
    [].forEach.call(doc.querySelectorAll('#v-etiquetas .btn-orientacion'), function (b) { b.addEventListener('click', function () { setTimeout(pintarDim, 50); }); });
    pintarDim();
    var copias = el('div', 'etq-cop', '<span>Copias</span><span class="ctl"><button type="button" data-d="-1" aria-label="Una copia menos">−</button></span>');
    var ctl = copias.querySelector('.ctl'); ctl.appendChild(cop); cop.setAttribute('aria-label', 'Copias'); cop.setAttribute('inputmode', 'numeric');
    var mas = el('button', '', '+'); mas.type = 'button'; mas.dataset.d = '1'; mas.setAttribute('aria-label', 'Una copia más'); ctl.appendChild(mas);
    ctl.addEventListener('click', function (e) { var b = e.target.closest('[data-d]'); if (!b) return; var n = Math.max(1, Math.min(50, (parseInt(cop.value, 10) || 1) + Number(b.dataset.d))); cop.value = n; });
    var filaVieja = null; // la fila vieja de «Cantidad de copias» queda vacía
     [].forEach.call(izq.querySelectorAll('.form-row'), function (f) { if (!f.querySelector('input,select') && /Copias/i.test(f.textContent)) filaVieja = f; });
    if (filaVieja) filaVieja.classList.add('etq-oculto');
    der.appendChild(copias);
    var bImp = izq.querySelector('button[onclick^="imprimirLabelAdhesivo"]'); var filaImp = bImp && bImp.parentNode;
    if (filaImp) {
      filaImp.classList.add('etq-imp'); filaImp.style.marginBottom = ''; der.appendChild(filaImp);
      bImp.innerHTML = '<i class="ti ti-printer" aria-hidden="true"></i> Imprimir etiqueta';
      var gear = filaImp.querySelector('button[onclick^="abrirModalConfigImpresora"]');
      if (gear) { gear.setAttribute('aria-label', 'Impresora de esta computadora'); gear.addEventListener('click', function (e) { if (window.bcImpresoraRapida) { e.preventDefault(); e.stopImmediatePropagation(); window.bcImpresoraRapida.abrir(); } }, true); }
    }
    return true;
  }
  var n = 0; (function intentar() { if (!armar() && ++n < 40) setTimeout(intentar, 500); })();
})();
