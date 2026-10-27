-- 27-oct-2026 · Dueño: app interna en el celular de los empleados (PWA) que solo prefactura y responde el CRM, con aviso
-- en el teléfono cuando entra un mensaje («Sí, con aviso»). Aquí va lo de la base para los avisos (Web Push):
--   · push_suscripciones: cada teléfono que aceptó avisos (solo se toca por las RPC de abajo; RLS sin políticas).
--   · _push_vapid: las claves VAPID; las crea la Edge push-enviar la primera vez (nunca pasan por el chat ni el repo).
--   · token en vault (push_token) para que el trigger llame a la Edge, igual que social_auto_token.
--   · trigger en whatsapp_mensajes: mensaje ENTRANTE → push-enviar. Si no hay teléfonos suscritos, no llama a nada.
-- Quién recibe el aviso (push_destinatarios): las mismas reglas con que el CRM le enseña el chat a cada persona
-- (RLS de whatsapp_hilos + filtro de asignación de la bandeja). Chat silenciado = sin aviso.
-- Sin drop/revoke (el conector no los deja pasar): las funciones de servicio comprueban auth.role() por dentro.

create table if not exists public.push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  actor_tipo text not null,
  actor_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  equipo text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  ultimo_ok timestamptz,
  ultimo_error text
);
alter table public.push_suscripciones enable row level security;
create index if not exists push_suscripciones_actor on public.push_suscripciones (actor_tipo, actor_id) where activo;

create table if not exists public._push_vapid (
  id int primary key default 1 check (id = 1),
  publica text not null,
  privada text not null,
  creado_en timestamptz not null default now()
);
alter table public._push_vapid enable row level security;

do $$ begin
  if not exists (select 1 from vault.secrets where name = 'push_token') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'push_token');
  end if;
end $$;

-- El teléfono se suscribe (o renueva su suscripción) con la persona que inició sesión.
create or replace function public.push_suscribir(p_endpoint text, p_p256dh text, p_auth text, p_equipo text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare t text; rid uuid;
begin
  select actor_type, actor_ref_id into t, rid from public.app_actor_identity();
  if t is null or rid is null then raise exception 'Sin sesión'; end if;
  if coalesce(p_endpoint, '') !~ '^https://' or length(p_endpoint) > 1000 or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    raise exception 'Suscripción no válida';
  end if;
  insert into public.push_suscripciones (actor_tipo, actor_id, endpoint, p256dh, auth, equipo, activo, ultimo_error)
  values (t, rid, p_endpoint, p_p256dh, p_auth, left(p_equipo, 160), true, null)
  on conflict (endpoint) do update set actor_tipo = excluded.actor_tipo, actor_id = excluded.actor_id, p256dh = excluded.p256dh,
    auth = excluded.auth, equipo = excluded.equipo, activo = true, ultimo_error = null;
  return true;
end $$;

create or replace function public.push_desuscribir(p_endpoint text)
returns boolean language plpgsql security definer set search_path = public as $$
declare t text; rid uuid;
begin
  select actor_type, actor_ref_id into t, rid from public.app_actor_identity();
  update public.push_suscripciones set activo = false where endpoint = p_endpoint and actor_tipo = t and actor_id = rid;
  return found;
end $$;

-- Clave pública VAPID (es pública por diseño: el navegador la necesita para suscribirse).
create or replace function public.push_clave_publica()
returns text language sql security definer set search_path = public stable as $$
  select publica from public._push_vapid where id = 1
$$;

-- Solo la Edge (service_role) valida el token del trigger.
create or replace function public.push_token_valido(p_token text)
returns boolean language plpgsql security definer set search_path = public, vault as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then return false; end if;
  return exists (select 1 from vault.decrypted_secrets where name = 'push_token' and decrypted_secret = p_token);
end $$;

-- Para un mensaje entrante: a qué teléfonos avisar y con qué texto. Solo service_role.
create or replace function public.push_destinatarios(p_mensaje_id uuid)
returns table (sus_id uuid, endpoint text, p256dh text, auth text, titulo text, cuerpo text, hilo_id uuid)
language plpgsql security definer set search_path = public stable as $$
declare m record; h record; lin text; tit text; cue text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then return; end if;
  select * into m from public.whatsapp_mensajes where id = p_mensaje_id;
  if m.id is null or m.direccion <> 'in' then return; end if;
  select * into h from public.whatsapp_hilos where id = m.hilo_id;
  if h.id is null or coalesce(h.silenciado, false) then return; end if;
  select nombre into lin from public.whatsapp_lineas where id = h.linea_id;
  tit := coalesce(nullif(trim(h.nombre_perfil), ''), h.telefono_e164, 'Cliente') || coalesce(' · ' || lin, '');
  cue := case
    when coalesce(trim(m.cuerpo), '') <> '' then left(m.cuerpo, 140)
    when m.tipo_contenido = 'image' then '📷 Foto'
    when m.tipo_contenido = 'audio' then '🎤 Nota de voz'
    when m.tipo_contenido = 'video' then '🎥 Video'
    when m.tipo_contenido = 'document' then '📄 Documento'
    when m.tipo_contenido = 'sticker' then 'Sticker'
    when m.tipo_contenido = 'location' then '📍 Ubicación'
    else 'Mensaje nuevo' end;
  return query
  select s.id, s.endpoint, s.p256dh, s.auth, tit, cue, h.id
  from public.push_suscripciones s
  left join public.tecnicos te on s.actor_tipo = 'tecnico' and te.id = s.actor_id
  left join public.roles_taller r on r.id = te.rol_id
  where s.activo
    and (
      s.actor_tipo = 'usuario'
      or (s.actor_tipo = 'tecnico' and te.id is not null and coalesce(te.activo, true) and (
        coalesce(te.tipo_empleado, '') = 'admin' or coalesce(te.rol, '') = 'admin'
        or (
          (coalesce(((coalesce(r.permisos, '{}'::jsonb) || coalesce(te.permisos_extra, '{}'::jsonb)) ->> 'whatsapp_ver')::boolean, false)
            or coalesce(((coalesce(r.permisos, '{}'::jsonb) || coalesce(te.permisos_extra, '{}'::jsonb)) ->> 'leads_ver')::boolean, false))
          and (h.asignado_id is null or (h.asignado_id = te.id and coalesce(h.asignado_tipo, 'tecnico') = 'tecnico'))
          and (not coalesce(((coalesce(r.permisos, '{}'::jsonb) || coalesce(te.permisos_extra, '{}'::jsonb)) ->> 'whatsapp_solo_sucursal')::boolean, false)
               or h.sucursal_id = te.sucursal_id or h.asignado_id = te.id)
        )
      ))
    );
end $$;

-- La Edge anota el resultado de cada envío (410/404 = el teléfono ya no existe → se desactiva).
create or replace function public.push_resultado(p_sus_id uuid, p_ok boolean, p_error text default null, p_baja boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then return; end if;
  update public.push_suscripciones
     set ultimo_ok = case when p_ok then now() else ultimo_ok end,
         ultimo_error = case when p_ok then null else left(p_error, 300) end,
         activo = case when p_baja then false else activo end
   where id = p_sus_id;
end $$;

-- Disparo: mensaje entrante → push-enviar (solo si hay al menos un teléfono suscrito).
create or replace function public.push_disparar_mensaje()
returns trigger language plpgsql security definer set search_path = public, vault, net as $$
begin
  if new.direccion <> 'in' then return new; end if;
  if not exists (select 1 from public.push_suscripciones where activo) then return new; end if;
  perform net.http_post(
    url := 'https://vkhwdvjtowrhkhqavnvk.supabase.co/functions/v1/push-enviar',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHdkdmp0b3dyaGtocWF2bnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzIwMzUsImV4cCI6MjA5NDkwODAzNX0.t1Vb8peJbT_9F7S3UajxvqklVl3fLm8nytZT02UIzPI',
      'x-push-token', (select decrypted_secret from vault.decrypted_secrets where name = 'push_token')),
    body := jsonb_build_object('mensaje_id', new.id),
    timeout_milliseconds := 15000);
  return new;
exception when others then
  return new; -- un aviso nunca debe impedir que se guarde el mensaje
end $$;

create trigger trg_push_mensaje_entrante
after insert on public.whatsapp_mensajes
for each row when (new.direccion = 'in')
execute function public.push_disparar_mensaje();
