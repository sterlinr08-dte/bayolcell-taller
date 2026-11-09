-- Cantidad de ventas (facturas, sin notas de crédito) por tienda en un periodo.
-- La usa Punto de equilibrio para «≈ N ventas» (dueño, 09-nov-2026). Solo lectura; mismo permiso que el resto de Contabilidad.
create or replace function public.facturas_por_tienda(p_ini date, p_fin date)
returns table(codlocalidad integer, facturas bigint)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.app_puede_contabilidad() then raise exception 'Sin permiso de Contabilidad' using errcode = '42501'; end if;
  return query
  select v.codlocalidad::int, count(distinct v.factura_id)
  from infoplus_ventas v
  where v.fecha >= p_ini and v.fecha < p_fin and v.codlocalidad is not null and v.factura_id not like 'CN%'
  group by 1 order by 1;
end $$;
revoke all on function public.facturas_por_tienda(date, date) from public, anon;
grant execute on function public.facturas_por_tienda(date, date) to authenticated;
