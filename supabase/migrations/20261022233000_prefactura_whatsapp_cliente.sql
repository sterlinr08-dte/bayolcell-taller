-- 22-oct-2026 · Prefactura: envío por WhatsApp desde la línea de la sucursal + cliente guardado por su número.
-- Ya aplicada en producción con execute_sql (columnas, RPC y grant).
alter table public.recepcion_prefacturas
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null,
  add column if not exists whatsapp_enviado_en timestamptz;

-- Devuelve (o crea) el hilo de WhatsApp de un teléfono en una línea. Admin, o técnico activo de la sucursal de la línea.
create or replace function public.whatsapp_hilo_para_telefono(p_linea uuid, p_telefono text, p_cliente uuid default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_dig text := regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
  v_tel text;
  v_linea record;
  v_hilo record;
  v_id uuid;
begin
  select l.id, l.sucursal_id into v_linea from public.whatsapp_lineas l where l.id = p_linea and l.activo;
  if v_linea.id is null then return json_build_object('ok', false, 'error', 'Línea no encontrada'); end if;
  if not (coalesce((select app_is_admin()), false)
          or (coalesce((select app_actor_es_tecnico_activo()), false) and (select app_actor_sucursal_id()) = v_linea.sucursal_id)) then
    return json_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if length(v_dig) = 10 then v_dig := '1' || v_dig; end if;
  if length(v_dig) < 11 or length(v_dig) > 15 then return json_build_object('ok', false, 'error', 'Teléfono inválido'); end if;
  v_tel := '+' || v_dig;
  select h.id, h.ultimo_inbound_at into v_hilo from public.whatsapp_hilos h
   where h.linea_id = p_linea and h.telefono_e164 = v_tel order by h.ultimo_mensaje_at desc nulls last limit 1;
  if v_hilo.id is not null then
    if p_cliente is not null then update public.whatsapp_hilos set cliente_id = coalesce(cliente_id, p_cliente) where id = v_hilo.id; end if;
    return json_build_object('ok', true, 'id', v_hilo.id, 'telefono', v_tel, 'nuevo', false,
      'abierto', v_hilo.ultimo_inbound_at is not null and v_hilo.ultimo_inbound_at > now() - interval '24 hours');
  end if;
  insert into public.whatsapp_hilos (linea_id, sucursal_id, telefono_e164, cliente_id, estado, creado_en, actualizado_en)
  values (p_linea, v_linea.sucursal_id, v_tel, p_cliente, 'abierto', now(), now()) returning id into v_id;
  return json_build_object('ok', true, 'id', v_id, 'telefono', v_tel, 'nuevo', true, 'abierto', false);
end $$;
grant execute on function public.whatsapp_hilo_para_telefono(uuid, text, uuid) to authenticated;
