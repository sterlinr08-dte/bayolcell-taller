# WhatsApp del CRM igual que el original — fase 3: reacciones (rama `claude/wa-fase3`, sin publicar) — Claude

Continúa `*-claude-whatsapp-fase2-publicada.md`. Pedido: «Continúa las fases».

## Hallazgo (docs.zernio.com)
- Zernio manda las reacciones como **evento propio `reaction.received`**, con:
  - `reaction.action` = `added` o `removed`;
  - `reaction.emoji`, que viene vacío cuando se quita;
  - `reaction.platformMessageId`, el wamid del mensaje.
- **La suscripción del webhook de WhatsApp no incluye ese evento**: hay 0 en `social_webhook_eventos` y ningún «Evento no manejado» en los logs. Por eso solo llegaba el texto vacío «[reaction]».
- La API también tiene `POST /v1/inbox/conversations/{id}/messages/{messageId}/reactions` para reaccionar desde el CRM. No se usa todavía:
  - hay que confirmar qué id acepta (de Zernio o el wamid);
  - probarlo significa mandar una reacción real a un cliente.
- **No sirve en Bayol:** «marcar como leído» (`/read`) no manda palomitas azules en cuentas de coexistencia, y Bayol usa la app WhatsApp Business.
- Para WhatsApp, la Cloud API no avisa de ediciones ni de borrados del cliente.

## Cambios
- **Migración** `20261018170000_wa_reacciones.sql` (**sin aplicar**):
  - columna `whatsapp_mensajes.reacciones jsonb`, con forma `{"cliente":"👍","negocio":"❤️"}`;
  - función `wa_aplicar_reaccion(wamid, quien, emoji)`: pone, cambia o quita la reacción de cada lado. Solo la puede ejecutar `service_role`.
- **`whatsapp-webhook`:**
  - maneja `reaction.received` con `procesarReaccion`;
  - el lado sale de `fromMe`, de `direction=outgoing` o de `sender.isMe` (defensivo, porque el payload real todavía no se ha visto);
  - si el mensaje no está en el CRM, se ignora.
- **`taller-app.js`:**
  - pastilla con el emoji pegada al pie de la burbuja, como en WhatsApp: a la izquierda en los mensajes del cliente y a la derecha en los del negocio;
  - la burbuja se redibuja sola cuando cambia una reacción (`data-reac`).
  - **Corrección extra:** `_waWireSwipe` enganchaba otra vez los gestos de todas las burbujas en cada mensaje nuevo (doble listener). Ahora se engancha una sola vez por burbuja.
  - Cache-bust: `taller-app.js?v=20261018-wa3`.

## Pruebas
- **Función SQL en producción dentro de un DO con RAISE** (todo se deshizo; se verificó que no quedó la columna, la función ni las filas de prueba):
  - 👍 del cliente;
  - ❤️ del negocio: quedan las dos;
  - el cliente cambia a 😂;
  - el cliente quita la suya: queda solo la del negocio;
  - el negocio quita la suya: queda NULL;
  - un mensaje inexistente da `sin_mensaje`;
  - un lado inválido da `ignorado`.
- **Pantalla (Node):** salen los dos emojis y `data-reac`; un mensaje sin reacciones no muestra pastilla; un `<script>` queda escapado.
- TypeScript del webhook: 0 errores. `node --check`: OK.

## Para publicar
1. Aplicar la migración.
2. Desplegar `whatsapp-webhook` (v36).
3. Llevar la rama a `main`.
4. **Agregar `reaction.received` a la suscripción del webhook de WhatsApp en Zernio**, con PUT sobre el webhook existente y nunca con POST (el 14-oct un POST repetido creó webhooks duplicados y disparó la cuota). Después revisar el primer payload real para confirmar quién reaccionó.
