-- Respaldo de las líneas de venta que infoplus-ventas-sync (v19) quita porque Info Plus ya no las devuelve
-- (facturas anuladas o líneas corregidas). APLICADA el 6-nov-2026.
create table if not exists public.infoplus_ventas_borradas (
  borrado_en timestamptz not null default now(),
  motivo text not null default 'ya no existe en Info Plus',
  fila jsonb not null
);
alter table public.infoplus_ventas_borradas enable row level security;
revoke all on public.infoplus_ventas_borradas from anon, public, authenticated;
grant all on public.infoplus_ventas_borradas to service_role;
create policy infoplus_ventas_borradas_leer on public.infoplus_ventas_borradas
  for select to authenticated using ((select app_puede_contabilidad()));
grant select on public.infoplus_ventas_borradas to authenticated;
-- Tarea diaria (job 13, 06:37 UTC = 2:37 a. m. RD): relee 40 días y quita lo anulado.
-- select cron.schedule('infoplus-ventas-limpieza-40d', '37 6 * * *', $$ select net.http_post(url := '.../functions/v1/infoplus-ventas-sync', headers := '{...anon...}'::jsonb, body := '{"dias":40}'::jsonb, timeout_milliseconds := 150000); $$);
