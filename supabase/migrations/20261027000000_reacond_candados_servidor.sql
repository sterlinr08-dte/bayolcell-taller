-- 27-oct-2026 · Candados de Reacondicionados en el servidor (dueño: «1- si»).
-- Junta 20261026014900 (evaluación solo en diagnóstico, devolución con tarea, fecha de despacho fija) y 20261026151000 (fase 3).
-- Se pega completo en el SQL Editor de Supabase (el conector retiene los DROP/DELETE). Si algo falla, no queda nada a medias.
begin;

create or replace function public.reacond_guardar_evaluacion(
  p_equipo uuid, p_notas text, p_fallas jsonb, p_piezas jsonb, p_marcar_evaluado boolean,
  p_tareas text[], p_catalogo text[], p_creado_por uuid default null)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_ref uuid; v_eq record; v_costo numeric; v_nuevas integer := 0; v_quitadas integer := 0;
  v_txt text; v_tareas text[] := coalesce(p_tareas, '{}'); v_cat text[] := coalesce(p_catalogo, '{}');
  v_estado_nuevo text := case when p_marcar_evaluado then 'evaluado' else 'en_evaluacion' end;
  v_usuario text;
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
  -- NUEVO: la evaluación solo se edita en diagnóstico. Antes, editarla en reparación, calidad o Listo regresaba el
  -- equipo a «Diagnosticado» y reescribía las piezas.
  if coalesce(v_eq.estado_evaluacion, 'pendiente') not in ('pendiente', 'en_evaluacion', 'evaluado') then
    raise exception 'Este equipo ya salió de diagnóstico. Las fallas nuevas se agregan como falla adicional en su panel de reparación.';
  end if;

  delete from public.equipo_fallas where equipo_id = p_equipo;
  insert into public.equipo_fallas (equipo_id, falla_id, falla_nombre, falla_corto, falla_categoria, nota)
  select p_equipo, nullif(f->>'falla_id','')::uuid, f->>'falla_nombre', f->>'falla_corto', f->>'falla_categoria', nullif(f->>'nota','')
  from jsonb_array_elements(coalesce(p_fallas, '[]'::jsonb)) f;

  delete from public.equipo_piezas_pedidas where equipo_id = p_equipo and coalesce(infoplus_desc_cant, 0) = 0;
  insert into public.equipo_piezas_pedidas (equipo_id, pieza_id, pieza_codigo, pieza_nombre, cantidad, costo_unitario, estado)
  select p_equipo, nullif(p->>'pieza_id','')::uuid, nullif(p->>'pieza_codigo',''), p->>'pieza_nombre',
         greatest(1, coalesce((p->>'cantidad')::integer, 1)), coalesce((p->>'costo_unitario')::numeric, 0), coalesce(nullif(p->>'estado',''), 'pendiente')
  from jsonb_array_elements(coalesce(p_piezas, '[]'::jsonb)) p
  where coalesce((p->>'infoplus_desc_cant')::integer, 0) = 0;

  select coalesce(sum(greatest(1, coalesce(cantidad, 1)) * coalesce(costo_unitario, 0)), 0) into v_costo
  from public.equipo_piezas_pedidas where equipo_id = p_equipo and coalesce(estado, '') not in ('devuelta', 'rechazada');

  update public.equipos_refurbish
     set notas_diagnostico = p_notas, estado_evaluacion = v_estado_nuevo, costo_repuestos = v_costo
   where id = p_equipo;

  -- NUEVO: renglón visible en la línea de tiempo cuando cambia el estado (la pantalla no lo repite si ve historial:true).
  if coalesce(v_eq.estado_evaluacion, 'pendiente') <> v_estado_nuevo then
    select coalesce(nombre, 'Usuario') into v_usuario from public.tecnicos where id = v_ref;
    insert into public.equipo_historial (equipo_id, estado_anterior, estado_nuevo, accion, notas, usuario)
    values (p_equipo, coalesce(v_eq.estado_evaluacion, 'pendiente'), v_estado_nuevo,
            case when p_marcar_evaluado then 'Diagnóstico terminado' else 'Diagnóstico guardado' end,
            case when cardinality(v_tareas) > 0 then 'Fallas: ' || array_to_string(v_tareas, ', ') else p_notas end,
            coalesce(v_usuario, 'Usuario'));
  end if;

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
                            'estado', v_estado_nuevo, 'historial', true);
end $$;


create or replace function public.reacond_registrar_devolucion(
  p_equipo uuid, p_motivo text, p_problemas text, p_cliente text, p_diagnostico text, p_tecnico uuid, p_usuario text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_eq record; v_dev_id uuid; v_veces integer; v_ciclo integer; v_tec text; v_ref uuid;
begin
  if not (public.app_is_admin() or public.app_actor_tiene_permiso('devoluciones_registrar')) then
    raise exception 'No tiene permiso para registrar devoluciones.' using errcode = '42501';
  end if;
  if trim(coalesce(p_motivo, '')) = '' then raise exception 'El motivo de devolución es obligatorio.'; end if;
  if p_tecnico is null then raise exception 'Seleccione el técnico de la nueva reparación.'; end if;
  select * into v_eq from public.equipos_refurbish where id = p_equipo for update;
  if not found then raise exception 'El equipo no existe.'; end if;
  if coalesce(v_eq.estado_evaluacion, '') <> 'vendido' then
    raise exception 'Solo se puede devolver un equipo Despachado (este está en «%»).', coalesce(v_eq.estado_evaluacion, 'sin estado');
  end if;
  v_veces := coalesce(v_eq.veces_devuelto, 0) + 1;
  v_ciclo := coalesce(v_eq.ciclo_actual, 1) + 1;
  select nombre into v_tec from public.tecnicos where id = p_tecnico;
  select actor_ref_id into v_ref from public.app_actor_identity() limit 1;

  insert into public.equipo_devoluciones (equipo_id, motivo_devolucion, problemas_reportados, ciclo, cliente_que_devolvio, diagnostico_inicial, registrado_por)
  values (p_equipo, trim(p_motivo), nullif(trim(coalesce(p_problemas, '')), ''), v_veces, nullif(trim(coalesce(p_cliente, '')), ''), nullif(trim(coalesce(p_diagnostico, '')), ''), coalesce(p_usuario, 'Admin'))
  returning id into v_dev_id;

  update public.equipos_refurbish
     set estado_evaluacion = 'en_proceso', tecnico_asignado_id = p_tecnico, fecha_asignacion = now(), fecha_terminado = null,
         completado = false, fecha_completado = null, fecha_despacho = null,
         veces_devuelto = v_veces, ultima_devolucion = now(), ciclo_actual = v_ciclo
   where id = p_equipo;

  -- NUEVO: sin una tarea abierta, el técnico podía pasar el ciclo 2 a calidad sin trabajo.
  if not exists (select 1 from public.tareas_trabajo where tipo = 'equipo' and ref_id = p_equipo and coalesce(estado, '') <> 'hecha') then
    insert into public.tareas_trabajo (tipo, ref_id, descripcion, tecnico_id, estado, creado_por)
    values ('equipo', p_equipo, left('Devolución: ' || trim(p_motivo), 200), p_tecnico, 'pendiente', v_ref);
  end if;

  insert into public.equipo_historial (equipo_id, estado_anterior, estado_nuevo, accion, notas, usuario)
  values (p_equipo, 'vendido', 'en_proceso', '🔄 Equipo devuelto (' || v_veces || '× total) → asignado a ' || coalesce(v_tec, 'técnico'),
          'Motivo: ' || trim(p_motivo) || coalesce(' | Problemas: ' || nullif(trim(coalesce(p_problemas, '')), ''), '') || coalesce(' | Diagnóstico: ' || nullif(trim(coalesce(p_diagnostico, '')), ''), ''),
          coalesce(p_usuario, 'Admin'));

  return jsonb_build_object('ok', true, 'devolucion_id', v_dev_id, 'veces_devuelto', v_veces, 'ciclo', v_ciclo, 'tarea', true);
end $$;


create or replace function public.trg_refurb_fecha_despacho_fija()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.estado_evaluacion = 'vendido' and new.estado_evaluacion = 'vendido'
     and old.fecha_despacho is not null and new.fecha_despacho is distinct from old.fecha_despacho then
    new.fecha_despacho := old.fecha_despacho;
  end if;
  return new;
end $$;
drop trigger if exists trg_refurb_fecha_despacho_fija on public.equipos_refurbish;
create trigger trg_refurb_fecha_despacho_fija before update on public.equipos_refurbish
  for each row execute function public.trg_refurb_fecha_despacho_fija();

create or replace function public.trg_refurb_guardia_fase3()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_piezas integer; v_tareas integer;
begin
  -- F3-1 · Cerrar salida: solo Despachado con fecha (aplica a todos)
  if coalesce(new.completado, false) and not coalesce(old.completado, false) then
    if coalesce(old.estado_evaluacion, '') <> 'vendido' or coalesce(new.estado_evaluacion, '') <> 'vendido' then
      raise exception 'Primero registre la salida: solo se cierra la salida de un equipo Despachado.';
    end if;
    if new.fecha_despacho is null then
      new.fecha_despacho := coalesce(old.fecha_despacho, now());
    end if;
  end if;
  -- Despachar siempre deja fecha
  if new.estado_evaluacion = 'vendido' and coalesce(old.estado_evaluacion, '') <> 'vendido' and new.fecha_despacho is null then
    new.fecha_despacho := now();
  end if;

  if public.app_is_admin() then return new; end if;

  -- F3-2 · Calidad / venta sin pendientes (no admin)
  if new.estado_evaluacion in ('listo_revision', 'listo_venta')
     and new.estado_evaluacion is distinct from old.estado_evaluacion then
    select count(*) into v_piezas from public.equipo_piezas_pedidas p
     where p.equipo_id = new.id and (p.agregada_por_tecnico or p.pieza_id is not null)
       and p.estado in ('pendiente', 'extra_pendiente', 'aprobada', 'entregada');
    if v_piezas > 0 then
      raise exception 'Este equipo tiene % pieza(s) pendiente(s). Resuélvalas antes de cambiar el estado.', v_piezas;
    end if;
    select count(*) into v_tareas from public.tareas_trabajo t
     where t.tipo = 'equipo' and t.ref_id = new.id and coalesce(t.estado, '') <> 'hecha';
    if v_tareas > 0 then
      raise exception 'Este equipo tiene % tarea(s) sin terminar. Márquelas como hechas antes de cambiar el estado.', v_tareas;
    end if;
  end if;
  return new;
end $$;
comment on function public.trg_refurb_guardia_fase3 is '26-oct-2026 (PROPUESTA): cierre de salida solo de Despachados con fecha; calidad/venta sin piezas ni tareas abiertas (no admin).';

drop trigger if exists trg_refurb_guardia_fase3 on public.equipos_refurbish;
create trigger trg_refurb_guardia_fase3 before update on public.equipos_refurbish
  for each row execute function public.trg_refurb_guardia_fase3();

commit;

-- Verificación (debe decir 2 disparadores y true):
select (select count(*) from pg_trigger where tgname in ('trg_refurb_fecha_despacho_fija','trg_refurb_guardia_fase3')) as disparadores,
       position('ya salió de diagnóstico' in pg_get_functiondef('public.reacond_guardar_evaluacion(uuid,text,jsonb,jsonb,boolean,text[],text[],uuid)'::regprocedure)) > 0 as evaluacion_ok;
