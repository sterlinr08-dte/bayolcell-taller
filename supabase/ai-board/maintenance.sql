-- Apply only in development alongside schema.sql. Retention is configurable.
begin;
create table public.ai_board_settings (
 singleton boolean primary key default true check(singleton),
 retention_days integer not null default 180 check(retention_days between 30 and 730)
);
insert into public.ai_board_settings default values;
alter table public.ai_board_settings enable row level security;
create policy ai_board_settings_read on public.ai_board_settings for select to authenticated using(public.app_puede_diagnostico());
revoke all on public.ai_board_settings from public,anon,authenticated;
grant select on public.ai_board_settings to authenticated;
grant all on public.ai_board_settings to service_role;

create function public.ai_board_set_retention(p_days integer) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.app_puede_diagnostico() or not public.app_is_admin() then raise exception 'Access denied' using errcode='42501'; end if;
 if p_days is null or p_days not between 30 and 730 then raise exception 'Invalid retention'; end if;
 update public.ai_board_settings set retention_days=p_days where singleton;
 return true;
end $$;
revoke all on function public.ai_board_set_retention(integer) from public,anon;
grant execute on function public.ai_board_set_retention(integer) to authenticated;

create function public.ai_board_purge_history() returns integer
language plpgsql security invoker set search_path='' as $$
declare days integer; affected integer;
begin
 select retention_days into days from public.ai_board_settings where singleton;
 if days is null then raise exception 'Retention not configured'; end if;
 -- Abandoned requests stop appearing permanently as pending after a worker failure.
 update public.ai_board_turns set status='failed',completed_at=now() where status='pending' and created_at<now()-interval '2 minutes';
 delete from public.ai_board_sessions s where greatest(s.created_at,
  coalesce((select max(t.created_at) from public.ai_board_turns t where t.session_id=s.id),s.created_at)) < now()-make_interval(days=>days);
 get diagnostics affected=row_count;return affected;
end $$;
revoke all on function public.ai_board_purge_history() from public,anon,authenticated;
grant execute on function public.ai_board_purge_history() to service_role;
commit;

-- A daily DB job is installed only when pg_cron is already enabled in this test DB.
-- Do not enable extensions or install a production job without deployment approval.
do $$ begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  execute 'select cron.schedule(''ai-board-history-retention'',''17 3 * * *'',''select public.ai_board_purge_history();'')';
 else
  raise notice 'pg_cron not enabled. Schedule ai_board_purge_history in staging before release.';
 end if;
end $$;
