-- Correccion antes de escribir el webhook: a diferencia de WhatsApp (donde
-- el telefono_e164 sirve tanto de identidad como de conversationId para
-- enviar), la doc de Zernio es explicita en que para Instagram/Facebook el
-- "conversationId" que hay que pasarle al endpoint de envio es el id de
-- thread NATIVO de la plataforma, un valor opaco distinto del participantId
-- ("do not correlate the two by equality"). Sin guardar este valor,
-- instagram-enviar no podria construir el request de envio.
alter table public.instagram_hilos add column zernio_conversation_id text;
