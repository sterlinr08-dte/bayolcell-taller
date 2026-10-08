-- Ajuste de permisos (8 oct 2026).
--
-- Afina en el servidor quién puede hacer ciertas operaciones que hasta
-- ahora solo controlaba la pantalla. No cambia datos existentes.
--
--  1. Incentivos de técnicos: cada técnico registra y corrige SUS tickets
--     mientras están por validar; validar, sellar y pagar queda para el
--     administrador o quien tenga el permiso «validar_tickets», y nunca
--     sobre un incentivo propio. Pagar (o revertir un pago) solo el
--     administrador. Los reportes de pago solo los escribe el administrador.
--  2. Carga manual de existencia del taller: exige administrador o el
--     permiso «catalogo_articulos» (el mismo que muestra ese botón) y no
--     acepta una carga vacía.
--  3. Activación de campañas programadas: solo la ejecuta la tarea
--     programada del servidor.
--
-- Se aplica como una sola migración (la herramienta la envuelve en una transacción).

-- ---------------------------------------------------------------------
-- Ayudante: id del técnico que está usando la sesión (null si no es técnico)
-- ---------------------------------------------------------------------
create or replace function public.app_actor_tecnico_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select i.actor_ref_id
  from public.app_actor_identity() i
  where i.actor_type = 'tecnico'
  limit 1
$$;

revoke all on function public.app_actor_tecnico_id() from public, anon;
grant execute on function public.app_actor_tecnico_id() to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 1. taller_incentivos — políticas por operación
-- ---------------------------------------------------------------------
drop policy if exists app_authenticated_all on public.taller_incentivos;
drop policy if exists taller_incentivos_select on public.taller_incentivos;
drop policy if exists taller_incentivos_insert on public.taller_incentivos;
drop policy if exists taller_incentivos_update on public.taller_incentivos;
drop policy if exists taller_incentivos_delete on public.taller_incentivos;

-- Leer: igual que antes (administrador o personal activo).
create policy taller_incentivos_select on public.taller_incentivos
  for select to authenticated
  using ((select public.app_is_admin()) or (select public.app_actor_es_tecnico_activo()));

-- Registrar: el administrador, o el técnico activo para sí mismo.
-- (El estado inicial lo controla el disparador de abajo.)
create policy taller_incentivos_insert on public.taller_incentivos
  for insert to authenticated
  with check (
    (select public.app_is_admin())
    or (
      (select public.app_actor_es_tecnico_activo())
      and tecnico_id = (select public.app_actor_tecnico_id())
    )
  );

-- Modificar: administrador, quien valida tickets, o el propio técnico
-- solo mientras su registro está por validar o devuelto.
create policy taller_incentivos_update on public.taller_incentivos
  for update to authenticated
  using (
    (select public.app_is_admin())
    or (select public.app_actor_tiene_permiso('validar_tickets'))
    or (
      (select public.app_actor_es_tecnico_activo())
      and tecnico_id = (select public.app_actor_tecnico_id())
      and estado in ('pendiente', 'rechazado')
    )
  )
  with check (
    (select public.app_is_admin())
    or (select public.app_actor_tiene_permiso('validar_tickets'))
    or (
      (select public.app_actor_es_tecnico_activo())
      and tecnico_id = (select public.app_actor_tecnico_id())
    )
  );

-- Borrar: administrador, o el propio técnico mientras está por validar o devuelto.
create policy taller_incentivos_delete on public.taller_incentivos
  for delete to authenticated
  using (
    (select public.app_is_admin())
    or (
      (select public.app_actor_es_tecnico_activo())
      and tecnico_id = (select public.app_actor_tecnico_id())
      and estado in ('pendiente', 'rechazado')
    )
  );

-- Disparador: controla los campos de validación y pago, que las políticas
-- de fila no pueden distinguir por columna.
create or replace function public.taller_incentivos_control_cambios()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_admin     boolean;
  v_validador boolean;
  v_yo        uuid;
  v_propio    boolean;
  v_puede     boolean;  -- puede validar/sellar este registro
  v_paga      boolean;  -- puede pagar este registro
begin
  -- Procesos internos del servidor (tareas programadas, mantenimiento)
  -- no pasan por este control; solo las sesiones de la aplicación.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  v_admin     := coalesce(public.app_is_admin(), false);
  v_validador := v_admin or coalesce(public.app_actor_tiene_permiso('validar_tickets'), false);
  v_yo        := public.app_actor_tecnico_id();
  v_propio    := v_yo is not null
                 and (v_yo = new.tecnico_id or (tg_op = 'UPDATE' and v_yo = old.tecnico_id));
  v_puede     := v_validador and not v_propio;
  v_paga      := v_admin and not v_propio;

  if tg_op = 'INSERT' then
    if not v_puede then
      if new.estado is distinct from 'pendiente'
         or coalesce(new.sellado, false)
         or new.sellado_por is not null or new.sellado_en is not null
         or new.aprobado_por is not null or new.aprobado_en is not null
         or new.pagado_en is not null or new.rechazo_motivo is not null then
        raise exception 'No autorizado: el registro debe quedar por validar.'
          using errcode = '42501';
      end if;
    end if;
    if (new.estado = 'pagado' or new.pagado_en is not null) and not v_paga then
      raise exception 'No autorizado: solo el administrador registra pagos.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- UPDATE
  if (new.estado = 'pagado') is distinct from (old.estado = 'pagado')
     or new.pagado_en is distinct from old.pagado_en
     or (old.estado = 'pagado' and not v_admin) then
    if not v_paga then
      raise exception 'No autorizado: solo el administrador maneja pagos.'
        using errcode = '42501';
    end if;
  end if;

  if not v_puede then
    if old.estado not in ('pendiente', 'rechazado') then
      raise exception 'No autorizado: el registro ya fue validado.'
        using errcode = '42501';
    end if;
    if new.tecnico_id is distinct from old.tecnico_id then
      raise exception 'No autorizado: no se puede cambiar el técnico.'
        using errcode = '42501';
    end if;
    if new.estado is distinct from old.estado
       and not (old.estado = 'rechazado' and new.estado = 'pendiente') then
      raise exception 'No autorizado: no se puede cambiar el estado.'
        using errcode = '42501';
    end if;
    if new.sellado is distinct from old.sellado
       or new.sellado_por is distinct from old.sellado_por
       or new.sellado_en is distinct from old.sellado_en
       or new.aprobado_por is distinct from old.aprobado_por
       or new.aprobado_en is distinct from old.aprobado_en then
      raise exception 'No autorizado: validar o sellar corresponde a otra persona.'
        using errcode = '42501';
    end if;
    if new.rechazo_motivo is distinct from old.rechazo_motivo and new.rechazo_motivo is not null then
      raise exception 'No autorizado: no se puede cambiar el motivo de devolución.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists taller_incentivos_control_cambios on public.taller_incentivos;
create trigger taller_incentivos_control_cambios
  before insert or update on public.taller_incentivos
  for each row execute function public.taller_incentivos_control_cambios();

-- ---------------------------------------------------------------------
-- 1b. taller_incentivo_reportes — leer igual que antes; escribir solo admin
-- ---------------------------------------------------------------------
drop policy if exists app_authenticated_all on public.taller_incentivo_reportes;
drop policy if exists taller_incentivo_reportes_select on public.taller_incentivo_reportes;
drop policy if exists taller_incentivo_reportes_admin on public.taller_incentivo_reportes;

create policy taller_incentivo_reportes_select on public.taller_incentivo_reportes
  for select to authenticated
  using ((select public.app_is_admin()) or (select public.app_actor_es_tecnico_activo()));

create policy taller_incentivo_reportes_admin on public.taller_incentivo_reportes
  for all to authenticated
  using ((select public.app_is_admin()))
  with check ((select public.app_is_admin()));

-- ---------------------------------------------------------------------
-- 2. Carga manual de existencia del taller
-- ---------------------------------------------------------------------
create or replace function public.set_taller_existencia(datos jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare n integer;
begin
  if auth.uid() is null then raise exception 'No autorizado'; end if;
  if not (coalesce(public.app_is_admin(), false)
          or coalesce(public.app_actor_tiene_permiso('catalogo_articulos'), false)) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if datos is null or jsonb_typeof(datos) <> 'object' or datos = '{}'::jsonb then
    raise exception 'No se recibieron artículos para cargar.';
  end if;
  -- Todo a 0; luego se ponen las cantidades reales del taller
  update public.infoplus_articulos set existencia = 0 where existencia <> 0;
  update public.infoplus_articulos i
     set existencia = floor((d.value)::numeric)::int, actualizado_en = now()
    from jsonb_each_text(datos) d
   where i.codigo = d.key;
  get diagnostics n = row_count;
  return n;
end$function$;

revoke all on function public.set_taller_existencia(jsonb) from public, anon;
grant execute on function public.set_taller_existencia(jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. Activación de campañas programadas: solo tarea del servidor
-- ---------------------------------------------------------------------
alter function public.campanas_activar_programadas() set search_path = public;
revoke all on function public.campanas_activar_programadas() from public, anon, authenticated;
grant execute on function public.campanas_activar_programadas() to service_role;
