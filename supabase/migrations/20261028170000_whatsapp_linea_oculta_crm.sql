-- 28-oct-2026 (dueño: «agrégalo al CRM pero no visible, porque es para enviar información desde el asistente»).
-- Línea de WhatsApp «solo para enviar» (el asistente 829-589-3292): está conectada y el sistema la usa para mandar
-- listados (despachos), pero no aparece en el selector de líneas del CRM ni en el directorio de líneas.
alter table public.whatsapp_lineas add column if not exists oculta_crm boolean not null default false;
comment on column public.whatsapp_lineas.oculta_crm is 'true = línea solo para envíos del sistema (asistente): no se muestra en el CRM ni en el directorio de líneas.';

create or replace function public.whatsapp_lineas_directorio()
returns table (id uuid, nombre text, whatsapp_numero text, sucursal_nombre text)
language sql stable security definer set search_path = public as $$
  select l.id, l.nombre::text, l.whatsapp_numero::text, s.nombre::text
  from public.whatsapp_lineas l left join public.sucursales s on s.id = l.sucursal_id
  where l.activo and l.whatsapp_numero is not null and not coalesce(l.oculta_crm, false)
    and ((select app_is_admin()) or (select app_actor_es_tecnico_activo()))
  order by s.nombre, l.nombre
$$;
