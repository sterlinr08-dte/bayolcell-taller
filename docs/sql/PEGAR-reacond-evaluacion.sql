-- 24-oct-2026 · Reacondicionados fase 2 · ÚNICO bloque que el dueño pega en el SQL Editor de Supabase (proyecto Bayol).
-- Todo lo demás de la migración 20261024130000 ya está aplicado. Se puede repetir sin peligro.

create or replace function public.reacond_guardar_evaluacion(
  p_equipo uuid, p_notas text, p_fallas jsonb, p_piezas jsonb, p_marcar_evaluado boolean,
  p_tareas text[], p_catalogo text[], p_creado_por uuid default null)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_ref uuid; v_eq record; v_costo numeric; v_nuevas integer := 0; v_quitadas integer := 0;
  v_txt text; v_tareas text[] := coalesce(p_tareas, '{}'); v_cat text[] := coalesce(p_catalogo, '{}');
begin
  select actor_ref_id into v_ref from public.app_actor_identity() limit 1;
  select * into v_eq from public.equipos_refurbish where id = p_equipo for update;
  if not found then raise exception 'El equipo no existe.'; end if;
  if not (public.app_is_admin() or public.app_actor_tiene_permiso('estado_cambiar') or public.app_actor_tiene_permiso('reacond_editar_otros')
          or (public.app_actor_tiene_permiso('reacond_editar_propios') and v_eq.tecnico_asignado_id = v_ref)) then
    raise exception 'No tiene permiso para evaluar este equipo.' using errcode = '42501';
  end if;
  if v_eq.estado_evaluacion = 'vendido' then
    raise exception 'Este equipo ya está Despachado; no se puede volver a evaluar. Registre una devolución si volvió por garantía.';
  end if;

  -- 1. Fallas: se reemplazan completas
  delete from public.equipo_fallas where equipo_id = p_equipo;
  insert into public.equipo_fallas (equipo_id, falla_id, falla_nombre, falla_corto, falla_categoria, nota)
  select p_equipo, nullif(f->>'falla_id','')::uuid, f->>'falla_nombre', f->>'falla_corto', f->>'falla_categoria', nullif(f->>'nota','')
  from jsonb_array_elements(coalesce(p_fallas, '[]'::jsonb)) f;

  -- 2. Piezas: solo se reescriben las que NO se han descontado de Info Plus (0). Las descontadas (>0) y las
  --    reservadas (-1) quedan intactas para que el descuento nunca se repita.
  delete from public.equipo_piezas_pedidas where equipo_id = p_equipo and coalesce(infoplus_desc_cant, 0) = 0;
  insert into public.equipo_piezas_pedidas (equipo_id, pieza_id, pieza_codigo, pieza_nombre, cantidad, costo_unitario, estado)
  select p_equipo, nullif(p->>'pieza_id','')::uuid, nullif(p->>'pieza_codigo',''), p->>'pieza_nombre',
         greatest(1, coalesce((p->>'cantidad')::integer, 1)), coalesce((p->>'costo_unitario')::numeric, 0), coalesce(nullif(p->>'estado',''), 'pendiente')
  from jsonb_array_elements(coalesce(p_piezas, '[]'::jsonb)) p
  where coalesce((p->>'infoplus_desc_cant')::integer, 0) = 0;

  -- 3. Costo de repuestos = suma real en la base (R10: sin devueltas ni rechazadas)
  select coalesce(sum(greatest(1, coalesce(cantidad, 1)) * coalesce(costo_unitario, 0)), 0) into v_costo
  from public.equipo_piezas_pedidas where equipo_id = p_equipo and coalesce(estado, '') not in ('devuelta', 'rechazada');

  update public.equipos_refurbish
     set notas_diagnostico = p_notas,
         estado_evaluacion = case when p_marcar_evaluado then 'evaluado' else 'en_evaluacion' end,
         costo_repuestos = v_costo
   where id = p_equipo;

  -- 4. Tareas (sincroniza): quita las PENDIENTES que vienen del catálogo y ya no están; crea las nuevas.
  delete from public.tareas_trabajo t
   where t.tipo = 'equipo' and t.ref_id = p_equipo and coalesce(t.estado, '') <> 'hecha'
     and lower(trim(t.descripcion)) = any (select lower(trim(x)) from unnest(v_cat) x)
     and lower(trim(t.descripcion)) <> all (select lower(trim(x)) from unnest(v_tareas) x);
  get diagnostics v_quitadas = row_count;
  foreach v_txt in array v_tareas loop
    if trim(coalesce(v_txt, '')) = '' then continue; end if;
    if not exists (select 1 from public.tareas_trabajo t where t.tipo = 'equipo' and t.ref_id = p_equipo and lower(trim(t.descripcion)) = lower(trim(v_txt))) then
      insert into public.tareas_trabajo (tipo, ref_id, descripcion, tecnico_id, estado, creado_por)
      values ('equipo', p_equipo, trim(v_txt), null, 'pendiente', p_creado_por);
      v_nuevas := v_nuevas + 1;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'costo_repuestos', v_costo, 'tareas_nuevas', v_nuevas, 'tareas_quitadas', v_quitadas,
                            'estado', case when p_marcar_evaluado then 'evaluado' else 'en_evaluacion' end);
end $$;
grant execute on function public.reacond_guardar_evaluacion(uuid, text, jsonb, jsonb, boolean, text[], text[], uuid) to authenticated;
comment on function public.reacond_guardar_evaluacion is '24-oct-2026 (auditoría R07): evaluación todo-o-nada; si algo falla no se pierden las fallas ni las piezas anteriores.';

