-- 22-oct-2026 · «Eliminar para todos» en el chat de WhatsApp (dueño). Ya aplicada en producción.
-- Estado nuevo 'eliminado' en whatsapp_mensajes: lo pone la Edge whatsapp-mensaje-eliminar (desde el CRM) o el
-- webhook con el evento message.deleted (borrado desde la app del teléfono). La fila no se borra: el texto queda
-- en meta.eliminado para auditoría y el CRM muestra «Este mensaje fue eliminado».
alter table public.whatsapp_mensajes drop constraint whatsapp_mensajes_estado_check;
alter table public.whatsapp_mensajes add constraint whatsapp_mensajes_estado_check
  check (estado = any (array['enviado'::text, 'entregado'::text, 'leido'::text, 'fallido'::text, 'recibido'::text, 'eliminado'::text]));

-- 'eliminado' manda sobre entregado/leído: un «leído» tardío no lo revive.
create or replace function public.wa_rango_estado(p text) returns integer
language sql immutable set search_path = public as $$
  select case p when 'enviado' then 10 when 'fallido' then 15 when 'entregado' then 20 when 'leido' then 30 when 'eliminado' then 40 else 0 end
$$;

create or replace function public.wa_aplicar_estado(p_wamid text, p_estado text, p_error text default null)
returns text language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid;
  v_actual text;
begin
  if p_wamid is null or p_estado is null or p_estado not in ('entregado', 'leido', 'fallido', 'eliminado') then
    return 'ignorado';
  end if;
  perform pg_advisory_xact_lock(hashtext('wa_estado:' || p_wamid));
  select id, estado into v_id, v_actual from public.whatsapp_mensajes where wa_message_id = p_wamid for update;
  if found then
    if v_actual is distinct from 'recibido' and wa_rango_estado(p_estado) > wa_rango_estado(v_actual) then
      update public.whatsapp_mensajes
         set estado = p_estado,
             error_detalle = case when p_estado = 'fallido' then coalesce(p_error, error_detalle) else error_detalle end
       where id = v_id;
      return 'aplicado';
    end if;
    return 'sin_cambio';
  end if;
  insert into public.whatsapp_estados_pendientes (wa_message_id, estado, error_detalle)
  values (p_wamid, p_estado, p_error)
  on conflict (wa_message_id) do update set
    estado = case when wa_rango_estado(excluded.estado) > wa_rango_estado(whatsapp_estados_pendientes.estado)
                  then excluded.estado else whatsapp_estados_pendientes.estado end,
    error_detalle = coalesce(excluded.error_detalle, whatsapp_estados_pendientes.error_detalle),
    recibido_en = now();
  return 'pendiente';
end $$;
