/* BAYOL CELL · Impresión fácil (dueño, 31-oct-2026, opción A: «hay empleados que no saben mucho»). Estilos en bc-impresion-facil.css.
   Rehace la tarjeta «Impresora de esta computadora» (#qzPanelCard) sin cambiar la firma ni las funciones de taller-app.js:
   · tres pasos con su estado: ① Instalar · ② Conectar · ③ Impresora;
   · se conecta sola: prueba QZ Tray cada 3 s mientras la tarjeta está a la vista y cada vez que se vuelve a la pestaña
     (ya no hace falta «Ya lo instalé, reconectar»);
   · un solo botón para instalar todo: instalar/bayol-impresion.bat (QZ Tray, certificado, arranque con Windows y el acceso
     «Bayol Cell Caja» con impresión directa de Chrome, que sirve aunque QZ no esté);
   · lo del certificado queda plegado en «¿Sigue pidiendo permiso?».
   Apagar: BC_BIF=false o localStorage bc_bif_off='1'. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  if (!root.classList.contains('bc-bif')) return;
  var INSTALADOR = 'instalar/bayol-impresion.bat';
  var probando = false, ultimo = 0;

  // 31-oct-2026 (dueño: «desde el iPhone no entiendo», eligió B): en iPhone/iPad/Android QZ Tray no existe. Ahí no se ofrece
  // el instalador de Windows: se explica cómo imprimir por wifi (AirPrint) y hay un botón para probar la impresora.
  var MOVIL = (function () {
    var ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod|Android/i.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  })();
  var IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (/Macintosh/.test(navigator.userAgent || '') && (navigator.maxTouchPoints || 0) > 1);
  function probarImpresoraMovil() {
    var w = window.open('', '_blank');
    if (!w) { try { toast('Permita las ventanas emergentes para probar', 'error'); } catch (e) {} return; }
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Prueba BAYOL CELL</title><style>@page{margin:4mm}body{font:15px/1.4 Arial,sans-serif;text-align:center;padding:10px}b{font-size:18px}</style></head>' +
      '<body><b>BAYOL CELL</b><br>Prueba de impresión<br>' + new Date().toLocaleString('es-DO') + '<br><br>Si lee esto, la impresora funciona.' +
      '<script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script></body></html>');
    w.document.close();
  }

  // En el celular no se intenta conectar a QZ (no existe): la función vieja queda en silencio y la impresión usa el navegador.
  if (MOVIL && typeof window.qzVerificarConexion === 'function' && !window.qzVerificarConexion._bif) {
    var nada = function () { return Promise.resolve(); }; nada._bif = true; window.qzVerificarConexion = nada;
  }

  function conectado() { try { return !!_qzConectado; } catch (e) { return false; } }
  function hayQz() { return typeof qz !== 'undefined' && qz && qz.websocket; }
  function impresoraTickets() { try { return typeof qzImpresoraTickets === 'function' ? qzImpresoraTickets() : ''; } catch (e) { return ''; } }
  function visible(el) { return !!(el && el.offsetParent !== null && !doc.hidden); }

  // ---- Conexión silenciosa: no llena la consola ni cambia nada si QZ no está ----
  function probar() {
    if (MOVIL) return;
    var card = doc.getElementById('qzPanelCard');
    if (probando || conectado() || !hayQz() || !visible(card)) return;
    if (Date.now() - ultimo < 2500) return;
    probando = true; ultimo = Date.now();
    pintar('buscando');
    try { if (typeof qzConfigurarFirma === 'function') qzConfigurarFirma(); } catch (e) {}
    var p;
    try { p = qz.websocket.isActive() ? Promise.resolve() : qz.websocket.connect({ retries: 0, delay: 0 }); } catch (e) { p = Promise.reject(e); }
    p.then(function () {
      try { _qzConectado = true; } catch (e) {}
      try { if (typeof qzMostrarConectado === 'function') qzMostrarConectado(); } catch (e) {}
    }, function () {}).then(function () { probando = false; pintar(); });
  }

  // ---- Estado de los tres pasos ----
  function estado() {
    if (!conectado()) return 1;
    return impresoraTickets() ? 4 : 3;
  }
  function pintar(buscando) {
    var card = doc.getElementById('qzPanelCard'); if (!card) return;
    if (MOVIL) {
      var bm = doc.getElementById('qzEstadoBadge'); if (bm && bm.textContent !== 'Celular') bm.textContent = 'Celular';
      var tv = doc.getElementById('bcproImpT'); if (tv && /computadora/.test(tv.textContent)) tv.innerHTML = '<i class="ti ti-printer" aria-hidden="true"></i> Impresora';
      return;
    }
    var e = estado(), pasos = card.querySelectorAll('.bif-paso');
    Array.prototype.forEach.call(pasos, function (p, i) {
      var n = i + 1, hecho = n < e || e === 4, actual = n === e || (e === 1 && n === 1);
      p.classList.toggle('hecho', hecho); p.classList.toggle('actual', !hecho && actual);
      p.setAttribute('aria-current', !hecho && actual ? 'step' : 'false');
    });
    var est = card.querySelector('.bif-buscando');
    if (est) {
      est.hidden = conectado();
      est.classList.toggle('activo', buscando === 'buscando');
    }
    // El aviso de taller-app.js dice «No instalado / No activo» aunque solo esté cerrado: se dice lo que se sabe.
    var badge = doc.getElementById('qzEstadoBadge');
    if (badge && !conectado() && /No instalado/.test(badge.textContent)) badge.textContent = 'Sin conectar';
    var resumen = card.querySelector('.bif-listo');
    if (resumen) {
      var imp = impresoraTickets();
      resumen.hidden = e !== 4;
      var b = resumen.querySelector('b'); if (b) b.textContent = imp || '';
    }
  }

  // ---- Armar la tarjeta (una vez) ----
  function armar(card) {
    if (card.classList.contains('bif')) return;
    card.classList.add('bif');
    var cab = card.firstElementChild;
    var h3 = cab && cab.querySelector('h3');
    if (h3) h3.innerHTML = '<i class="ti ti-printer" aria-hidden="true"></i> Impresión en esta computadora';

    // Pasos
    var pasos = doc.createElement('ol'); pasos.className = 'bif-pasos'; pasos.setAttribute('aria-label', 'Pasos');
    pasos.innerHTML = [['ti-download', 'Instalar'], ['ti-plug-connected', 'Conectar'], ['ti-receipt', 'Impresora']].map(function (x, i) {
      return '<li class="bif-paso"><span class="n" aria-hidden="true"><i class="ti ' + x[0] + '"></i><i class="ti ti-check ok"></i></span><span class="t">' + (i + 1) + '. ' + x[1] + '</span></li>';
    }).join('');
    if (cab) cab.insertAdjacentElement('afterend', pasos);

    // Celular: cómo imprimir por wifi + probar. Nada de QZ ni del instalador de Windows.
    if (MOVIL) {
      card.classList.add('bif-movil');
      var mv = doc.createElement('div'); mv.className = 'bif-movil-caja';
      mv.innerHTML =
        '<b class="bif-tit"><i class="ti ti-wifi" aria-hidden="true"></i> En el celular se imprime por wifi</b>' +
        '<ol class="bif-pasos-movil">' +
          '<li>Toque <b>Guardar e imprimir</b>.</li>' +
          (IOS ? '<li>Toque <b>Impresora</b> y elija la de la tienda.</li>' : '<li>Toque <b>Seleccionar impresora</b> y elija la de la tienda.</li>') +
          '<li>Toque <b>Imprimir</b>.</li>' +
        '</ol>' +
        '<button type="button" class="bif-btn bif-probar"><i class="ti ti-printer" aria-hidden="true"></i> Probar impresora</button>' +
        '<p class="bif-nota">' + (IOS ? 'Solo salen impresoras con wifi compatibles con <b>AirPrint</b>. Por Bluetooth el iPhone no imprime desde aquí.'
          : 'Si la impresora no sale, instale el complemento de impresión de su marca (Play Store).') + '</p>' +
        '<p class="bif-nota"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Si escribió el WhatsApp del cliente, al guardar le llega la prefactura en PDF.</p>';
      var ref = doc.getElementById('qzNoInstalado') || card.lastElementChild;
      card.insertBefore(mv, ref);
      mv.querySelector('.bif-probar').addEventListener('click', probarImpresoraMovil);
      pintar();
      return;
    }

    // Estado «no conectado»: un solo botón
    var no = doc.getElementById('qzNoInstalado');
    if (no) {
      no.innerHTML =
        '<div class="bif-caja">' +
          '<b class="bif-tit">QZ Tray no está abierto en esta computadora</b>' +
          '<div class="bif-acc">' +
            '<a class="bif-btn" href="' + INSTALADOR + '" download="Instalar impresion BAYOL.bat"><i class="ti ti-download" aria-hidden="true"></i> Instalar impresión</a>' +
            '<a class="bif-sec" href="https://qz.io/download/" target="_blank" rel="noopener">Solo QZ Tray</a>' +
          '</div>' +
          '<p class="bif-buscando" role="status"><i class="ti ti-loader-2" aria-hidden="true"></i> Buscando QZ Tray… se conecta solo</p>' +
          '<details class="bif-ayuda"><summary>¿Cómo se instala?</summary><ol>' +
            '<li>Toque <b>Instalar impresión</b>. Si Chrome avisa, toque <b>Conservar</b>.</li>' +
            '<li>Abra el archivo y toque <b>Sí</b> cuando Windows pida permiso.</li>' +
            '<li>Espere a que diga <b>LISTO</b>. Esta ventana se conecta sola.</li>' +
          '</ol><p class="bif-nota">Se hace una vez por computadora. Deja QZ Tray abriendo con Windows, sin el aviso «¿Permitir?», ' +
          'y crea el icono <b>Bayol Cell Caja</b>: con él la prefactura sale directo a la impresora aunque QZ no esté.</p></details>' +
        '</div>';
    }

    // Estado «conectado»: resumen corto encima de las listas y textos cortos (sin MAYÚSCULAS)
    var si = doc.getElementById('qzConectado');
    if (si) {
      var et = si.querySelectorAll('label');
      if (et[0]) et[0].innerHTML = '<i class="ti ti-tag" aria-hidden="true"></i> Etiquetas';
      if (et[1]) et[1].innerHTML = '<i class="ti ti-receipt" aria-hidden="true"></i> Tickets';
      var pb = si.querySelector('button[onclick="qzImprimirPrueba()"]'); if (pb) pb.innerHTML = '<i class="ti ti-printer" aria-hidden="true"></i> Probar etiqueta';
    }
    if (si && !si.querySelector('.bif-listo')) {
      var listo = doc.createElement('p'); listo.className = 'bif-listo'; listo.hidden = true;
      listo.innerHTML = '<i class="ti ti-circle-check" aria-hidden="true"></i> Listo. Tickets: <b></b>';
      si.insertBefore(listo, si.firstChild);
    }

    // Lo del certificado, plegado
    var cert = si && si.nextElementSibling;
    if (cert && /certificado/i.test(cert.textContent) && cert.tagName !== 'DETAILS') {
      var det = doc.createElement('details'); det.className = 'bif-perm';
      det.innerHTML = '<summary><i class="ti ti-shield-lock" aria-hidden="true"></i> ¿Sigue pidiendo permiso al imprimir?</summary>' +
        '<p class="bif-nota">Use <a href="' + INSTALADOR + '" download="Instalar impresion BAYOL.bat"><b>Instalar impresión</b></a>: deja el certificado puesto. ' +
        'O hágalo a mano:</p>';
      var cuerpo = cert.querySelector('div[style*="font-size:13px"]') || cert;
      var ol = cuerpo.querySelector('ol'), btn = cuerpo.querySelector('button');
      if (btn) { btn.innerHTML = '<i class="ti ti-download" aria-hidden="true"></i> Descargar certificado'; det.appendChild(btn); }
      if (ol) det.appendChild(ol);
      cert.parentNode.replaceChild(det, cert);
    }
    pintar();
  }

  function buscarYArmar() { var c = doc.getElementById('qzPanelCard'); if (c) { armar(c); pintar(); } }

  // El estado cambia cuando taller-app.js conecta o guarda impresora: se vuelve a pintar
  var mo = new MutationObserver(function () { var c = doc.getElementById('qzPanelCard'); if (c && !c.classList.contains('bif')) armar(c); pintar(); });
  function vigilar() {
    var c = doc.getElementById('qzPanelCard'); if (!c) return;
    mo.observe(c, { attributes: true, attributeFilter: ['style'], subtree: true });
  }
  doc.addEventListener('change', function (e) { if (e.target && /^qzImpresora/.test(e.target.id || '')) setTimeout(pintar, 0); });
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) { ultimo = 0; probar(); } });
  window.addEventListener('focus', function () { ultimo = 0; probar(); });
  setInterval(probar, 3000);

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { buscarYArmar(); vigilar(); });
  else { buscarYArmar(); vigilar(); }
  window.bcImpresionFacil = { probar: probar, pintar: pintar, movil: MOVIL };
})();
