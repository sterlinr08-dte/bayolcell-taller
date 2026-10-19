-- 19 oct 2026 (dueño: «si»): el crédito de US$200 del plan Max vence el 24-oct-2026.
-- Hasta ese día (hora RD) se prenden los borradores de seguimiento y el tope diario sube a 400.
-- El 25-oct a las 00:05 RD un trabajo de pg_cron los apaga solo y se borra. El tope vuelve a 150 por fecha.

create or replace function public.ia_consumir_cupo(p_tope integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia date := (now() at time zone 'America/Santo_Domingo')::date;
  v_tope integer := case when v_dia <= date '2026-10-24' then greatest(p_tope, 400) else p_tope end;
  v_ok integer;
begin
  insert into whatsapp_ia_uso_diario (dia) values (v_dia) on conflict (dia) do nothing;
  update whatsapp_ia_uso_diario
     set llamadas = llamadas + 1, actualizado_en = now()
   where dia = v_dia and llamadas < v_tope
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

update public.whatsapp_ia_config set borradores_seguimiento = true where not borradores_seguimiento;

select cron.schedule(
  'ia-borradores-fin-credito-24oct',
  '5 4 25 10 *',  -- 25-oct 04:05 UTC = 00:05 RD
  $job$
    update public.whatsapp_ia_config set borradores_seguimiento = false where borradores_seguimiento;
    select cron.unschedule('ia-borradores-fin-credito-24oct');
  $job$
);
