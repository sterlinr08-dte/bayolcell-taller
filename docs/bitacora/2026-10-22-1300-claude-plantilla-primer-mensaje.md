# 22-oct-2026 13:00 · Plantilla a un cliente referido: «Zernio todavia no reconoce esta conversacion»

## Pedido del dueño
«MIRA ESE ERROR»: al enviar la plantilla `bayolcell_seguimiento_consulta` a ToNnY (referido de Moca a Servicio al Cliente Santiago) salió «Zernio todavia no reconoce esta conversacion».

## Diagnóstico
- El hilo de destino se crea en el CRM al referir, pero en Zernio esa línea nunca habló con el cliente: no existe conversación ahí.
- `whatsapp-enviar` mandaba la plantilla a `POST /v1/inbox/conversations/{id}/messages`, que exige una conversación existente.
- Zernio tiene otra ruta para el primer mensaje: `POST /v1/inbox/conversations` con `accountId`, `participantId` (+1809…), `templateName`, `templateLanguage` y `templateParams`. Crea la conversación y devuelve `data.conversationId`.

## Cambio
- `supabase/functions/whatsapp-enviar/index.ts` → **v22** (ya desplegada en Supabase Bayol).
  - Si el hilo tiene teléfono real (10 dígitos o más, no `bsid:`) y la plantilla no lleva imagen de cabecera, se envía por la ruta de crear conversación.
  - Si el hilo no tenía `zernio_conversation_id`, se guarda el que devuelve Zernio.
  - Plantillas con imagen o hilos sin teléfono siguen por la ruta anterior, con su reintento.
- No cambia el envío de texto normal ni el CRM.

## Pruebas
- Desplegada como versión 22. Falta que el dueño reintente «Enviar plantilla» con ToNnY.

## Riesgos / pendientes
- Si Zernio responde error, el mensaje se muestra igual que antes y no se guarda nada.
