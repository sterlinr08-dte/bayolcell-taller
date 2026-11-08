-- Copia de la migración aplicada el 08-nov-2026 (web_visitas_solo_admin).
-- Contador de visitas solo para el admin/dueño.
alter policy web_visitas_select_auth on public.web_visitas using (public.app_is_admin());

create or replace function public.web_visitas_resumen()
returns json language plpgsql stable security definer set search_path to 'public' as $function$
declare r json;
begin
  if not public.app_is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  with v as (
    select *, (created_at at time zone 'America/Santo_Domingo')::date as dia_rd,
           not coalesce(interno,false) and not web_visita_es_robot(ua) as real
    from web_visitas
  ), hoy as (select (now() at time zone 'America/Santo_Domingo')::date as d)
  select json_build_object(
    'total',   count(*) filter (where real),
    'unicas',  count(distinct visitor_id) filter (where real and visitor_id is not null),
    'hoy',     count(*) filter (where real and dia_rd = (select d from hoy)),
    'd7',      count(*) filter (where real and dia_rd > (select d from hoy) - 7),
    'd30',     count(*) filter (where real and dia_rd > (select d from hoy) - 30),
    'internas',count(*) filter (where coalesce(interno,false)),
    'robots',  count(*) filter (where not coalesce(interno,false) and web_visita_es_robot(ua))
  ) into r from v;
  return r;
end $function$;

create or replace function public.web_visitas_por_dia(p_dias integer default 14)
returns json language plpgsql stable security definer set search_path to 'public' as $function$
declare r json;
begin
  if not public.app_is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  with hoy as (select (now() at time zone 'America/Santo_Domingo')::date as d)
  select coalesce(json_agg(x order by x.dia), '[]'::json) into r from (
    select to_char(g.d, 'YYYY-MM-DD') as dia,
      count(v.*) as visitas,
      count(distinct v.visitor_id) filter (where v.visitor_id is not null) as unicas
    from (select generate_series((select d from hoy) - (least(greatest(p_dias,1),366) - 1), (select d from hoy), interval '1 day')::date as d) g
    left join web_visitas v
      on (v.created_at at time zone 'America/Santo_Domingo')::date = g.d
     and not coalesce(v.interno,false) and not web_visita_es_robot(v.ua)
    group by g.d
  ) x;
  return r;
end $function$;
