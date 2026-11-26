-- 26-nov-2026 · Dueño («1B»): ganancia por teléfono con el precio de la venta deducida, «sugerir y usted confirma».
-- Corrección de la regla de la venta deducida (20261126090000): al probarla salió la factura CO00100054 (1 unidad del 2199)
-- asignada a 4 teléfonos distintos. Ahora:
--   · imei_ultimos_lugares(): el último lugar conocido de cada IMEI (despacho, ajuste del taller o lote).
--   · imei_venta_deducida(imei): las facturas del mismo código en ese almacén desde esa fecha. «Clara» solo si hay UNA
--     factura y esa factura vendió al menos tantas unidades como teléfonos de ese código esperaban en ese almacén
--     (último lugar ahí, visto antes de la venta). Si no, son candidatas («Posible venta»).
--   · imei_historial usa esa función (mismo resultado que antes cuando la venta es clara).
--   · reacond_precios_sugeridos(): para Rentabilidad, solo despachados SIN precio con venta clara. El precio es el de esa
--     línea en Info Plus (PrecioVenta; el ITBIS va aparte). La pantalla además revisa en vivo que el IMEI ya no esté en
--     ningún almacén. Solo lectura: el precio se guarda solo cuando el administrador toca «Guardar».

create or replace function public.imei_ultimos_lugares()
returns table (imei text, f timestamptz, alm int, cod text, tipo text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not ((select app_is_admin()) or (select app_actor_es_tecnico_activo())) then raise exception 'Sin permiso'; end if;
  return query
  select distinct on (z.imei) z.imei, z.f, z.alm, z.cod, z.tipo from (
    select regexp_replace(case when jsonb_typeof(x) = 'string' then x #>> '{}' else x ->> 'imei' end, '\D', '', 'g') imei,
           d.fecha f, d.almacen_destino alm, regexp_replace(coalesce(it ->> 'codigo', ''), '\D', '', 'g') cod, 'despacho'::text tipo
      from despachos_almacen d,
           jsonb_array_elements(case when jsonb_typeof(d.items) = 'array' then d.items else '[]'::jsonb end) it,
           jsonb_array_elements(case when jsonb_typeof(it -> 'imeis') = 'array' then it -> 'imeis' else '[]'::jsonb end) x
    union all
    select m.imei, m.creado_en, imei_alm_codigo(m.almacen), regexp_replace(coalesce(m.codarticulo, ''), '\D', '', 'g'), m.tipo from imei_movimientos m
    union all
    select regexp_replace(coalesce(e.imei, ''), '\D', '', 'g'), e.creado_en, 6, regexp_replace(coalesce(e.articulo_codigo, ''), '\D', '', 'g'), 'lote'
      from equipos_refurbish e
  ) z where z.f is not null and length(z.imei) between 14 and 17
  order by z.imei, z.f desc;
end $$;

-- { n, clara, ventas: [{factura, fecha, precio}] } o null si no hay de dónde deducir.
create or replace function public.imei_venta_deducida(p_imei text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v text := regexp_replace(coalesce(p_imei, ''), '\D', '', 'g'); u record; n int; vs jsonb; fac record; comp int;
begin
  if not ((select app_is_admin()) or (select app_actor_es_tecnico_activo())) then raise exception 'Sin permiso'; end if;
  select * into u from imei_ultimos_lugares() l where l.imei = v;
  if u.imei is null or coalesce(u.tipo, '') = 'salida' or coalesce(u.cod, '') = '' or u.alm is null then return null; end if;
  with fx as (
    select vt.factura_id, min(vt.fecha) fecha, sum(vt.cantidad) cant, sum(vt.monto_venta) monto
      from infoplus_ventas vt
     where vt.producto_id = u.cod and vt.codlocalidad = u.alm and vt.fecha >= (u.f at time zone 'America/Santo_Domingo')::date
     group by vt.factura_id)
  select count(*)::int, coalesce(jsonb_agg(jsonb_build_object('factura', factura_id, 'fecha', fecha, 'cant', cant,
           'precio', case when cant > 0 then round(monto / cant, 2) end) order by fecha, factura_id), '[]'::jsonb)
    into n, vs from fx;
  if n = 0 then return null; end if;
  comp := 0;
  if n = 1 then
    select count(*) into comp from imei_ultimos_lugares() l
     where l.cod = u.cod and l.alm = u.alm and coalesce(l.tipo, '') <> 'salida'
       and (l.f at time zone 'America/Santo_Domingo')::date <= (vs -> 0 ->> 'fecha')::date;
  end if;
  return jsonb_build_object('n', n, 'clara', n = 1 and comp <= coalesce((vs -> 0 ->> 'cant')::numeric, 0),
    'competidores', comp, 'alm', u.alm, 'desde', u.f,
    'ventas', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements(vs) e limit 3) s));
end $$;

create or replace function public.reacond_precios_sugeridos()
returns table (equipo_id uuid, imei text, factura_id text, fecha date, precio numeric)
language plpgsql stable security definer set search_path = public as $$
declare e record; vd jsonb;
begin
  if not (select app_is_admin()) then raise exception 'Sin permiso'; end if;
  for e in select r.id, regexp_replace(coalesce(r.imei, ''), '\D', '', 'g') im from equipos_refurbish r
            where (r.estado_evaluacion = 'vendido' or coalesce(r.completado, false)) and coalesce(r.precio_venta_real, 0) <= 0
              and length(regexp_replace(coalesce(r.imei, ''), '\D', '', 'g')) between 14 and 17 loop
    vd := imei_venta_deducida(e.im);
    if vd is not null and (vd ->> 'clara')::boolean and (vd -> 'ventas' -> 0 ->> 'precio')::numeric > 0 then
      equipo_id := e.id; imei := e.im; factura_id := vd -> 'ventas' -> 0 ->> 'factura';
      fecha := (vd -> 'ventas' -> 0 ->> 'fecha')::date; precio := (vd -> 'ventas' -> 0 ->> 'precio')::numeric;
      return next;
    end if;
  end loop;
end $$;

-- imei_historial: la venta sale de imei_venta_deducida (misma regla en las dos pantallas).
create or replace function public.imei_historial(p_imei text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v text := regexp_replace(coalesce(p_imei, ''), '\D', '', 'g'); r jsonb; vd jsonb;
begin
  if not ((select app_is_admin()) or (select app_actor_es_tecnico_activo())) then raise exception 'Sin permiso'; end if;
  if length(v) < 8 then return '[]'::jsonb; end if;
  -- Último lugar conocido del IMEI (para deducir la venta): el despacho, ajuste o lote más reciente.
  vd := imei_venta_deducida(v);
  with ev as (
    -- Compra en Info Plus (proveedor y factura)
    select s.fecha::timestamptz f, 'compra' tipo, 'Compra' t,
           concat_ws(' · ', s.producto, s.proveedor, 'Factura ' || nullif(s.factura, '')) d, null::text ref
      from infoplus_seriales s where s.imei = v
    union all
    -- Reacondicionado: entrada al lote
    select coalesce(e.creado_en, now()), 'lote', 'Entró al lote ' || coalesce(l.codigo_lote, ''),
           concat_ws(' · ', e.modelo, 'Código ' || e.articulo_codigo, case when e.es_garantia then 'Garantía' end), e.id::text
      from equipos_refurbish e left join refurb_lotes l on l.id = e.lote_id where regexp_replace(coalesce(e.imei, ''), '\D', '', 'g') = v
    union all
    -- Reacondicionado: cada paso del historial
    select h.fecha, 'reacond', coalesce(nullif(h.accion, ''), h.estado_nuevo, 'Cambio'),
           concat_ws(' · ', case when h.estado_nuevo is not null and h.estado_nuevo is distinct from h.estado_anterior
               then coalesce(nullif(h.estado_anterior, '') || ' → ', '') || h.estado_nuevo end,
             nullif(h.notas, ''), nullif(h.usuario, '')), e.id::text
      from equipo_historial h join equipos_refurbish e on e.id = h.equipo_id where regexp_replace(coalesce(e.imei, ''), '\D', '', 'g') = v
    union all
    -- Reparaciones de clientes
    select o.creado_en::timestamptz, 'orden', 'Orden de servicio #' || o.numero_orden,
           concat_ws(' · ', nullif(o.falla_reportada, ''), o.estado, case when o.es_garantia then 'Garantía' end), o.id::text
      from ordenes_reparacion o join equipos q on q.id = o.equipo_id where regexp_replace(coalesce(q.imei, ''), '\D', '', 'g') = v
    union all
    select oh.creado_en, 'orden', coalesce(nullif(oh.accion, ''), 'Cambio en la orden') || ' · #' || o.numero_orden,
           concat_ws(' · ', nullif(left(oh.detalle, 160), ''), nullif(oh.usuario, '')), o.id::text
      from orden_historial oh join ordenes_reparacion o on o.id = oh.orden_id join equipos q on q.id = o.equipo_id
     where regexp_replace(coalesce(q.imei, ''), '\D', '', 'g') = v
    union all
    -- Despachos entre almacenes (Info Plus, documento DA)
    select d.fecha, 'despacho', 'Despacho ' || coalesce(nullif(d.despacho_numero, ''), '') ,
           concat_ws(' · ', imei_alm_nombre(d.almacen_origen) || ' → ' || imei_alm_nombre(d.almacen_destino), nullif(d.nota, ''), nullif(d.usuario, ''),
             case when coalesce(d.estado, '') not in ('', 'ok', 'hecho', 'creado') then d.estado end), d.id::text
      from despachos_almacen d where d.items::text like '%' || v || '%'
    union all
    -- Prefacturas
    select p.creado_en, 'prefactura', 'Prefactura ' || coalesce(nullif(p.codprefactura, ''), ''),
           concat_ws(' · ', nullif(p.nombre_visible, ''), nullif(p.equipo, ''), p.estado), p.id::text
      from recepcion_prefacturas p where regexp_replace(coalesce(p.imei, ''), '\D', '', 'g') = v or p.items::text like '%' || v || '%'
    union all
    -- Financiamiento
    select f.creado_en, 'financiamiento', 'Financiamiento #' || f.codigo, concat_ws(' · ', f.cliente_nombre, f.estado), f.id::text
      from financiamientos f where regexp_replace(coalesce(f.equipo_imei, ''), '\D', '', 'g') = v
    union all
    -- Diagnóstico, batería y pantalla
    select g.created_at, 'diagnostico', 'Diagnóstico', concat_ws(' · ', nullif(g.panic_componente, ''), nullif(g.resultado_final, '')), g.id::text
      from diagnosticos g where regexp_replace(coalesce(g.imei, ''), '\D', '', 'g') = v
    union all
    select b.created_at, 'bateria', 'Batería ' || coalesce(b.salud_pct::text || '%', ''), concat_ws(' · ', b.ciclos::text || ' ciclos', nullif(b.momento, '')), b.id::text
      from bateria_registros b where regexp_replace(coalesce(b.imei, ''), '\D', '', 'g') = v
    union all
    select pr.created_at, 'pantalla', 'Pantalla', concat_ws(' · ', nullif(pr.tipo_pantalla, ''), nullif(pr.nota, '')), pr.id::text
      from pantalla_registros pr where regexp_replace(coalesce(pr.imei, ''), '\D', '', 'g') = v
    union all
    -- Conteo físico
    select coalesce(il.contado_en, il.cuadrado_en), 'conteo', 'Conteo físico', concat_ws(' · ', il.descripcion, nullif(il.estado, '')), il.id::text
      from inv_fisico_lineas il where il.imeis::text like '%' || v || '%'
    union all
    -- Movimientos de Info Plus hechos desde el taller (desde 25-nov-2026)
    select m.creado_en, 'movimiento', case m.tipo when 'entrada' then 'Entrada en Info Plus' when 'salida' then 'Salida de Info Plus' else m.tipo end,
      concat_ws(' · ', m.articulo, m.almacen, 'Nº ' || nullif(m.documento, ''), nullif(m.nota, ''), nullif(m.usuario, '')), m.id::text
      from imei_movimientos m where m.imei = v
    union all
    -- Venta deducida (26-nov-2026): las ventas de Info Plus no traen IMEI; se toman las ventas del mismo código en el
    -- almacén donde el taller vio el IMEI por última vez, desde esa fecha. Una sola = «Venta (deducida)»; varias = candidatas.
    -- La pantalla las esconde si Info Plus dice que el IMEI sigue en un almacén.
    select ((x ->> 'fecha')::date + interval '12 hours') at time zone 'America/Santo_Domingo', 'venta',
           case when (vd ->> 'clara')::boolean then 'Venta (deducida)' else 'Posible venta' end,
           concat_ws(' · ', 'Factura ' || (x ->> 'factura'), imei_alm_nombre((vd ->> 'alm')::int),
             case when not (vd ->> 'clara')::boolean then (vd ->> 'n') || ' ventas de este modelo ahí desde el '
               || to_char((vd ->> 'desde')::timestamptz at time zone 'America/Santo_Domingo', 'DD-MM') end), x ->> 'factura'
      from jsonb_array_elements(case when vd is null then '[]'::jsonb else vd -> 'ventas' end) x
  )
  select coalesce(jsonb_agg(jsonb_build_object('f', f, 'tipo', tipo, 't', t, 'd', nullif(d, ''), 'ref', ref) order by f nulls first), '[]'::jsonb)
    into r from ev;
  return r;
end $$;
