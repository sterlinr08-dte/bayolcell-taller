-- 3 oct 2026 — «Transferir cliente» entre empleados (pedido del dueño: «que los empleados se pasen clientes y le
-- puedan escribir», sin que el cliente tenga que volver a escribir a otro número).
-- Transferir = asignar el chat a otro empleado + nota + aviso. El que lo recibe lo ve y le escribe desde el MISMO
-- número del chat aunque sea de otra sucursal (antes la RLS «whatsapp_solo_sucursal» y whatsapp-enviar se lo
-- impedían). Ese permiso extra es SOLO para los chats asignados a él.

-- 1) ¿El chat está asignado a quien está conectado?
create or replace function public.app_actor_es_asignado(p_tipo text, p_id uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select p_id is not null and exists (select 1 from public.app_actor_identity() a where a.actor_type = p_tipo and a.actor_ref_id = p_id)
$$;
revoke all on function public.app_actor_es_asignado(text, uuid) from public, anon;
grant execute on function public.app_actor_es_asignado(text, uuid) to authenticated;

-- 2) RLS: mismas reglas de antes + «o el chat está asignado a mí» (subconsultas cacheadas una vez por consulta).
alter policy app_authenticated_all on public.whatsapp_hilos
  using ((select app_is_admin()) or ((select app_actor_es_tecnico_activo()) and (
          (not (select app_actor_tiene_permiso('whatsapp_solo_sucursal'::text)))
          or sucursal_id = (select app_actor_sucursal_id())
          or (asignado_id = (select actor_ref_id from app_actor_identity()) and asignado_tipo = (select actor_type from app_actor_identity())))))
  with check ((select app_is_admin()) or ((select app_actor_es_tecnico_activo()) and (
          (not (select app_actor_tiene_permiso('whatsapp_solo_sucursal'::text)))
          or sucursal_id = (select app_actor_sucursal_id())
          or (asignado_id = (select actor_ref_id from app_actor_identity()) and asignado_tipo = (select actor_type from app_actor_identity())))));
alter policy app_authenticated_all on public.whatsapp_mensajes
  using ((select app_is_admin()) or ((select app_actor_es_tecnico_activo()) and (
          (not (select app_actor_tiene_permiso('whatsapp_solo_sucursal'::text)))
          or exists (select 1 from public.whatsapp_hilos h where h.id = whatsapp_mensajes.hilo_id
                     and (h.sucursal_id = (select app_actor_sucursal_id()) or (h.asignado_id = (select actor_ref_id from app_actor_identity()) and h.asignado_tipo = (select actor_type from app_actor_identity())))))))
  with check ((select app_is_admin()) or ((select app_actor_es_tecnico_activo()) and (
          (not (select app_actor_tiene_permiso('whatsapp_solo_sucursal'::text)))
          or exists (select 1 from public.whatsapp_hilos h where h.id = whatsapp_mensajes.hilo_id
                     and (h.sucursal_id = (select app_actor_sucursal_id()) or (h.asignado_id = (select actor_ref_id from app_actor_identity()) and h.asignado_tipo = (select actor_type from app_actor_identity())))))));

-- 3) Historial de transferencias (quién, a quién, nota, cuándo, visto).
create table if not exists public.whatsapp_transferencias (
  id uuid primary key default gen_random_uuid(),
  hilo_id uuid not null references public.whatsapp_hilos(id) on delete cascade,
  de_tipo text, de_id uuid, de_nombre text,
  a_tipo text not null default 'tecnico', a_id uuid not null,
  nota text,
  creado_en timestamptz not null default now(),
  visto_en timestamptz
);
create index if not exists whatsapp_transferencias_a_idx on public.whatsapp_transferencias (a_id, visto_en, creado_en desc);
create index if not exists whatsapp_transferencias_hilo_idx on public.whatsapp_transferencias (hilo_id, creado_en desc);
alter table public.whatsapp_transferencias enable row level security;
create policy wt_select on public.whatsapp_transferencias for select to authenticated
  using ((select app_is_admin()) or app_actor_es_asignado(a_tipo, a_id) or app_actor_es_asignado(de_tipo, de_id));
-- Escritura solo por las funciones de abajo.
revoke insert, update, delete on public.whatsapp_transferencias from anon, authenticated;
grant select on public.whatsapp_transferencias to authenticated;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'whatsapp_transferencias') then
    alter publication supabase_realtime add table public.whatsapp_transferencias;
  end if;
end $$;

-- 4) Empleados a los que se puede transferir (solo nombre y sucursal).
create or replace function public.whatsapp_empleados_directorio()
returns table (id uuid, nombre text, sucursal_nombre text)
language sql stable security definer set search_path = public as $$
  select t.id, t.nombre::text, s.nombre::text
  from public.tecnicos t left join public.sucursales s on s.id = t.sucursal_id
  where coalesce(t.activo, true) and ((select app_is_admin()) or (select app_actor_es_tecnico_activo()))
  order by s.nombre nulls last, t.nombre
$$;
revoke all on function public.whatsapp_empleados_directorio() from public, anon;
grant execute on function public.whatsapp_empleados_directorio() to authenticated;

-- 5) Transferir: quien lo hace tiene que poder ver el chat; el destino tiene que ser un empleado activo.
create or replace function public.whatsapp_transferir_hilo(p_hilo uuid, p_a uuid, p_nota text default null)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare yo_t text; yo_id uuid; h record; dest record; nom text;
begin
  select actor_type, actor_ref_id into yo_t, yo_id from public.app_actor_identity();
  if yo_t is null then raise exception 'sin_sesion'; end if;
  select id, sucursal_id, asignado_tipo, asignado_id into h from public.whatsapp_hilos where id = p_hilo;
  if h.id is null then raise exception 'chat_no_encontrado'; end if;
  if not (app_is_admin() or (app_actor_es_tecnico_activo() and (
          not app_actor_tiene_permiso('whatsapp_solo_sucursal') or h.sucursal_id = app_actor_sucursal_id()
          or app_actor_es_asignado(h.asignado_tipo, h.asignado_id)))) then
    raise exception 'sin_permiso';
  end if;
  select id, nombre into dest from public.tecnicos where id = p_a and coalesce(activo, true);
  if dest.id is null then raise exception 'empleado_no_valido'; end if;
  if yo_t = 'tecnico' then select nombre into nom from public.tecnicos where id = yo_id; else nom := 'Administrador'; end if;
  update public.whatsapp_hilos set asignado_tipo = 'tecnico', asignado_id = p_a, actualizado_en = now() where id = p_hilo;
  insert into public.whatsapp_transferencias (hilo_id, de_tipo, de_id, de_nombre, a_tipo, a_id, nota)
  values (p_hilo, yo_t, yo_id, nom, 'tecnico', p_a, nullif(left(trim(coalesce(p_nota, '')), 500), ''));
  return jsonb_build_object('ok', true, 'a_nombre', dest.nombre);
end $$;
revoke all on function public.whatsapp_transferir_hilo(uuid, uuid, text) from public, anon;
grant execute on function public.whatsapp_transferir_hilo(uuid, uuid, text) to authenticated;

-- 6) Mis transferencias recibidas (últimos 7 días) con lo necesario para abrir el chat.
create or replace function public.whatsapp_mis_transferencias()
returns table (id uuid, hilo_id uuid, linea_id uuid, linea_nombre text, sucursal_nombre text, cliente text, telefono text,
               de_nombre text, nota text, creado_en timestamptz, visto_en timestamptz, sigue_asignado boolean)
language sql stable security definer set search_path = public, auth as $$
  select t.id, t.hilo_id, h.linea_id, l.nombre::text, s.nombre::text, coalesce(h.nombre_perfil, h.telefono_e164)::text, h.telefono_e164::text,
         t.de_nombre, t.nota, t.creado_en, t.visto_en, (h.asignado_tipo = t.a_tipo and h.asignado_id = t.a_id)
  from public.whatsapp_transferencias t
  join public.whatsapp_hilos h on h.id = t.hilo_id
  left join public.whatsapp_lineas l on l.id = h.linea_id
  left join public.sucursales s on s.id = l.sucursal_id
  where app_actor_es_asignado(t.a_tipo, t.a_id) and t.creado_en > now() - interval '7 days'
  order by (t.visto_en is null) desc, t.creado_en desc
  limit 50
$$;
revoke all on function public.whatsapp_mis_transferencias() from public, anon;
grant execute on function public.whatsapp_mis_transferencias() to authenticated;

create or replace function public.whatsapp_transferencia_vista(p_id uuid)
returns void language sql security definer set search_path = public, auth as $$
  update public.whatsapp_transferencias set visto_en = now()
  where id = p_id and visto_en is null and app_actor_es_asignado(a_tipo, a_id)
$$;
revoke all on function public.whatsapp_transferencia_vista(uuid) from public, anon;
grant execute on function public.whatsapp_transferencia_vista(uuid) to authenticated;
