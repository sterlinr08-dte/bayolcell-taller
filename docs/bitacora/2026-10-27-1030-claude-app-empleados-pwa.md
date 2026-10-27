# 2026-10-27 10:30 (RD) — App del celular para los empleados (PWA): solo Prefactura y CRM, con avisos

## Pedido del dueño
«Usar el taller como app en los celulares de los empleados, pero que ahí solamente podamos prefacturar y responder el CRM …
muy parecido al WhatsApp original, con las mismas funciones que tenemos en la web … como una aplicación interna (PWA).»
Decisiones (preguntas en el chat): chats **solo de su línea** · **con aviso** en el teléfono · se da **por permiso del rol**.

## Lo que ya existía (auditoría)
- `taller.webmanifest` + metas de iPhone: el taller ya se podía instalar. No había service worker.
- Modos «SOLO …» en `applyAccessControls` (Mi Trabajo, Atención, Contabilidad).
- `whatsapp_solo_sucursal` ya limita los chats **en la base** (RLS de `whatsapp_hilos`/`whatsapp_mensajes`): cada sucursal
  tiene sus líneas (Santiago 3, Navarrete 2, Moca 1). No hizo falta tocar el CRM: es el mismo de la web (capa
  `crm-wa-identico`), con todas sus funciones.

## Qué se hizo
| Pieza | Archivo |
|---|---|
| Permiso **«SOLO Prefactura y CRM (app del celular)»** (`solo_movil`): menú solo CRM + Prefactura, entra al CRM | `taller-app.js` (+ `taller-app.min.js` regenerado, `?v=20261027-m1`) |
| Service worker **solo de avisos** (sin caché, no intercepta páginas → nunca deja una versión vieja) | `sw.js` |
| Píldora «Avisos de mensajes nuevos» en el CRM; en iPhone sin instalar explica «Compartir → Agregar a inicio»; tocar el aviso abre ese chat | `taller-app-movil.js`, `taller-app-movil.css` |
| Manifest con `id` y descripción | `taller.webmanifest` |
| Base: `push_suscripciones`, `_push_vapid`, token `push_token` en vault, RPC `push_suscribir/desuscribir/clave_publica`, `push_destinatarios`, `push_resultado`, trigger `trg_push_mensaje_entrante` (mensaje entrante → Edge; si no hay teléfonos suscritos no llama a nada; un error nunca impide guardar el mensaje) | `supabase/migrations/20261027130000_app_empleados_push.sql` |
| Edge `push-enviar` (web-push, VAPID creadas por ella misma la primera vez: no pasan por el chat ni el repo; 404/410 da de baja el teléfono) | `supabase/functions/push-enviar/index.ts` |

Quién recibe el aviso = las mismas reglas con que el CRM le enseña el chat: admin y usuarios todo; empleados con
`whatsapp_ver`/`leads_ver`, de su sucursal si tienen `whatsapp_solo_sucursal`, y no los chats asignados a otra persona.
Chat silenciado = sin aviso. Sin `drop`/`revoke` (el conector los retiene): las funciones de servicio comprueban `auth.role()`.

## Pruebas
- Postgres 16 local con stubs: la migración aplica; **12 casos** de destinatarios (sucursal, asignado, silenciado, inactivo,
  permiso extra, baja por 410, sin sesión, endpoint http, anon sin acceso, token) — todos bien.
- `web-push` en Deno: claves VAPID y cifrado `aes128gcm` correctos.
- `scripts/pruebas/app-movil.cjs` a 390 y 1280 px: **36/36**. Siguen bien `prefactura-confiable.cjs` y `solicitudes-crm.cjs`.

## Estado
Rama `claude/app-empleados-pwa`, PR **sin publicar**. Nada aplicado en Supabase todavía.

## Al publicar (con «publícalo»)
1. Aplicar la migración (sin sentencias destructivas). 2. Desplegar la Edge `push-enviar` (verify_jwt true, la llama el trigger
con la clave anon). 3. Prepararla una vez con `net.http_post(..., {preparar:true})` leyendo el token del vault (crea las VAPID).
4. Unir el PR. 5. En el rol de las empleadas: marcar «SOLO Prefactura y CRM» y «Solo ver los chats de SU sucursal».
6. Probar con el teléfono del dueño (mensaje de prueba solo a su número).

## Riesgos
- iPhone: avisos solo con la app en la pantalla de inicio (iOS 16.4+). Android y PC funcionan desde el navegador.
- El texto del aviso muestra el inicio del mensaje en la pantalla bloqueada (como WhatsApp).
