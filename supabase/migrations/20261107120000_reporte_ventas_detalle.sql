-- 07-nov-2026 · Reportes de ventas (dueño): celulares, al detalle (nivel de precio 1) y al por mayor (niveles 2 y 3), reparaciones.
-- Ya aplicada en producción (vkhwdvjtowrhkhqavnvk) el 07-nov-2026. Copia en el repo.
-- Nivel: el precio cobrado igual (±0.5 %) al nivel 1, 2 o 3 del artículo; si no coincide (precio negociado), la cuenta:
-- «CONTADO» (cuenta 1) = detalle, cliente con ficha = mayor. Devoluciones (factura CN…) restan. TALLER (servicios, envíos,
-- recargas) va aparte para que detalle + mayor + taller = venta total. Reparación = factura (no CN) con el artículo 1121.
create or replace function public.reporte_ventas_detalle(p_ini date, p_fin date)
returns table(codlocalidad int, venta_total numeric, cel_unid numeric, cel_venta numeric, cel_detalle numeric, cel_mayor numeric,
  detalle_venta numeric, detalle_fact bigint, mayor_venta numeric, mayor_fact bigint, taller_venta numeric, pct_por_precio numeric,
  rep_n bigint, rep_mano_obra numeric, rep_piezas numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.app_puede_contabilidad() then raise exception 'Sin permiso de Contabilidad' using errcode = '42501'; end if;
  return query
  with v as (
    select x.codlocalidad loc, x.factura_id, x.producto_id, x.categoria, x.cantidad, x.monto_venta, x.cliente_cuenta,
      case when x.factura_id like 'CN%' then -1 else 1 end s, a.descripcion,
      nullif(a.niveles->>'1','')::numeric n1, nullif(a.niveles->>'2','')::numeric n2, nullif(a.niveles->>'3','')::numeric n3,
      x.monto_venta / nullif(x.cantidad, 0) pu
    from infoplus_ventas x left join infoplus_articulos a on a.codigo = x.producto_id
    where x.fecha >= p_ini and x.fecha < p_fin),
  c as (select v.*, (v.categoria = 'MOBILES' and coalesce(v.descripcion,'') ~* '^\s*CELULAR') es_cel,
    case when v.n1 is not null and abs(v.pu - v.n1) <= greatest(1, v.n1 * 0.005) then 1
         when v.n2 is not null and abs(v.pu - v.n2) <= greatest(1, v.n2 * 0.005) then 2
         when v.n3 is not null and abs(v.pu - v.n3) <= greatest(1, v.n3 * 0.005) then 3 end nivel_precio
    from v),
  d as (select c.*, coalesce(c.nivel_precio, case when trim(c.cliente_cuenta) = '1' then 1 else 2 end) nivel from c),
  rep as (select d.loc, d.factura_id, sum(d.monto_venta) filter (where d.producto_id = '1121') mo,
            coalesce(sum(d.monto_venta) filter (where d.categoria = 'PIEZAS'), 0) pz
          from d where d.s = 1 group by 1, 2 having bool_or(d.producto_id = '1121')),
  r as (select rep.loc, count(*) n, sum(rep.mo) mo, sum(rep.pz) pz from rep group by 1),
  t as (select d.loc,
      sum(d.s * d.monto_venta) vt,
      sum(d.s * d.cantidad) filter (where d.es_cel) cu, sum(d.s * d.monto_venta) filter (where d.es_cel) cv,
      sum(d.s * d.cantidad) filter (where d.es_cel and d.nivel = 1) cd, sum(d.s * d.cantidad) filter (where d.es_cel and d.nivel > 1) cm,
      sum(d.s * d.monto_venta) filter (where d.nivel = 1 and d.categoria is distinct from 'TALLER') dv,
      count(distinct d.factura_id) filter (where d.nivel = 1 and d.categoria is distinct from 'TALLER' and d.s = 1) df,
      sum(d.s * d.monto_venta) filter (where d.nivel > 1 and d.categoria is distinct from 'TALLER') mv,
      count(distinct d.factura_id) filter (where d.nivel > 1 and d.categoria is distinct from 'TALLER' and d.s = 1) mf,
      sum(d.s * d.monto_venta) filter (where d.categoria = 'TALLER') tv,
      round(100.0 * sum(d.monto_venta) filter (where d.nivel_precio is not null and d.categoria is distinct from 'TALLER')
        / nullif(sum(d.monto_venta) filter (where d.categoria is distinct from 'TALLER'), 0), 1) pp
    from d group by d.loc)
  select coalesce(t.loc, 0)::int, coalesce(t.vt,0), coalesce(t.cu,0), coalesce(t.cv,0), coalesce(t.cd,0), coalesce(t.cm,0),
    coalesce(t.dv,0), t.df, coalesce(t.mv,0), t.mf, coalesce(t.tv,0), t.pp, coalesce(r.n,0), coalesce(r.mo,0), coalesce(r.pz,0)
  from t left join r on r.loc is not distinct from t.loc order by 1;
end $$;
revoke all on function public.reporte_ventas_detalle(date, date) from public, anon;
grant execute on function public.reporte_ventas_detalle(date, date) to authenticated, service_role;
