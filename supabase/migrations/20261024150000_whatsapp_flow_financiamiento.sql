-- 24-oct-2026 · Formulario nativo de WhatsApp (Meta Flow vía Zernio) para la solicitud de financiamiento.
-- Aplicado con el conector (create table/policy no son destructivos).
create table if not exists public.whatsapp_flows (
  id uuid primary key default gen_random_uuid(),
  linea_id uuid not null,
  nombre text not null,
  flow_id text not null,
  version integer not null default 1,
  estado text not null default 'DRAFT',
  flow_json jsonb,
  validation_errors jsonb,
  creado_en timestamptz not null default now(),
  publicado_en timestamptz,
  unique (linea_id, flow_id)
);
comment on table public.whatsapp_flows is '24-oct-2026 · Formularios nativos de WhatsApp (Meta Flows vía Zernio) por línea: id de Meta, versión y estado.';
alter table public.whatsapp_flows enable row level security;
drop policy if exists whatsapp_flows_leer on public.whatsapp_flows;
create policy whatsapp_flows_leer on public.whatsapp_flows for select to authenticated using (public.app_is_admin() or public.app_actor_es_tecnico_activo());

create table if not exists public.fin_solicitudes_whatsapp (
  id uuid primary key default gen_random_uuid(),
  hilo_id uuid, linea_id uuid, sucursal_id uuid, sucursal_nombre text, telefono text,
  mensaje_out_id uuid, flow_id text, flow_token text unique,
  enviado_por_tipo text, enviado_por_id uuid, enviado_por_nombre text,
  equipo text, precio numeric, referencia text,
  estado text not null default 'enviado',
  datos jsonb, respuesta_wa_message_id text, mensaje_in_id uuid, respondido_en timestamptz,
  procesado_en timestamptz, procesado_por text, fin_solicitud_id uuid,
  creado_en timestamptz not null default now()
);
comment on table public.fin_solicitudes_whatsapp is '24-oct-2026 · Solicitud de financiamiento enviada como formulario de WhatsApp (equipo y precio fijados por el empleado) y la respuesta del cliente. estado: enviado → respondido → procesado | descartado.';
create index if not exists fin_solicitudes_whatsapp_hilo_idx on public.fin_solicitudes_whatsapp (hilo_id, creado_en desc);
alter table public.fin_solicitudes_whatsapp enable row level security;
drop policy if exists fin_solicitudes_whatsapp_leer on public.fin_solicitudes_whatsapp;
create policy fin_solicitudes_whatsapp_leer on public.fin_solicitudes_whatsapp for select to authenticated using (public.app_is_admin() or public.app_actor_es_tecnico_activo());
drop policy if exists fin_solicitudes_whatsapp_editar on public.fin_solicitudes_whatsapp;
create policy fin_solicitudes_whatsapp_editar on public.fin_solicitudes_whatsapp for update to authenticated using (public.app_is_admin() or public.app_actor_es_tecnico_activo()) with check (public.app_is_admin() or public.app_actor_es_tecnico_activo());
