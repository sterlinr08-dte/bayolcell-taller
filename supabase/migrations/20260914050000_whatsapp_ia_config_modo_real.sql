-- Fase 1 de la hoja de ruta (revision externa 14 sept 2026): reemplazar el
-- interruptor binario "activo" por un modo real de 3 niveles, la base que
-- todo lo demas necesita antes de poder graduar capacidades.
--   observacion: el agente NO envia nada, ni siquiera el saludo, y no
--                 genera sugerencias (silencio total, solo para lineas
--                 nuevas que todavia no se quieren activar).
--   copiloto:    todo (saludo Y seguimientos) sale como sugerencia
--                 pendiente -- un empleado siempre revisa antes de enviar.
--   automatico:  el saludo de inicio de conversacion se auto-envia (como
--                 ya viene funcionando en produccion desde antes de esta
--                 hoja de ruta); los seguimientos SIGUEN siendo sugerencia
--                 (automatizar seguimientos requiere el marco de
--                 evaluacion/graduacion por capacidad, que es una fase
--                 posterior, no esta implementado todavia).
-- "activo" se mantiene como apagado general (si es false, no importa el
-- modo -- silencio total), tal como sugirio la revision externa.
alter table public.whatsapp_ia_config
  add column if not exists modo text not null default 'observacion'
  check (modo in ('observacion', 'copiloto', 'automatico'));

-- Las 3 sucursales ya tenian activo=true y el saludo YA se auto-enviaba en
-- vivo -- migrar a 'automatico' preserva el comportamiento actual en vez
-- de apagarlo silenciosamente. Un admin puede bajarlas a 'copiloto' u
-- 'observacion' desde el panel del CRM cuando quiera un arranque mas
-- gradual para una linea especifica.
update public.whatsapp_ia_config set modo = 'automatico' where activo = true;
