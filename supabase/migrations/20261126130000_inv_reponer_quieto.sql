-- 26-nov-2026 · Dueño: «5 · Qué reponer y qué está muerto», opción C (ventana + «Traer» + aviso cada lunes), quieto = 60 días.
-- Solo lectura. Fuentes ya sincronizadas desde Info Plus:
--   · infoplus_articulos.existencias = existencia por almacén (1 Oficina Santiago, 3 Garantía China, 4 Moca, 5 2do Nivel,
--     6 Taller, 7 Navarrete). OJO: niveles_min es PRECIO mínimo por nivel, no existencia mínima.
--   · infoplus_ventas = líneas de factura por localidad (localidad 1/4/7 = almacén 1/4/7; no traen IMEI).
--   · infoplus_art_prov.ultima_fecha = última compra al proveedor (para no llamar «quieto» a lo recién comprado).
--   · infoplus_seriales = artículos que llevan IMEI (esos se despachan con «Despachar teléfonos», no con «Traer»).
-- Reglas:
--   «Se agota»: se vendió en los últimos 30 días en esa sucursal y lo que hay no alcanza para 2 semanas.
--     Sugerido = lo vendido en 30 días − lo que hay (un mes de venta). «Traer de» = almacén con sobrante:
--     2do Nivel y Oficina Santiago primero; en una sucursal, solo lo que le sobra después de su propio mes de venta.
--     Nunca de Garantía China (3) ni del Taller (6).
--   «Quieto»: hay existencia (sin contar Garantía China) y no se vendió en ninguna sucursal en p_dias días,
--     ni se compró en esos días. Valor = unidades × costo.

create or replace function public.inv_reponer(p_dias int default 60)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d int := greatest(15, least(coalesce(p_dias, 60), 365)); hoy date := (now() at time zone 'America/Santo_Domingo')::date; r jsonb;
begin
  if not ((select app_is_admin()) or (select app_actor_es_tecnico_activo())) then raise exception 'Sin permiso'; end if;
  with
  v30 as (select codlocalidad alm, producto_id cod, sum(cantidad) u from infoplus_ventas
          where fecha >= hoy - 30 and codlocalidad in (1, 4, 7) group by 1, 2),
  vend as (select producto_id cod, max(fecha) ult from infoplus_ventas group by 1),
  imei as (select distinct codproducto cod from infoplus_seriales where coalesce(codproducto, '') <> ''),
  ex as (select a.codigo cod, a.descripcion, coalesce(a.costo, 0) costo, k::int alm, greatest(coalesce(nullif(x.v, '')::numeric, 0), 0) hay
         from infoplus_articulos a, jsonb_each_text(coalesce(a.existencias, '{}'::jsonb)) x(k, v) where k ~ '^\d+$'),
  agota as (
    select v.alm, v.cod, a.descripcion, coalesce(a.costo, 0) costo, v.u vendidas,
           coalesce((a.existencias ->> v.alm::text)::numeric, 0) hay,
           greatest(ceil(v.u - coalesce((a.existencias ->> v.alm::text)::numeric, 0)), 1) sugerido,
           (i.cod is not null) lleva_imei
      from v30 v join infoplus_articulos a on a.codigo = v.cod left join imei i on i.cod = v.cod
     where coalesce((a.existencias ->> v.alm::text)::numeric, 0) < v.u / 2.0),
  fuente as (
    select g.alm, g.cod, e.alm desde,
           case when e.alm in (1, 4, 7) then e.hay - coalesce(v.u, 0) else e.hay end sobra
      from agota g join ex e on e.cod = g.cod and e.alm <> g.alm and e.alm not in (3, 6)
      left join v30 v on v.cod = e.cod and v.alm = e.alm),
  agota2 as (
    select g.*, (select jsonb_agg(jsonb_build_object('alm', f.desde, 'nombre', imei_alm_nombre(f.desde), 'sobra', floor(f.sobra))
                   order by (f.desde = 5) desc, (f.desde = 1) desc, f.sobra desc)
                  from fuente f where f.alm = g.alm and f.cod = g.cod and floor(f.sobra) >= 1) fuentes,
           pv.proveedor prov, pv.ultima_fecha prov_fecha,
           case when coalesce(pv.cantidad, 0) > 0 then round(pv.monto / pv.cantidad) end prov_costo
      from agota g
      -- «Hazlo smart»: a quién se le compró la última vez (para «Comprar» y «Copiar pedido»).
      left join lateral (select p.proveedor, p.ultima_fecha, p.monto, p.cantidad from infoplus_art_prov p
                          where p.codproducto::text = g.cod order by p.ultima_fecha desc nulls last limit 1) pv on true),
  quieto as (
    select e.cod, max(e.descripcion) descripcion, max(e.costo) costo, sum(e.hay) unidades, sum(e.hay * e.costo) valor,
           jsonb_object_agg(e.alm, e.hay) por_alm, max(vd.ult) ult_venta, max(p.ultima_fecha) ult_compra,
           bool_or(i.cod is not null) lleva_imei
      from ex e left join vend vd on vd.cod = e.cod
      left join (select codproducto::text cod, max(ultima_fecha) ultima_fecha from infoplus_art_prov group by 1) p on p.cod = e.cod
      left join imei i on i.cod = e.cod
     where e.hay > 0 and e.alm <> 3
     group by e.cod
    having coalesce(max(vd.ult), date '1900-01-01') < hoy - d and coalesce(max(p.ultima_fecha), date '1900-01-01') < hoy - d)
  select jsonb_build_object(
    'dias', d, 'hoy', hoy,
    'agota', coalesce((select jsonb_agg(jsonb_build_object('alm', alm, 'nombre', imei_alm_nombre(alm), 'cod', cod, 'desc', descripcion,
               'costo', costo, 'vendidas', vendidas, 'hay', hay, 'sugerido', sugerido, 'imei', lleva_imei,
               'dias', case when vendidas > 0 then floor(hay * 30 / vendidas) else null end, 'fuentes', coalesce(fuentes, '[]'::jsonb),
               'prov', prov, 'prov_fecha', prov_fecha, 'prov_costo', prov_costo)
               order by (hay <= 0) desc, hay * 30 / nullif(vendidas, 0) nulls first, vendidas desc) from agota2), '[]'::jsonb),
    'quieto', coalesce((select jsonb_agg(jsonb_build_object('cod', cod, 'desc', descripcion, 'costo', costo, 'unidades', unidades,
               'valor', round(valor), 'por_alm', por_alm, 'ult_venta', ult_venta, 'ult_compra', ult_compra, 'imei', lleva_imei)
               order by valor desc) from quieto), '[]'::jsonb),
    'valor_quieto', coalesce((select round(sum(valor)) from quieto), 0)
  ) into r;
  return r;
end $$;

-- Resumen corto para el aviso de cada lunes (lo llama la Edge push-enviar con la llave de servicio).
create or replace function public.inv_reponer_resumen()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare hoy date := (now() at time zone 'America/Santo_Domingo')::date; r jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not (select app_is_admin()) then raise exception 'Sin permiso'; end if;
  with
  v30 as (select codlocalidad alm, producto_id cod, sum(cantidad) u from infoplus_ventas
          where fecha >= hoy - 30 and codlocalidad in (1, 4, 7) group by 1, 2),
  ag as (select v.alm, count(*) n from v30 v join infoplus_articulos a on a.codigo = v.cod
          where coalesce((a.existencias ->> v.alm::text)::numeric, 0) < v.u / 2.0 group by 1),
  vend as (select producto_id cod, max(fecha) ult from infoplus_ventas group by 1),
  prov as (select codproducto::text cod, max(ultima_fecha) f from infoplus_art_prov group by 1),
  q as (select sum(greatest(coalesce(nullif(x.v, '')::numeric, 0), 0) * coalesce(a.costo, 0)) valor, count(distinct a.codigo) n
          from infoplus_articulos a cross join lateral jsonb_each_text(coalesce(a.existencias, '{}'::jsonb)) x(k, v)
          left join vend vd on vd.cod = a.codigo left join prov p on p.cod = a.codigo
         where x.k ~ '^\d+$' and x.k::int <> 3 and coalesce(nullif(x.v, '')::numeric, 0) > 0
           and coalesce(vd.ult, date '1900-01-01') < hoy - 60 and coalesce(p.f, date '1900-01-01') < hoy - 60)
  select jsonb_build_object(
    'agota', coalesce((select jsonb_object_agg(imei_alm_nombre(alm), n) from ag), '{}'::jsonb),
    'quieto_n', (select n from q), 'quieto_valor', coalesce((select round(valor) from q), 0)) into r;
  return r;
end $$;

-- A quién le llega el aviso del lunes: solo administradores con avisos activos.
create or replace function public.push_destinatarios_admin()
returns table (sus_id uuid, endpoint text, p256dh text, auth text)
language sql security definer set search_path = public stable as $$
  select s.id, s.endpoint, s.p256dh, s.auth
    from public.push_suscripciones s
    left join public.tecnicos te on s.actor_tipo = 'tecnico' and te.id = s.actor_id
   where coalesce(auth.role(), '') = 'service_role' and s.activo
     and (s.actor_tipo = 'usuario'
          or (s.actor_tipo = 'tecnico' and te.id is not null and coalesce(te.activo, true)
              and (coalesce(te.tipo_empleado, '') = 'admin' or coalesce(te.rol, '') = 'admin')));
$$;

-- Cada lunes 7:47 a. m. (hora de RD = 11:47 UTC). Si no hay teléfonos con avisos, no llama a nada.
create or replace function public.inv_reponer_aviso_semanal()
returns void language plpgsql security definer set search_path = public, vault, net as $$
begin
  if not exists (select 1 from public.push_suscripciones where activo) then return; end if;
  perform net.http_post(
    url := 'https://vkhwdvjtowrhkhqavnvk.supabase.co/functions/v1/push-enviar',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHdkdmp0b3dyaGtocWF2bnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzIwMzUsImV4cCI6MjA5NDkwODAzNX0.t1Vb8peJbT_9F7S3UajxvqklVl3fLm8nytZT02UIzPI',
      'x-push-token', (select decrypted_secret from vault.decrypted_secrets where name = 'push_token')),
    body := jsonb_build_object('aviso', 'reponer_semanal'),
    timeout_milliseconds := 20000);
end $$;

do $$ begin
  perform cron.unschedule('inv-reponer-lunes') where exists (select 1 from cron.job where jobname = 'inv-reponer-lunes');
  perform cron.schedule('inv-reponer-lunes', '47 11 * * 1', 'select public.inv_reponer_aviso_semanal()');
end $$;
