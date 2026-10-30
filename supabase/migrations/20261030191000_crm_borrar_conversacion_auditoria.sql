-- Corrección (30-oct-2026): auditoria.usuario_id apunta a public.usuarios, no a auth.uid().
-- Se guarda el usuario del sistema si quien borra es un «usuario»; si es un técnico admin, va su nombre en el detalle.
create or replace function public._crm_actor_audit(out p_usuario uuid, out p_nombre text)
language plpgsql stable security definer set search_path = public, auth as $$
declare t text; rid uuid;
begin
  select actor_type, actor_ref_id into t, rid from public.app_actor_identity();
  if t = 'usuario' and exists (select 1 from public.usuarios where id = rid) then p_usuario := rid; end if;
  p_nombre := coalesce(
    (select tc.nombre from public.tecnicos tc where tc.id = public.app_actor_tecnico_id()),
    split_part((select email from auth.users where id = auth.uid()), '@', 1), 'admin');
end $$;
revoke all on function public._crm_actor_audit() from public, anon, authenticated;
create or replace function public.crm_vaciar_hilo(p_hilo uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare h record; n int; a record;
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
  select * into a from public._crm_actor_audit();
  insert into public.auditoria (id, usuario_id, accion, tabla_afectada, registro_id, detalle, creado_en)
  values (gen_random_uuid(), a.p_usuario, 'CRM_VACIAR_CONVERSACION', 'whatsapp_hilos', p_hilo,
          a.p_nombre || ' vació ' || n || ' mensaje(s) de ' || coalesce(h.nombre_perfil, '') || ' ' || coalesce(h.telefono_e164, ''), now());
  return jsonb_build_object('ok', true, 'mensajes', n);
end $$;

create or replace function public.crm_eliminar_hilo(p_hilo uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare h record; n int; a record;
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
  select * into a from public._crm_actor_audit();
  insert into public.auditoria (id, usuario_id, accion, tabla_afectada, registro_id, detalle, creado_en)
  values (gen_random_uuid(), a.p_usuario, 'CRM_ELIMINAR_CONVERSACION', 'whatsapp_hilos', p_hilo,
          a.p_nombre || ' eliminó el chat de ' || coalesce(h.nombre_perfil, '') || ' ' || coalesce(h.telefono_e164, '') || ' con ' || n || ' mensaje(s)', now());
  return jsonb_build_object('ok', true, 'mensajes', n);
end $$;

