-- 25-nov-2026 · Dueño: «que en el historial del IMEI aparezcan todas las novedades, todo el histórico de todos los
-- movimientos que ha tenido el equipo». Opción A (elegida): una línea de tiempo con lo que ya guarda el taller + anotar
-- desde hoy los movimientos de Info Plus que hace el taller con IMEI (ajustes − / +, corregir IMEI, entrada al
-- registrar, Garantía China). Sin foto diaria de Info Plus (opción B, no elegida). Solo lectura de lo existente.
-- Lo que NO sale (y por qué): la venta en Info Plus (las ventas sincronizadas no traen IMEI) y lo que alguien mueva
-- directo en Info Plus fuera del taller.

create table if not exists public.imei_movimientos (
  id uuid primary key default gen_random_uuid(),
  imei text not null,
  tipo text not null,          -- entrada · salida (ajuste de Info Plus; el motivo va en nota)
  codarticulo text,
  articulo text,
  almacen text,
  documento text,
  nota text,
  usuario text,
  creado_en timestamptz not null default now()
);
alter table public.imei_movimientos enable row level security;
create index if not exists imei_movimientos_imei on public.imei_movimientos (imei, creado_en);
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'imei_movimientos' and policyname = 'imei_movimientos_auth') then
    create policy imei_movimientos_auth on public.imei_movimientos for all to authenticated
      using ((select app_is_admin()) or (select app_actor_es_tecnico_activo()))
      with check ((select app_is_admin()) or (select app_actor_es_tecnico_activo()));
  end if;
end $$;

create or replace function public.imei_alm_nombre(p int)
returns text language sql immutable as $$
  select case p when 1 then 'Oficina Santiago' when 3 then 'Garantía China' when 4 then 'Localidad Moca'
    when 5 then 'Almacén 2do Nivel' when 6 then 'Taller' when 7 then 'Navarrete' else 'Almacén ' || p end
$$;

-- Línea de tiempo de un IMEI: [{f, tipo, t, d, ref}] ordenada por fecha. Solo admin o técnico activo.
-- No devuelve costos, claves ni datos de cuentas del cliente.
create or replace function public.imei_historial(p_imei text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v text := regexp_replace(coalesce(p_imei, ''), '\D', '', 'g'); r jsonb;
begin
  if not ((select app_is_admin()) or (select app_actor_es_tecnico_activo())) then raise exception 'Sin permiso'; end if;
  if length(v) < 8 then return '[]'::jsonb; end if;
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
  )
  select coalesce(jsonb_agg(jsonb_build_object('f', f, 'tipo', tipo, 't', t, 'd', nullif(d, ''), 'ref', ref) order by f nulls first), '[]'::jsonb)
    into r from ev;
  return r;
end $$;
