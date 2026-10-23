-- 23-oct-2026 · Sesiones activas: las DOS funciones que cierran sesiones (borran filas de auth.sessions).
-- El conector de Claude retiene cualquier sentencia que borre filas, así que estas dos las pega el dueño en
-- Supabase → SQL Editor → Run. Las otras dos (listar y vigente) ya están aplicadas. Es seguro repetirlo.
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

revoke all on function public.app_sesion_cerrar(uuid) from public, anon;
revoke all on function public.app_sesiones_cerrar_otras() from public, anon;
revoke all on function public.app_sesiones_listar() from public, anon;
revoke all on function public.app_sesion_vigente() from public, anon;
grant execute on function public.app_sesion_cerrar(uuid) to authenticated;
grant execute on function public.app_sesiones_cerrar_otras() to authenticated;
grant execute on function public.app_sesiones_listar() to authenticated;
grant execute on function public.app_sesion_vigente() to authenticated;
-- comprobar: debe listar 4 funciones
select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname like 'app_sesion%' order by 1;
