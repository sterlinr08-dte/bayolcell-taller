-- CRM WhatsApp: vaciar o eliminar una conversación, SOLO el administrador (dueño, 30-oct-2026).
--   * crm_vaciar_hilo:   borra los mensajes del chat y lo deja vacío (el contacto, la línea, el cliente y las etiquetas siguen).
--   * crm_eliminar_hilo: borra el chat completo. Los leads y los envíos masivos que apuntaban a él se conservan (hilo_id = null).
-- Solo borra en el CRM de Bayol Cell: el WhatsApp del cliente no cambia. Si el cliente vuelve a escribir, el chat aparece de nuevo.
-- Queda constancia en public.auditoria (quién, cuándo, a quién y cuántos mensajes).

create or replace function public.crm_vaciar_hilo(p_hilo uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare h record; n int;
begin
  if not public.app_is_admin() then raise exception 'Solo el administrador puede vaciar conversaciones'; end if;
  select id, telefono_e164, nombre_perfil into h from public.whatsapp_hilos where id = p_hilo for update;
  if h.id is null then return jsonb_build_object('ok', false, 'motivo', 'no_existe'); end if;
  -- referencias a mensajes de este chat que no se borran en cascada
  update public.whatsapp_ia_episodios set mensaje_cliente_id = null where mensaje_cliente_id in (select id from public.whatsapp_mensajes where hilo_id = p_hilo);
  update public.whatsapp_ia_episodios set respuesta_humana_mensaje_id = null where respuesta_humana_mensaje_id in (select id from public.whatsapp_mensajes where hilo_id = p_hilo);
  update public.whatsapp_envio_destinatarios set mensaje_id = null where mensaje_id in (select id from public.whatsapp_mensajes where hilo_id = p_hilo);
  delete from public.whatsapp_ia_sugerencias where hilo_id = p_hilo or mensaje_cliente_id in (select id from public.whatsapp_mensajes where hilo_id = p_hilo);
  update public.whatsapp_mensajes set responde_a_id = null where responde_a_id in (select id from public.whatsapp_mensajes where hilo_id = p_hilo);
  delete from public.whatsapp_mensajes where hilo_id = p_hilo;
  get diagnostics n = row_count;
  update public.whatsapp_hilos set ultimo_mensaje_preview = null, no_leidos_count = 0, actualizado_en = now() where id = p_hilo;
  insert into public.auditoria (id, usuario_id, accion, tabla_afectada, registro_id, detalle, creado_en)
  values (gen_random_uuid(), auth.uid(), 'CRM_VACIAR_CONVERSACION', 'whatsapp_hilos', p_hilo,
          'Vació ' || n || ' mensaje(s) de ' || coalesce(h.nombre_perfil, '') || ' ' || coalesce(h.telefono_e164, ''), now());
  return jsonb_build_object('ok', true, 'mensajes', n);
end $$;

create or replace function public.crm_eliminar_hilo(p_hilo uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare h record; n int;
begin
  if not public.app_is_admin() then raise exception 'Solo el administrador puede eliminar conversaciones'; end if;
  select id, telefono_e164, nombre_perfil into h from public.whatsapp_hilos where id = p_hilo for update;
  if h.id is null then return jsonb_build_object('ok', false, 'motivo', 'no_existe'); end if;
  select count(*) into n from public.whatsapp_mensajes where hilo_id = p_hilo;
  update public.whatsapp_ia_episodios set mensaje_cliente_id = null where mensaje_cliente_id in (select id from public.whatsapp_mensajes where hilo_id = p_hilo);
  update public.whatsapp_ia_episodios set respuesta_humana_mensaje_id = null where respuesta_humana_mensaje_id in (select id from public.whatsapp_mensajes where hilo_id = p_hilo);
  update public.whatsapp_envio_destinatarios set mensaje_id = null where mensaje_id in (select id from public.whatsapp_mensajes where hilo_id = p_hilo);
  update public.whatsapp_envio_destinatarios set hilo_id = null where hilo_id = p_hilo;
  update public.leads set hilo_id = null where hilo_id = p_hilo;
  delete from public.whatsapp_ia_sugerencias where hilo_id = p_hilo or mensaje_cliente_id in (select id from public.whatsapp_mensajes where hilo_id = p_hilo);
  update public.whatsapp_mensajes set responde_a_id = null where responde_a_id in (select id from public.whatsapp_mensajes where hilo_id = p_hilo);
  delete from public.whatsapp_hilos where id = p_hilo; -- mensajes, episodios, transferencias y referidos en cascada
  insert into public.auditoria (id, usuario_id, accion, tabla_afectada, registro_id, detalle, creado_en)
  values (gen_random_uuid(), auth.uid(), 'CRM_ELIMINAR_CONVERSACION', 'whatsapp_hilos', p_hilo,
          'Eliminó el chat de ' || coalesce(h.nombre_perfil, '') || ' ' || coalesce(h.telefono_e164, '') || ' con ' || n || ' mensaje(s)', now());
  return jsonb_build_object('ok', true, 'mensajes', n);
end $$;

revoke all on function public.crm_vaciar_hilo(uuid), public.crm_eliminar_hilo(uuid) from public, anon;
grant execute on function public.crm_vaciar_hilo(uuid), public.crm_eliminar_hilo(uuid) to authenticated;
