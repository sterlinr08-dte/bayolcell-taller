-- Horario estructurado (por dia de la semana, 0=domingo..6=sabado) para poder
-- determinar en CODIGO si una sucursal esta abierta ahora mismo, en vez de
-- dejar que el modelo interprete el texto libre de "horario" (riesgo de error
-- en un dato que afecta directo la experiencia del cliente). El campo
-- "horario" de texto libre se mantiene tal cual para mostrarlo legible.
alter table public.whatsapp_ia_config add column if not exists horario_json jsonb;

comment on column public.whatsapp_ia_config.horario_json is
  'Horario estructurado por dia (clave "0".."6", 0=domingo) -> {"o":"HH:MM","c":"HH:MM"} o null si cerrado ese dia. Hora local Republica Dominicana (America/Santo_Domingo, sin horario de verano).';

update public.whatsapp_ia_config set horario_json = '{
  "0": null,
  "1": {"o":"08:30","c":"18:00"},
  "2": {"o":"08:30","c":"18:00"},
  "3": {"o":"08:30","c":"18:00"},
  "4": {"o":"08:30","c":"18:00"},
  "5": {"o":"08:30","c":"18:00"},
  "6": {"o":"09:00","c":"16:00"}
}'::jsonb
where sucursal_id = '76ac5921-142b-4264-81c9-784e5affe345'; -- Santiago: L-V 8:30-18:00, Sab 9:00-16:00, Dom cerrado

update public.whatsapp_ia_config set horario_json = '{
  "0": null,
  "1": {"o":"08:00","c":"18:00"},
  "2": {"o":"08:00","c":"18:00"},
  "3": {"o":"08:00","c":"18:00"},
  "4": {"o":"08:00","c":"18:00"},
  "5": {"o":"08:00","c":"18:00"},
  "6": {"o":"08:00","c":"17:00"}
}'::jsonb
where sucursal_id = 'c3707ce6-357c-4ec9-9b02-6271e72b1165'; -- Moca: L-V 8:00-18:00, Sab 8:00-17:00, Dom cerrado

update public.whatsapp_ia_config set horario_json = '{
  "0": {"o":"09:00","c":"13:00"},
  "1": {"o":"09:00","c":"19:00"},
  "2": {"o":"09:00","c":"19:00"},
  "3": {"o":"09:00","c":"19:00"},
  "4": {"o":"09:00","c":"19:00"},
  "5": {"o":"09:00","c":"19:00"},
  "6": {"o":"09:00","c":"19:00"}
}'::jsonb
where sucursal_id = '18b297c2-7f53-4794-a6ca-d9885e9c841f'; -- Navarrete: L-Sab 9:00-19:00, Dom 9:00-13:00
