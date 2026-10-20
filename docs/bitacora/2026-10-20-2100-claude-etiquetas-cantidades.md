# 2026-10-20 21:00 · Claude · CRM: etiquetas con cantidades y avisos de sin leer

## Pedido del dueño
Mandó una captura del menú «Etiquetas» del CRM de WhatsApp y pidió «que en las etiquetas salgan notificaciones y las cantidades».

## Qué se hizo (`crm-wa-identico.js` y `.css`, versión 20261020-w14; `crm-marketing-consent.js` u2)
- **En cada etiqueta del menú:**
  - a la derecha, cuántos chats tienen esa etiqueta;
  - un círculo verde, como en WhatsApp, con cuántos de esos chats tienen mensajes sin leer.
- **«Todas las etiquetas» y el botón «Etiquetas ▾»** muestran el círculo verde con el total de chats etiquetados que tienen mensajes sin leer.
  - Con una etiqueta elegida, el botón muestra los sin leer de esa etiqueta.
- **Cómo se cuenta:**
  - en la base, no solo en la página cargada de la lista;
  - solo la línea abierta, sin los archivados ni las copias `duplicado:`;
  - con la misma visibilidad de la lista: el admin ve todo; el empleado, los suyos y los sin asignar.
- **Cuándo se actualiza:** al abrir el menú y, como máximo, cada 45 segundos al repintarse la lista. Si falla, no reintenta en cada repintado.
- **No cambia** etiquetas, chats, Zernio ni la IA. Es solo lectura.

## Pruebas
Nueva prueba `etqcount` 14/14 a 1280 y 390 px. Datos de prueba: 4 chats, uno archivado.
- «Nuevo cliente» marca 2 chats y 1 sin leer: el archivado no cuenta.
- «Cotización enviada» marca 2 chats y 1 sin leer.
- «Pagado» marca 0, sin aviso.
- El botón y «Todas» marcan 2 sin leer.
- Sin errores.

## Dato real
Hoy solo 4 chats de 11,306 tienen etiqueta.

## Estado
Rama `claude/prefactura-limpia`, **sin publicar**.
