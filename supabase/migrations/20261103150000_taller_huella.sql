-- 3-nov-2026 · Rapidez 2 (dueño eligió «Huella por lista»). Solo lectura: no cambia tablas ni datos.
-- Devuelve una huella corta (md5) de cada una de las 17 listas que carga loadAll() en el taller, con los MISMOS filtros
-- y columnas. El navegador compara con la huella anterior y baja solo las listas que cambiaron (nuevos, cambios y borrados).
-- SECURITY INVOKER: respeta la RLS de quien llama (ve lo mismo que sus select). Si una lista no se puede leer → null
-- (el navegador la recarga como antes). Exige sesión.
create or replace function public.taller_huella()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  r record;
  h text;
  out jsonb := '{}'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'sin sesión' using errcode = '42501';
  end if;
  for r in select * from (values
      ('ordenes_reparacion', 'true', 't'),
      ('clientes', 'true', 't'),
      ('equipos', 'true', 't'),
      ('piezas_inventario', 'true', 't'),
      ('activos_taller', 'true', 't'),
      ('equipos_refurbish', 'true', 't'),
      ('proveedores', 'activo = true', 't'),
      ('refurb_lotes', 'true', 't'),
      ('articulos', 'activo = true', 't'),
      ('tecnicos', 'true', 't'),
      ('usuarios', 'true', 'row(t.id, t.nombre, t.usuario, t.rol)'),
      ('orden_piezas', 'true', 't'),
      ('tareas_trabajo', 'true', 't'),
      ('equipo_piezas_pedidas', 'true', 't'),
      ('fallas_comunes', 'true', 't'),
      ('config_taller', 'id = 1', 't'),
      ('orden_notas', 'true', 't')
    ) as v(tabla, filtro, fila)
  loop
    begin
      execute format(
        'select count(*)::text || '':'' || coalesce(md5(string_agg((%s)::text, ''|'' order by t.id::text)), '''') from public.%I t where %s',
        r.fila, r.tabla, r.filtro) into h;
    exception when others then
      h := null;
    end;
    out := out || jsonb_build_object(r.tabla, h);
  end loop;
  return out;
end;
$$;

comment on function public.taller_huella() is 'Rapidez 2 (3-nov-2026): huella md5 por lista del taller; solo lectura, RLS del que llama.';
grant execute on function public.taller_huella() to authenticated;
