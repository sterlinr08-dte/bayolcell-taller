-- 4 oct 2026 — Automatizaciones estilo ManyChat, Fase 1: «Comentario → privado» (Instagram/Facebook).
-- Cuando alguien comenta una palabra clave en una publicación elegida (o en cualquiera), le llega un mensaje
-- privado automático (y opcionalmente una respuesta pública). Una vez por persona y publicación.
-- Decisión del dueño: cada automatización nace APAGADA y solo envía si un administrador la activa.
-- No responde comentarios anteriores a la activación (activado_en) y no actúa si el chat de esa persona ya está
-- tomado por un empleado. Lo envía el motor `social-automatizaciones` (cron cada 2 min).

create table if not exists public.social_automatizaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  plataforma text not null check (plataforma in ('instagram','facebook')),
  post_id text,                      -- null = cualquier publicación reciente
  post_texto text, post_imagen text, post_enlace text,
  palabras text[] not null default '{}',
  coincidencia text not null default 'contiene' check (coincidencia in ('contiene','exacta','cualquiera')),
  mensaje_privado text not null,
  respuesta_publica text,
  activo boolean not null default false,
  activado_en timestamptz,
  ultima_revision timestamptz,
  ultimo_error text,
  enviados_count integer not null default 0,
  creado_por text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.social_automatizacion_envios (
  id uuid primary key default gen_random_uuid(),
  automatizacion_id uuid not null references public.social_automatizaciones(id) on delete cascade,
  plataforma text not null,
  post_id text not null,
  comentario_id text not null,
  autor_clave text not null,
  autor_nombre text,
  texto text,
  estado text not null default 'enviando' check (estado in ('enviando','ok','error','omitido_tomado')),
  publico_ok boolean,
  error text,
  creado_en timestamptz not null default now()
);
create unique index if not exists sae_comentario_uq on public.social_automatizacion_envios (automatizacion_id, comentario_id);
create unique index if not exists sae_persona_post_uq on public.social_automatizacion_envios (automatizacion_id, post_id, autor_clave);
create index if not exists sae_auto_fecha_idx on public.social_automatizacion_envios (automatizacion_id, creado_en desc);

alter table public.social_automatizaciones enable row level security;
alter table public.social_automatizacion_envios enable row level security;

create policy sa_select on public.social_automatizaciones for select to authenticated
  using ((select app_is_admin()) or (select app_actor_es_tecnico_activo()));
create policy sa_admin_ins on public.social_automatizaciones for insert to authenticated with check ((select app_is_admin()));
create policy sa_admin_upd on public.social_automatizaciones for update to authenticated
  using ((select app_is_admin())) with check ((select app_is_admin()));
create policy sa_admin_del on public.social_automatizaciones for delete to authenticated using ((select app_is_admin()));

create policy sae_select on public.social_automatizacion_envios for select to authenticated
  using ((select app_is_admin()) or (select app_actor_es_tecnico_activo()));
revoke insert, update, delete on public.social_automatizacion_envios from anon, authenticated;
grant select on public.social_automatizacion_envios to authenticated;
grant select, insert, update, delete on public.social_automatizaciones to authenticated;

-- Al activar se marca la hora: solo se responden comentarios posteriores (no se le escribe a gente vieja).
create or replace function public.social_automatizaciones_marcar_activacion()
returns trigger language plpgsql as $$
begin
  if new.activo and (tg_op = 'INSERT' or not coalesce(old.activo, false)) then new.activado_en := now(); end if;
  new.actualizado_en := now();
  return new;
end $$;
create or replace trigger social_automatizaciones_activacion before insert or update on public.social_automatizaciones
  for each row execute function public.social_automatizaciones_marcar_activacion();

-- Token del cron (vault). El motor lo valida con esta función, que solo puede llamar service_role.
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'social_auto_token') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'social_auto_token');
  end if;
end $$;
create or replace function public.social_auto_token_valido(p_token text)
returns boolean language sql security definer set search_path = public, vault as $$
  select coalesce(p_token, '') <> '' and exists (select 1 from vault.decrypted_secrets where name = 'social_auto_token' and decrypted_secret = p_token);
$$;
revoke all on function public.social_auto_token_valido(text) from public, anon, authenticated;
grant execute on function public.social_auto_token_valido(text) to service_role;

create or replace function public.social_automatizacion_sumar(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.social_automatizaciones set enviados_count = enviados_count + 1 where id = p_id;
$$;
revoke all on function public.social_automatizacion_sumar(uuid) from public, anon, authenticated;
grant execute on function public.social_automatizacion_sumar(uuid) to service_role;

-- Cron (aplicado aparte con cron.schedule, job 'social-automatizaciones-cada-2min'): cada 2 min llama al motor con
-- x-auto-token (vault) SOLO si existe alguna automatización activa.
