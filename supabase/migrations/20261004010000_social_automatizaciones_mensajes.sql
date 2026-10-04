-- 4 oct 2026 — Automatizaciones estilo ManyChat, Fase 2: «Palabra clave en el chat → respuesta automática con botones»
-- (WhatsApp, Instagram y Facebook). Misma tabla social_automatizaciones con tipo='mensaje'.
-- Igual que la Fase 1: nace APAGADA, solo responde la que un administrador active, nunca en un chat tomado por un
-- empleado, y solo a mensajes que llegan DESPUÉS de activarla. Cada botón puede llevar su propia respuesta: cuando el
-- cliente lo toca (llega el texto del botón) se le contesta eso (solo si ese chat recibió antes esa automatización).
-- El disparo es un trigger AFTER INSERT de mensajes entrantes que llama al motor con pg_net (solo si hay alguna activa).

alter table public.social_automatizaciones drop constraint if exists social_automatizaciones_plataforma_check;
alter table public.social_automatizaciones add constraint social_automatizaciones_plataforma_check
  check (plataforma in ('instagram','facebook','whatsapp'));
alter table public.social_automatizaciones
  add column if not exists tipo text not null default 'comentario',
  add column if not exists linea_id uuid references public.whatsapp_lineas(id) on delete set null,
  add column if not exists botones jsonb not null default '[]'::jsonb,
  add column if not exists enfriamiento_horas integer not null default 24;
alter table public.social_automatizaciones drop constraint if exists social_automatizaciones_tipo_check;
alter table public.social_automatizaciones add constraint social_automatizaciones_tipo_check
  check (tipo in ('comentario','mensaje') and (tipo = 'mensaje' or plataforma <> 'whatsapp'));

create table if not exists public.social_auto_respuestas (
  id uuid primary key default gen_random_uuid(),
  automatizacion_id uuid not null references public.social_automatizaciones(id) on delete cascade,
  canal text not null check (canal in ('whatsapp','instagram','facebook')),
  hilo_id uuid not null,
  mensaje_id uuid not null,
  boton text,
  contacto text,
  texto text,
  estado text not null default 'enviando' check (estado in ('enviando','ok','error','omitido_tomado')),
  error text,
  creado_en timestamptz not null default now()
);
create unique index if not exists sar_mensaje_uq on public.social_auto_respuestas (mensaje_id);
create index if not exists sar_auto_hilo_idx on public.social_auto_respuestas (automatizacion_id, hilo_id, creado_en desc);
alter table public.social_auto_respuestas enable row level security;
create policy sar_select on public.social_auto_respuestas for select to authenticated
  using ((select app_is_admin()) or (select app_actor_es_tecnico_activo()));
revoke insert, update, delete on public.social_auto_respuestas from anon, authenticated;
grant select on public.social_auto_respuestas to authenticated;

-- Disparo: mensaje entrante → motor (solo si hay automatizaciones de mensaje activas para ese canal).
create or replace function public.social_auto_disparar_mensaje()
returns trigger language plpgsql security definer set search_path = public, vault, net as $$
declare canal text := tg_argv[0];
begin
  if new.direccion <> 'in' then return new; end if;
  if not exists (select 1 from public.social_automatizaciones where activo and tipo = 'mensaje' and plataforma = canal) then
    return new;
  end if;
  perform net.http_post(
    url := 'https://vkhwdvjtowrhkhqavnvk.supabase.co/functions/v1/social-automatizaciones',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHdkdmp0b3dyaGtocWF2bnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzIwMzUsImV4cCI6MjA5NDkwODAzNX0.t1Vb8peJbT_9F7S3UajxvqklVl3fLm8nytZT02UIzPI',
      'x-auto-token', (select decrypted_secret from vault.decrypted_secrets where name = 'social_auto_token')),
    body := jsonb_build_object('accion', 'mensaje', 'canal', canal, 'mensaje_id', new.id),
    timeout_milliseconds := 30000);
  return new;
exception when others then
  -- Nunca bloquear el guardado del mensaje por un fallo del disparo.
  return new;
end $$;
revoke all on function public.social_auto_disparar_mensaje() from public, anon, authenticated;

create or replace trigger social_auto_mensaje_wa after insert on public.whatsapp_mensajes
  for each row when (new.direccion = 'in') execute function public.social_auto_disparar_mensaje('whatsapp');
create or replace trigger social_auto_mensaje_ig after insert on public.instagram_mensajes
  for each row when (new.direccion = 'in') execute function public.social_auto_disparar_mensaje('instagram');
create or replace trigger social_auto_mensaje_fb after insert on public.social_mensajes
  for each row when (new.direccion = 'in') execute function public.social_auto_disparar_mensaje('facebook');

-- Una respuesta AUTOMÁTICA no marca el chat como leído (el empleado debe seguir viendo que el cliente escribió).
create or replace function public.whatsapp_cerrar_pendiente_al_responder()
returns trigger language plpgsql set search_path = '' as $f$
begin
  update public.whatsapp_hilos
     set ultimo_mensaje_at = greatest(coalesce(ultimo_mensaje_at, new.creado_en), new.creado_en),
         ultimo_mensaje_preview = case
           when new.creado_en >= coalesce(ultimo_mensaje_at, '-infinity'::timestamptz)
             then coalesce(nullif(new.cuerpo, ''), '[' || new.tipo_contenido || ']')
           else ultimo_mensaje_preview
         end,
         no_leidos_count = case
           when coalesce(new.es_automatico, false) then no_leidos_count
           when ultimo_inbound_at is null or new.creado_en >= ultimo_inbound_at then 0
           else no_leidos_count
         end,
         ultima_respuesta_humana_at = case
           when coalesce(new.es_automatico, false) then ultima_respuesta_humana_at
           else greatest(coalesce(ultima_respuesta_humana_at, new.creado_en), new.creado_en)
         end,
         actualizado_en = now()
   where id = new.hilo_id;
  return new;
end;
$f$;
