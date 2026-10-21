-- 21-oct-2026 (dueño): «dos empleados de servicio, a uno le quiero dar un acceso que al otro no».
-- Permisos por empleado encima de los del rol: tecnicos.permisos_extra = { permiso: true (extra) | false (quitado) }.
-- Solo el administrador puede escribir tecnicos (política tecnicos_admin_update), así que nadie se da permisos solo.

alter table public.tecnicos add column if not exists permisos_extra jsonb not null default '{}'::jsonb;

comment on column public.tecnicos.permisos_extra is
  'Permisos solo de esta persona sobre los del rol: true = extra, false = quitado. Los demás salen del rol (roles_taller.permisos).';

create or replace function public.app_actor_tiene_permiso(p_permiso text)
 returns boolean
 language plpgsql
 stable security definer
 set search_path to 'public', 'auth'
as $function$
declare
  t text;
  rid uuid;
  perms jsonb;
  extra jsonb;
begin
  select actor_type, actor_ref_id into t, rid
  from public.app_actor_identity();

  if t = 'usuario' then
    return true;
  end if;

  if t = 'tecnico' and rid is not null then
    select r.permisos, te.permisos_extra into perms, extra
    from public.tecnicos te
    left join public.roles_taller r on r.id = te.rol_id
    where te.id = rid
      and coalesce(te.activo, true) = true
    limit 1;

    if perms is null and coalesce(extra, '{}'::jsonb) = '{}'::jsonb then return false; end if;
    -- lo de la persona pisa lo del rol (un false quita, un true agrega)
    perms := coalesce(perms, '{}'::jsonb) || coalesce(extra, '{}'::jsonb);
    return coalesce((perms ->> p_permiso)::boolean, false);
  end if;

  return false;
exception when others then
  return false;
end;
$function$;
