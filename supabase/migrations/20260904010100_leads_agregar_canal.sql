-- leads.hilo_id/linea_id no tienen FK (son referencias blandas) y hasta hoy
-- solo apuntaban a whatsapp_hilos/whatsapp_lineas. Con instagram_hilos
-- naciendo como tabla separada, sin esta columna no hay forma de saber a
-- que tabla resolver un hilo_id dado -- exactamente el tipo de ambiguedad
-- silenciosa que causo la corrupcion de whatsapp_hilos. Default 'whatsapp'
-- para no romper ninguna fila/consulta existente.
alter table public.leads add column canal text not null default 'whatsapp'
  check (canal in ('whatsapp','instagram','facebook'));
