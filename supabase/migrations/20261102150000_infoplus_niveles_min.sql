-- 2-nov-2026 — Precio mínimo por nivel (dueño: el empleado sube el precio libre y lo baja hasta el mínimo).
-- Aplicada el 2-nov-2026. Info Plus no deja leer el mínimo (bitácoras 2026-10-20-0930/0945): lo guarda
-- infoplus-precio-actualizar cuando el administrador edita los precios desde el sistema.
alter table public.infoplus_articulos add column if not exists niveles_min jsonb;
comment on column public.infoplus_articulos.niveles_min is 'Precio mínimo por nivel de Info Plus ({"1":n,"2":n}); lo llena infoplus-precios-sync. La prefactura no deja bajar el precio de ahí (dueño, 2-nov-2026).';
