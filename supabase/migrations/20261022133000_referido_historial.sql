-- 22-oct-2026 · Conversación anterior del cliente referido (solo lectura). Ya aplicada en producción.
-- El empleado del chat de destino puede leer los últimos 200 mensajes del chat de origen, con la misma regla
-- de acceso que la RLS de whatsapp_hilos sobre el chat de destino. Ante cualquier NULL, se niega.
create or replace function public.whatsapp_referido_historial(p_hilo uuid)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare yo_t text; yo_id uuid; d record; ref record; msgs jsonb; puede boolean;
begin
  select actor_type, actor_ref_id into yo_t, yo_id from public.app_actor_identity();
  if yo_t is null then raise exception 'sin_sesion'; end if;
  select id, sucursal_id, asignado_tipo, asignado_id into d from public.whatsapp_hilos where id = p_hilo;
  if d.id is null then raise exception 'chat_no_encontrado'; end if;
  puede := coalesce(app_is_admin(), false) or (coalesce(app_actor_es_tecnico_activo(), false) and (
             not coalesce(app_actor_tiene_permiso('whatsapp_solo_sucursal'), true)
             or coalesce(d.sucursal_id = app_actor_sucursal_id(), false)
             or coalesce(d.asignado_tipo = yo_t and d.asignado_id = yo_id, false)));
  if not puede then raise exception 'sin_permiso'; end if;
  select r.hilo_origen, r.de_nombre, r.nota, r.creado_en, l.nombre as linea, s.nombre as suc into ref
    from public.whatsapp_referidos r
    left join public.whatsapp_lineas l on l.id = r.linea_origen
    left join public.sucursales s on s.id = l.sucursal_id
   where r.hilo_destino = p_hilo order by r.creado_en desc limit 1;
  if ref.hilo_origen is null then return jsonb_build_object('ok', false, 'motivo', 'sin_referido'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('direccion', m.direccion, 'tipo', m.tipo_contenido, 'cuerpo', left(m.cuerpo, 2000),
           'plantilla', m.plantilla_nombre, 'creado_en', m.creado_en) order by m.creado_en), '[]'::jsonb) into msgs
    from (select direccion, tipo_contenido, cuerpo, plantilla_nombre, creado_en from public.whatsapp_mensajes
           where hilo_id = ref.hilo_origen
             and not (tipo_contenido = 'text' and media_path is null and trim(coalesce(cuerpo, '')) = '[reaction]')
           order by creado_en desc limit 200) m;
  return jsonb_build_object('ok', true, 'linea', coalesce(ref.suc || ' · ', '') || coalesce(ref.linea, ''),
    'de_nombre', ref.de_nombre, 'nota', ref.nota, 'referido_en', ref.creado_en, 'mensajes', msgs);
end $$;
revoke execute on function public.whatsapp_referido_historial(uuid) from public, anon;
grant execute on function public.whatsapp_referido_historial(uuid) to authenticated;
