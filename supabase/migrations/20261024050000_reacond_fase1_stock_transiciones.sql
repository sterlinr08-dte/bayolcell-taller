-- 24-oct-2026 · Auditoría de Reacondicionados, fase 1 (R09 y R14).
-- Aplicado con el conector en bloques pequeños (sin DROP: el conector los retiene).

-- R09: ajuste atómico de stock en servidor (antes se calculaba desde el caché del navegador).
create or replace function public.ajustar_stock_pieza(p_pieza_id uuid, p_delta integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_antes integer; v_despues integer;
begin
  if not (public.app_is_admin() or public.app_actor_es_tecnico_activo()) then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  select cantidad into v_antes from public.piezas_inventario where id = p_pieza_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'pieza_no_existe'); end if;
  v_despues := greatest(0, coalesce(v_antes, 0) + coalesce(p_delta, 0));
  update public.piezas_inventario set cantidad = v_despues where id = p_pieza_id;
  return jsonb_build_object('ok', true, 'antes', coalesce(v_antes,0), 'cantidad', v_despues, 'truncado', (coalesce(v_antes,0) + coalesce(p_delta,0)) < 0);
end $$;
grant execute on function public.ajustar_stock_pieza(uuid, integer) to authenticated;
comment on function public.ajustar_stock_pieza is '24-oct-2026 (auditoría R09): ajuste atómico de stock en servidor; nunca baja de 0 y avisa si se truncó.';

-- R14: evidencia inmutable de cada cambio de estado, escrita por trigger (aparte de equipo_historial, que sigue siendo la nota libre de la app).
create table if not exists public.refurb_transiciones (
  id bigserial primary key,
  equipo_id uuid not null,
  estado_anterior text,
  estado_nuevo text,
  fecha_despacho_antes timestamptz,
  fecha_despacho_despues timestamptz,
  completado_antes boolean,
  completado_despues boolean,
  actor_type text,
  actor_ref_id uuid,
  actor_email text,
  fecha timestamptz not null default now()
);
comment on table public.refurb_transiciones is '24-oct-2026 (auditoría R14): evidencia inmutable de cada cambio de estado de equipos_refurbish, escrita por trigger. No se edita ni se borra desde la app.';
alter table public.refurb_transiciones enable row level security;
create index if not exists refurb_transiciones_equipo_idx on public.refurb_transiciones (equipo_id, fecha desc);
create policy refurb_transiciones_leer on public.refurb_transiciones for select to authenticated using (public.app_is_admin() or public.app_actor_es_tecnico_activo());

create or replace function public.trg_refurb_transicion()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_type text; v_ref uuid; v_email text;
begin
  if (new.estado_evaluacion is distinct from old.estado_evaluacion)
     or (new.fecha_despacho is distinct from old.fecha_despacho)
     or (new.completado is distinct from old.completado) then
    begin
      select actor_type, actor_ref_id into v_type, v_ref from public.app_actor_identity() limit 1;
    exception when others then v_type := null; v_ref := null; end;
    begin v_email := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', null); exception when others then v_email := null; end;
    insert into public.refurb_transiciones (equipo_id, estado_anterior, estado_nuevo, fecha_despacho_antes, fecha_despacho_despues, completado_antes, completado_despues, actor_type, actor_ref_id, actor_email)
    values (new.id, old.estado_evaluacion, new.estado_evaluacion, old.fecha_despacho, new.fecha_despacho, old.completado, new.completado, v_type, v_ref, v_email);
  end if;
  return new;
end $$;
create trigger trg_refurb_transicion after update on public.equipos_refurbish for each row execute function public.trg_refurb_transicion();
