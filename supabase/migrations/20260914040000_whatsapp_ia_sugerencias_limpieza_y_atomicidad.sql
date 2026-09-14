-- URGENTE: se encontraron 268 sugerencias en estado 'pendiente', TODAS del
-- 4 de septiembre (el dia que se apago la funcion original por el bug de
-- tarjetas duplicadas) -- hasta 12 acumuladas en un mismo hilo. Como el 14
-- de septiembre se reactivo la bandeja de sugerencias en el CRM, estas
-- iban a aparecer TODAS de golpe en cualquier chat que se abriera --
-- exactamente el bug que se habia corregido. Se marcan como 'reemplazada'
-- (no reflejan la conversacion actual, quedaron obsoletas por el apagon de
-- 10 dias) antes de que algun empleado abriera esos chats.
update public.whatsapp_ia_sugerencias
set estado = 'reemplazada', resuelto_por_tipo = 'sistema', resuelto_en = now()
where estado = 'pendiente' and creado_en < '2026-09-05';

-- Garantia atomica: nunca mas de una sugerencia 'pendiente' por hilo. El
-- codigo (UPDATE reemplazada + INSERT) ya intentaba esto, pero no es
-- atomico entre llamadas concurrentes -- y de hecho ya se habian acumulado
-- las 268 pendientes viejas de arriba. Este indice parcial hace que la
-- base de datos rechace un segundo INSERT 'pendiente' para el mismo hilo
-- si el UPDATE previo no llego a tiempo (el codigo de whatsapp-ia-responder
-- ya maneja ese choque con un UPDATE de reintento).
create unique index if not exists whatsapp_ia_sugerencias_una_pendiente_por_hilo
  on public.whatsapp_ia_sugerencias (hilo_id)
  where estado = 'pendiente';
