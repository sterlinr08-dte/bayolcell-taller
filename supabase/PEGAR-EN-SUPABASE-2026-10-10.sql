-- ============================================================================================
-- PEGAR EN SUPABASE (10 oct 2026) — proyecto BayolCell-taller (vkhwdvjtowrhkhqavnvk)
-- Panel de Supabase → SQL Editor → New query → pegar TODO este archivo → Run.
-- Por qué a mano: la herramienta que usa Claude pide una confirmación extra cuando hay
-- «drop policy» o «delete», y esa confirmación no llega desde el chat. Es seguro correrlo
-- más de una vez (usa «if exists»).
-- Hace dos cosas:
--   1) Fotos de placas: todos los autorizados las VEN; solo el autor o un admin edita/borra.
--   2) Limpieza automática del historial del chat de IA (conversaciones de más de 180 días).
-- ============================================================================================
--
--
begin;

drop policy if exists placas_mapas_acc on public.placas_mapas;
drop policy if exists placas_mapas_leer on public.placas_mapas;
create policy placas_mapas_leer on public.placas_mapas for select to authenticated
  using (public.app_puede_diagnostico());
drop policy if exists placas_mapas_crear on public.placas_mapas;
create policy placas_mapas_crear on public.placas_mapas for insert to authenticated
  with check (public.app_puede_diagnostico() and creado_por = (select auth.uid())::text);
drop policy if exists placas_mapas_editar on public.placas_mapas;
create policy placas_mapas_editar on public.placas_mapas for update to authenticated
  using (public.app_puede_diagnostico() and (creado_por = (select auth.uid())::text or public.app_is_admin()))
  with check (public.app_puede_diagnostico() and (creado_por = (select auth.uid())::text or public.app_is_admin()));
drop policy if exists placas_mapas_borrar on public.placas_mapas;
create policy placas_mapas_borrar on public.placas_mapas for delete to authenticated
  using (public.app_puede_diagnostico() and (creado_por = (select auth.uid())::text or public.app_is_admin()));

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='placas_puntos' loop
    execute format('drop policy %I on public.placas_puntos', p.policyname);
  end loop;
end $$;
-- Puntos marcados (Buscador de cortos, 10 oct 2026): es conocimiento COMPARTIDO del taller.
-- Todos los técnicos con Diagnóstico ven, marcan y corrigen las líneas; borrar solo el autor o un admin.
drop policy if exists placas_puntos_leer on public.placas_puntos;
create policy placas_puntos_leer on public.placas_puntos for select to authenticated
  using (public.app_puede_diagnostico());
drop policy if exists placas_puntos_crear on public.placas_puntos;
create policy placas_puntos_crear on public.placas_puntos for insert to authenticated
  with check (public.app_puede_diagnostico() and creado_por = (select auth.uid())::text);
drop policy if exists placas_puntos_editar on public.placas_puntos;
create policy placas_puntos_editar on public.placas_puntos for update to authenticated
  using (public.app_puede_diagnostico()) with check (public.app_puede_diagnostico());
drop policy if exists placas_puntos_borrar on public.placas_puntos;
create policy placas_puntos_borrar on public.placas_puntos for delete to authenticated
  using (public.app_puede_diagnostico() and (creado_por = (select auth.uid())::text or public.app_is_admin()));

drop policy if exists placas_obj_select on storage.objects;
drop policy if exists placas_obj_insert on storage.objects;
drop policy if exists placas_obj_update on storage.objects;
drop policy if exists placas_obj_delete on storage.objects;
drop policy if exists placas_obj_leer on storage.objects;
create policy placas_obj_leer on storage.objects for select to authenticated
  using (bucket_id = 'placas' and public.app_puede_diagnostico());
drop policy if exists placas_obj_subir on storage.objects;
create policy placas_obj_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'placas' and public.app_puede_diagnostico()
    and (storage.foldername(name))[1] = 'ai-board'
    and (storage.foldername(name))[2] = (select auth.uid())::text);
drop policy if exists placas_obj_editar on storage.objects;
create policy placas_obj_editar on storage.objects for update to authenticated
  using (bucket_id = 'placas' and public.app_puede_diagnostico()
    and ((storage.foldername(name))[2] = (select auth.uid())::text or public.app_is_admin()))
  with check (bucket_id = 'placas' and public.app_puede_diagnostico()
    and ((storage.foldername(name))[2] = (select auth.uid())::text or public.app_is_admin()));
drop policy if exists placas_obj_borrar on storage.objects;
create policy placas_obj_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'placas' and public.app_puede_diagnostico()
    and ((storage.foldername(name))[2] = (select auth.uid())::text or public.app_is_admin()));

commit;

-- 2) Limpieza del historial del chat de IA
create or replace function public.ai_board_purge_history() returns integer
language plpgsql security invoker set search_path='' as $$
declare days integer; affected integer;
begin
 select retention_days into days from public.ai_board_settings where singleton;
 if days is null then raise exception 'Retention not configured'; end if;
 update public.ai_board_turns set status='failed',completed_at=now() where status='pending' and created_at<now()-interval '2 minutes';
 delete from public.ai_board_sessions s where greatest(s.created_at,
  coalesce((select max(t.created_at) from public.ai_board_turns t where t.session_id=s.id),s.created_at)) < now()-make_interval(days=>days);
 get diagnostics affected=row_count;return affected;
end $$;
revoke all on function public.ai_board_purge_history() from public,anon,authenticated;
grant execute on function public.ai_board_purge_history() to service_role;
select cron.unschedule(jobid) from cron.job where jobname='ai-board-history-retention';
select cron.schedule('ai-board-history-retention','17 3 * * *','select public.ai_board_purge_history();');
