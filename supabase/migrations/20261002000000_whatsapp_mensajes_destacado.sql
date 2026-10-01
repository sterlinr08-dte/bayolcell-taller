-- Mensajes destacados (estrella) del CRM de WhatsApp, como en WhatsApp Web. Aplicada 2 oct 2026.
alter table public.whatsapp_mensajes
  add column if not exists destacado boolean not null default false,
  add column if not exists destacado_por text,
  add column if not exists destacado_en timestamptz;
create index if not exists whatsapp_mensajes_destacados_idx on public.whatsapp_mensajes (hilo_id, creado_en desc) where destacado;
