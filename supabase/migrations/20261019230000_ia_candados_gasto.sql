-- 19 oct 2026 (dueño: «sí, aplica los 3 candados»): candados de gasto de la IA de WhatsApp.
-- Ver docs/bitacora/2026-10-19-2340-claude-ia-candados-gasto.md

-- Candado 1: los borradores de seguimiento (copiloto/automático) quedan apagados por defecto.
-- En 60 días se usaron ~6 de ~560 sugerencias. Reactivar por sucursal con:
--   update whatsapp_ia_config set borradores_seguimiento = true where sucursal_id = '…';
alter table public.whatsapp_ia_config
  add column if not exists borradores_seguimiento boolean not null default false;
comment on column public.whatsapp_ia_config.borradores_seguimiento is
  'Si es true, whatsapp-ia-responder redacta un borrador con IA para cada mensaje de seguimiento (copiloto/automático). Default false para ahorrar crédito de Anthropic. El saludo, el precio de pantalla y el financiamiento no dependen de esto.';

-- Candado 2: tope diario de llamadas a Anthropic (día de RD), consumido de forma atómica.
create table if not exists public.whatsapp_ia_uso_diario (
  dia date primary key,
  llamadas integer not null default 0,
  rechazadas integer not null default 0,
  actualizado_en timestamptz not null default now()
);
alter table public.whatsapp_ia_uso_diario enable row level security;
comment on table public.whatsapp_ia_uso_diario is
  'Llamadas a la IA (Anthropic) por día de RD desde whatsapp-ia-responder; "rechazadas" = las que no se hicieron por llegar al tope.';

create or replace function public.ia_consumir_cupo(p_tope integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia date := (now() at time zone 'America/Santo_Domingo')::date;
  v_ok integer;
begin
  insert into whatsapp_ia_uso_diario (dia) values (v_dia) on conflict (dia) do nothing;
  update whatsapp_ia_uso_diario
     set llamadas = llamadas + 1, actualizado_en = now()
   where dia = v_dia and llamadas < p_tope
  returning llamadas into v_ok;
  if v_ok is null then
    update whatsapp_ia_uso_diario set rechazadas = rechazadas + 1, actualizado_en = now() where dia = v_dia;
    return false;
  end if;
  return true;
end;
$$;
revoke all on function public.ia_consumir_cupo(integer) from public, anon, authenticated;
grant execute on function public.ia_consumir_cupo(integer) to service_role;
