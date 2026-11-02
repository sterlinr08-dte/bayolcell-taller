-- 2-nov-2026 — Corrección ortográfica automática del CRM (fase 2 del plan v2).
-- Plan: docs/bitacora/2026-11-01-2345-claude-plan-correccion-ortografica-v2.md
-- NO APLICADA. Aplicar solo con autorización expresa del dueño.
-- Sin sentencias destructivas (sin drop/revoke de objetos existentes), para que la
-- herramienta de Supabase no la retenga.

-- 1) Interruptor propio, separado de whatsapp_ia_config. Una sola fila. Empieza APAGADO.
create table if not exists public.crm_ortografia_config (
  id smallint primary key default 1 check (id = 1),
  activo boolean not null default false,
  canales text[] not null default array['whatsapp', 'instagram', 'facebook']
    check (canales <@ array['whatsapp', 'instagram', 'facebook']),
  tope_diario integer not null default 300 check (tope_diario between 0 and 5000),
  techo_global integer not null default 600 check (techo_global between 0 and 20000),
  timeout_ms integer not null default 1500 check (timeout_ms between 300 and 1500),
  piloto_hilos text[] not null default '{}',   -- vacío = todos los hilos
  piloto_cuentas text[] not null default '{}', -- vacío = todas las cuentas
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  -- El techo global debe dejar sitio al tope del asistente (IA_TOPE_DIARIO = 150 en
  -- whatsapp-ia-responder) más el de ortografía: así ninguno deja sin cupo al otro.
  constraint crm_ortografia_techo_cubre_topes check (techo_global >= tope_diario + 150)
);
comment on table public.crm_ortografia_config is
  'Interruptor de la corrección ortográfica automática (whatsapp-enviar, instagram-enviar, social-enviar). '
  'activo=false o fila ausente/ilegible => se envía el texto original. Las funciones guardan la fila 30 s en memoria: '
  'apagarlo tarda como máximo 30 s en hacer efecto.';

insert into public.crm_ortografia_config (id) values (1) on conflict (id) do nothing;

alter table public.crm_ortografia_config enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'crm_ortografia_config' and policyname = 'crm_ortografia_config_admin_lee') then
    create policy crm_ortografia_config_admin_lee on public.crm_ortografia_config
      for select to authenticated using (public.app_is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'crm_ortografia_config' and policyname = 'crm_ortografia_config_admin_cambia') then
    create policy crm_ortografia_config_admin_cambia on public.crm_ortografia_config
      for update to authenticated using (public.app_is_admin()) with check (public.app_is_admin());
  end if;
end $$;
grant select, update on public.crm_ortografia_config to authenticated;

create or replace function public.crm_ortografia_config_sello()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  new.actualizado_por := auth.uid();
  return new;
end $$;
create or replace trigger crm_ortografia_config_sello
  before update on public.crm_ortografia_config
  for each row execute function public.crm_ortografia_config_sello();

-- 2) Contador diario por servicio (día de RD). Solo la clave de servicio lo toca.
create table if not exists public.ia_uso_diario_servicio (
  dia date not null,
  servicio text not null check (servicio in ('ortografia')),
  llamadas integer not null default 0,
  rechazadas integer not null default 0,
  actualizado_en timestamptz not null default now(),
  primary key (dia, servicio)
);
alter table public.ia_uso_diario_servicio enable row level security;
comment on table public.ia_uso_diario_servicio is
  'Llamadas a la IA por servicio y día de RD. El asistente de WhatsApp sigue en whatsapp_ia_uso_diario.';

-- Reserva atómica: suma 1 solo si el servicio no pasó su tope y el total del día
-- (este servicio + asistente) no pasó el techo global. Se llama ANTES de la IA.
-- El bloqueo de la fila del servicio ordena las reservas de ortografía entre sí; la
-- lectura del asistente puede quedar corta por unas pocas llamadas simultáneas.
create or replace function public.ia_reservar_cupo(p_servicio text, p_tope integer, p_techo_global integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia date := (now() at time zone 'America/Santo_Domingo')::date;
  v_asistente integer;
  v_ok integer;
begin
  if p_servicio is null or p_tope is null or p_techo_global is null or p_tope <= 0 then
    return false;
  end if;
  insert into ia_uso_diario_servicio (dia, servicio) values (v_dia, p_servicio) on conflict do nothing;
  select coalesce(max(llamadas), 0) into v_asistente from whatsapp_ia_uso_diario where dia = v_dia;
  update ia_uso_diario_servicio
     set llamadas = llamadas + 1, actualizado_en = now()
   where dia = v_dia and servicio = p_servicio
     and llamadas < p_tope
     and llamadas + v_asistente < p_techo_global
  returning llamadas into v_ok;
  if v_ok is null then
    update ia_uso_diario_servicio set rechazadas = rechazadas + 1, actualizado_en = now()
     where dia = v_dia and servicio = p_servicio;
    return false;
  end if;
  return true;
end;
$$;
revoke all on function public.ia_reservar_cupo(text, integer, integer) from public, anon, authenticated;
grant execute on function public.ia_reservar_cupo(text, integer, integer) to service_role;

-- 3) Los webhooks e importaciones reescriben el metadato completo del mensaje
--    (social-webhook y social-importar-historial lo hacen en cada evento).
--    Este trigger conserva la clave «ortografia» si la nueva versión no la trae.
create or replace function public.crm_conservar_ortografia_metadata()
returns trigger language plpgsql as $$
begin
  if jsonb_typeof(old.metadata) = 'object' and old.metadata ? 'ortografia'
     and (new.metadata is null or (jsonb_typeof(new.metadata) = 'object' and not new.metadata ? 'ortografia')) then
    new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object('ortografia', old.metadata -> 'ortografia');
  end if;
  return new;
end $$;

create or replace function public.crm_conservar_ortografia_meta()
returns trigger language plpgsql as $$
begin
  if jsonb_typeof(old.meta) = 'object' and old.meta ? 'ortografia'
     and (new.meta is null or (jsonb_typeof(new.meta) = 'object' and not new.meta ? 'ortografia')) then
    new.meta := coalesce(new.meta, '{}'::jsonb) || jsonb_build_object('ortografia', old.meta -> 'ortografia');
  end if;
  return new;
end $$;

create or replace trigger social_mensajes_conservar_ortografia
  before update of metadata on public.social_mensajes
  for each row when (old.metadata is distinct from new.metadata)
  execute function public.crm_conservar_ortografia_metadata();

create or replace trigger instagram_mensajes_conservar_ortografia
  before update of metadata on public.instagram_mensajes
  for each row when (old.metadata is distinct from new.metadata)
  execute function public.crm_conservar_ortografia_metadata();

create or replace trigger whatsapp_mensajes_conservar_ortografia
  before update of meta on public.whatsapp_mensajes
  for each row when (old.meta is distinct from new.meta)
  execute function public.crm_conservar_ortografia_meta();
