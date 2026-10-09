-- Existing shared technical-photo catalog: keep diagnostic RLS, restrict client grants.
-- No table changes or data deletion. TRUNCATE bypasses row-level security.
begin;
revoke all on public.placas_mapas,public.placas_puntos from public,anon,authenticated;
grant select,insert,update,delete on public.placas_mapas,public.placas_puntos to authenticated;
grant all on public.placas_mapas,public.placas_puntos to service_role;
commit;
