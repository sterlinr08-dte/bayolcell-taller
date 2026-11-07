-- 07-nov-2026 · Auditoría de Contabilidad, opción C del dueño. Ver docs/bitacora/2026-11-07-*-claude-*.md
-- Ya aplicada en producción el 07-nov-2026 (con el OK del dueño «Sigue»). infoplus-ventas-sync v20 desplegada el mismo día.
-- (3) Ventas y costos de Info Plus: solo quien tiene Contabilidad (dueño, admin o permiso contabilidad_ver).
drop policy if exists infoplus_ventas_auth_read on public.infoplus_ventas;
create policy infoplus_ventas_contabilidad_read on public.infoplus_ventas
  for select to authenticated using ((select public.app_puede_contabilidad()));
-- (5) Permisos de sobra: nadie escribe en la copia desde el navegador (lo hace infoplus-ventas-sync con service_role).
revoke all on public.infoplus_ventas from anon;
revoke insert, update, delete, truncate, references, trigger on public.infoplus_ventas from authenticated;

-- (3) Las funciones que devuelven COSTO o margen exigen el mismo permiso. Se renombra la original a _base (sin acceso
-- desde el navegador) y queda una envoltura con el mismo nombre y argumentos que la revisa primero.
alter function public.estado_mensual_cat(date, date, integer) rename to _estado_mensual_cat_base;
revoke all on function public._estado_mensual_cat_base(date, date, integer) from public, anon, authenticated;
create function public.estado_mensual_cat(p_ini date, p_fin date, p_localidad integer default null::integer)
 returns table(categoria text, venta numeric, costo numeric, lineas bigint)
 language plpgsql stable security definer set search_path to 'public'
as $$ begin
  if not public.app_puede_contabilidad() then raise exception 'Sin permiso de Contabilidad' using errcode = '42501'; end if;
  return query select * from public._estado_mensual_cat_base(p_ini, p_fin, p_localidad);
end $$;
revoke all on function public.estado_mensual_cat(date, date, integer) from public, anon;
grant execute on function public.estado_mensual_cat(date, date, integer) to authenticated, service_role;

alter function public.infoplus_resumen_ventas_mensual(date, date) rename to _infoplus_resumen_ventas_mensual_base;
revoke all on function public._infoplus_resumen_ventas_mensual_base(date, date) from public, anon, authenticated;
create function public.infoplus_resumen_ventas_mensual(p_desde date default null::date, p_hasta date default null::date)
 returns table(mes text, tipo text, venta numeric, costo numeric, facturas bigint)
 language plpgsql stable security definer set search_path to 'public'
as $$ begin
  if not public.app_puede_contabilidad() then raise exception 'Sin permiso de Contabilidad' using errcode = '42501'; end if;
  return query select * from public._infoplus_resumen_ventas_mensual_base(p_desde, p_hasta);
end $$;
revoke all on function public.infoplus_resumen_ventas_mensual(date, date) from public, anon;
grant execute on function public.infoplus_resumen_ventas_mensual(date, date) to authenticated, service_role;

alter function public.stats_rentabilidad(date, date, integer) rename to _stats_rentabilidad_base;
revoke all on function public._stats_rentabilidad_base(date, date, integer) from public, anon, authenticated;
create function public.stats_rentabilidad(p_desde date, p_hasta date, p_lim integer default 25)
 returns json language plpgsql stable security definer set search_path to 'public'
as $$ begin
  if not public.app_puede_contabilidad() then raise exception 'Sin permiso de Contabilidad' using errcode = '42501'; end if;
  return public._stats_rentabilidad_base(p_desde, p_hasta, p_lim);
end $$;
revoke all on function public.stats_rentabilidad(date, date, integer) from public, anon;
grant execute on function public.stats_rentabilidad(date, date, integer) to authenticated, service_role;

-- (4) infoplus-ventas-sync: solo la llaman las tareas programadas con un token guardado en Vault (el valor nunca sale
-- de la base: lo crea gen_random_bytes y lo compara esta función, que solo puede usar service_role).
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'ventas_sync_token', 'Token de las tareas programadas que llaman a infoplus-ventas-sync (07-nov-2026)')
 where not exists (select 1 from vault.secrets where name = 'ventas_sync_token');
create or replace function public.app_token_valido(p_nombre text, p_token text) returns boolean
 language sql stable security definer set search_path to 'public', 'vault'
as $$ select coalesce(length(p_token) >= 32 and p_token = (select decrypted_secret from vault.decrypted_secrets where name = p_nombre limit 1), false) $$;
revoke all on function public.app_token_valido(text, text) from public, anon, authenticated;
grant execute on function public.app_token_valido(text, text) to service_role;
-- Las tareas 2 (cada hora) y 13 (limpieza diaria) mandan el token en la cabecera x-sync-token.
select cron.alter_job(jobid, command := regexp_replace(command,
  $re$\}'::jsonb,$re$,
  $rp$}'::jsonb || jsonb_build_object('x-sync-token', (select decrypted_secret from vault.decrypted_secrets where name = 'ventas_sync_token')),$rp$))
 from cron.job where jobname in ('infoplus-ventas-sync-hora', 'infoplus-ventas-limpieza-40d') and command not like '%x-sync-token%';
