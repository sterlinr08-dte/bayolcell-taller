-- Esquema de Instagram para el CRM, siguiendo el mismo patron que WhatsApp
-- (whatsapp_lineas/whatsapp_hilos/whatsapp_mensajes) pero en tablas propias
-- -- decision tomada tras investigar la API de Zernio y auditar el codigo
-- actual: whatsapp_hilos/whatsapp_mensajes acaban de salir de una corrupcion
-- de datos real (2026-09-03/04) y no es el momento de tocarlas para
-- "generalizar". Instagram tiene ademas mecanica de negocio genuinamente
-- distinta (no puede iniciar conversacion en frio, ventana de 24h se
-- resuelve con message tags en vez de plantillas de Meta, identidad del
-- contacto es un IGSID/username, no un telefono).

create table public.instagram_cuentas (
  id uuid primary key default gen_random_uuid(),
  sucursal_id uuid not null references public.sucursales(id),
  nombre text not null default 'Principal',
  instagram_username text,
  instagram_user_id text,
  login_method text check (login_method in ('instagram_login','facebook_login')),
  zernio_account_id text,
  zernio_profile_id text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.instagram_hilos (
  id uuid primary key default gen_random_uuid(),
  sucursal_id uuid not null references public.sucursales(id),
  cuenta_id uuid references public.instagram_cuentas(id),
  participant_id text not null,
  participant_username text,
  cliente_id uuid,
  nombre_perfil text,
  ultimo_mensaje_at timestamptz,
  ultimo_inbound_at timestamptz,
  ultimo_mensaje_preview text,
  no_leidos_count integer not null default 0,
  estado text not null default 'abierto',
  asignado_tipo text,
  asignado_id uuid,
  campana_id uuid,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (sucursal_id, participant_id)
);

create table public.instagram_mensajes (
  id uuid primary key default gen_random_uuid(),
  hilo_id uuid not null references public.instagram_hilos(id) on delete cascade,
  direccion text not null check (direccion in ('in','out')),
  tipo_contenido text not null default 'text',
  cuerpo text,
  zernio_message_id text,
  estado text not null default 'enviado',
  error_detalle text,
  es_automatico boolean not null default false,
  enviado_por_tipo text,
  enviado_por_id uuid,
  media_path text,
  responde_a_id uuid references public.instagram_mensajes(id),
  metadata jsonb,
  creado_en timestamptz not null default now()
);

create unique index instagram_mensajes_zernio_message_id_uk
  on public.instagram_mensajes (zernio_message_id) where zernio_message_id is not null;

create index instagram_hilos_sucursal_idx on public.instagram_hilos (sucursal_id);
create index instagram_mensajes_hilo_idx on public.instagram_mensajes (hilo_id);

-- Helper de RLS por sucursal (aprendido del hallazgo de la auditoria de
-- whatsapp_hilos: no repetir "RLS permite todo a cualquier autenticado" en
-- tablas nuevas solo porque las viejas ya lo hacen).
create or replace function public.app_actor_sucursal_id()
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare t text; rid uuid; suc uuid;
begin
  t := auth.jwt()->'user_metadata'->>'tipo';
  begin rid := nullif(auth.jwt()->'user_metadata'->>'ref_id','')::uuid; exception when others then rid := null; end;
  if t = 'tecnico' and rid is not null then
    select sucursal_id into suc from public.tecnicos where id = rid;
    return suc;
  end if;
  return null;
end $function$;

alter table public.instagram_cuentas enable row level security;
alter table public.instagram_hilos enable row level security;
alter table public.instagram_mensajes enable row level security;

create policy "instagram_cuentas_select" on public.instagram_cuentas for select to authenticated
  using (public.app_is_admin() or sucursal_id = public.app_actor_sucursal_id());
create policy "instagram_cuentas_write_admin" on public.instagram_cuentas for all to authenticated
  using (public.app_is_admin()) with check (public.app_is_admin());

create policy "instagram_hilos_scoped" on public.instagram_hilos for all to authenticated
  using (public.app_is_admin() or sucursal_id = public.app_actor_sucursal_id())
  with check (public.app_is_admin() or sucursal_id = public.app_actor_sucursal_id());

create policy "instagram_mensajes_scoped" on public.instagram_mensajes for all to authenticated
  using (public.app_is_admin() or exists (
    select 1 from public.instagram_hilos h where h.id = instagram_mensajes.hilo_id
      and h.sucursal_id = public.app_actor_sucursal_id()
  ))
  with check (public.app_is_admin() or exists (
    select 1 from public.instagram_hilos h where h.id = instagram_mensajes.hilo_id
      and h.sucursal_id = public.app_actor_sucursal_id()
  ));
