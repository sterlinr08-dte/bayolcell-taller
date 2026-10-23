-- 23-oct-2026 · Sesiones activas (dueño: «Bayol Cell, pero por el momento sin mensaje al WhatsApp»).
-- Referencia: reel Moxen «Quién entra a tu cuenta». No crea tablas: usa auth.sessions (user_agent, ip, refreshed_at).
-- El admin (app_is_admin) ve y puede cerrar las sesiones de todos; los demás, solo las suyas.

create or replace function public.app_sesiones_listar()
returns table (
  id uuid, auth_user_id uuid, nombre text, tipo text, user_agent text, ip text,
  creada_en timestamptz, vista_en timestamptz, es_actual boolean, es_mia boolean
)
language sql stable security definer set search_path = public, auth as $$
  select s.id, s.user_id,
    coalesce(t.nombre, u.nombre, u.usuario, split_part(au.email, '@', 1)) as nombre,
    coalesce(au.raw_user_meta_data->>'tipo', 'tecnico') as tipo,
    s.user_agent, host(s.ip) as ip, s.created_at, coalesce(s.refreshed_at, s.updated_at, s.created_at) as vista_en,
    (s.id::text = (auth.jwt()->>'session_id')) as es_actual,
    (s.user_id = auth.uid()) as es_mia
  from auth.sessions s
  join auth.users au on au.id = s.user_id
  left join public.tecnicos t on au.raw_user_meta_data->>'tipo' = 'tecnico' and t.id::text = au.raw_user_meta_data->>'ref_id'
  left join public.usuarios u on au.raw_user_meta_data->>'tipo' = 'usuario' and u.id::text = au.raw_user_meta_data->>'ref_id'
  where auth.uid() is not null and (s.user_id = auth.uid() or public.app_is_admin())
    and (s.not_after is null or s.not_after > now())
  order by (s.id::text = (auth.jwt()->>'session_id')) desc, coalesce(s.refreshed_at, s.updated_at, s.created_at) desc
$$;

create or replace function public.app_sesion_cerrar(p_id uuid)
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare n int;
begin
  if auth.uid() is null then return false; end if;
  if p_id::text = (auth.jwt()->>'session_id') then
    raise exception 'La sesión actual se cierra con «Salir».';
  end if;
  delete from auth.sessions s where s.id = p_id and (s.user_id = auth.uid() or public.app_is_admin());
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function public.app_sesiones_cerrar_otras()
returns integer language plpgsql security definer set search_path = public, auth as $$
declare n int;
begin
  if auth.uid() is null then return 0; end if;
  delete from auth.sessions s where s.user_id = auth.uid() and s.id::text is distinct from (auth.jwt()->>'session_id');
  get diagnostics n = row_count;
  return n;
end $$;

-- ¿Sigue existiendo mi sesión? (el aparato cerrado desde otro lo consulta cada minuto y, si no, sale solo)
create or replace function public.app_sesion_vigente()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from auth.sessions s where s.id::text = (auth.jwt()->>'session_id') and s.user_id = auth.uid())
$$;

revoke all on function public.app_sesiones_listar() from public;
revoke all on function public.app_sesion_cerrar(uuid) from public;
revoke all on function public.app_sesiones_cerrar_otras() from public;
revoke all on function public.app_sesion_vigente() from public;
grant execute on function public.app_sesiones_listar() to authenticated;
grant execute on function public.app_sesion_cerrar(uuid) to authenticated;
grant execute on function public.app_sesiones_cerrar_otras() to authenticated;
grant execute on function public.app_sesion_vigente() to authenticated;
