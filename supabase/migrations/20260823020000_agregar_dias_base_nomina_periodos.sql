-- Bug: al reabrir un periodo de nomina para corregir a UN empleado, el
-- "dias base" usado para prorratear el salario por dias trabajados se
-- reseteaba siempre a 23.83 (el default), en vez de recordar el valor
-- real que se uso cuando se guardo el periodo. Eso recalculaba mal (y
-- sobreescribia si se guardaba) el salario de CUALQUIER empleado con
-- dias_trabajados distinto de null, aunque nadie hubiera tocado su linea.
alter table public.nomina_periodos add column if not exists dias_base numeric;
comment on column public.nomina_periodos.dias_base is 'Dias base usado para prorratear salario por dias trabajados en este periodo (evita que al reabrir se resetee al default y recalcule mal).';
