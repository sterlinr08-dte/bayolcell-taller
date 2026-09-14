-- Flujo de aprobacion para cambios de estado de ordenes_reparacion:
-- el tecnico PROPONE un cambio de estado (queda en estado_propuesto*) y
-- servicio al cliente o un administrador lo ACEPTA (se aplica a "estado")
-- o lo RECHAZA (se descarta). El campo "estado" real no cambia hasta que
-- se acepta -- asi el tecnico no es juez y parte de su propio avance.
alter table public.ordenes_reparacion
  add column if not exists estado_propuesto text,
  add column if not exists estado_propuesto_por text,
  add column if not exists estado_propuesto_en timestamptz,
  add column if not exists estado_propuesto_nota text,
  add column if not exists estado_propuesto_solucion text;

comment on column public.ordenes_reparacion.estado_propuesto is 'Estado que el tecnico propuso cambiar (null = sin propuesta pendiente). Se aplica a "estado" solo cuando servicio/admin lo acepta.';
