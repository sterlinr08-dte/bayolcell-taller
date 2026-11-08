-- Copia de la migración aplicada el 08-nov-2026 (web_visitas_sin_robots_hora_rd).
-- Contador de visitas de bayolcell.com: no contar robots ni navegadores automáticos, y cortar los días con la hora de RD.
create or replace function public.web_visita_es_robot(p_ua text)
returns boolean language sql immutable set search_path to 'public' as $$
  select coalesce(p_ua, '') ~* '(headlesschrome|headless|bot\b|bot/|crawl|spider|slurp|facebookexternalhit|facebot|lighthouse|preview|python-|curl/|wget|playwright|puppeteer|phantomjs|bingpreview|whatsapp/|telegrambot|discordbot)';
$$;

create or replace function public.web_visitas_resumen()
returns json language sql stable security definer set search_path to 'public' as $function$
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
  ) from v;
$function$;

create or replace function public.web_visitas_por_dia(p_dias integer default 14)
returns json language sql stable security definer set search_path to 'public' as $function$
  with hoy as (select (now() at time zone 'America/Santo_Domingo')::date as d)
  select coalesce(json_agg(x order by x.dia), '[]'::json) from (
    select to_char(g.d, 'YYYY-MM-DD') as dia,
      count(v.*) as visitas,
      count(distinct v.visitor_id) filter (where v.visitor_id is not null) as unicas
    from (select generate_series((select d from hoy) - (p_dias - 1), (select d from hoy), interval '1 day')::date as d) g
    left join web_visitas v
      on (v.created_at at time zone 'America/Santo_Domingo')::date = g.d
     and not coalesce(v.interno,false) and not web_visita_es_robot(v.ua)
    group by g.d
  ) x;
$function$;
