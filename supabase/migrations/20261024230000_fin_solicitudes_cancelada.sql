-- 24-oct-2026 · Dueño: «faltan más seguimientos: rechazada o cancelada». Agrega el paso «cancelada» (el cliente desistió).
-- «no_aprobada» se sigue guardando igual; en pantalla ahora se llama «Rechazada». Ya aplicada en vkhwdvjtowrhkhqavnvk.
alter table public.fin_solicitudes_whatsapp
  drop constraint fin_solicitudes_whatsapp_seguimiento_chk,
  add constraint fin_solicitudes_whatsapp_seguimiento_chk
  check (seguimiento in ('recibida','banco','aprobada','no_aprobada','entregada','cancelada'));
create or replace function public.fin_solicitud_seguimiento(p_id uuid, p_seguimiento text, p_nota text default null)
returns public.fin_solicitudes_whatsapp
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r public.fin_solicitudes_whatsapp;
  t text; rid uuid; quien text;
begin
  if not (public.app_is_admin() or public.app_actor_es_tecnico_activo()) then
    raise exception 'No tiene permiso para dar seguimiento a solicitudes.' using errcode = '42501';
  end if;
  if p_seguimiento not in ('recibida','banco','aprobada','no_aprobada','entregada','cancelada') then
    raise exception 'Paso de seguimiento no válido: %', p_seguimiento using errcode = '22023';
  end if;
  select * into r from public.fin_solicitudes_whatsapp where id = p_id for update;
  if not found then raise exception 'La solicitud no existe.' using errcode = 'P0002'; end if;
  if r.estado <> 'respondido' then
    raise exception 'El cliente todavía no ha llenado esta solicitud.' using errcode = '22023';
  end if;
  if r.seguimiento = p_seguimiento then return r; end if;

  select actor_type, actor_ref_id into t, rid from public.app_actor_identity();
  if t = 'tecnico' and rid is not null then
    select nombre into quien from public.tecnicos where id = rid;
  end if;
  quien := coalesce(nullif(trim(quien), ''), case when public.app_is_admin() then 'Administración' else 'Empleado' end);

  update public.fin_solicitudes_whatsapp
     set seguimiento = p_seguimiento,
         seguimiento_en = now(),
         seguimiento_historial = coalesce(seguimiento_historial, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
           'paso', p_seguimiento, 'de', r.seguimiento, 'en', now(), 'por', quien,
           'nota', nullif(left(trim(coalesce(p_nota, '')), 300), '')))
   where id = p_id
   returning * into r;
  return r;
end $$;
