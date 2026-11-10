-- 10-nov-2026 (dueño: «Publícalo y compártela»). Accesos rápidos de «Texto de estado» de la ventana «Imprimir label»,
-- iguales en todas las computadoras. NULL = usar CLASE A · CLASE B · CLASE C. Hasta 10 textos.
alter table public.config_taller add column if not exists label_estados jsonb;
comment on column public.config_taller.label_estados is 'Accesos rápidos de «Texto de estado» del label de Reacondicionados (lista de textos, máx. 10). NULL = lista por defecto. 10-nov-2026.';
alter table public.config_taller drop constraint if exists config_taller_label_estados_lista;
alter table public.config_taller add constraint config_taller_label_estados_lista check (label_estados is null or (jsonb_typeof(label_estados) = 'array' and jsonb_array_length(label_estados) <= 10));
