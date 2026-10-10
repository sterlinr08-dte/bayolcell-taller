-- AI BOARD: servidor del chat y la Biblioteca revisada (instalado en producción el 10 oct 2026 con autorización del dueño).
-- Fuente: supabase/ai-board/schema.sql + library.sql + maintenance.sql (sin begin/commit; la migración ya es una transacción).

-- ===== schema.sql =====
-- Experimental AI BOARD schema. Apply ONLY to an isolated test database.
-- Audited against BayolCell-taller schema on 2026-10-09. Not a production migration.
create table public.ai_board_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  diagnostico_id uuid not null references public.diagnosticos(id) on delete cascade,
  modelo text not null check (char_length(modelo) between 1 and 80),
  created_at timestamptz not null default now()
);
create index ai_board_sessions_owner_case on public.ai_board_sessions(owner_id, diagnostico_id, created_at desc);
create table public.ai_board_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_board_sessions(id) on delete cascade,
  request_id uuid not null,
  user_message text not null check (char_length(user_message) between 1 and 1400),
  context jsonb not null default '{}' check (jsonb_typeof(context)='object' and octet_length(context::text)<=6000),
  assistant_message text check (char_length(assistant_message) <= 12000),
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(session_id, request_id)
);
create index ai_board_turns_session_time on public.ai_board_turns(session_id, created_at, id);
create table public.ai_board_limits (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  day date not null, day_count integer not null,
  minute timestamptz not null, minute_count integer not null
);
alter table public.ai_board_sessions enable row level security;
alter table public.ai_board_turns enable row level security;
alter table public.ai_board_limits enable row level security;

-- RLS of legacy diagnosticos is broad. Add explicit ownership / current assignment.
create function public.ai_board_can_case(p_case uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
  select auth.uid() is not null and public.app_puede_diagnostico()
    and exists (
      select 1 from public.diagnosticos d, public.app_actor_identity() a
      where d.id = p_case and (
        d.creado_por = auth.uid() or d.creado_por = a.actor_ref_id
        or (a.actor_type = 'tecnico' and exists (
          select 1 from public.ordenes_reparacion o where o.id = d.orden_id
            and (o.tecnico_asignado_id = a.actor_ref_id or o.tecnico_principal_id = a.actor_ref_id)
        ))
      )
    );
$$;
revoke all on function public.ai_board_can_case(uuid) from public, anon;
grant execute on function public.ai_board_can_case(uuid) to authenticated;
create policy ai_board_sessions_read on public.ai_board_sessions for select to authenticated
  using (owner_id = (select auth.uid()) and public.ai_board_can_case(diagnostico_id));
create policy ai_board_sessions_create on public.ai_board_sessions for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.ai_board_can_case(diagnostico_id)
    and exists (select 1 from public.diagnosticos d where d.id = ai_board_sessions.diagnostico_id and d.modelo = ai_board_sessions.modelo));
create policy ai_board_sessions_delete on public.ai_board_sessions for delete to authenticated
  using (owner_id = (select auth.uid()) and public.ai_board_can_case(diagnostico_id));
create policy ai_board_turns_read on public.ai_board_turns for select to authenticated
  using (exists (select 1 from public.ai_board_sessions s where s.id = session_id));
revoke all on public.ai_board_sessions, public.ai_board_turns, public.ai_board_limits from public, anon, authenticated;
grant select, insert, delete on public.ai_board_sessions to authenticated;
grant select on public.ai_board_turns to authenticated;
grant all on public.ai_board_sessions, public.ai_board_turns, public.ai_board_limits to service_role;

-- A narrowly scoped definer RPC is necessary to create pending turns without allowing
-- clients to forge assistant replies. It checks the authenticated owner and case itself.
create function public.ai_board_reserve(p_session uuid, p_request uuid, p_message text, p_context jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.ai_board_sessions; t public.ai_board_turns; q public.ai_board_limits;
begin
  if auth.uid() is null or not public.app_puede_diagnostico() then raise exception 'Access denied' using errcode='42501'; end if;
  -- Serializes quota and requests across all sessions belonging to one user.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 108));
  select * into s from public.ai_board_sessions where id=p_session and owner_id=auth.uid() for update;
  if s.id is null or not public.ai_board_can_case(s.diagnostico_id) then raise exception 'Access denied' using errcode='42501'; end if;
  if p_request is null or p_message is null or char_length(btrim(p_message)) not between 1 and 1400 then raise exception 'Invalid message'; end if;
  if p_context is null or jsonb_typeof(p_context)<>'object' or octet_length(p_context::text)>6000
    or exists(select 1 from jsonb_object_keys(p_context) k where k not in ('bateria','consumo','sintomas','point')) then raise exception 'Invalid context'; end if;
  select * into t from public.ai_board_turns where session_id=p_session and request_id=p_request;
  if t.id is not null then
    if t.user_message <> p_message or t.context <> p_context then raise exception 'Request conflict'; end if;
    if t.status='pending' and t.created_at < now()-interval '2 minutes' then
      update public.ai_board_turns set status='failed', completed_at=now() where id=t.id;
      t.status := 'failed';
    end if;
    return jsonb_build_object('fresh',false,'turn',to_jsonb(t));
  end if;
  if exists(select 1 from public.ai_board_turns where session_id=p_session and status='pending' and created_at>now()-interval '2 minutes') then raise exception 'Turn in progress'; end if;
  insert into public.ai_board_limits values (auth.uid(),current_date,0,date_trunc('minute',now()),0)
    on conflict(owner_id) do nothing;
  select * into q from public.ai_board_limits where owner_id=auth.uid() for update;
  if q.day<>current_date then q.day_count:=0; end if;
  if q.minute<>date_trunc('minute',now()) then q.minute_count:=0; end if;
  if q.day_count>=80 or q.minute_count>=10 then raise exception 'Quota exceeded' using errcode='P0001'; end if;
  update public.ai_board_limits set day=current_date,day_count=q.day_count+1,
    minute=date_trunc('minute',now()),minute_count=q.minute_count+1 where owner_id=auth.uid();
  insert into public.ai_board_turns(session_id,request_id,user_message,context) values(p_session,p_request,p_message,p_context) returning * into t;
  return jsonb_build_object('fresh',true,'turn',to_jsonb(t));
end $$;
revoke all on function public.ai_board_reserve(uuid,uuid,text,jsonb) from public, anon;
grant execute on function public.ai_board_reserve(uuid,uuid,text,jsonb) to authenticated;

create function public.ai_board_cases(p_offset integer default 0,p_limit integer default 50) returns table(id uuid, modelo text, orden_id uuid)
language sql stable security invoker set search_path='' as $$
  select d.id,d.modelo,d.orden_id from public.diagnosticos d
  where public.ai_board_can_case(d.id) and d.modelo like 'iPhone %'
  order by d.created_at desc,d.id desc limit least(greatest(p_limit,1),50) offset greatest(p_offset,0);
$$;
revoke all on function public.ai_board_cases(integer,integer) from public, anon;
grant execute on function public.ai_board_cases(integer,integer) to authenticated;

-- Create a minimal case without sending a legacy diagnostic request to the LLM.
-- Existing order-linked cases are opened through ai_board_cases, never copied.
create function public.ai_board_create_case(p_model text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  if auth.uid() is null or not public.app_puede_diagnostico() then raise exception 'Access denied' using errcode='42501'; end if;
  if p_model is null or p_model not in ('iPhone X','iPhone XR','iPhone XS','iPhone XS Max','iPhone 11','iPhone 11 Pro','iPhone 11 Pro Max','iPhone 12','iPhone 12 mini','iPhone 12 Pro','iPhone 12 Pro Max','iPhone 13','iPhone 13 mini','iPhone 13 Pro','iPhone 13 Pro Max','iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max','iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max','iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max','iPhone 16e','iPhone 17','iPhone 17 Pro','iPhone 17 Pro Max','iPhone Air') then raise exception 'Invalid model'; end if;
  insert into public.diagnosticos(modelo,creado_por) values(p_model,auth.uid()) returning id into result;
  return result;
end $$;
revoke all on function public.ai_board_create_case(text) from public,anon;
grant execute on function public.ai_board_create_case(text) to authenticated;

-- Only the new server function may commit generated text. Row checks prevent stale
-- responses or concurrent retries from replacing an already completed response.
create function public.ai_board_finish(p_turn uuid, p_owner uuid, p_answer text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare affected integer;
begin
  update public.ai_board_turns t set status=case when p_answer is null then 'failed' else 'completed' end,
    assistant_message=p_answer,completed_at=now()
    from public.ai_board_sessions s
    where t.id=p_turn and t.session_id=s.id and s.owner_id=p_owner and t.status='pending'
      and t.created_at>now()-interval '2 minutes';
  get diagnostics affected=row_count;
  return affected=1;
end $$;
revoke all on function public.ai_board_finish(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.ai_board_finish(uuid,uuid,text) to service_role;

-- ===== library.sql =====
-- Apply AFTER schema.sql in a development environment. No legacy cases auto-approved.
create table public.ai_board_library (
  id uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null references public.diagnosticos(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  modelo text not null,
  revision text not null check(char_length(revision) between 1 and 80),
  summary text not null check(char_length(summary) between 20 and 4000),
  evidence text not null check(char_length(evidence) between 20 and 4000),
  sources jsonb not null check(jsonb_typeof(sources)='array' and jsonb_array_length(sources) between 1 and 8 and octet_length(sources::text)<=5000),
  status text not null default 'pending' check(status in ('pending','approved','rejected','withdrawn')),
  reviewer_id uuid references auth.users(id),
  review_notes text,
  created_at timestamptz not null default now(), reviewed_at timestamptz
);
create index ai_board_library_model_status_time on public.ai_board_library(modelo,status,created_at desc,id);
create table public.ai_board_library_reviews (
 id uuid primary key default gen_random_uuid(), entry_id uuid not null references public.ai_board_library(id) on delete cascade,
 reviewer_id uuid not null references auth.users(id), decision text not null, notes text not null, created_at timestamptz not null default now()
);
alter table public.ai_board_library enable row level security;
alter table public.ai_board_library_reviews enable row level security;
create policy ai_board_library_read on public.ai_board_library for select to authenticated using(
 public.app_puede_diagnostico() and (
  status='approved' or public.app_is_admin() or (author_id=(select auth.uid()) and public.ai_board_can_case(diagnostico_id))
 )
);
create policy ai_board_reviews_read on public.ai_board_library_reviews for select to authenticated
 using(public.app_puede_diagnostico() and exists(select 1 from public.ai_board_library e where e.id=entry_id));
revoke all on public.ai_board_library,public.ai_board_library_reviews from public,anon,authenticated;
grant select on public.ai_board_library,public.ai_board_library_reviews to authenticated;
grant all on public.ai_board_library,public.ai_board_library_reviews to service_role;

create function public.ai_board_minimize(p_text text) returns text language sql immutable set search_path='' as $$
 select regexp_replace(regexp_replace(regexp_replace(coalesce(p_text,''),
 '(clave|contraseña|password|pin|patrón|nombre|cliente|dirección|serial|imei)[[:space:]]*[:=][[:space:]]*[^\n,;]+','[DATO OMITIDO]','gi'),
 '[[:alnum:].+_-]{1,128}@[[:alnum:]._-]{1,128}\.[[:alpha:]]{2,20}','[CORREO OMITIDO]','gi'),
 '(?<![0-9])(?<![0-9][.])[+]?[0-9]([ ()-]*[0-9]){8,}(?![0-9])(?![.][0-9])','[IDENTIFICADOR OMITIDO]','g');
$$;
revoke all on function public.ai_board_minimize(text) from public,anon;
grant execute on function public.ai_board_minimize(text) to authenticated,service_role;

create function public.ai_board_library_submit(p_case uuid,p_revision text,p_summary text,p_evidence text,p_sources jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare model text; result uuid; item jsonb;
begin
 if auth.uid() is null or not public.ai_board_can_case(p_case) then raise exception 'Access denied' using errcode='42501'; end if;
 if p_revision is null or char_length(btrim(p_revision)) not between 1 and 80 or p_summary is null or char_length(p_summary) not between 20 and 4000 or p_evidence is null or char_length(p_evidence) not between 20 and 4000 or p_sources is null or jsonb_typeof(p_sources)<>'array' or jsonb_array_length(p_sources) not between 1 and 8 or octet_length(p_sources::text)>5000 then raise exception 'Invalid evidence'; end if;
 for item in select value from jsonb_array_elements(p_sources) loop
  if jsonb_typeof(item)<>'object' or not(item ?& array['title','url']) or jsonb_typeof(item->'title')<>'string' or char_length(item->>'title') not between 1 and 150 or jsonb_typeof(item->'url')<>'string' or (item->>'url') !~ '^https://[A-Za-z0-9.-]+(/[^[:space:]]*)?$' or char_length(item->>'url')>500
     or exists(select 1 from jsonb_object_keys(item) k where k not in ('title','url')) then raise exception 'Invalid source'; end if;
 end loop;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,109));
 if exists(select 1 from public.ai_board_library where author_id=auth.uid() and diagnostico_id=p_case and status='pending') then raise exception 'Review already pending'; end if;
 if (select count(*) from public.ai_board_library where author_id=auth.uid() and created_at>now()-interval '1 day')>=10 then raise exception 'Submission limit'; end if;
 select modelo into model from public.diagnosticos where id=p_case;
 insert into public.ai_board_library(diagnostico_id,author_id,modelo,revision,summary,evidence,sources)
 values(p_case,auth.uid(),model,btrim(p_revision),public.ai_board_minimize(p_summary),public.ai_board_minimize(p_evidence),p_sources) returning id into result;
 return result;
end $$;
revoke all on function public.ai_board_library_submit(uuid,text,text,text,jsonb) from public,anon;
grant execute on function public.ai_board_library_submit(uuid,text,text,text,jsonb) to authenticated;

create function public.ai_board_library_review(p_entry uuid,p_decision text,p_notes text) returns boolean
language plpgsql security definer set search_path='' as $$
declare entry public.ai_board_library;
begin
 if auth.uid() is null or not public.app_puede_diagnostico() then raise exception 'Access denied' using errcode='42501'; end if;
 select * into entry from public.ai_board_library where id=p_entry for update;
 if entry.id is null or p_decision is null or p_decision not in ('approved','rejected','withdrawn') or p_notes is null or char_length(btrim(p_notes)) not between 20 and 2000 then raise exception 'Invalid review'; end if;
 if p_decision='withdrawn' then
   if entry.status not in ('approved','pending') or (entry.author_id<>auth.uid() and not public.app_is_admin()) then raise exception 'Access denied' using errcode='42501'; end if;
 else
   if not public.app_is_admin() or entry.author_id=auth.uid() or entry.status<>'pending' then raise exception 'Independent reviewer required' using errcode='42501'; end if;
 end if;
 update public.ai_board_library set status=p_decision,reviewer_id=auth.uid(),review_notes=public.ai_board_minimize(p_notes),reviewed_at=now() where id=p_entry;
 insert into public.ai_board_library_reviews(entry_id,reviewer_id,decision,notes) values(p_entry,auth.uid(),p_decision,public.ai_board_minimize(p_notes));
 return true;
end $$;
revoke all on function public.ai_board_library_review(uuid,text,text) from public,anon;
grant execute on function public.ai_board_library_review(uuid,text,text) to authenticated;

-- ===== maintenance.sql =====
-- Apply only in development alongside schema.sql. Retention is configurable.
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

-- A daily DB job is installed only when pg_cron is already enabled in this test DB.
-- Do not enable extensions or install a production job without deployment approval.
do $$ begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  execute 'select cron.schedule(''ai-board-history-retention'',''17 3 * * *'',''select public.ai_board_purge_history();'')';
 else
  raise notice 'pg_cron not enabled. Schedule ai_board_purge_history in staging before release.';
 end if;
end $$;
