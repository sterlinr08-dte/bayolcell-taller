-- Agente de IA (Claude Haiku 4.5) para responder WhatsApp: preguntas simples
-- (horario, direccion, disponibilidad) se responden directo; cotizaciones de
-- precio y cualquier cosa incierta se redactan como sugerencia para que un
-- tecnico la revise y mande manualmente -- nunca se auto-envia un precio.

create table public.whatsapp_ia_config (
  sucursal_id uuid primary key references public.sucursales(id),
  horario text,
  direccion text,
  notas_adicionales text,
  activo boolean not null default false,
  actualizado_en timestamptz not null default now()
);

create table public.whatsapp_ia_sugerencias (
  id uuid primary key default gen_random_uuid(),
  hilo_id uuid not null references public.whatsapp_hilos(id) on delete cascade,
  mensaje_cliente_id uuid references public.whatsapp_mensajes(id),
  texto_sugerido text not null,
  razon text,
  estado text not null default 'pendiente' check (estado in ('pendiente','enviada','descartada')),
  creado_en timestamptz not null default now(),
  resuelto_por_tipo text,
  resuelto_por_id uuid,
  resuelto_en timestamptz
);

create index whatsapp_ia_sugerencias_hilo_idx on public.whatsapp_ia_sugerencias (hilo_id);
create index whatsapp_ia_sugerencias_pendientes_idx on public.whatsapp_ia_sugerencias (hilo_id) where estado = 'pendiente';

alter table public.whatsapp_ia_config enable row level security;
alter table public.whatsapp_ia_sugerencias enable row level security;

-- Configuracion: solo admin la edita (define el horario/direccion que el
-- agente le repite a clientes reales); lectura abierta a autenticados para
-- que el frontend pueda mostrar el estado activo/inactivo por sucursal.
create policy "whatsapp_ia_config_select" on public.whatsapp_ia_config for select to authenticated using (true);
create policy "whatsapp_ia_config_write_admin" on public.whatsapp_ia_config for all to authenticated
  using (public.app_is_admin()) with check (public.app_is_admin());

-- Sugerencias: mismo patron de sucursal-scoping que instagram_hilos (no
-- repetir el RLS abierto de whatsapp_hilos en tablas nuevas).
create policy "whatsapp_ia_sugerencias_scoped" on public.whatsapp_ia_sugerencias for all to authenticated
  using (public.app_is_admin() or exists (
    select 1 from public.whatsapp_hilos h where h.id = whatsapp_ia_sugerencias.hilo_id
      and h.sucursal_id = public.app_actor_sucursal_id()
  ))
  with check (public.app_is_admin() or exists (
    select 1 from public.whatsapp_hilos h where h.id = whatsapp_ia_sugerencias.hilo_id
      and h.sucursal_id = public.app_actor_sucursal_id()
  ));
