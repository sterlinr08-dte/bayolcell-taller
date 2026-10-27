/* sw.js — Taller Bayol como app del celular (27-oct-2026). SOLO avisos (Web Push): no guarda nada en caché ni intercepta
   las páginas, para que nunca se quede una versión vieja del sistema. Lo registra taller-app-movil.js. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { b: e.data ? e.data.text() : '' }; }
  var titulo = d.t || 'Mensaje nuevo';
  e.waitUntil(self.registration.showNotification(titulo, {
    body: d.b || '',
    tag: d.h ? 'hilo-' + d.h : undefined,
    renotify: !!d.h,
    icon: 'assets/taller/taller-icon-192.png',
    badge: 'assets/taller/taller-icon-192.png',
    data: { h: d.h || null }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var h = e.notification.data && e.notification.data.h;
  var url = new URL('taller.html' + (h ? '?hilo=' + encodeURIComponent(h) : ''), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      if (c.url.indexOf('taller.html') >= 0) {
        if (h) c.postMessage({ tipo: 'abrir-hilo', h: h });
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
