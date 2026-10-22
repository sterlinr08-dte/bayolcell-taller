# 22-oct-2026 16:40 · «Eliminar para todos» en el menú del mensaje de WhatsApp

## Pedido del dueño
«Vamos a poner en el menú de acción del chat 💬 eliminar los mensajes para todos.»

## Hallazgo importante (la documentación de Zernio se contradice)
- Página de WhatsApp (docs.zernio.com/platforms/whatsapp): `message.deleted` se dispara cuando «el negocio elimina un mensaje
  enviado con DELETE /v1/inbox/conversations/{conversationId}/messages/{messageId}» → sugiere que SÍ se puede.
- Página del endpoint (docs.zernio.com/messages/delete-inbox-message): «Facebook, Instagram, WhatsApp: Not supported (returns 400)».
- El comentario viejo del CRM (3 oct) se basaba en la segunda. **Solo una prueba real lo resuelve.** Se construyó todo de forma
  que, si Zernio responde 400, el CRM avisa «WhatsApp no permitió eliminar este mensaje desde el sistema. Bórrelo desde la app
  del teléfono» y no toca nada.

## Cambios
- **Base (aplicado):** estado nuevo `eliminado` en `whatsapp_mensajes` (check), rango 40 en `wa_rango_estado`, aceptado en
  `wa_aplicar_estado`. Migración `20261022163000_mensaje_eliminado.sql`. El MCP aceptó el `drop constraint` sin colgarse.
- **Edge `whatsapp-mensaje-eliminar` v1 (desplegada):** POST {mensaje_id}. Solo mensajes salientes con `wa_message_id`;
  misma autorización que `whatsapp-enviar`. Llama a Zernio DELETE; si acepta, `estado='eliminado'` y el texto queda en
  `meta.eliminado` (auditoría). Si era el último mensaje, el chat muestra «🚫 Mensaje eliminado» en la lista.
- **Webhook v39 (desplegada):** evento `message.deleted` → marca `eliminado` (sirve si lo borran desde la app del teléfono y
  Meta avisa). Verificado igual al repo (impresión TS sin comentarios).
- **Pantalla (rama `claude/eliminar-para-todos`, sin publicar):** `taller-app.js` p6 + `taller.html`:
  - opción roja «Eliminar para todos» en el menú ⌄ del mensaje; solo en mensajes nuestros, enviados, no eliminados y de
    menos de 48 h (ventana de WhatsApp); confirma antes;
  - burbuja «🚫 Eliminaste este mensaje» / «Este mensaje fue eliminado», sin menú ni reenviar; vista previa «🚫 Mensaje eliminado»;
  - si llega el cambio por Realtime, la burbuja se redibuja sola;
  - botones del menú a 44 px.

## Pruebas (Playwright, 390 y 1280 px, datos de ejemplo)
- La opción no sale en mensajes del cliente ni en uno de hace 3 días; sí en uno propio reciente.
- Éxito: la burbuja pasa a «Eliminaste este mensaje». Error `no_soportado`: aviso claro y el mensaje queda igual.
- Sin errores de consola.

## Pendiente
- **Prueba real** con un mensaje al número del dueño (necesita «publícalo» y que él lo haga desde el CRM).
