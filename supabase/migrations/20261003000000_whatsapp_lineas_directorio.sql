-- 3 oct 2026: directorio de lineas de WhatsApp para «Contactos de sucursales» del CRM (aplicada en vkhwdvjtowrhkhqavnvk).
-- Solo lectura y solo datos publicos (nombre de la linea, numero, sucursal). Lo puede usar cualquier
-- empleado activo, aunque tenga «whatsapp_solo_sucursal» (que limita qué chats ve, no qué número compartir).
create or replace function public.whatsapp_lineas_directorio()
returns table (id uuid, nombre text, whatsapp_numero text, sucursal_nombre text)
language sql stable security definer set search_path = public as $$
  select l.id, l.nombre::text, l.whatsapp_numero::text, s.nombre::text
  from public.whatsapp_lineas l left join public.sucursales s on s.id = l.sucursal_id
  where l.activo and l.whatsapp_numero is not null
    and ((select app_is_admin()) or (select app_actor_es_tecnico_activo()))
  order by s.nombre, l.nombre
$$;
revoke all on function public.whatsapp_lineas_directorio() from public, anon;
grant execute on function public.whatsapp_lineas_directorio() to authenticated;
