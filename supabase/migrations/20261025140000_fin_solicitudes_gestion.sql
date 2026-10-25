-- 25-oct-2026 · Solicitudes: responsable y próxima gestión (maqueta aprobada; dueño: el responsable es quien envió el formulario).
-- Solo agrega columnas, una función de gestión, una lista de responsables y un disparador. No borra nada.

alter table public.fin_solicitudes_whatsapp
  add column if not exists responsable_tipo text,
  add column if not exists responsable_id uuid,
  add column if not exists responsable_nombre text,
  add column if not exists proxima_gestion_en timestamptz,
  add column if not exists proxima_accion text;

create index if not exists fin_solicitudes_whatsapp_prox_idx on public.fin_solicitudes_whatsapp (proxima_gestion_en) where proxima_gestion_en is not null;

-- Al crearse: el responsable es quien la envió. Al llegar la respuesta del cliente: toca pasarla al banco hoy.
create or replace function public.fin_solicitud_defaults() returns trigger language plpgsql set search_path to 'public' as $$
begin
  if tg_op = 'INSERT' and new.responsable_id is null and new.enviado_por_id is not null then
    new.responsable_tipo := new.enviado_por_tipo; new.responsable_id := new.enviado_por_id; new.responsable_nombre := new.enviado_por_nombre;
  end if;
  if tg_op = 'UPDATE' and old.estado = 'enviado' and new.estado = 'respondido' and new.proxima_gestion_en is null then
    new.proxima_gestion_en := now(); new.proxima_accion := coalesce(new.proxima_accion, 'Pasar la solicitud al banco');
  end if;
  return new;
end $$;
create trigger fin_solicitud_defaults_trg before insert or update on public.fin_solicitudes_whatsapp
  for each row execute function public.fin_solicitud_defaults();

-- Las que ya existen: responsable = quien la envió; las abiertas se atienden hoy.
update public.fin_solicitudes_whatsapp set responsable_tipo = enviado_por_tipo, responsable_id = enviado_por_id, responsable_nombre = enviado_por_nombre
 where responsable_id is null and enviado_por_id is not null;
update public.fin_solicitudes_whatsapp set proxima_gestion_en = now(), proxima_accion = 'Pasar la solicitud al banco'
 where proxima_gestion_en is null and estado = 'respondido' and seguimiento in ('recibida','banco','aprobada');

-- Quién puede ser responsable: empleados activos con permiso de financiamiento (de esa sucursal) y cuentas de usuario activas.
create or replace function public.fin_solicitud_responsables(p_sucursal uuid default null)
returns table(tipo text, id uuid, nombre text) language sql stable security definer set search_path to 'public' as $$
  select 'tecnico'::text, te.id, te.nombre from public.tecnicos te left join public.roles_taller r on r.id = te.rol_id
   where coalesce(te.activo, true) and (p_sucursal is null or te.sucursal_id = p_sucursal)
     and (coalesce(te.tipo_empleado,'') = 'admin' or coalesce(te.rol,'') = 'admin'
          or coalesce(((coalesce(r.permisos,'{}'::jsonb) || coalesce(te.permisos_extra,'{}'::jsonb)) ->> 'financiamientos_crear')::boolean, false)
          or coalesce(((coalesce(r.permisos,'{}'::jsonb) || coalesce(te.permisos_extra,'{}'::jsonb)) ->> 'financiamientos_ver')::boolean, false)
          or coalesce(((coalesce(r.permisos,'{}'::jsonb) || coalesce(te.permisos_extra,'{}'::jsonb)) ->> 'financiamientos_aprobar')::boolean, false))
     and (public.app_is_admin() or public.app_actor_es_tecnico_activo())
  union all
  select 'usuario'::text, u.id, u.nombre from public.usuarios u
   where coalesce(u.activo, true) and (public.app_is_admin() or public.app_actor_es_tecnico_activo())
  order by 3;
$$;
revoke all on function public.fin_solicitud_responsables(uuid) from public, anon;
grant execute on function public.fin_solicitud_responsables(uuid) to authenticated;

-- Guardar una gestión: responsable, cuándo y qué toca, y una nota de lo que pasó. Queda en el historial.
create or replace function public.fin_solicitud_gestion(p_id uuid, p_responsable_tipo text, p_responsable_id uuid, p_proxima timestamptz, p_accion text, p_nota text default null)
returns public.fin_solicitudes_whatsapp language plpgsql security definer set search_path to 'public' as $$
declare r public.fin_solicitudes_whatsapp; t text; rid uuid; quien text; rnom text; nota text := nullif(left(trim(coalesce(p_nota,'')),300),''); acc text := nullif(left(trim(coalesce(p_accion,'')),80),'');
begin
  select * into r from public.fin_solicitudes_whatsapp where id = p_id for update;
  if not found or not public.fin_solicitud_visible(r.sucursal_id, r.enviado_por_id) then
    raise exception 'No tiene permiso para esta solicitud.' using errcode = '42501'; end if;
  if r.estado <> 'respondido' then raise exception 'El cliente todavía no ha llenado esta solicitud.' using errcode = '22023'; end if;
  if r.seguimiento in ('no_aprobada','entregada','cancelada') then raise exception 'Esta solicitud ya está cerrada.' using errcode = '22023'; end if;
  if p_responsable_tipo not in ('tecnico','usuario') or p_responsable_id is null then raise exception 'Elija el responsable.' using errcode = '22023'; end if;
  if p_proxima is null then raise exception 'Elija cuándo es la próxima gestión.' using errcode = '22023'; end if;
  if p_responsable_tipo = 'tecnico' then select nombre into rnom from public.tecnicos where id = p_responsable_id and coalesce(activo,true);
  else select nombre into rnom from public.usuarios where id = p_responsable_id and coalesce(activo,true); end if;
  if rnom is null then raise exception 'Ese responsable no está activo.' using errcode = '22023'; end if;
  select actor_type, actor_ref_id into t, rid from public.app_actor_identity();
  if t = 'tecnico' and rid is not null then select nombre into quien from public.tecnicos where id = rid; end if;
  if t = 'usuario' and rid is not null then select nombre into quien from public.usuarios where id = rid; end if;
  quien := coalesce(nullif(trim(quien),''), 'Empleado');
  update public.fin_solicitudes_whatsapp set
    responsable_tipo = p_responsable_tipo, responsable_id = p_responsable_id, responsable_nombre = rnom,
    proxima_gestion_en = p_proxima, proxima_accion = coalesce(acc, 'Llamar al cliente'),
    seguimiento_historial = coalesce(seguimiento_historial,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'paso', 'gestion', 'en', now(), 'por', quien, 'actor_id', rid,
      'responsable', rnom, 'responsable_antes', r.responsable_nombre, 'proxima', p_proxima, 'accion', coalesce(acc, 'Llamar al cliente'), 'nota', nota))
  where id = p_id returning * into r;
  return r;
end $$;
revoke all on function public.fin_solicitud_gestion(uuid, text, uuid, timestamptz, text, text) from public, anon;
grant execute on function public.fin_solicitud_gestion(uuid, text, uuid, timestamptz, text, text) to authenticated;

-- La función de pasos (de 20261025120000) ahora también propone la próxima gestión.
create or replace function public.fin_solicitud_seguimiento(p_id uuid, p_seguimiento text, p_nota text default null)
returns public.fin_solicitudes_whatsapp language plpgsql security definer set search_path to 'public' as $$
declare r public.fin_solicitudes_whatsapp; t text; rid uuid; quien text; normal boolean; nota text := nullif(left(trim(coalesce(p_nota,'')),300),'');
begin
  if p_seguimiento not in ('recibida','banco','aprobada','no_aprobada','entregada','cancelada') then
    raise exception 'Paso de seguimiento no válido: %', p_seguimiento using errcode = '22023'; end if;
  select * into r from public.fin_solicitudes_whatsapp where id = p_id for update;
  if not found or not public.fin_solicitud_visible(r.sucursal_id, r.enviado_por_id) then
    raise exception 'No tiene permiso para esta solicitud.' using errcode = '42501'; end if;
  if r.estado <> 'respondido' then raise exception 'El cliente todavía no ha llenado esta solicitud.' using errcode = '22023'; end if;
  if r.seguimiento = p_seguimiento then return r; end if;
  normal := (r.seguimiento, p_seguimiento) in (('recibida','banco'),('banco','aprobada'),('banco','no_aprobada'),('aprobada','entregada'))
         or (p_seguimiento = 'cancelada' and r.seguimiento in ('recibida','banco','aprobada'));
  if not normal and nota is null then raise exception 'Escriba el motivo de la corrección.' using errcode = '22023'; end if;
  select actor_type, actor_ref_id into t, rid from public.app_actor_identity();
  if t = 'tecnico' and rid is not null then select nombre into quien from public.tecnicos where id = rid; end if;
  if t = 'usuario' and rid is not null then select nombre into quien from public.usuarios where id = rid; end if;
  quien := coalesce(nullif(trim(quien),''), case when public.app_is_admin() then 'Administración' else 'Empleado' end);
  update public.fin_solicitudes_whatsapp set seguimiento = p_seguimiento, seguimiento_en = now(),
    -- 25-oct: el sistema propone la próxima gestión según el paso; al cerrar, ya no hay nada pendiente.
    proxima_gestion_en = case
      when p_seguimiento in ('no_aprobada','entregada','cancelada') then null
      when p_seguimiento = 'banco' then ((date_trunc('day', now() at time zone 'America/Santo_Domingo') + interval '1 day 10 hours') at time zone 'America/Santo_Domingo')
      when p_seguimiento = 'aprobada' then now()
      else proxima_gestion_en end,
    proxima_accion = case
      when p_seguimiento in ('no_aprobada','entregada','cancelada') then null
      when p_seguimiento = 'banco' then 'Preguntar al banco'
      when p_seguimiento = 'aprobada' then 'Avisar al cliente y citarlo para retirar'
      else proxima_accion end,
    seguimiento_historial = coalesce(seguimiento_historial,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'paso', p_seguimiento, 'de', r.seguimiento, 'en', now(), 'por', quien, 'actor_id', rid, 'correccion', not normal, 'nota', nota))
  where id = p_id returning * into r;
  return r;
end $$;

