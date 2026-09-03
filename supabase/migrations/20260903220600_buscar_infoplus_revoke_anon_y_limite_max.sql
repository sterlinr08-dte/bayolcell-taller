-- Auditoria 2026-09-04: buscar_infoplus era ejecutable por anon (sin sesion),
-- sin ningun tope maximo en p_limite mas alla del default. Se demostro en
-- vivo que un caller sin login puede pedir p_limite=100000 y reconstruir el
-- catalogo completo (incluyendo costo, dato de negocio sensible). El
-- buscador vive dentro del CRM autenticado, no hace falta acceso publico.

revoke execute on function public.buscar_infoplus(text, integer) from public;
revoke execute on function public.buscar_infoplus(text, integer) from anon;
grant execute on function public.buscar_infoplus(text, integer) to authenticated;

create or replace function public.buscar_infoplus(p_query text, p_limite integer default 100)
 returns table(codigo text, descripcion text, marca text, referencia text, referencia_fabrica text, costo numeric, precio numeric, existencia integer, existencias jsonb)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select a.codigo, a.descripcion, a.marca, a.referencia, a.referencia_fabrica,
         a.costo, a.precio, a.existencia, a.existencias
  from infoplus_articulos a
  where p_query is not null and length(trim(p_query)) > 0
    and (
      a.codigo ilike '%' || p_query || '%'
      or a.descripcion ilike '%' || p_query || '%'
      or a.marca ilike '%' || p_query || '%'
      or a.referencia ilike '%' || p_query || '%'
      or to_tsvector('spanish', coalesce(a.descripcion,'')) @@ websearch_to_tsquery('spanish', p_query)
      or similarity(coalesce(a.codigo,''), p_query) > 0.3
      or similarity(coalesce(a.descripcion,''), p_query) > 0.25
      or similarity(coalesce(a.marca,''), p_query) > 0.3
      or similarity(coalesce(a.referencia,''), p_query) > 0.3
    )
  order by
    greatest(
      similarity(coalesce(a.codigo,''), p_query),
      similarity(coalesce(a.descripcion,''), p_query),
      similarity(coalesce(a.marca,''), p_query),
      similarity(coalesce(a.referencia,''), p_query),
      case when to_tsvector('spanish', coalesce(a.descripcion,'')) @@ websearch_to_tsquery('spanish', p_query) then 0.5 else 0 end
    ) desc,
    a.codigo
  limit least(greatest(coalesce(p_limite, 100), 1), 200);
$function$;
