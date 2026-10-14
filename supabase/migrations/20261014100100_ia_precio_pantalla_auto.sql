-- 14-oct-2026 — Capacidad «precio de pantalla» de la IA de WhatsApp con autoenvío (dueño: «que el precio se envíe solo»).
-- Interruptor por sucursal; solo cubre esta capacidad (el precio lo arma el código con Info Plus nivel 1, no la IA).
alter table public.whatsapp_ia_config add column if not exists auto_precio_pantalla boolean not null default false;
comment on column public.whatsapp_ia_config.auto_precio_pantalla is
  'Si es true, whatsapp-ia-responder envía solo el precio EXACTO de pantalla de iPhone (Info Plus nivel 1) cuando el cliente lo pregunta. Solo esta capacidad; no afecta el modo general.';
-- Un solo envío/sugerencia de precio por mensaje del cliente (reclamo antes de enviar; evita duplicados si corren dos a la vez).
create unique index if not exists whatsapp_ia_sugerencias_precio_por_mensaje
  on public.whatsapp_ia_sugerencias (mensaje_cliente_id)
  where razon = 'Precio exacto de pantalla (Info Plus, nivel 1)' and estado = 'enviada';
