-- Captura guiada, sin tocar importes históricos ni la fórmula del equilibrio.
-- Aplicar antes de publicar la nueva interfaz. No incluye datos ni secretos.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('conta-comprobantes','conta-comprobantes',false,8388608,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy conta_comprobantes_leer on storage.objects for select to authenticated
using (bucket_id='conta-comprobantes' and (select public.app_puede_contabilidad()));
create policy conta_comprobantes_subir on storage.objects for insert to authenticated
with check (bucket_id='conta-comprobantes' and (select public.app_puede_contabilidad())
  and name ~ '^[0-9]{4}-(0[1-9]|1[0-2])/(0|1|4|7)/[a-f0-9-]{36}\.(jpg|png|webp|pdf)$');
-- Sin UPDATE/DELETE: un documento nuevo nunca reemplaza un soporte anterior.

create or replace function public.conta_equilibrio_guardar_captura(
  p_mes date, p_filas jsonb, p_versiones jsonb
) returns setof public.conta_equilibrio
language plpgsql security invoker set search_path='' as $$
declare f jsonb; g jsonb; gs jsonb; cod int; version_actual timestamptz; existe boolean;
begin
  if auth.uid() is null or not public.app_puede_contabilidad() then
    raise exception 'Sin permiso de Contabilidad' using errcode='42501';
  end if;
  if p_mes is null or p_mes <> date_trunc('month',p_mes)::date
     or jsonb_typeof(p_filas) is distinct from 'array'
     or jsonb_array_length(p_filas) not between 1 and 4
     or jsonb_typeof(p_versiones) is distinct from 'object' then
    raise exception 'Captura no válida' using errcode='22023';
  end if;
  if (select count(distinct x->>'codlocalidad') from jsonb_array_elements(p_filas) x) <> jsonb_array_length(p_filas) then
    raise exception 'Tienda repetida' using errcode='22023';
  end if;
  -- Una transacción por mes. Los candados de fila también coordinan con el editor anterior.
  perform pg_advisory_xact_lock(61109, (p_mes-date '2000-01-01')::int);
  for f in select value from jsonb_array_elements(p_filas) order by (value->>'codlocalidad')::int loop
    cod := (f->>'codlocalidad')::int;
    if cod not in (0,1,4,7) or cod is null or (f->>'mes')::date is distinct from p_mes
       or jsonb_typeof(f->'gastos') is distinct from 'array' or not (p_versiones ? cod::text) then
      raise exception 'Mes o tienda no válidos' using errcode='22023';
    end if;
    select actualizado_en into version_actual from public.conta_equilibrio
      where mes=p_mes and codlocalidad=cod for update;
    existe := found;
    if (existe and (p_versiones->>cod::text)::timestamptz is distinct from version_actual)
       or (not existe and p_versiones->>cod::text is not null) then
      raise exception 'Otra persona cambió este mes. Actualice antes de guardar.' using errcode='40001';
    end if;
    gs := '[]'::jsonb;
    for g in select value from jsonb_array_elements(f->'gastos') loop
      if jsonb_typeof(g) is distinct from 'object' or length(coalesce(g->>'concepto',''))>160 then
        raise exception 'Concepto no válido' using errcode='22023';
      end if;
      if coalesce(g->>'monto','') <> '' and (g->>'monto') !~ '^([0-9]+(\.[0-9]*)?|\.[0-9]+)$' then
        raise exception 'Monto no válido' using errcode='22023';
      end if;
      if g ? 'captura' then
        if jsonb_typeof(g->'captura') is distinct from 'object'
           or coalesce(g#>>'{captura,estado}','') not in ('confirmado','estimado','revisar')
           or length(coalesce(g#>>'{captura,nota}',''))>400
           or jsonb_typeof(coalesce(g#>'{captura,archivos}','[]'::jsonb)) is distinct from 'array'
           or jsonb_array_length(coalesce(g#>'{captura,archivos}','[]'::jsonb))>3 then
          raise exception 'Estado o soporte no válido' using errcode='22023';
        end if;
        if g#>>'{captura,estado}'='confirmado' and coalesce(g->>'monto','')='' then
          raise exception 'Un gasto sin monto no puede confirmarse' using errcode='22023';
        end if;
        if exists(select 1 from jsonb_array_elements(coalesce(g#>'{captura,archivos}','[]'::jsonb)) a
           where a->>'ruta' is null or a->>'ruta' !~ ('^'||to_char(p_mes,'YYYY-MM')||'/'||cod||'/[a-f0-9-]{36}\.(jpg|png|webp|pdf)$')
             or not exists(select 1 from storage.objects o where o.bucket_id='conta-comprobantes' and o.name=a->>'ruta')) then
          raise exception 'Comprobante no disponible para este mes y tienda' using errcode='22023';
        end if;
        -- El nombre es informativo; la identidad real la registra el servidor solo al cambiar la captura.
        if not exists(select 1 from public.conta_equilibrio ce, jsonb_array_elements(ce.gastos) viejo
           where ce.mes=p_mes and ce.codlocalidad=cod and viejo=g) then
          g := jsonb_set(g,'{captura,usuario_id}',to_jsonb(auth.uid()::text));
          g := jsonb_set(g,'{captura,guardado_en}',to_jsonb(now()));
        end if;
      end if;
      gs := gs || jsonb_build_array(g);
    end loop;
    insert into public.conta_equilibrio(mes,codlocalidad,gastos,variables,dias_habiles,incluye_itbis,reparto,reparto_pct,notas,actualizado_por)
    values(p_mes,cod,gs,coalesce(f->'variables','{}'::jsonb),nullif(f->>'dias_habiles','')::int,
      coalesce((f->>'incluye_itbis')::boolean,false),coalesce(f->>'reparto','venta'),
      coalesce(f->'reparto_pct','{}'::jsonb),left(coalesce(f->>'notas',''),2000),auth.uid()::text)
    on conflict(mes,codlocalidad) do update set gastos=excluded.gastos,variables=excluded.variables,
      dias_habiles=excluded.dias_habiles,incluye_itbis=excluded.incluye_itbis,reparto=excluded.reparto,
      reparto_pct=excluded.reparto_pct,notas=excluded.notas,actualizado_por=excluded.actualizado_por;
  end loop;
  return query select ce.* from public.conta_equilibrio ce where ce.mes=p_mes
    and ce.codlocalidad in(select (x->>'codlocalidad')::int from jsonb_array_elements(p_filas) x);
end $$;
revoke all on function public.conta_equilibrio_guardar_captura(date,jsonb,jsonb) from public,anon;
grant execute on function public.conta_equilibrio_guardar_captura(date,jsonb,jsonb) to authenticated;
