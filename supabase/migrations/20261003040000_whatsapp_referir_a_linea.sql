-- 3 oct 2026 — «Pasar cliente a otra sucursal» (pedido del dueño: «si un cliente me escribe y me dice que es de
-- Santiago, que yo pueda pasarle ese contacto al número que usa la vendedora de Santiago, para que ella le escriba»).
-- Referir = el chat del cliente aparece en el CRM de la línea elegida (lo crea si no existe), marcado como no leído,
-- con quién lo pasó y la nota. La vendedora de esa línea le escribe desde SU número (botón «Escribirle»).
-- No cambia nada del chat de origen.

create table if not exists public.whatsapp_referidos (
  id uuid primary key default gen_random_uuid(),
  hilo_origen uuid references public.whatsapp_hilos(id) on delete set null,
  hilo_destino uuid not null references public.whatsapp_hilos(id) on delete cascade,
  linea_origen uuid, linea_destino uuid not null,
  de_tipo text, de_id uuid, de_nombre text,
  nota text,
  creado_en timestamptz not null default now()
);
create index if not exists whatsapp_referidos_destino_idx on public.whatsapp_referidos (hilo_destino, creado_en desc);
alter table public.whatsapp_referidos enable row level security;
create policy wr_select on public.whatsapp_referidos for select to authenticated
  using ((select app_is_admin()) or (select app_actor_es_tecnico_activo()));
revoke insert, update, delete on public.whatsapp_referidos from anon, authenticated;
grant select on public.whatsapp_referidos to authenticated;

create or replace function public.whatsapp_referir_a_linea(p_hilo uuid, p_linea uuid, p_nota text default null)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare yo_t text; yo_id uuid; h record; dest record; orig record; tel text; destino uuid; nom text; nota text; prev text;
begin
  select actor_type, actor_ref_id into yo_t, yo_id from public.app_actor_identity();
  if yo_t is null then raise exception 'sin_sesion'; end if;
  select id, linea_id, sucursal_id, telefono_e164, nombre_perfil, cliente_id, asignado_tipo, asignado_id into h
    from public.whatsapp_hilos where id = p_hilo;
  if h.id is null then raise exception 'chat_no_encontrado'; end if;
  if not (app_is_admin() or (app_actor_es_tecnico_activo() and (
          not app_actor_tiene_permiso('whatsapp_solo_sucursal') or h.sucursal_id = app_actor_sucursal_id()
          or app_actor_es_asignado(h.asignado_tipo, h.asignado_id)))) then
    raise exception 'sin_permiso';
  end if;
  if h.linea_id = p_linea then raise exception 'misma_linea'; end if;
  tel := regexp_replace(coalesce(h.telefono_e164, ''), '\D', '', 'g');
  if h.telefono_e164 like 'bsid:%' or length(tel) < 10 then raise exception 'sin_telefono'; end if;
  if length(tel) = 10 then tel := '1' || tel; end if;
  select l.id, l.sucursal_id, l.nombre, s.nombre as suc into dest
    from public.whatsapp_lineas l left join public.sucursales s on s.id = l.sucursal_id
    where l.id = p_linea and coalesce(l.activo, true);
  if dest.id is null then raise exception 'linea_no_valida'; end if;
  select l.nombre, s.nombre as suc into orig
    from public.whatsapp_lineas l left join public.sucursales s on s.id = l.sucursal_id where l.id = h.linea_id;
  if yo_t = 'tecnico' then select nombre into nom from public.tecnicos where id = yo_id; else nom := 'Administrador'; end if;
  nota := nullif(left(trim(coalesce(p_nota, '')), 500), '');
  prev := 'Referido de ' || coalesce(orig.suc || ' · ' || orig.nombre, 'otra línea') || coalesce(': ' || nota, '');

  -- Mismo número en la línea destino (como lo guarda el webhook: solo dígitos; se acepta también la forma con "+")
  select id into destino from public.whatsapp_hilos
    where linea_id = p_linea and telefono_e164 in (tel, '+' || tel)
    order by (telefono_e164 = tel) desc, ultimo_mensaje_at desc nulls last limit 1;
  if destino is null then
    insert into public.whatsapp_hilos (sucursal_id, linea_id, telefono_e164, nombre_perfil, cliente_id, estado,
                                       no_leidos_count, ultimo_mensaje_at, ultimo_mensaje_preview, creado_en, actualizado_en)
    values (dest.sucursal_id, p_linea, tel, h.nombre_perfil, h.cliente_id, 'abierto', 1, now(), prev, now(), now())
    returning id into destino;
  else
    update public.whatsapp_hilos set estado = 'abierto', no_leidos_count = greatest(coalesce(no_leidos_count, 0), 1),
      ultimo_mensaje_at = now(), ultimo_mensaje_preview = prev, cliente_id = coalesce(cliente_id, h.cliente_id),
      actualizado_en = now()
    where id = destino;
  end if;
  insert into public.whatsapp_referidos (hilo_origen, hilo_destino, linea_origen, linea_destino, de_tipo, de_id, de_nombre, nota)
  values (p_hilo, destino, h.linea_id, p_linea, yo_t, yo_id, nom, nota);
  return jsonb_build_object('ok', true, 'hilo_destino', destino, 'linea', coalesce(dest.suc || ' · ', '') || dest.nombre);
end $$;
revoke all on function public.whatsapp_referir_a_linea(uuid, uuid, text) from public, anon;
grant execute on function public.whatsapp_referir_a_linea(uuid, uuid, text) to authenticated;
