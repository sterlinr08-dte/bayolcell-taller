-- Prueba del ajuste de permisos (migración 20261008000000_ajuste_permisos.sql).
--
-- Se ejecuta DESPUÉS de aplicar la migración, con psql y como dueño de la base:
--   psql "$DATABASE_URL" -f supabase/tests/prueba_ajuste_permisos.sql
-- Todo ocurre dentro de BEGIN … ROLLBACK: crea usuarios y registros de
-- prueba, simula cada sesión y al final deshace todo. No deja rastro.
-- Resultado esperado: todas las filas de la tabla final con ok = true.

begin;

-- Resultados ---------------------------------------------------------------
create temp table _res (
  n serial, prueba text, esperado text, obtenido text, ok boolean
) on commit drop;
grant all on table pg_temp._res to authenticated, anon;
grant all on sequence pg_temp._res_n_seq to authenticated, anon;

-- Ejecuta una sentencia con el rol/sesión actual y anota el resultado.
--   p_debe_pasar: true si debe aplicarse (al menos 1 fila), false si debe bloquearse.
--   p_error: si se indica, la prueba pasa solo si falla con un mensaje que lo contenga.
create function pg_temp._t(p_prueba text, p_sql text, p_debe_pasar boolean, p_error text default null)
returns void language plpgsql as $$
declare v_n bigint; v_ok boolean; v_obt text;
begin
  begin
    execute p_sql;
    get diagnostics v_n = row_count;
    if v_n = 0 then
      v_obt := 'sin efecto (0 filas)';
      v_ok := (not p_debe_pasar) and p_error is null;
    else
      v_obt := 'aplicado (' || v_n || ' filas)';
      v_ok := p_debe_pasar and p_error is null;
    end if;
  exception when others then
    v_obt := 'rechazado: ' || sqlerrm;
    v_ok := case when p_error is not null then sqlerrm ilike '%' || p_error || '%'
                 else not p_debe_pasar end;
  end;
  insert into pg_temp._res (prueba, esperado, obtenido, ok)
  values (p_prueba,
          coalesce('error con «' || p_error || '»', case when p_debe_pasar then 'permitido' else 'bloqueado' end),
          v_obt, v_ok);
end $$;

-- Datos de prueba (como dueño de la base) ----------------------------------
-- Cuentas de acceso
insert into auth.users (id, aud, role, email) values
  ('00000000-0000-4000-8000-00000000a001', 'authenticated', 'authenticated', 'prueba-tecnico@prueba.invalid'),
  ('00000000-0000-4000-8000-00000000a002', 'authenticated', 'authenticated', 'prueba-validador@prueba.invalid'),
  ('00000000-0000-4000-8000-00000000a003', 'authenticated', 'authenticated', 'prueba-admin@prueba.invalid');

-- Roles: uno sin permisos y uno con permiso de validar tickets
insert into public.roles_taller (id, nombre, permisos) values
  ('00000000-0000-4000-8000-00000000b001', 'PRUEBA sin permisos', '{}'::jsonb),
  ('00000000-0000-4000-8000-00000000b002', 'PRUEBA validador', '{"validar_tickets": true}'::jsonb);

-- Técnico normal y técnico validador
insert into public.tecnicos (id, nombre, rol, tipo_empleado, activo, rol_id) values
  ('00000000-0000-4000-8000-00000000c001', 'PRUEBA Técnico', 'tecnico', 'tecnico', true, '00000000-0000-4000-8000-00000000b001'),
  ('00000000-0000-4000-8000-00000000c002', 'PRUEBA Validador', 'tecnico', 'tecnico', true, '00000000-0000-4000-8000-00000000b002');

-- Vínculos de identidad (el administrador como cuenta tipo «usuario»)
insert into public.auth_actor_bindings (auth_user_id, actor_type, actor_ref_id, activo) values
  ('00000000-0000-4000-8000-00000000a001', 'tecnico', '00000000-0000-4000-8000-00000000c001', true),
  ('00000000-0000-4000-8000-00000000a002', 'tecnico', '00000000-0000-4000-8000-00000000c002', true),
  ('00000000-0000-4000-8000-00000000a003', 'usuario', '00000000-0000-4000-8000-00000000d003', true);

-- =========================================================================
-- Sesión: TÉCNICO (beneficiario)
-- =========================================================================
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated"}', true);
set local role authenticated;

select pg_temp._t('Técnico registra su ticket por validar',
  $q$insert into public.taller_incentivos (id, tecnico_id, tecnico_nombre, ticket, monto_factura, tipo, monto_incentivo, estado)
     values ('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000c001', 'PRUEBA Técnico', 'PRUEBA-1', 1000, 'reparacion', 50, 'pendiente')$q$, true);

select pg_temp._t('Técnico registra un segundo ticket por validar',
  $q$insert into public.taller_incentivos (id, tecnico_id, tecnico_nombre, ticket, monto_factura, tipo, monto_incentivo, estado)
     values ('00000000-0000-4000-8000-00000000e003', '00000000-0000-4000-8000-00000000c001', 'PRUEBA Técnico', 'PRUEBA-8', 1000, 'pulido', 100, 'pendiente')$q$, true);

select pg_temp._t('Técnico corrige su ticket por validar (nota/monto)',
  $q$update public.taller_incentivos set nota = 'corregido', monto_incentivo = 60
     where id = '00000000-0000-4000-8000-00000000e001'$q$, true);

select pg_temp._t('Técnico registra su ticket ya «validado»',
  $q$insert into public.taller_incentivos (tecnico_id, tecnico_nombre, ticket, monto_factura, tipo, monto_incentivo, estado, sellado)
     values ('00000000-0000-4000-8000-00000000c001', 'PRUEBA Técnico', 'PRUEBA-2', 1000, 'manual', 99999, 'validado', true)$q$, false);

select pg_temp._t('Técnico registra un ticket ya «pagado»',
  $q$insert into public.taller_incentivos (tecnico_id, tecnico_nombre, ticket, monto_factura, tipo, monto_incentivo, estado, pagado_en)
     values ('00000000-0000-4000-8000-00000000c001', 'PRUEBA Técnico', 'PRUEBA-3', 1000, 'manual', 99999, 'pagado', now())$q$, false);

select pg_temp._t('Técnico registra un ticket a nombre de otro',
  $q$insert into public.taller_incentivos (tecnico_id, tecnico_nombre, ticket, monto_factura, tipo, monto_incentivo, estado)
     values ('00000000-0000-4000-8000-00000000c002', 'PRUEBA Validador', 'PRUEBA-4', 1000, 'reparacion', 50, 'pendiente')$q$, false);

select pg_temp._t('Técnico valida su propio ticket',
  $q$update public.taller_incentivos set estado = 'validado', aprobado_en = now()
     where id = '00000000-0000-4000-8000-00000000e001'$q$, false);

select pg_temp._t('Técnico sella su propio ticket',
  $q$update public.taller_incentivos set sellado = true, sellado_en = now()
     where id = '00000000-0000-4000-8000-00000000e001'$q$, false);

select pg_temp._t('Técnico marca pagado su propio ticket',
  $q$update public.taller_incentivos set estado = 'pagado', pagado_en = now()
     where id = '00000000-0000-4000-8000-00000000e001'$q$, false);

select pg_temp._t('Técnico (sin permiso) carga existencia del taller',
  $q$select public.set_taller_existencia('{"PRUEBA-ART": 1}'::jsonb)$q$, false, 'No autorizado');

select pg_temp._t('Técnico guarda un reporte de pago',
  $q$insert into public.taller_incentivo_reportes (tecnico_id, tecnico_nombre, total, cantidad)
     values ('00000000-0000-4000-8000-00000000c001', 'PRUEBA Técnico', 99999, 1)$q$, false);

reset role;

-- =========================================================================
-- Sesión: VALIDADOR (permiso validar_tickets, no administrador)
-- =========================================================================
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000a002","role":"authenticated"}', true);
set local role authenticated;

select pg_temp._t('Validador valida y sella el ticket de otro técnico',
  $q$update public.taller_incentivos
        set estado = 'validado', sellado = true, sellado_en = now(), aprobado_por = 'PRUEBA Validador', aprobado_en = now()
      where id = '00000000-0000-4000-8000-00000000e001'$q$, true);

select pg_temp._t('Validador devuelve un ticket al técnico con motivo',
  $q$update public.taller_incentivos
        set estado = 'rechazado', rechazo_motivo = 'PRUEBA falta sello', sellado = false, sellado_por = null, sellado_en = null
      where id = '00000000-0000-4000-8000-00000000e003'$q$, true);

select pg_temp._t('Validador (no admin) marca pagado un ticket',
  $q$update public.taller_incentivos set estado = 'pagado', pagado_en = now()
     where id = '00000000-0000-4000-8000-00000000e001'$q$, false);

select pg_temp._t('Validador registra su propio ticket por validar',
  $q$insert into public.taller_incentivos (id, tecnico_id, tecnico_nombre, ticket, monto_factura, tipo, monto_incentivo, estado)
     values ('00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-00000000c002', 'PRUEBA Validador', 'PRUEBA-5', 1000, 'reparacion', 50, 'pendiente')$q$, true);

select pg_temp._t('Validador valida su PROPIO ticket',
  $q$update public.taller_incentivos set estado = 'validado', sellado = true, aprobado_en = now()
     where id = '00000000-0000-4000-8000-00000000e002'$q$, false);

select pg_temp._t('Validador registra su propio ticket ya «validado»',
  $q$insert into public.taller_incentivos (tecnico_id, tecnico_nombre, ticket, monto_factura, tipo, monto_incentivo, estado, sellado)
     values ('00000000-0000-4000-8000-00000000c002', 'PRUEBA Validador', 'PRUEBA-6', 1000, 'manual', 99999, 'validado', true)$q$, false);

reset role;

-- =========================================================================
-- Sesión: TÉCNICO otra vez (su ticket ya está validado)
-- =========================================================================
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated"}', true);
set local role authenticated;

select pg_temp._t('Técnico cambia el monto de su ticket ya validado',
  $q$update public.taller_incentivos set monto_incentivo = 99999
     where id = '00000000-0000-4000-8000-00000000e001'$q$, false);

select pg_temp._t('Técnico corrige su ticket devuelto y lo reenvía (vuelve a por validar)',
  $q$update public.taller_incentivos set estado = 'pendiente', rechazo_motivo = null, nota = 'ya sellado'
     where id = '00000000-0000-4000-8000-00000000e003'$q$, true);

select pg_temp._t('Técnico cambia el motivo de devolución por su cuenta',
  $q$update public.taller_incentivos set rechazo_motivo = 'otro motivo'
     where id = '00000000-0000-4000-8000-00000000e003'$q$, false);

select pg_temp._t('Técnico borra su ticket ya validado',
  $q$delete from public.taller_incentivos where id = '00000000-0000-4000-8000-00000000e001'$q$, false);

reset role;

-- =========================================================================
-- Sesión: ADMINISTRADOR
-- =========================================================================
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000a003","role":"authenticated"}', true);
set local role authenticated;

select pg_temp._t('Administrador registra un ticket ya validado para un técnico',
  $q$insert into public.taller_incentivos (tecnico_id, tecnico_nombre, ticket, monto_factura, tipo, monto_incentivo, estado)
     values ('00000000-0000-4000-8000-00000000c001', 'PRUEBA Técnico', 'PRUEBA-7', 1000, 'reparacion', 50, 'validado')$q$, true);

select pg_temp._t('Administrador valida el ticket del validador',
  $q$update public.taller_incentivos set estado = 'validado', sellado = true, aprobado_en = now()
     where id = '00000000-0000-4000-8000-00000000e002'$q$, true);

select pg_temp._t('Administrador marca pagado un ticket validado',
  $q$update public.taller_incentivos set estado = 'pagado', pagado_en = now()
     where id = '00000000-0000-4000-8000-00000000e001'$q$, true);

select pg_temp._t('Administrador guarda un reporte de pago',
  $q$insert into public.taller_incentivo_reportes (tecnico_id, tecnico_nombre, total, cantidad)
     values ('00000000-0000-4000-8000-00000000c001', 'PRUEBA Técnico', 60, 1)$q$, true);

-- Con datos vacíos la función se detiene ANTES de tocar la existencia:
-- prueba que el administrador pasa el control de permiso sin cambiar nada.
select pg_temp._t('Administrador pasa el control de existencia (carga vacía rechazada)',
  $q$select public.set_taller_existencia('{}'::jsonb)$q$, false, 'No se recibieron');

reset role;

-- =========================================================================
-- Sesión: TÉCNICO tras el pago
-- =========================================================================
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated"}', true);
set local role authenticated;

select pg_temp._t('Técnico revierte el pago de su ticket',
  $q$update public.taller_incentivos set estado = 'validado', pagado_en = null
     where id = '00000000-0000-4000-8000-00000000e001'$q$, false);

reset role;

-- =========================================================================
-- Activación de campañas: ni anónimo ni sesión de la aplicación
-- =========================================================================
insert into pg_temp._res (prueba, esperado, obtenido, ok)
select 'Permiso de ejecución anónimo en activar campañas', 'sin permiso',
       case when has_function_privilege('anon', 'public.campanas_activar_programadas()', 'EXECUTE') then 'con permiso' else 'sin permiso' end,
       not has_function_privilege('anon', 'public.campanas_activar_programadas()', 'EXECUTE');

insert into pg_temp._res (prueba, esperado, obtenido, ok)
select 'Permiso de ejecución de sesión en activar campañas', 'sin permiso',
       case when has_function_privilege('authenticated', 'public.campanas_activar_programadas()', 'EXECUTE') then 'con permiso' else 'sin permiso' end,
       not has_function_privilege('authenticated', 'public.campanas_activar_programadas()', 'EXECUTE');

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select pg_temp._t('Anónimo ejecuta activar campañas',
  $q$select public.campanas_activar_programadas()$q$, false, 'permission denied');
reset role;

select pg_temp._t('La tarea programada del servidor (dueño de la base) sigue pudiendo activar campañas',
  $q$select public.campanas_activar_programadas()$q$, true);

-- Resultado -----------------------------------------------------------------
select n, ok, prueba, esperado, obtenido from pg_temp._res order by n;
select count(*) filter (where ok) as pasaron, count(*) filter (where not ok) as fallaron from pg_temp._res;

rollback;
