-- Apply AFTER schema.sql in a development environment. No legacy cases auto-approved.
begin;
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
 '([+]?([0-9][ ().-]*){9,})','[IDENTIFICADOR OMITIDO]','g');
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
commit;
