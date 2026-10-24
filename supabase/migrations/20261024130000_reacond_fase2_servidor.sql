-- 24-oct-2026 · Auditoría de Reacondicionados, fase 2 (servidor): R01, R03, R07, R11, R12.
-- Idempotente: se puede pegar completo en el SQL Editor de Supabase. El conector MCP retiene los bloques con DELETE/DROP,
-- por eso las funciones de guardia y las RPC de Info Plus se aplicaron con él y el resto lo pega el dueño (ver bitácora).
-- El administrador (usuario tradicional o técnico admin) no tiene candados: app_is_admin() los salta todos.

-- ============================================================
-- R01 · Guardia de permisos y transiciones en equipos_refurbish
-- ============================================================
create or replace function public.trg_refurb_guardia()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare
  v_ref uuid;
  p_cambiar boolean; p_desp boolean; p_otros boolean; p_propios boolean; p_dev boolean;
  p_crear boolean; p_elim boolean; p_aprobar boolean; p_costos boolean;
  v_asignado boolean;
  v_old text; v_new text;
begin
  if public.app_is_admin() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  select actor_ref_id into v_ref from public.app_actor_identity() limit 1;
  p_crear   := public.app_actor_tiene_permiso('compras_crear');
  p_elim    := public.app_actor_tiene_permiso('compras_eliminar');
  p_costos  := public.app_actor_tiene_permiso('compras_ver_costos');
  p_cambiar := public.app_actor_tiene_permiso('estado_cambiar');
  p_desp    := public.app_actor_tiene_permiso('estado_despachar');
  p_otros   := public.app_actor_tiene_permiso('reacond_editar_otros');
  p_propios := public.app_actor_tiene_permiso('reacond_editar_propios');
  p_dev     := public.app_actor_tiene_permiso('devoluciones_registrar');
  p_aprobar := public.app_actor_tiene_permiso('piezas_aprobar_extra');

  if tg_op = 'INSERT' then
    if not p_crear then
      raise exception 'No tiene permiso para agregar equipos reacondicionados (permiso «Crear/editar lotes»).' using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if not p_elim then
      raise exception 'No tiene permiso para eliminar equipos reacondicionados (permiso «Eliminar lotes»).' using errcode = '42501';
    end if;
    return old;
  end if;

  -- UPDATE
  v_old := coalesce(old.estado_evaluacion, '');
  v_new := coalesce(new.estado_evaluacion, '');
  v_asignado := v_ref is not null and (old.tecnico_asignado_id = v_ref or new.tecnico_asignado_id = v_ref);
  -- Puerta general: quien solo registra devoluciones entra únicamente para la devolución (Despachado → En reparación).
  if not (p_cambiar or p_desp or p_otros or p_propios or p_crear or p_aprobar
          or (p_dev and v_old = 'vendido' and v_new = 'en_proceso')) then
    raise exception 'No tiene permiso para modificar equipos reacondicionados.' using errcode = '42501';
  end if;
  if new.costo_compra is distinct from old.costo_compra and not p_costos then
    raise exception 'Solo quien ve los costos de compra puede cambiar el costo del equipo.' using errcode = '42501';
  end if;

  if v_new is distinct from v_old
     or (new.fecha_despacho is not null and old.fecha_despacho is null)
     or (coalesce(new.completado, false) and not coalesce(old.completado, false)) then

    if v_new = 'vendido' or (new.fecha_despacho is not null and old.fecha_despacho is null)
       or (coalesce(new.completado, false) and not coalesce(old.completado, false)) then
      -- Despachar / cerrar la salida
      if not p_desp then
        raise exception 'No tiene permiso para despachar equipos (permiso «Marcar como Despachado»).' using errcode = '42501';
      end if;
      if v_old not in ('listo_venta', 'vendido') then
        raise exception 'Solo se despacha un equipo que está Listo para venta (este está en «%»).', coalesce(nullif(v_old, ''), 'sin estado');
      end if;

    elsif v_old = 'vendido' then
      -- Salir de Despachado: devolución (vuelve a reparación) o regresar a Listo para venta
      if v_new = 'en_proceso' then
        if not p_dev then
          raise exception 'Solo quien registra devoluciones puede regresar un equipo Despachado a reparación.' using errcode = '42501';
        end if;
      elsif v_new = 'listo_venta' then
        if not (p_desp or p_aprobar) then
          raise exception 'No tiene permiso para regresar un equipo Despachado a Listo para venta.' using errcode = '42501';
        end if;
      else
        raise exception 'Un equipo Despachado solo puede volver a «En reparación» (por devolución) o a «Listo para venta».';
      end if;

    elsif v_new = 'listo_venta' and v_old = 'listo_revision' then
      -- Control de calidad: no juez y parte
      if not p_aprobar then
        raise exception 'Solo quien aprueba piezas y calidad puede aprobar el control de calidad (permiso «Aprobar piezas extras»).' using errcode = '42501';
      end if;

    else
      if not (p_cambiar or p_otros or (p_propios and v_asignado)) then
        raise exception 'No tiene permiso para cambiar el estado de este equipo.' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;
comment on function public.trg_refurb_guardia is '24-oct-2026 (auditoría R01): permisos por rol y transiciones de estado comprobadas en el servidor; el administrador no tiene candados.';
drop trigger if exists trg_refurb_guardia on public.equipos_refurbish;
create trigger trg_refurb_guardia before insert or update or delete on public.equipos_refurbish
  for each row execute function public.trg_refurb_guardia();

-- Lotes: crear/editar con compras_crear, borrar con compras_eliminar.
create or replace function public.trg_refurb_lotes_guardia()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if public.app_is_admin() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if not public.app_actor_tiene_permiso('compras_eliminar') then
      raise exception 'No tiene permiso para eliminar lotes (permiso «Eliminar lotes»).' using errcode = '42501';
    end if;
    return old;
  end if;
  if not public.app_actor_tiene_permiso('compras_crear') then
    raise exception 'No tiene permiso para crear o editar lotes (permiso «Crear/editar lotes»).' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_refurb_lotes_guardia on public.refurb_lotes;
create trigger trg_refurb_lotes_guardia before insert or update or delete on public.refurb_lotes
  for each row execute function public.trg_refurb_lotes_guardia();

-- Devoluciones: registrar/editar con devoluciones_registrar, borrar con devoluciones_eliminar.
create or replace function public.trg_equipo_devoluciones_guardia()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if public.app_is_admin() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if not public.app_actor_tiene_permiso('devoluciones_eliminar') then
      raise exception 'No tiene permiso para eliminar devoluciones.' using errcode = '42501';
    end if;
    return old;
  end if;
  if not public.app_actor_tiene_permiso('devoluciones_registrar') then
    raise exception 'No tiene permiso para registrar devoluciones.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_equipo_devoluciones_guardia on public.equipo_devoluciones;
create trigger trg_equipo_devoluciones_guardia before insert or update or delete on public.equipo_devoluciones
  for each row execute function public.trg_equipo_devoluciones_guardia();

-- ============================================================
-- R07 · Evaluación en una sola transacción (fallas, piezas, costo, estado, tareas)
-- ============================================================
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

-- ============================================================
-- R11 · Devolución en una sola transacción (registro + equipo + historial)
-- ============================================================
create or replace function public.reacond_registrar_devolucion(
  p_equipo uuid, p_motivo text, p_problemas text, p_cliente text, p_diagnostico text, p_tecnico uuid, p_usuario text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_eq record; v_dev_id uuid; v_veces integer; v_ciclo integer; v_tec text;
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

  insert into public.equipo_devoluciones (equipo_id, motivo_devolucion, problemas_reportados, ciclo, cliente_que_devolvio, diagnostico_inicial, registrado_por)
  values (p_equipo, trim(p_motivo), nullif(trim(coalesce(p_problemas, '')), ''), v_veces, nullif(trim(coalesce(p_cliente, '')), ''), nullif(trim(coalesce(p_diagnostico, '')), ''), coalesce(p_usuario, 'Admin'))
  returning id into v_dev_id;

  update public.equipos_refurbish
     set estado_evaluacion = 'en_proceso', tecnico_asignado_id = p_tecnico, fecha_asignacion = now(), fecha_terminado = null,
         completado = false, fecha_completado = null, fecha_despacho = null,
         veces_devuelto = v_veces, ultima_devolucion = now(), ciclo_actual = v_ciclo
   where id = p_equipo;

  insert into public.equipo_historial (equipo_id, estado_anterior, estado_nuevo, accion, notas, usuario)
  values (p_equipo, 'vendido', 'en_proceso', '🔄 Equipo devuelto (' || v_veces || '× total) → asignado a ' || coalesce(v_tec, 'técnico'),
          'Motivo: ' || trim(p_motivo) || coalesce(' | Problemas: ' || nullif(trim(coalesce(p_problemas, '')), ''), '') || coalesce(' | Diagnóstico: ' || nullif(trim(coalesce(p_diagnostico, '')), ''), ''),
          coalesce(p_usuario, 'Admin'));

  return jsonb_build_object('ok', true, 'devolucion_id', v_dev_id, 'veces_devuelto', v_veces, 'ciclo', v_ciclo);
end $$;
grant execute on function public.reacond_registrar_devolucion(uuid, text, text, text, text, uuid, text) to authenticated;
comment on function public.reacond_registrar_devolucion is '24-oct-2026 (auditoría R11): devolución todo-o-nada con ciclo limpio e historial garantizado.';

-- ============================================================
-- R12 · Lote + equipos en una sola transacción
-- ============================================================
create or replace function public.reacond_crear_lote(p_lote jsonb, p_equipos jsonb)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_lote_id uuid; v_n integer := 0; v_codigo text; v_detail text;
begin
  if not (public.app_is_admin() or public.app_actor_tiene_permiso('compras_crear')) then
    raise exception 'No tiene permiso para crear lotes (permiso «Crear/editar lotes»).' using errcode = '42501';
  end if;
  v_codigo := nullif(trim(coalesce(p_lote->>'codigo_lote', '')), '');
  if v_codigo is null then raise exception 'El lote necesita un código.'; end if;
  if exists (select 1 from public.refurb_lotes where codigo_lote = v_codigo) then
    raise exception 'Ya existe un lote con el código «%». No se creó nada.', v_codigo;
  end if;
  insert into public.refurb_lotes (codigo_lote, proveedor_id, fecha_compra, costo_total_lote, cantidad_equipos, gastos_envio, estado, notas, creado_por)
  values (v_codigo, nullif(p_lote->>'proveedor_id','')::uuid, coalesce(nullif(p_lote->>'fecha_compra','')::date, current_date),
          coalesce((p_lote->>'costo_total_lote')::numeric, 0), coalesce((p_lote->>'cantidad_equipos')::integer, 0),
          coalesce((p_lote->>'gastos_envio')::numeric, 0), coalesce(nullif(p_lote->>'estado',''), 'Abierto'),
          nullif(p_lote->>'notas',''), nullif(p_lote->>'creado_por','')::uuid)
  returning id into v_lote_id;

  insert into public.equipos_refurbish (lote_id, modelo, articulo_codigo, imei, marca, capacidad, color, costo_compra, costo_repuestos, estado_evaluacion, costo_origen, fecha_compra)
  select v_lote_id, coalesce(nullif(trim(e->>'modelo'), ''), 'Equipo'), nullif(e->>'articulo_codigo',''), nullif(trim(coalesce(e->>'imei','')), ''),
         nullif(e->>'marca',''), nullif(e->>'capacidad',''), nullif(e->>'color',''),
         coalesce((e->>'costo_compra')::numeric, 0), 0, 'pendiente', coalesce(nullif(e->>'costo_origen',''), 'manual'),
         nullif(e->>'fecha_compra','')::date
  from jsonb_array_elements(coalesce(p_equipos, '[]'::jsonb)) e;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'El lote no trae equipos. No se creó nada.'; end if;

  update public.refurb_lotes set cantidad_equipos = v_n where id = v_lote_id;
  return jsonb_build_object('ok', true, 'lote_id', v_lote_id, 'equipos', v_n);
exception
  when unique_violation then
    get stacked diagnostics v_detail = pg_exception_detail;
    if sqlerrm ilike '%imei%' or v_detail ilike '%imei%' then
      raise exception 'Hay un IMEI que ya existe en reacondicionados (%). No se creó el lote; corrija el IMEI y vuelva a intentar.', coalesce(substring(v_detail from '=\(([^)]+)\)'), 'repetido');
    end if;
    raise exception 'Ya existe un lote con ese código. No se creó nada.';
end $$;
grant execute on function public.reacond_crear_lote(jsonb, jsonb) to authenticated;
comment on function public.reacond_crear_lote is '24-oct-2026 (auditoría R12): lote y equipos todo-o-nada; nunca queda un lote a medias.';

-- ============================================================
-- R03 · Reserva del descuento de Info Plus con referencia (idempotencia)
-- ============================================================
alter table public.equipo_piezas_pedidas add column if not exists infoplus_ref text;
alter table public.equipo_piezas_pedidas add column if not exists infoplus_codajuste text;
comment on column public.equipo_piezas_pedidas.infoplus_ref is '24-oct-2026 (R03): referencia única que viaja en el comentario del ajuste de Info Plus; permite encontrar el ajuste si no se pudo anotar.';
comment on column public.equipo_piezas_pedidas.infoplus_codajuste is '24-oct-2026 (R03): respuesta de Info Plus al crear el ajuste (si la devuelve).';

create or replace function public.reacond_ip_reservar(p_pieza uuid, p_ref text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_row record;
begin
  if not (public.app_is_admin() or public.app_actor_tiene_permiso('piezas_aprobar_extra') or public.app_actor_tiene_permiso('estado_despachar')) then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  update public.equipo_piezas_pedidas
     set infoplus_desc_cant = -1, infoplus_ref = p_ref
   where id = p_pieza and coalesce(infoplus_desc_cant, 0) = 0
   returning id into v_row;
  if found then return jsonb_build_object('ok', true, 'ganada', true, 'ref', p_ref); end if;
  select infoplus_desc_cant, infoplus_ref, infoplus_codajuste into v_row from public.equipo_piezas_pedidas where id = p_pieza;
  if not found then return jsonb_build_object('ok', false, 'error', 'pieza_no_existe'); end if;
  return jsonb_build_object('ok', true, 'ganada', false, 'estado', v_row.infoplus_desc_cant, 'ref', v_row.infoplus_ref, 'codajuste', v_row.infoplus_codajuste);
end $$;
grant execute on function public.reacond_ip_reservar(uuid, text) to authenticated;

create or replace function public.reacond_ip_liberar(p_pieza uuid)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
begin
  if not (public.app_is_admin() or public.app_actor_tiene_permiso('piezas_aprobar_extra') or public.app_actor_tiene_permiso('estado_despachar')) then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  update public.equipo_piezas_pedidas set infoplus_desc_cant = 0, infoplus_ref = null
   where id = p_pieza and infoplus_desc_cant = -1;
  return jsonb_build_object('ok', true, 'liberada', found);
end $$;
grant execute on function public.reacond_ip_liberar(uuid) to authenticated;
comment on function public.reacond_ip_liberar is '24-oct-2026 (R03): suelta una reserva (-1) que quedó colgada; solo si Info Plus NO llegó a descontar (verificar con la referencia).';
