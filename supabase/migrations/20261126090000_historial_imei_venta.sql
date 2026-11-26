-- 26-nov-2026 · Dueño («las dos»): (1) «Posible venta» en el Historial del IMEI y (2) Kárdex del artículo (Edge infoplus-kardex).
-- Aquí (1): las ventas de Info Plus (infoplus_ventas, ya sincronizadas) no traen IMEI; se deduce la venta con las ventas del mismo
-- código en el almacén donde el taller vio el IMEI por última vez (despacho, ajuste o lote), desde esa fecha. Si lo último fue
-- una salida por ajuste, no se busca venta. Comprobado con el IMEI 357676150562102: despacho DA00003680 Taller → Oficina
-- (22-oct) y la única venta del 1133 en Oficina después: CO00098453 (23-oct). Solo lectura; no cambia datos.

create or replace function public.imei_alm_codigo(p text)
returns int language sql immutable as $$
  select case lower(coalesce(p, '')) when 'oficina santiago' then 1 when 'garantía china' then 3 when 'garantia china' then 3
    when 'localidad moca' then 4 when 'almacén 2do nivel' then 5 when 'almacen 2do nivel' then 5 when 'taller' then 6
    when 'navarrete' then 7 else nullif(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '')::int end
$$;

create or replace function public.imei_historial(p_imei text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v text := regexp_replace(coalesce(p_imei, ''), '\D', '', 'g'); r jsonb; u record; n int;
begin
  if not ((select app_is_admin()) or (select app_actor_es_tecnico_activo())) then raise exception 'Sin permiso'; end if;
  if length(v) < 8 then return '[]'::jsonb; end if;
  -- Último lugar conocido del IMEI (para deducir la venta): el despacho, ajuste o lote más reciente.
  select z.f, z.alm, z.cod, z.tipo into u from (
      select d.fecha f, d.almacen_destino alm,
             (select regexp_replace(coalesce(it ->> 'codigo', ''), '\D', '', 'g') from jsonb_array_elements(case when jsonb_typeof(d.items) = 'array' then d.items else '[]'::jsonb end) it
               where it::text like '%' || v || '%' limit 1) cod, 'despacho' tipo
        from despachos_almacen d where d.items::text like '%' || v || '%'
      union all
      select m.creado_en, imei_alm_codigo(m.almacen), regexp_replace(coalesce(m.codarticulo, ''), '\D', '', 'g'), m.tipo from imei_movimientos m where m.imei = v
      union all
      select e.creado_en, 6, regexp_replace(coalesce(e.articulo_codigo, ''), '\D', '', 'g'), 'lote'
        from equipos_refurbish e where regexp_replace(coalesce(e.imei, ''), '\D', '', 'g') = v
    ) z where z.f is not null order by z.f desc limit 1;
  n := 0;
  if u.f is not null and coalesce(u.tipo, '') <> 'salida' and coalesce(u.cod, '') <> '' and u.alm is not null then
    select count(distinct vt.factura_id) into n from infoplus_ventas vt
     where vt.producto_id = u.cod and vt.codlocalidad = u.alm and vt.fecha >= (u.f at time zone 'America/Santo_Domingo')::date;
  end if;
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
    select (vt.fecha::timestamp + interval '12 hours') at time zone 'America/Santo_Domingo', 'venta',
           case when n = 1 then 'Venta (deducida)' else 'Posible venta' end,
           concat_ws(' · ', 'Factura ' || vt.factura_id, imei_alm_nombre(vt.codlocalidad),
             case when n > 1 then n || ' ventas de este modelo ahí desde el ' || to_char(u.f at time zone 'America/Santo_Domingo', 'DD-MM') end), vt.factura_id
      from (select factura_id, min(fecha) fecha, min(codlocalidad) codlocalidad from infoplus_ventas
             where n > 0 and producto_id = u.cod and codlocalidad = u.alm and fecha >= (u.f at time zone 'America/Santo_Domingo')::date
             group by factura_id order by 2, 1 limit 3) vt
  )
  select coalesce(jsonb_agg(jsonb_build_object('f', f, 'tipo', tipo, 't', t, 'd', nullif(d, ''), 'ref', ref) order by f nulls first), '[]'::jsonb)
    into r from ev;
  return r;
end $$;
