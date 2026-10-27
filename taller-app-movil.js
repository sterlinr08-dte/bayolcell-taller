/* taller-app-movil.js — El taller como app en el celular de los empleados (27-oct-2026).
   Dueño: «usar el taller como app en los celulares de los empleados … que solamente podamos prefacturar y responder el CRM
   … como una aplicación interna (PWA)». Decisiones: chats solo de su línea · con aviso · por permiso del rol.
   1) Registra sw.js (solo avisos; sin caché).
   2) En el CRM, una píldora «Activar avisos en este teléfono». En iPhone los avisos solo funcionan con la app instalada
      en la pantalla de inicio: si no lo está, la píldora explica cómo instalarla.
   3) Tocar el aviso abre ese chat (?hilo=… o mensaje del service worker).
   El modo «Solo Prefactura y CRM» es el permiso solo_movil (taller-app.js). Apagar esta capa: localStorage.bc_movil_off='1'. */
(function () {
  'use strict';
  try { if (localStorage.getItem('bc_movil_off') === '1') return; } catch (e) {}
  var doc = document;
  var LS_NO = 'bc_movil_avisos_no';
  var soporta = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  var ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var instalada = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var reg = null;

  function cli() { try { return typeof supabaseClient !== 'undefined' ? supabaseClient : null; } catch (e) { return null; } }
  function conSesion() { try { return typeof sessionUser !== 'undefined' && !!sessionUser; } catch (e) { return false; } }
  function aviso(msg, tipo) { try { if (typeof toast === 'function') toast(msg, tipo || 'info'); } catch (e) {} }
  function b64aBytes(b) {
    var p = '='.repeat((4 - b.length % 4) % 4), s = atob((b + p).replace(/-/g, '+').replace(/_/g, '/'));
    var u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u;
  }
  function equipo() {
    var ua = navigator.userAgent;
    return (/iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : 'Computadora') + (instalada ? ' · app' : ' · navegador');
  }

  if (soporta) {
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(function (r) { reg = r; }).catch(function () {});
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.tipo === 'abrir-hilo' && e.data.h) abrirHilo(e.data.h);
    });
  }

  // Guarda (o renueva) la suscripción de este teléfono a nombre de quien inició sesión.
  async function suscribir(pedirPermiso) {
    var c = cli(); if (!c || !soporta) return false;
    if (pedirPermiso && Notification.permission === 'default') {
      var p = await Notification.requestPermission();
      if (p !== 'granted') { pintar(); return false; }
    }
    if (Notification.permission !== 'granted') return false;
    var r = reg || await navigator.serviceWorker.ready;
    var sub = await r.pushManager.getSubscription();
    if (!sub) {
      var k = await c.rpc('push_clave_publica');
      if (k.error || !k.data) { if (pedirPermiso) aviso('Los avisos todavía no están listos en el servidor. Intente más tarde.', 'error'); return false; }
      sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64aBytes(k.data) });
    }
    var j = sub.toJSON();
    var res = await c.rpc('push_suscribir', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_equipo: equipo() });
    if (res.error) { if (pedirPermiso) aviso('No se pudieron activar los avisos: ' + res.error.message, 'error'); return false; }
    try { localStorage.removeItem(LS_NO); } catch (e) {}
    if (pedirPermiso) aviso('Listo. Este teléfono avisará cuando entre un mensaje.', 'success');
    pintar();
    return true;
  }

  // Píldora en el CRM
  function estado() {
    if (!soporta) return ios && !instalada ? 'instalar' : null;
    if (ios && !instalada) return 'instalar';
    if (Notification.permission === 'granted') return null;
    if (Notification.permission === 'denied') return 'bloqueado';
    return 'activar';
  }
  function pintar() {
    var vista = doc.getElementById('v-crmLinea'); if (!vista) return;
    var el = doc.getElementById('bcMovilAvisos');
    var st = conSesion() ? estado() : null, no = false;
    try { no = localStorage.getItem(LS_NO) === '1'; } catch (e) {}
    if (!st || no) { if (el) el.remove(); return; }
    var txt = st === 'instalar' ? 'Para recibir avisos, instale la app: toque <b>Compartir</b> y luego <b>Agregar a inicio</b>.'
      : st === 'bloqueado' ? 'Los avisos están bloqueados. Actívelos en los ajustes del teléfono para este sitio.'
      : 'Avisos de mensajes nuevos en este teléfono.';
    var html = '<i class="ti ti-bell" aria-hidden="true"></i><span class="bcm-t">' + txt + '</span>' +
      (st === 'activar' ? '<button type="button" class="bcm-si">Activar avisos</button>' : '') +
      '<button type="button" class="bcm-x" aria-label="Ocultar"><i class="ti ti-x" aria-hidden="true"></i></button>';
    if (!el) {
      el = doc.createElement('div'); el.id = 'bcMovilAvisos'; el.setAttribute('role', 'status');
      vista.insertBefore(el, vista.firstChild);
      el.addEventListener('click', function (e) {
        if (e.target.closest('.bcm-si')) { suscribir(true).catch(function (x) { aviso('No se pudieron activar los avisos.', 'error'); }); }
        else if (e.target.closest('.bcm-x')) { try { localStorage.setItem(LS_NO, '1'); } catch (x) {} el.remove(); }
      });
    }
    if (el.innerHTML !== html) el.innerHTML = html;
  }

  // Abrir el chat del aviso
  async function abrirHilo(id) {
    var c = cli(); if (!c || !/^[0-9a-f-]{36}$/i.test(String(id))) return;
    try {
      if (typeof nav === 'function') nav('crmLinea');
      var r = await c.from('whatsapp_hilos').select('*, whatsapp_lineas(nombre, sucursales(nombre))').eq('id', id).maybeSingle();
      var h = r.data; if (!h) { aviso('Ese chat no está disponible para su usuario.', 'error'); return; }
      if (typeof _crmLineaActualId !== 'undefined' && _crmLineaActualId !== h.linea_id && typeof seleccionarLineaCRM === 'function') {
        var ln = h.whatsapp_lineas || {};
        seleccionarLineaCRM(h.linea_id, (ln.sucursales && ln.sucursales.nombre) || '', ln.nombre || '');
        try { localStorage.setItem('bayol_subtab_crmlinea', 'mensajes'); } catch (e) {}
        for (var k = 0; k < 30 && !(_waHilos || []).some(function (x) { return x.linea_id === h.linea_id; }); k++) await new Promise(function (ok) { setTimeout(ok, 200); });
      }
      if (typeof _waHilos !== 'undefined' && !_waHilos.some(function (x) { return x.id === h.id; })) _waHilos.unshift(h);
      if (typeof abrirHiloWhatsapp === 'function') await abrirHiloWhatsapp(h.id);
    } catch (e) { aviso('No se pudo abrir el chat.', 'error'); }
  }

  // Al iniciar sesión: renovar la suscripción en silencio, pintar la píldora y abrir ?hilo= si vino de un aviso.
  var pendiente = null;
  try { pendiente = new URLSearchParams(location.search).get('hilo'); } catch (e) {}
  var listo = false;
  var t = setInterval(function () {
    if (!conSesion() || !cli()) return;
    if (!listo) {
      listo = true;
      if (soporta && Notification.permission === 'granted') suscribir(false).catch(function () {});
      if (pendiente) {
        var h = pendiente; pendiente = null;
        try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
        setTimeout(function () { abrirHilo(h); }, 600);
      }
    }
    pintar();
  }, 1500);
  window.bcMovilAbrirHilo = abrirHilo;
})();
