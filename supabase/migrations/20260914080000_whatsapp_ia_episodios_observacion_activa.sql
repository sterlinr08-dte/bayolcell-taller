-- "Observacion activa" (14 sept 2026, cumpliendo la Primera entrega exigida
-- de .claude/rules/agente-atencion-supervisado.md): en modo 'observacion'
-- el agente redacta un borrador POR DENTRO para cada seguimiento del
-- cliente, pero NUNCA lo muestra como sugerencia -- se guarda como un
-- "episodio" para comparar despues contra lo que el empleado realmente
-- respondio. Nunca se envia nada; es puramente para que un admin revise.
create table if not exists public.whatsapp_ia_episodios (
  id uuid primary key default gen_random_uuid(),
  hilo_id uuid not null references public.whatsapp_hilos(id) on delete cascade,
  mensaje_cliente_id uuid references public.whatsapp_mensajes(id) on delete set null,
  mensaje_cliente_texto text,
  borrador_ia text not null,
  modelo_detectado text,
  respuesta_humana text,
  respuesta_humana_mensaje_id uuid references public.whatsapp_mensajes(id) on delete set null,
  -- esperando_respuesta: se guardo el borrador, todavia no responde nadie.
  -- listo_revisar: ya llego una respuesta humana real, lista para comparar.
  -- aprobado/rechazado: un admin ya la reviso.
  estado text not null default 'esperando_respuesta'
    check (estado in ('esperando_respuesta','listo_revisar','aprobado','rechazado')),
  evaluacion text check (evaluacion in ('parecido','no_parecido')),
  nota_revisor text,
  revisado_por text,
  revisado_en timestamptz,
  creado_en timestamptz not null default now()
);
create index if not exists whatsapp_ia_episodios_hilo_idx on public.whatsapp_ia_episodios (hilo_id, estado);
create index if not exists whatsapp_ia_episodios_listos_idx on public.whatsapp_ia_episodios (creado_en) where estado = 'listo_revisar';

alter table public.whatsapp_ia_episodios enable row level security;
-- Es una herramienta de revision interna para el responsable -- solo admin
-- (a diferencia de whatsapp_ia_sugerencias, que cualquier tecnico activo ve
-- para responder). No hay razon para que un tecnico vea los episodios.
create policy whatsapp_ia_episodios_admin on public.whatsapp_ia_episodios
  for all to authenticated
  using (app_is_admin())
  with check (app_is_admin());

-- Cuando llega una respuesta humana real (direccion='out', no automatica)
-- en un hilo con episodios esperando, los cierra para revision. No
-- distingue A CUAL pregunta responde exactamente (aproximacion v1) -- cierra
-- TODOS los que estaban esperando en ese hilo con la misma respuesta.
create or replace function public.whatsapp_episodio_capturar_respuesta_humana()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.direccion = 'out' and coalesce(NEW.es_automatico, false) = false then
    update public.whatsapp_ia_episodios
    set respuesta_humana = NEW.cuerpo,
        respuesta_humana_mensaje_id = NEW.id,
        estado = 'listo_revisar'
    where hilo_id = NEW.hilo_id and estado = 'esperando_respuesta';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_whatsapp_episodio_capturar_respuesta on public.whatsapp_mensajes;
create trigger trg_whatsapp_episodio_capturar_respuesta
  after insert on public.whatsapp_mensajes
  for each row execute function public.whatsapp_episodio_capturar_respuesta_humana();
