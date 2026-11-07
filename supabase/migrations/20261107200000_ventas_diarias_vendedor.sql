-- 07-nov-2026 · Ya aplicada en producción. Punto de equilibrio: metas diaria / semanal / quincenal por sucursal y vendedor.
-- Venta neta por día, tienda y vendedor (código de Info Plus); las notas de crédito (CN) restan. Nombre desde tecnicos.
create or replace function public.ventas_diarias_vendedor(p_ini date, p_fin date)
returns table(fecha date, codlocalidad int, codempleado text, nombre text, venta numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.app_puede_contabilidad() then raise exception 'Sin permiso de Contabilidad' using errcode = '42501'; end if;
  return query
  select v.fecha, v.codlocalidad::int, coalesce(v.codempleado, '?'),
    (select t.nombre from tecnicos t where t.infoplus_codempleado = v.codempleado order by t.activo desc nulls last limit 1),
    round(sum(case when v.factura_id like 'CN%' then -v.monto_venta else v.monto_venta end), 2)
  from infoplus_ventas v
  where v.fecha >= p_ini and v.fecha < p_fin and v.codlocalidad is not null
  group by 1, 2, 3 order by 1, 2, 3;
end $$;
revoke all on function public.ventas_diarias_vendedor(date, date) from public, anon;
grant execute on function public.ventas_diarias_vendedor(date, date) to authenticated, service_role;
