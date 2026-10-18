-- WhatsApp del CRM igual que el original, fase 2 (18-oct-2026): saber si una línea está desconectada.
--
-- Zernio avisa account.disconnected / account.connected (38 avisos en 30 días). social-webhook ya los guarda crudos en
-- social_webhook_eventos, pero nadie los usaba: si una línea se caía, el CRM seguía igual y los mensajes simplemente
-- dejaban de entrar. Este trigger copia el último estado a whatsapp_lineas (conectada, desde cuándo y el motivo) para que
-- la bandeja muestre un aviso, como WhatsApp Web cuando el teléfono pierde la conexión.
--
-- El trigger nunca hace fallar el guardado del evento (cualquier error se ignora) y no aplica avisos más viejos que el
-- último ya guardado. No borra nada.

alter table public.whatsapp_lineas add column if not exists conectada boolean not null default true;
alter table public.whatsapp_lineas add column if not exists conexion_cambio_en timestamptz;
alter table public.whatsapp_lineas add column if not exists motivo_desconexion text;
comment on column public.whatsapp_lineas.conectada is 'Último estado avisado por Zernio (account.connected / account.disconnected).';

create or replace function public.wa_trg_estado_conexion_linea() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_acc jsonb;
  v_tel text;
  v_desc boolean;
  v_ts timestamptz;
begin
  if new.plataforma is distinct from 'whatsapp' or new.evento not in ('account.connected', 'account.disconnected') then
    return new;
  end if;
  begin
    v_acc := coalesce(new.payload->'account', '{}'::jsonb);
    v_tel := regexp_replace(coalesce(v_acc->>'username', ''), '[^0-9]', '', 'g');
    v_desc := new.evento = 'account.disconnected';
    v_ts := case when coalesce(new.payload->>'timestamp', '') ~ '^\d{4}-\d{2}-\d{2}T'
                 then (new.payload->>'timestamp')::timestamptz else now() end;
    update public.whatsapp_lineas l
       set conectada = not v_desc,
           conexion_cambio_en = v_ts,
           motivo_desconexion = case when v_desc then left(coalesce(v_acc->>'reason', ''), 200) else null end
     where ((l.zernio_account_id is not null
             and l.zernio_account_id in (v_acc->>'accountId', v_acc->>'id', new.cuenta_zernio_id))
            or (v_tel <> '' and regexp_replace(coalesce(l.whatsapp_numero, ''), '[^0-9]', '', 'g') = v_tel))
       and (l.conexion_cambio_en is null or l.conexion_cambio_en <= v_ts);
  exception when others then
    raise warning 'wa_trg_estado_conexion_linea: %', sqlerrm;
  end;
  return new;
end $$;
revoke all on function public.wa_trg_estado_conexion_linea() from public, anon, authenticated;

create or replace trigger trg_wa_estado_conexion_linea
  after insert on public.social_webhook_eventos
  for each row execute function public.wa_trg_estado_conexion_linea();

-- ── Reversa ──
-- drop trigger if exists trg_wa_estado_conexion_linea on public.social_webhook_eventos;
-- drop function if exists public.wa_trg_estado_conexion_linea();
-- alter table public.whatsapp_lineas drop column if exists motivo_desconexion, drop column if exists conexion_cambio_en, drop column if exists conectada;
