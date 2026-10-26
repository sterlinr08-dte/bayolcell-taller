-- =====================================================================================================
-- PROPUESTA, SIN APLICAR · 26-oct-2026 · Reacondicionados: conciliación de datos viejos (auditoría 2026-10-24-0130)
-- Requiere autorización específica del dueño (regla: no tocar datos históricos sin OK). No la corre ningún robot.
--
-- Cómo usarla (dueño o la IA con su OK, en el SQL Editor de Supabase):
--   PASO 1 · Correr SOLO la parte «DIAGNÓSTICO» (son SELECT, no cambian nada) y comparar los números con la auditoría:
--            32 sin fecha · 60 tareas en 36 equipos · 14 piezas · 9 solicitudes sin equipo.
--   PASO 2 · Si los números cuadran y el dueño dice qué grupo arreglar, correr ese bloque de «ARREGLO». Cada bloque va
--            dentro de BEGIN … COMMIT; para probar primero, cambie COMMIT por ROLLBACK.
-- La primera línea detiene el archivo si alguien lo pega completo por error.
-- =====================================================================================================
do $$ begin raise exception 'PROPUESTA sin aplicar: corra cada bloque por separado y solo con el OK del dueño.'; end $$;

-- -----------------------------------------------------------------------------------------------------
-- DIAGNÓSTICO (solo lectura)
-- -----------------------------------------------------------------------------------------------------
-- D1 · Despachados sin fecha de despacho (la auditoría contó 32). Sin fecha no salen en el filtro por fechas.
select e.id, e.modelo, e.imei, e.completado, e.fecha_completado, e.fecha_terminado,
       (select min(t.fecha) from public.refurb_transiciones t where t.equipo_id = e.id and t.estado_nuevo = 'vendido') as fecha_por_transicion,
       (select min(h.fecha) from public.equipo_historial h where h.equipo_id = e.id and h.estado_nuevo = 'vendido') as fecha_por_historial
from public.equipos_refurbish e
where e.estado_evaluacion = 'vendido' and e.fecha_despacho is null
order by e.modelo;

-- D2 · Tareas abiertas en equipos que ya están Listo para venta o Despachados (la auditoría: 60 tareas en 36 equipos).
select e.estado_evaluacion, count(distinct e.id) as equipos, count(*) as tareas
from public.tareas_trabajo t join public.equipos_refurbish e on e.id = t.ref_id
where t.tipo = 'equipo' and coalesce(t.estado, '') <> 'hecha' and e.estado_evaluacion in ('listo_venta', 'vendido')
group by e.estado_evaluacion;

-- D3 · Piezas de Info Plus sin descontar (0) o con reserva colgada (-1) en equipos Despachados (la auditoría: 14).
--      OJO: esto NO se arregla con SQL; el descuento se hace en Info Plus desde la ficha del equipo (botón «Descontar»).
select p.id, e.modelo, e.imei, p.pieza_codigo, p.pieza_nombre, p.cantidad, p.estado, p.infoplus_desc_cant, p.infoplus_ref
from public.equipo_piezas_pedidas p join public.equipos_refurbish e on e.id = p.equipo_id
where e.estado_evaluacion = 'vendido' and p.pieza_codigo is not null
  and coalesce(p.estado, '') not in ('devuelta', 'rechazada')
  and coalesce(p.infoplus_desc_cant, 0) <= 0
order by e.modelo;

-- D4 · Solicitudes de piezas sin equipo (la auditoría: 9). Vienen de «Solicitar pieza» sin equipo elegido.
select p.id, p.pieza_nombre, p.cantidad, p.estado, p.tecnico_id, p.creado_en
from public.equipo_piezas_pedidas p
where p.equipo_id is null
order by p.creado_en;

-- D5 · Equipos cuyo costo de repuestos no cuadra con sus piezas (regla R10: sin devueltas ni rechazadas).
select e.id, e.modelo, e.imei, e.costo_repuestos as guardado, x.calculado
from public.equipos_refurbish e
join lateral (
  select coalesce(sum(greatest(1, coalesce(p.cantidad, 1)) * coalesce(p.costo_unitario, 0)), 0) as calculado
  from public.equipo_piezas_pedidas p where p.equipo_id = e.id and coalesce(p.estado, '') not in ('devuelta', 'rechazada')
) x on true
where coalesce(e.costo_repuestos, 0) <> x.calculado
order by e.modelo;

-- -----------------------------------------------------------------------------------------------------
-- ARREGLOS (cada uno por separado, con el OK del dueño)
-- La guardia de permisos (trg_refurb_guardia) rechaza cambios sin usuario de la app (el SQL Editor no tiene sesión),
-- por eso cada bloque la apaga y la vuelve a prender DENTRO de la misma transacción. El historial de transiciones
-- (trg_refurb_transicion) sigue prendido: cada cambio deja su rastro.
-- -----------------------------------------------------------------------------------------------------

-- A1 · Poner fecha de despacho a los Despachados que no la tienen.
--      Orden: primera transición a Despachado → primer historial a Despachado → fecha de cierre de salida → fecha terminado.
--      Los que no tengan ninguna se quedan sin fecha (salen en D1 otra vez para revisarlos a mano).
begin;
alter table public.equipos_refurbish disable trigger trg_refurb_guardia;
update public.equipos_refurbish e
   set fecha_despacho = coalesce(
         (select min(t.fecha) from public.refurb_transiciones t where t.equipo_id = e.id and t.estado_nuevo = 'vendido'),
         (select min(h.fecha) from public.equipo_historial h where h.equipo_id = e.id and h.estado_nuevo = 'vendido'),
         e.fecha_completado, e.fecha_terminado)
 where e.estado_evaluacion = 'vendido' and e.fecha_despacho is null;
alter table public.equipos_refurbish enable trigger trg_refurb_guardia;
commit;  -- cambiar por ROLLBACK para probar

-- A2 · Cerrar las tareas abiertas de equipos ya Listo para venta o Despachados, dejando la nota de por qué.
--      (Decisión del dueño: ¿se cierran o se revisan una por una? Si se revisan, NO correr este bloque.)
begin;
update public.tareas_trabajo t
   set estado = 'hecha', fecha_completada = now(),
       notas = trim(both ' ' from coalesce(t.notas, '') || ' [Cerrada por conciliación 26-oct-2026: el equipo ya estaba Listo/Despachado]')
  from public.equipos_refurbish e
 where e.id = t.ref_id and t.tipo = 'equipo' and coalesce(t.estado, '') <> 'hecha'
   and e.estado_evaluacion in ('listo_venta', 'vendido');
commit;  -- cambiar por ROLLBACK para probar

-- A3 · Piezas sin descontar (D3): SIN SQL. Se descuentan desde la ficha de cada equipo con el botón «Descontar»
--      (escribe en Info Plus, requiere OK del dueño). Las reservas colgadas (-1) primero se buscan en Info Plus por su
--      referencia [PZ-…] y luego se usa «Liberar» o se anota a mano.

-- A4 · Solicitudes sin equipo (D4): marcar como rechazadas las que tengan más de 30 días y nunca se entregaron.
--      (Decisión del dueño: ¿rechazar, enlazar a un equipo o dejarlas?)
begin;
update public.equipo_piezas_pedidas
   set estado = 'rechazada'
 where equipo_id is null and coalesce(estado, '') in ('pendiente', 'extra_pendiente')
   and creado_en < now() - interval '30 days';
commit;  -- cambiar por ROLLBACK para probar

-- A5 · Recalcular el costo de repuestos con la regla única (sin devueltas ni rechazadas).
begin;
alter table public.equipos_refurbish disable trigger trg_refurb_guardia;
update public.equipos_refurbish e
   set costo_repuestos = x.calculado
  from (select p.equipo_id, coalesce(sum(greatest(1, coalesce(p.cantidad, 1)) * coalesce(p.costo_unitario, 0)), 0) as calculado
          from public.equipo_piezas_pedidas p where coalesce(p.estado, '') not in ('devuelta', 'rechazada')
         group by p.equipo_id) x
 where x.equipo_id = e.id and coalesce(e.costo_repuestos, 0) <> x.calculado;
alter table public.equipos_refurbish enable trigger trg_refurb_guardia;
commit;  -- cambiar por ROLLBACK para probar
