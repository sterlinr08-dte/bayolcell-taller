-- Contador de conversaciones sin leer para el aviso de la pestaña (taller-pestana-avisos.js), 18-oct-2026.
-- Antes, el navegador bajaba hasta 2000 filas de whatsapp_hilos, instagram_hilos y social_hilos CADA 20 s solo para
-- contarlas. Esta función devuelve solo el número, con las mismas reglas:
--   · sin leer (no_leidos_count > 0), sin archivados; en WhatsApp, sin silenciados;
--   · el admin cuenta todo; un empleado cuenta lo de su sucursal (o sin sucursal) que está asignado a él (mismo tipo)
--     o no tiene dueño.
-- SECURITY INVOKER: corre con los permisos de quien la llama, así que RLS limita las filas igual que antes.
-- Solo lectura. Reversa al final.

create or replace function public.crm_no_leidos_count(p_admin boolean, p_usuario uuid, p_tipo text, p_sucursal uuid)
returns integer language sql stable security invoker set search_path = public
as $$
  with h as (
    select asignado_id, asignado_tipo, sucursal_id from public.whatsapp_hilos
     where no_leidos_count > 0 and estado is distinct from 'archivado' and not coalesce(silenciado, false)
    union all
    select asignado_id, asignado_tipo, sucursal_id from public.instagram_hilos
     where no_leidos_count > 0 and estado is distinct from 'archivado'
    union all
    select asignado_id, asignado_tipo, sucursal_id from public.social_hilos
     where no_leidos_count > 0 and estado is distinct from 'archivado'
  )
  select count(*)::int from h
  where coalesce(p_admin, false)
     or ((p_sucursal is null or h.sucursal_id is null or h.sucursal_id = p_sucursal)
         and (h.asignado_id is null
              or (h.asignado_id = p_usuario and (coalesce(h.asignado_tipo, '') = '' or h.asignado_tipo = p_tipo))));
$$;
revoke all on function public.crm_no_leidos_count(boolean, uuid, text, uuid) from public, anon;
grant execute on function public.crm_no_leidos_count(boolean, uuid, text, uuid) to authenticated;

-- Reversa:
-- drop function if exists public.crm_no_leidos_count(boolean, uuid, text, uuid);
