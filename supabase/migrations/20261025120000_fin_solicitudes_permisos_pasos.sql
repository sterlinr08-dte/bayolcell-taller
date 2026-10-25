-- 25-oct-2026 · Auditoría Solicitudes, Fase 1: S01 (quién ve), S02 (nadie edita directo), S03 (pasos en orden).
-- Decisión del dueño (25-oct): «Cada uno su sucursal» y corregir: «Cualquiera, con motivo». Se aplica al publicar (PR #122).
-- Nota: la base trata a TODA cuenta de tipo «usuario» como administrador (app_is_admin), así que esas cuentas ven todo.
-- Reglas:
--   · Ver y dar seguimiento: administrador, o empleado con permiso de financiamiento (crear, ver o aprobar),
--     solo de SU sucursal o de las solicitudes que él mismo envió.
--   · Pasos normales: Recibida → Enviada al banco → Aprobada → Entregada; Rechazada solo desde «Enviada al banco»;
--     Cancelada desde cualquier paso abierto. Cualquier otro cambio es una CORRECCIÓN: la puede hacer quien vea la solicitud,
--     siempre escribiendo el motivo (queda en el historial).

create or replace function public.fin_solicitud_visible(p_sucursal uuid, p_enviado_por uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select public.app_is_admin()
      or ( public.app_actor_es_tecnico_activo()
           and ( public.app_actor_tiene_permiso('financiamientos_crear') or public.app_actor_tiene_permiso('financiamientos_ver') or public.app_actor_tiene_permiso('financiamientos_aprobar') )
           and ( (p_sucursal is not null and p_sucursal = public.app_actor_sucursal_id())
                 or (p_enviado_por is not null and p_enviado_por = (select actor_ref_id from public.app_actor_identity())) ) );
$$;

drop policy if exists fin_solicitudes_whatsapp_leer on public.fin_solicitudes_whatsapp;
create policy fin_solicitudes_whatsapp_leer on public.fin_solicitudes_whatsapp for select to authenticated
  using (public.fin_solicitud_visible(sucursal_id, enviado_por_id));

-- S02: nadie escribe la tabla directo desde la pantalla; solo las funciones del servidor.
drop policy if exists fin_solicitudes_whatsapp_editar on public.fin_solicitudes_whatsapp;
revoke insert, update, delete, truncate on public.fin_solicitudes_whatsapp from authenticated, anon;

-- S03: la función de seguimiento valida quién, qué solicitud y qué paso.
create or replace function public.fin_solicitud_seguimiento(p_id uuid, p_seguimiento text, p_nota text default null)
returns public.fin_solicitudes_whatsapp language plpgsql security definer set search_path to 'public' as $$
declare r public.fin_solicitudes_whatsapp; t text; rid uuid; quien text; normal boolean; nota text := nullif(left(trim(coalesce(p_nota,'')),300),'');
begin
  if p_seguimiento not in ('recibida','banco','aprobada','no_aprobada','entregada','cancelada') then
    raise exception 'Paso de seguimiento no válido: %', p_seguimiento using errcode = '22023'; end if;
  select * into r from public.fin_solicitudes_whatsapp where id = p_id for update;
  if not found or not public.fin_solicitud_visible(r.sucursal_id, r.enviado_por_id) then
    raise exception 'No tiene permiso para esta solicitud.' using errcode = '42501'; end if;
  if r.estado <> 'respondido' then raise exception 'El cliente todavía no ha llenado esta solicitud.' using errcode = '22023'; end if;
  if r.seguimiento = p_seguimiento then return r; end if;
  normal := (r.seguimiento, p_seguimiento) in (('recibida','banco'),('banco','aprobada'),('banco','no_aprobada'),('aprobada','entregada'))
         or (p_seguimiento = 'cancelada' and r.seguimiento in ('recibida','banco','aprobada'));
  if not normal and nota is null then raise exception 'Escriba el motivo de la corrección.' using errcode = '22023'; end if;
  select actor_type, actor_ref_id into t, rid from public.app_actor_identity();
  if t = 'tecnico' and rid is not null then select nombre into quien from public.tecnicos where id = rid; end if;
  if t = 'usuario' and rid is not null then select nombre into quien from public.usuarios where id = rid; end if;
  quien := coalesce(nullif(trim(quien),''), case when public.app_is_admin() then 'Administración' else 'Empleado' end);
  update public.fin_solicitudes_whatsapp set seguimiento = p_seguimiento, seguimiento_en = now(),
    seguimiento_historial = coalesce(seguimiento_historial,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'paso', p_seguimiento, 'de', r.seguimiento, 'en', now(), 'por', quien, 'actor_id', rid, 'correccion', not normal, 'nota', nota))
  where id = p_id returning * into r;
  return r;
end $$;
