-- 4 oct 2026 — Automatizaciones Fase 3: preguntas en cadena (guardan datos del cliente) + etiquetas automáticas.
-- Una respuesta automática (tipo 'mensaje') puede llevar preguntas: tras la respuesta, el sistema pregunta una por una,
-- valida (cédula, teléfono, correo…), guarda las respuestas y, al terminar, manda un mensaje final, pone etiquetas al chat
-- (WhatsApp) y anota los datos en el lead del chat. Mismas reglas: solo automatizaciones activas, nunca en chat tomado.

alter table public.social_automatizaciones
  add column if not exists preguntas jsonb not null default '[]'::jsonb,     -- [{pregunta, campo}]
  add column if not exists mensaje_final text,
  add column if not exists etiquetas_auto jsonb not null default '[]'::jsonb; -- ids de whatsapp_etiquetas

alter table public.social_auto_respuestas add column if not exists paso integer;  -- respuesta a la pregunta N (null = disparo/botón)

create table if not exists public.social_auto_flujos (
  id uuid primary key default gen_random_uuid(),
  automatizacion_id uuid not null references public.social_automatizaciones(id) on delete cascade,
  canal text not null check (canal in ('whatsapp','instagram','facebook')),
  hilo_id uuid not null,
  contacto text,
  paso integer not null default 0,
  intentos integer not null default 0,
  respuestas jsonb not null default '[]'::jsonb,                 -- [{pregunta, campo, valor}]
  estado text not null default 'activo' check (estado in ('activo','completo','cancelado','vencido')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create unique index if not exists saf_un_activo on public.social_auto_flujos (canal, hilo_id) where estado = 'activo';
create index if not exists saf_hilo_idx on public.social_auto_flujos (hilo_id, creado_en desc);
create index if not exists saf_auto_idx on public.social_auto_flujos (automatizacion_id, creado_en desc);
alter table public.social_auto_flujos enable row level security;
create policy saf_select on public.social_auto_flujos for select to authenticated
  using ((select app_is_admin()) or (select app_actor_es_tecnico_activo()));
revoke insert, update, delete on public.social_auto_flujos from anon, authenticated;
grant select on public.social_auto_flujos to authenticated;
