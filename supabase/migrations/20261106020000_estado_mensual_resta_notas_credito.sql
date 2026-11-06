-- Notas de crédito (factura CN…): Info Plus las manda en positivo; son devoluciones y deben RESTAR venta y costo.
-- APLICADA el 6-nov-2026 (dueño: «corrige también el Estado Mensual»).
create or replace function public.estado_mensual_cat(p_ini date, p_fin date, p_localidad integer default null::integer)
 returns table(categoria text, venta numeric, costo numeric, lineas bigint)
 language sql stable security definer
 set search_path to 'public'
as $function$
  select coalesce(nullif(trim(categoria),''),'(sin categoría)') as categoria,
         coalesce(sum(case when factura_id like 'CN%' then -monto_venta else monto_venta end),0)::numeric as venta,
         coalesce(sum(case when factura_id like 'CN%' then -monto_costo else monto_costo end),0)::numeric as costo,
         count(*)::bigint as lineas
  from public.infoplus_ventas
  where fecha >= p_ini and fecha < p_fin
    and (p_localidad is null or codlocalidad = p_localidad)
  group by 1 order by 2 desc;
$function$;
