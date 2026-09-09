-- Mismo problema que ya se habia resuelto para Instagram en
-- 20260904010200_instagram_hilos_agregar_conversation_id.sql, pero en WhatsApp
-- pasó desapercibido porque ahi el atajo FUNCIONA... casi siempre.
--
-- Para un contacto normal, Zernio manda conversation.platformConversationId ==
-- el telefono, asi que pasar el telefono como {conversationId} al endpoint de
-- envio resuelve bien. Pero para un contacto que llega desde un ANUNCIO, Meta
-- no revela el numero: ahi el webhook guarda `bsid:<conversation.contactId>` y
-- el envio manda ese contactId donde Zernio espera un conversationId. Son dos
-- ids distintos (confirmado en un payload real de produccion del 2026-09-09:
-- conversation.id = 6aa187d82b83d299b4767e3f vs
-- conversation.contactId = 6aa187d8c1cdc72fb1b6493b), y por eso Zernio
-- responde 404 "Conversation not found. Use the conversation id from the list
-- conversations endpoint."
--
-- Efecto en produccion, medido: el ultimo mensaje que salio del sistema hacia
-- un contacto de anuncio fue el 2026-09-04 18:12. Desde entonces fallan TODOS
-- (tanto el envio manual del CRM como el agente de IA), mientras que los
-- contactos con telefono real siguen funcionando normal.
--
-- La solucion es la misma que la de Instagram: guardar el conversationId real
-- que Zernio ya manda en cada webhook, y usarlo al enviar.

alter table public.whatsapp_hilos
  add column if not exists zernio_conversation_id text;

comment on column public.whatsapp_hilos.zernio_conversation_id is
  'conversationId real de Zernio (conversation.id del webhook). Es lo que hay que pasarle al endpoint de envio -- NO es el telefono ni el contactId. Se llena solo con cada mensaje que entra; los hilos viejos lo tendran en cuanto el cliente vuelva a escribir.';

-- Los hilos de contactos de anuncio son la minoria pero son justo los que
-- dependen de esta columna para poder responder.
create index if not exists idx_whatsapp_hilos_zernio_conversation_id
  on public.whatsapp_hilos (zernio_conversation_id)
  where zernio_conversation_id is not null;
