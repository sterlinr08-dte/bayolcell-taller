-- WhatsApp del CRM igual que el original, fase 1 (18-oct-2026).
--
-- 1) Palomitas que se perdían. Cuando el empleado escribe desde el CELULAR, Zernio manda el «entregado» o «leído»
--    ANTES que el espejo del mensaje (message.sent). whatsapp-webhook buscaba el mensaje, no lo encontraba y botaba el
--    estado («actualizar estado: no se encontro mensaje», ~235 por día). Por eso ~11,000 mensajes del último mes se quedaron
--    con una sola palomita. Ahora el estado que llega antes se guarda en whatsapp_estados_pendientes y se aplica solo
--    cuando entra el mensaje (trigger BEFORE INSERT). Un candado por wa_message_id evita que se crucen los dos.
-- 2) Las palomitas nunca retroceden: un «entregado» que llega tarde ya no pisa un «leído».
--    Orden: enviado < fallido < entregado < leido. «recibido» (entrantes) no se toca.
-- 3) Columna meta (jsonb) para lo que trae el mensaje y no es el texto: reenviado y anuncio de origen (referral).
--
-- No borra ni cambia datos existentes. Los estados viejos que ya se perdieron NO se reparan aquí.

alter table public.whatsapp_mensajes add column if not exists meta jsonb;
comment on column public.whatsapp_mensajes.meta is 'Datos extra del mensaje de WhatsApp: {reenviado:bool, anuncio:{titulo,texto,imagen,url}}';

create table if not exists public.whatsapp_estados_pendientes (
  wa_message_id text primary key,
  estado text not null check (estado in ('entregado', 'leido', 'fallido')),
  error_detalle text,
  recibido_en timestamptz not null default now(),
  aplicado_en timestamptz
);
comment on table public.whatsapp_estados_pendientes is 'Estados de entrega/lectura que llegaron antes que su mensaje. Los escribe solo wa_aplicar_estado (service_role).';
alter table public.whatsapp_estados_pendientes enable row level security;
revoke all on public.whatsapp_estados_pendientes from anon, authenticated;

create or replace function public.wa_rango_estado(p text) returns integer
language sql immutable set search_path = public as $$
  select case p when 'enviado' then 10 when 'fallido' then 15 when 'entregado' then 20 when 'leido' then 30 else 0 end
$$;

create or replace function public.wa_aplicar_estado(p_wamid text, p_estado text, p_error text default null)
returns text language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid;
  v_actual text;
begin
  if p_wamid is null or p_estado is null or p_estado not in ('entregado', 'leido', 'fallido') then
    return 'ignorado';
  end if;
  -- Mismo candado que el trigger de inserción: o el mensaje ya está (y se actualiza), o el pendiente queda guardado
  -- antes de que el trigger lo busque. Nunca se pierde por cruzarse.
  perform pg_advisory_xact_lock(hashtext('wa_estado:' || p_wamid));
  select id, estado into v_id, v_actual from public.whatsapp_mensajes where wa_message_id = p_wamid for update;
  if found then
    if v_actual is distinct from 'recibido' and wa_rango_estado(p_estado) > wa_rango_estado(v_actual) then
      update public.whatsapp_mensajes
         set estado = p_estado,
             error_detalle = case when p_estado = 'fallido' then coalesce(p_error, error_detalle) else error_detalle end
       where id = v_id;
      return 'aplicado';
    end if;
    return 'sin_cambio';
  end if;
  insert into public.whatsapp_estados_pendientes (wa_message_id, estado, error_detalle)
  values (p_wamid, p_estado, p_error)
  on conflict (wa_message_id) do update set
    estado = case when wa_rango_estado(excluded.estado) > wa_rango_estado(whatsapp_estados_pendientes.estado)
                  then excluded.estado else whatsapp_estados_pendientes.estado end,
    error_detalle = coalesce(excluded.error_detalle, whatsapp_estados_pendientes.error_detalle),
    recibido_en = now();
  return 'pendiente';
end $$;
revoke all on function public.wa_aplicar_estado(text, text, text) from public, anon, authenticated;
grant execute on function public.wa_aplicar_estado(text, text, text) to service_role;

-- SECURITY DEFINER: la tabla de pendientes no tiene políticas; el trigger también corre cuando el CRM inserta.
create or replace function public.wa_trg_aplicar_estado_pendiente() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p record;
begin
  if new.wa_message_id is null or new.direccion is distinct from 'out' then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('wa_estado:' || new.wa_message_id));
  select estado, error_detalle into p
    from public.whatsapp_estados_pendientes
   where wa_message_id = new.wa_message_id and aplicado_en is null;
  if found then
    if wa_rango_estado(p.estado) > wa_rango_estado(new.estado) then
      new.estado := p.estado;
      if p.estado = 'fallido' then new.error_detalle := coalesce(new.error_detalle, p.error_detalle); end if;
    end if;
    update public.whatsapp_estados_pendientes set aplicado_en = now() where wa_message_id = new.wa_message_id;
  end if;
  return new;
end $$;
revoke all on function public.wa_trg_aplicar_estado_pendiente() from public, anon, authenticated;

create or replace trigger trg_wa_aplicar_estado_pendiente
  before insert on public.whatsapp_mensajes
  for each row execute function public.wa_trg_aplicar_estado_pendiente();

-- ── Reversa ──
-- drop trigger if exists trg_wa_aplicar_estado_pendiente on public.whatsapp_mensajes;
-- drop function if exists public.wa_trg_aplicar_estado_pendiente();
-- drop function if exists public.wa_aplicar_estado(text, text, text);
-- drop function if exists public.wa_rango_estado(text);
-- drop table if exists public.whatsapp_estados_pendientes;
-- alter table public.whatsapp_mensajes drop column if exists meta;
