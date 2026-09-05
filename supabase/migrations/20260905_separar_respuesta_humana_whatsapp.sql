-- Un saludo automático informa al cliente, pero no sustituye el seguimiento
-- de una persona. Este campo permite calcular la cola "Por responder" sin
-- cerrar un hilo solo porque el bot envió la bienvenida.
alter table public.whatsapp_hilos
  add column if not exists ultima_respuesta_humana_at timestamptz;

-- Conserva el historial: para los hilos existentes, toma la última salida
-- que no fue generada automáticamente.
update public.whatsapp_hilos h
set ultima_respuesta_humana_at = fuente.ultima_respuesta_humana_at
from (
  select hilo_id, max(creado_en) as ultima_respuesta_humana_at
  from public.whatsapp_mensajes
  where direccion = 'out'
    and coalesce(es_automatico, false) = false
  group by hilo_id
) fuente
where h.id = fuente.hilo_id
  and (h.ultima_respuesta_humana_at is null or h.ultima_respuesta_humana_at < fuente.ultima_respuesta_humana_at);

create index if not exists whatsapp_hilos_linea_pendientes_humanos_idx
  on public.whatsapp_hilos (linea_id, ultimo_inbound_at desc, ultima_respuesta_humana_at desc);
