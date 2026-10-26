-- =====================================================================================================
-- PROPUESTA, SIN APLICAR · 26-oct-2026 · Reacondicionados, candados que faltan en el servidor (fase 3)
-- Lo que la capa taller-reacond-proceso.js ya controla en el navegador, pero que hoy el servidor no exige:
--   F3-1 · Cerrar la salida (completado = true) solo de un equipo Despachado con fecha de despacho (todos, también admin).
--   F3-2 · Pasar a Control de calidad o a Listo para venta sin piezas pendientes ni tareas abiertas (no admin).
--          El admin conserva su salida con justificación desde la ficha (eso queda en el navegador).
-- Requiere OK del dueño. Probar dentro de BEGIN … ROLLBACK con identidades reales, como en la fase 2.
-- La primera línea detiene el archivo si alguien lo pega completo por error.
-- =====================================================================================================
do $$ begin raise exception 'PROPUESTA sin aplicar: revisar con el dueño antes de correrla.'; end $$;

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

-- Pruebas sugeridas (cada una dentro de BEGIN … ROLLBACK, con request.jwt.claims de un técnico real, como en la fase 2):
--  1. Técnico pasa a listo_revision un equipo con una pieza 'entregada'            → rechazado.
--  2. Técnico pasa a listo_revision con todas las tareas hechas y piezas recibidas → pasa.
--  3. Cualquiera marca completado = true en un equipo listo_venta                  → rechazado.
--  4. Admin despacha (vendido) sin fecha                                          → queda con fecha_despacho = now().
-- Pendiente para otra fase (conversar con el dueño): candados en equipo_piezas_pedidas (aprobar/entregar por permiso y
-- anotar infoplus_desc_cant solo por RPC). Hoy el descuento automático escribe esas columnas desde el navegador.
