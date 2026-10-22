-- 22-oct-2026 · Prefactura (dueño): tope de descuento (%) configurable y descuento en pesos sobre toda la prefactura.
-- Ya aplicada en producción con execute_sql.
alter table public.config_taller add column if not exists prefactura_desc_max_pct numeric default 10;
alter table public.recepcion_prefacturas add column if not exists descuento_monto numeric default 0;
