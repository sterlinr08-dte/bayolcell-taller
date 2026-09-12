-- Bug real encontrado 12 sept 2026: el indice unico de zernio_message_id era
-- PARCIAL (WHERE zernio_message_id IS NOT NULL). Postgres no acepta un
-- indice unico parcial como destino de "ON CONFLICT (columna)" en un upsert
-- plano (sin repetir el WHERE ahi tambien, que el cliente de Supabase JS no
-- soporta) -- esto rompia tanto instagram-webhook (que guarda cada mensaje
-- entrante/saliente real con upsert+onConflict) como el importador de
-- historial nuevo. Un indice unico NORMAL (no parcial) ya permite multiples
-- NULL sin problema (semantica estandar de SQL: NULL nunca es igual a NULL
-- para unicidad) -- exactamente el mismo patron que ya usa
-- whatsapp_mensajes.wa_message_id (indice unico plano, sin WHERE), que si
-- funciona. Se reemplaza el indice parcial por uno igual de simple.
DROP INDEX IF EXISTS public.instagram_mensajes_zernio_message_id_uk;
CREATE UNIQUE INDEX instagram_mensajes_zernio_message_id_uk
  ON public.instagram_mensajes (zernio_message_id);
