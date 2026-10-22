-- 22-oct-2026 · Respuestas rápidas del CRM de WhatsApp (dueño: «agrega la opción de poder agregar respuestas rápidas»).
-- Todos los empleados activos las ven y pueden crear; edita o borra quien la creó o un administrador. Ya aplicada.
create table if not exists public.whatsapp_respuestas_rapidas (
  id uuid primary key default gen_random_uuid(),
  atajo text not null check (length(trim(atajo)) between 1 and 40),
  texto text not null check (length(trim(texto)) between 1 and 4000),
  creado_por_tipo text, creado_por_id uuid, creado_por_nombre text,
  creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now()
);
create unique index if not exists whatsapp_respuestas_rapidas_atajo_uq on public.whatsapp_respuestas_rapidas (lower(trim(atajo)));
alter table public.whatsapp_respuestas_rapidas enable row level security;

create or replace function public.whatsapp_respuestas_rapidas_autor()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare t text; rid uuid;
begin
  select actor_type, actor_ref_id into t, rid from public.app_actor_identity();
  if tg_op = 'INSERT' then
    new.creado_por_tipo := t; new.creado_por_id := rid;
    new.creado_por_nombre := case when t = 'tecnico' then (select nombre from tecnicos where id = rid) when t = 'usuario' then 'Administrador' end;
    new.creado_en := now();
  else
    new.creado_por_tipo := old.creado_por_tipo; new.creado_por_id := old.creado_por_id;
    new.creado_por_nombre := old.creado_por_nombre; new.creado_en := old.creado_en;
  end if;
  new.atajo := lower(regexp_replace(trim(new.atajo), '^/+|\s+', '', 'g'));
  new.texto := trim(new.texto);
  new.actualizado_en := now();
  return new;
end $$;
create trigger whatsapp_respuestas_rapidas_autor before insert or update on public.whatsapp_respuestas_rapidas
  for each row execute function public.whatsapp_respuestas_rapidas_autor();
revoke execute on function public.whatsapp_respuestas_rapidas_autor() from public, anon, authenticated;

create policy rr_select on public.whatsapp_respuestas_rapidas for select to authenticated
  using ((select app_is_admin()) or (select app_actor_es_tecnico_activo()));
create policy rr_insert on public.whatsapp_respuestas_rapidas for insert to authenticated
  with check ((select app_is_admin()) or (select app_actor_es_tecnico_activo()));
create policy rr_update on public.whatsapp_respuestas_rapidas for update to authenticated
  using ((select app_is_admin()) or (creado_por_id is not null and creado_por_id = (select actor_ref_id from app_actor_identity())))
  with check ((select app_is_admin()) or (select app_actor_es_tecnico_activo()));
create policy rr_delete on public.whatsapp_respuestas_rapidas for delete to authenticated
  using ((select app_is_admin()) or (creado_por_id is not null and creado_por_id = (select actor_ref_id from app_actor_identity())));
grant select, insert, update, delete on public.whatsapp_respuestas_rapidas to authenticated;
revoke all on public.whatsapp_respuestas_rapidas from anon;
