-- 2-nov-2026 — Corrección ortográfica solo para ciertos empleados (dueño: «Alejandro y Omil … lo más
-- importante es que esté bien escrito»). Lista vacía = todos. Las funciones comparan con
-- auth_actor_bindings.actor_ref_id de quien envía. Sin sentencias destructivas.
alter table public.crm_ortografia_config
  add column if not exists empleados text[] not null default '{}';
comment on column public.crm_ortografia_config.empleados is
  'actor_ref_id de los empleados a los que se les corrige la escritura. Vacío = a todos. Si la columna no existe, las funciones envían el original (sin_config).';
