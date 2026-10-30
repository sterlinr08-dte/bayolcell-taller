-- ============================================================
-- Raspa y gana (dueño, 28/29-oct-2026). Bitácoras 2026-10-29-*-claude-raspa-*.
--
-- Reglas del dueño:
--   * Un juego por compra (prefactura) de RD$500 o más. Se activa al pagar en caja.
--   * Premios: 5 % (80 de cada 100), 10 % (15 de cada 100) o accesorio gratis (5 de cada 100).
--     Máximo 3 accesorios gratis por día (hora de RD); pasado el tope, el juego da 5 %.
--   * El premio vence a los 30 días de raspado y se usa en otra compra (no en la misma).
--   * Dónde vale: accesorios, baterías y servicio técnico hasta 10 %; pantallas y demás piezas hasta 5 %.
--     No vale en celulares (MOBILES), cargadores VIDVIE 1539/1540, envío 1161, recarga 1186 ni Turbo SIM.
--   * Accesorio gratis: templado 1582 o cable tipo C Samsung 1021.
--   * Se reclama con el QR del recibo, el código corto o el teléfono del cliente.
--
-- Todo pasa por funciones: la tabla no se escribe directo desde la app ni desde la página pública.
-- ============================================================

create table if not exists public.raspa_juegos (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,                 -- va en el QR (largo, no se adivina)
  codigo text not null unique,                -- corto, para escribir: BC-7K4P
  codprefactura text not null unique,         -- la compra que lo generó (un juego por compra)
  prefactura_id uuid references public.recepcion_prefacturas(id) on delete set null,
  infoplus_codcliente text,
  total_compra numeric(12,2) not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','activo','jugado','usado','anulado')),
  factura_id text,                            -- factura de Info Plus con que se pagó
  activado_en timestamptz, activado_por text, activado_modo text check (activado_modo in ('auto','manual')),
  telefono text,                              -- se pide al raspar (10 dígitos)
  premio text check (premio in ('5','10','regalo')),
  jugado_en timestamptz, vence_en timestamptz,
  usado_en timestamptz, usado_por text, usado_codprefactura text,
  creado_en timestamptz not null default now(), creado_por text
);
create index if not exists raspa_juegos_tel_idx on public.raspa_juegos (telefono) where estado = 'jugado';
create index if not exists raspa_juegos_jugado_idx on public.raspa_juegos (jugado_en);
create unique index if not exists raspa_juegos_factura_uq on public.raspa_juegos (factura_id) where factura_id is not null;

alter table public.raspa_juegos enable row level security;
-- Solo lectura para el personal que hace prefacturas; los cambios van por las funciones.
drop policy if exists raspa_juegos_leer on public.raspa_juegos;
create policy raspa_juegos_leer on public.raspa_juegos for select to authenticated
  using ((select public.app_puede_prefactura()));
revoke all on public.raspa_juegos from anon;
revoke insert, update, delete on public.raspa_juegos from authenticated;

-- ---------- Ayudas ----------
create or replace function public._raspa_actor()
returns text language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    (select t.nombre from public.tecnicos t where t.id = public.app_actor_tecnico_id()),
    split_part((select email from auth.users where id = auth.uid()), '@', 1),
    'Sistema')
$$;

create or replace function public._raspa_tel(p text)
returns text language sql immutable as $$
  -- deja los últimos 10 dígitos (809/829/849 + 7)
  select nullif(right(regexp_replace(coalesce(p,''), '\D', '', 'g'), 10), '')
$$;

create or replace function public._raspa_codigo()
returns text language plpgsql volatile as $$
declare abc constant text := 'ACDEFGHJKMNPQRTUVWXY34679'; c text; i int;
begin
  loop
    c := 'BC-';
    for i in 1..4 loop c := c || substr(abc, 1 + floor(random() * length(abc))::int, 1); end loop;
    exit when not exists (select 1 from public.raspa_juegos where codigo = c);
  end loop;
  return c;
end $$;

-- Tope de premio por artículo (0, 5 o 10). Fuente: categoría de Info Plus (infoplus_ventas) y descripción.
create or replace function public.raspa_tope_articulo(p_cod text)
returns int language plpgsql stable security definer set search_path = public as $$
declare cat text; des text;
begin
  if p_cod is null then return 0; end if;
  if p_cod in ('1539','1540','1161','1186') then return 0; end if;
  select v.categoria into cat from public.infoplus_ventas v where v.producto_id::text = p_cod order by v.fecha desc limit 1;
  select a.descripcion into des from public.infoplus_articulos a where a.codigo::text = p_cod limit 1;
  cat := upper(coalesce(cat, '')); des := upper(coalesce(des, ''));
  if cat = 'ACCESORIOS' then return 10; end if;
  if cat = 'TALLER' then return case when p_cod = '1121' then 10 else 0 end; end if;
  if cat = 'PIEZAS' then return case when des like '%BATERIA%' or des like '%BATERÍA%' then 10 else 5 end; end if;
  if cat = 'BOTON' then return 5; end if;
  return 0; -- MOBILES, TURBO SIM o sin categoría conocida: no aplica
end $$;

create or replace function public.raspa_topes(p_cods text[])
returns table (cod text, tope int) language sql stable security definer set search_path = public as $$
  select c, public.raspa_tope_articulo(c) from unnest(p_cods) c
  where (select public.app_puede_prefactura())
$$;

-- ---------- Emitir (al imprimir la prefactura) ----------
create or replace function public.raspa_emitir(p_codprefactura text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p record; j record;
begin
  if not public.app_puede_prefactura() then raise exception 'No autorizado'; end if;
  select * into p from public.recepcion_prefacturas where codprefactura = p_codprefactura order by creado_en desc limit 1;
  if p.id is null then return jsonb_build_object('ok', false, 'motivo', 'sin_prefactura'); end if;
  if coalesce(p.total, 0) < 500 then return jsonb_build_object('ok', false, 'motivo', 'menor_500'); end if;
  select * into j from public.raspa_juegos where codprefactura = p_codprefactura;
  if j.id is null then
    insert into public.raspa_juegos (token, codigo, codprefactura, prefactura_id, infoplus_codcliente, total_compra, telefono, creado_por)
    values (encode(extensions.gen_random_bytes(18), 'hex'), public._raspa_codigo(), p_codprefactura, p.id, p.infoplus_codcliente,
            p.total, public._raspa_tel(p.telefono_visible), public._raspa_actor())
    returning * into j;
  elsif j.estado = 'pendiente' and j.total_compra is distinct from p.total then
    update public.raspa_juegos set total_compra = p.total where id = j.id returning * into j;
  end if;
  return jsonb_build_object('ok', true, 'codigo', j.codigo, 'token', j.token, 'estado', j.estado);
end $$;

-- ---------- Activar ----------
-- Automático: busca en las ventas de Info Plus (se copian cada hora) UNA factura del mismo cliente, de ese día
-- a 3 días después, que tenga todos los artículos de la prefactura y sume RD$500 o más. Si hay más de una, no adivina.
create or replace function public._raspa_auto_activar(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare j record; p record; cand text[];
begin
  select * into j from public.raspa_juegos where id = p_id for update;
  if j.estado <> 'pendiente' then return j.estado <> 'anulado'; end if;
  select * into p from public.recepcion_prefacturas where id = j.prefactura_id;
  if p.id is null or jsonb_typeof(p.items) <> 'array' or jsonb_array_length(p.items) = 0 then return false; end if;
  select array_agg(f) into cand from (
    select v.factura_id f
    from public.infoplus_ventas v
    where v.fecha between p.creado_en::date and p.creado_en::date + 3
      and v.cliente_cuenta::text = coalesce(p.infoplus_codcliente, '1')
      and not exists (select 1 from public.raspa_juegos x where x.factura_id = v.factura_id)
    group by v.factura_id
    having sum(v.monto_venta) >= 500
       and count(distinct v.producto_id::text) filter (where v.producto_id::text in (select i->>'cod' from jsonb_array_elements(p.items) i))
           = (select count(distinct i->>'cod') from jsonb_array_elements(p.items) i)
  ) s;
  if cand is null or array_length(cand, 1) <> 1 then return false; end if;
  update public.raspa_juegos set estado = 'activo', factura_id = cand[1], activado_en = now(), activado_por = 'Sistema', activado_modo = 'auto'
   where id = j.id;
  return true;
end $$;

-- Manual (cajera o admin): con el número de factura de Info Plus.
create or replace function public.raspa_activar(p_codigo text, p_factura text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare j record; f text := upper(trim(coalesce(p_factura, '')));
begin
  if not public.app_puede_prefactura() then raise exception 'No autorizado'; end if;
  select * into j from public.raspa_juegos where codigo = upper(trim(p_codigo)) for update;
  if j.id is null then return jsonb_build_object('ok', false, 'motivo', 'no_existe'); end if;
  if j.estado <> 'pendiente' then return jsonb_build_object('ok', false, 'motivo', 'ya_' || j.estado); end if;
  if length(f) < 4 then return jsonb_build_object('ok', false, 'motivo', 'falta_factura'); end if;
  if exists (select 1 from public.raspa_juegos where factura_id = f) then return jsonb_build_object('ok', false, 'motivo', 'factura_usada'); end if;
  update public.raspa_juegos set estado = 'activo', factura_id = f, activado_en = now(), activado_por = public._raspa_actor(), activado_modo = 'manual'
   where id = j.id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Página pública (cliente) ----------
create or replace function public.raspa_ver(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare j record;
begin
  select * into j from public.raspa_juegos where token = p_token;
  if j.id is null then return jsonb_build_object('ok', false, 'estado', 'no_existe'); end if;
  if j.estado = 'pendiente' then perform public._raspa_auto_activar(j.id); select * into j from public.raspa_juegos where id = j.id; end if;
  return jsonb_build_object('ok', true, 'estado', case when j.estado = 'jugado' and j.vence_en < now() then 'vencido' else j.estado end,
    'codigo', j.codigo, 'premio', j.premio, 'vence_en', j.vence_en, 'jugado_en', j.jugado_en);
end $$;

create or replace function public.raspa_jugar(p_token text, p_telefono text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare j record; tel text := public._raspa_tel(p_telefono); r float8; pr text; regalos int;
begin
  if tel is null or length(tel) <> 10 then return jsonb_build_object('ok', false, 'motivo', 'telefono'); end if;
  select * into j from public.raspa_juegos where token = p_token;
  if j.id is null then return jsonb_build_object('ok', false, 'motivo', 'no_existe'); end if;
  if j.estado = 'pendiente' then perform public._raspa_auto_activar(j.id); end if;
  select * into j from public.raspa_juegos where id = j.id for update;
  if j.estado in ('jugado','usado') then
    return jsonb_build_object('ok', true, 'premio', j.premio, 'codigo', j.codigo, 'vence_en', j.vence_en, 'estado', j.estado);
  end if;
  if j.estado <> 'activo' then return jsonb_build_object('ok', false, 'motivo', j.estado); end if;
  -- Un solo sorteo a la vez para que el tope de regalos del día no se pase.
  perform pg_advisory_xact_lock(hashtext('raspa_sorteo'));
  r := random();
  pr := case when r < 0.80 then '5' when r < 0.95 then '10' else 'regalo' end;
  if pr = 'regalo' then
    select count(*) into regalos from public.raspa_juegos
     where premio = 'regalo' and (jugado_en at time zone 'America/Santo_Domingo')::date = (now() at time zone 'America/Santo_Domingo')::date;
    if regalos >= 3 then pr := '5'; end if;
  end if;
  update public.raspa_juegos set estado = 'jugado', premio = pr, telefono = tel, jugado_en = now(), vence_en = now() + interval '30 days'
   where id = j.id returning * into j;
  return jsonb_build_object('ok', true, 'premio', j.premio, 'codigo', j.codigo, 'vence_en', j.vence_en, 'estado', j.estado);
end $$;

-- ---------- Caja: buscar y canjear ----------
create or replace function public.raspa_buscar(p_q text)
returns table (codigo text, estado text, premio text, telefono text, vence_en timestamptz, codprefactura text,
               usado_en timestamptz, usado_por text, usado_codprefactura text, factura_id text)
language plpgsql stable security definer set search_path = public as $$
declare q text := upper(trim(coalesce(p_q, ''))); tel text := public._raspa_tel(p_q); tok text;
begin
  if not public.app_puede_prefactura() then raise exception 'No autorizado'; end if;
  -- el QR trae la dirección completa: se toma lo que viene después de «t=»
  tok := substring(p_q from 't=([0-9a-fA-F]{20,})');
  return query
    select j.codigo, case when j.estado = 'jugado' and j.vence_en < now() then 'vencido' else j.estado end, j.premio, j.telefono,
           j.vence_en, j.codprefactura, j.usado_en, j.usado_por, j.usado_codprefactura, j.factura_id
    from public.raspa_juegos j
    where j.codigo = q or (tok is not null and j.token = lower(tok)) or j.token = lower(trim(p_q))
       or (tel is not null and length(tel) = 10 and j.telefono = tel and j.estado = 'jugado' and j.vence_en >= now())
    order by j.jugado_en desc nulls last limit 10;
end $$;

create or replace function public.raspa_canjear(p_codigo text, p_codprefactura text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare j record;
begin
  if not public.app_puede_prefactura() then raise exception 'No autorizado'; end if;
  select * into j from public.raspa_juegos where codigo = upper(trim(p_codigo)) for update;
  if j.id is null then return jsonb_build_object('ok', false, 'motivo', 'no_existe'); end if;
  if j.estado = 'usado' then
    if j.usado_codprefactura = p_codprefactura then return jsonb_build_object('ok', true, 'ya', true); end if;
    return jsonb_build_object('ok', false, 'motivo', 'usado', 'usado_codprefactura', j.usado_codprefactura, 'usado_en', j.usado_en, 'usado_por', j.usado_por);
  end if;
  if j.estado <> 'jugado' then return jsonb_build_object('ok', false, 'motivo', j.estado); end if;
  if j.vence_en < now() then return jsonb_build_object('ok', false, 'motivo', 'vencido'); end if;
  if j.codprefactura = p_codprefactura then return jsonb_build_object('ok', false, 'motivo', 'misma_compra'); end if;
  update public.raspa_juegos set estado = 'usado', usado_en = now(), usado_por = public._raspa_actor(), usado_codprefactura = p_codprefactura
   where id = j.id;
  return jsonb_build_object('ok', true);
end $$;

-- Deshacer un canje (solo admin), por si la prefactura no se cobró.
create or replace function public.raspa_deshacer_canje(p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.app_is_admin() then raise exception 'No autorizado'; end if;
  update public.raspa_juegos set estado = 'jugado', usado_en = null, usado_por = null, usado_codprefactura = null
   where codigo = upper(trim(p_codigo)) and estado = 'usado';
  return jsonb_build_object('ok', found);
end $$;

-- Activación automática cada hora (después de copiar las ventas de Info Plus, que corre a los :07).
create or replace function public.raspa_auto_activar_todo()
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select id from public.raspa_juegos where estado = 'pendiente' and creado_en > now() - interval '5 days' loop
    if public._raspa_auto_activar(r.id) then n := n + 1; end if;
  end loop;
  return n;
end $$;

revoke all on function public._raspa_actor(), public._raspa_tel(text), public._raspa_codigo(), public._raspa_auto_activar(uuid),
  public.raspa_auto_activar_todo() from public, anon, authenticated;
revoke all on function public.raspa_tope_articulo(text), public.raspa_topes(text[]), public.raspa_emitir(text), public.raspa_activar(text, text),
  public.raspa_buscar(text), public.raspa_canjear(text, text), public.raspa_deshacer_canje(text), public.raspa_ver(text), public.raspa_jugar(text, text)
  from public, anon;
grant execute on function public.raspa_topes(text[]), public.raspa_emitir(text), public.raspa_activar(text, text),
  public.raspa_buscar(text), public.raspa_canjear(text, text), public.raspa_deshacer_canje(text) to authenticated;
grant execute on function public.raspa_ver(text), public.raspa_jugar(text, text) to anon, authenticated;

do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'raspa_auto_activar';
    perform cron.schedule('raspa_auto_activar', '17 * * * *', 'select public.raspa_auto_activar_todo()');
  end if;
end $$;
