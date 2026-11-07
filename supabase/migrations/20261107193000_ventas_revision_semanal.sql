-- 07-nov-2026 · Ya aplicada en producción (tarea 14). Revisión semanal de la copia de ventas (dueño eligió «B»).
-- Cada domingo 07:41 UTC (03:41 RD) vuelve a pedir a Info Plus los últimos 120 días, en dos tramos de ≤ 62 días
-- (límite de infoplus-ventas-sync v20), para que las facturas anuladas o corregidas en Info Plus salgan de la copia.
-- Lo que se quita queda en infoplus_ventas_borradas. Los encabezados se copian de la tarea 2 (cada hora).
select cron.schedule('infoplus-ventas-revision-semanal', '41 7 * * 0',
  'select net.http_post(url := ''https://vkhwdvjtowrhkhqavnvk.supabase.co/functions/v1/infoplus-ventas-sync'', headers := ' ||
  quote_literal((select (regexp_match(command, $re$headers := '(\{[^']*\})'::jsonb$re$))[1] from cron.job where jobname='infoplus-ventas-sync-hora')) ||
  '::jsonb || jsonb_build_object(''x-sync-token'', (select decrypted_secret from vault.decrypted_secrets where name = ''ventas_sync_token'')), body := jsonb_build_object(''desde'', to_char(now() - interval ''120 days'', ''YYYY-FMMM-FMDD''), ''hasta'', to_char(now() - interval ''61 days'', ''YYYY-FMMM-FMDD'')), timeout_milliseconds := 150000); ' ||
  'select net.http_post(url := ''https://vkhwdvjtowrhkhqavnvk.supabase.co/functions/v1/infoplus-ventas-sync'', headers := ' ||
  quote_literal((select (regexp_match(command, $re$headers := '(\{[^']*\})'::jsonb$re$))[1] from cron.job where jobname='infoplus-ventas-sync-hora')) ||
  '::jsonb || jsonb_build_object(''x-sync-token'', (select decrypted_secret from vault.decrypted_secrets where name = ''ventas_sync_token'')), body := jsonb_build_object(''desde'', to_char(now() - interval ''60 days'', ''YYYY-FMMM-FMDD''), ''hasta'', to_char(now(), ''YYYY-FMMM-FMDD'')), timeout_milliseconds := 150000);'
);
