-- 10-nov-2026 · Ya aplicada en producción (migraciones «ventas_diarias_vendedor_arreglo_agrupado» y «…_arreglo_tipos»).
-- La versión del 07-nov (20261107200000) fallaba SIEMPRE, por eso «Meta por vendedor» nunca salía:
--   1) 42803: agrupaba por coalesce(codempleado,'?') y la subconsulta del nombre usaba codempleado sin agrupar;
--   2) 42804: tecnicos.nombre es varchar(120) y la función devuelve text.
-- Ahora se agrupa por el código tal cual, el nombre se busca después y se convierte a text. Misma firma y resultado.
create or replace function public.ventas_diarias_vendedor(p_ini date, p_fin date)
returns table(fecha date, codlocalidad int, codempleado text, nombre text, venta numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.app_puede_contabilidad() then raise exception 'Sin permiso de Contabilidad' using errcode = '42501'; end if;
  return query
  select a.fecha, a.loc, coalesce(a.emp, '?')::text,
    (select t.nombre::text from tecnicos t where t.infoplus_codempleado = a.emp order by t.activo desc nulls last limit 1),
    a.venta::numeric
  from (
    select v.fecha, v.codlocalidad::int as loc, v.codempleado as emp,
      round(sum(case when v.factura_id like 'CN%' then -v.monto_venta else v.monto_venta end), 2) as venta
    from infoplus_ventas v
    where v.fecha >= p_ini and v.fecha < p_fin and v.codlocalidad is not null
    group by 1, 2, 3
  ) a
  order by 1, 2, 3;
end $$;
revoke all on function public.ventas_diarias_vendedor(date, date) from public, anon;
grant execute on function public.ventas_diarias_vendedor(date, date) to authenticated, service_role;
