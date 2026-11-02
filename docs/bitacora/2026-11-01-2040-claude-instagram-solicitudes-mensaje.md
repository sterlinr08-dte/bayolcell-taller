# Instagram: carpeta «Solicitudes de mensaje» y el CRM (2-nov-2026, consulta)

**Pregunta del dueño:** los DM que caen en «Solicitudes» en la app de Instagram, ¿cómo se ven en el CRM? Hay conversaciones que se pierden.

## Lo confirmado (docs.zernio.com/platforms/instagram/inbox, 2-nov-2026)
- Meta **no separa** la carpeta de solicitudes para Instagram: `GET /v1/inbox/conversations?folder=requests` responde `400 PLATFORM_LIMITATION` en todas las cuentas de Instagram (sí funciona para páginas de Facebook).
- Las solicitudes **sí llegan** por webhook como `message.received` normales cuando la persona escribe. El CRM las guarda como cualquier chat, **sin marca** de que eran solicitud.
- Las solicitudes **ocultas** (filtradas por Instagram) no las entrega Meta a nadie.
- El webhook trae `message.sender.instagramProfile.isFollower` (null = desconocido, nunca «no sigue»): sirve para marcar «No sigue» en el chat.
- Nota de Zernio: cuentas conectadas antes de agosto 2026 necesitan refrescar el registro del webhook. La de Bayol (`bayolcell`, Principal) se conectó el **12-sep-2026**: no aplica.
- Nuestro código (`instagram-webhook`, `instagram-importar-historial`, `_shared/inbox-common.ts`) no distingue carpetas ni `isFollower`.

## Prueba acordada con el dueño
DM «prueba solicitud 1102» desde una cuenta que no sigue a @bayolcell; se verifica en `social_webhook_eventos` / `instagram_hilos` si entra y cómo.

## Opciones propuestas (sin ejecutar)
1. Etiqueta «No sigue» en el chat (usando `isFollower`).
2. Filtro «Solicitudes» en la lista de Instagram.
3. Resincronización automática desde Zernio para Facebook e Instagram (opción A de la auditoría del CRM).
