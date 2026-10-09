-- Experimental AI BOARD schema. Apply ONLY to an isolated test database.
-- Audited against BayolCell-taller schema on 2026-10-09. Not a production migration.
begin;
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
  context jsonb not null default '{}' check (jsonb_typeof(context)='object' and octet_length(context::text)<=3000),
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
  if p_context is null or jsonb_typeof(p_context)<>'object' or octet_length(p_context::text)>3000
    or exists(select 1 from jsonb_object_keys(p_context) k where k not in ('bateria','consumo','sintomas')) then raise exception 'Invalid context'; end if;
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

create function public.ai_board_cases() returns table(id uuid, modelo text, orden_id uuid)
language sql stable security invoker set search_path='' as $$
  select d.id,d.modelo,d.orden_id from public.diagnosticos d
  where public.ai_board_can_case(d.id) and d.modelo like 'iPhone %'
  order by d.created_at desc,d.id desc limit 50;
$$;
revoke all on function public.ai_board_cases() from public, anon;
grant execute on function public.ai_board_cases() to authenticated;

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
commit;
