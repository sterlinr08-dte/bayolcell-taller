-- CRM WhatsApp como WhatsApp Web/Business: fijar, silenciar y etiquetas por conversación. Aplicada 2 oct 2026 (por pasos, con lock_timeout).
set lock_timeout = '8s';
alter table public.whatsapp_hilos
  add column if not exists fijado_en timestamptz,
  add column if not exists silenciado boolean not null default false,
  add column if not exists etiquetas jsonb not null default '[]'::jsonb;

create table if not exists public.whatsapp_etiquetas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  color text not null default '#25d366',
  orden int not null default 0,
  creado_en timestamptz not null default now()
);
alter table public.whatsapp_etiquetas enable row level security;
create policy whatsapp_etiquetas_leer on public.whatsapp_etiquetas for select to authenticated
  using ((select app_is_admin()) or (select app_actor_es_tecnico_activo()));
create policy whatsapp_etiquetas_admin on public.whatsapp_etiquetas for all to authenticated
  using ((select app_is_admin())) with check ((select app_is_admin()));
insert into public.whatsapp_etiquetas (nombre, color, orden) values
  ('Nuevo cliente','#25d366',1),('Cotización enviada','#53bdeb',2),('Pago pendiente','#ffbc38',3),
  ('Pagado','#00a884',4),('En reparación','#7f66ff',5),('Listo para entregar','#ff7a59',6);
