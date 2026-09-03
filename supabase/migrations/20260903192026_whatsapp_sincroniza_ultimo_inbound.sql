-- Mantiene la ventana de servicio de 24h alineada con los mensajes reales.
-- El webhook ya actualiza el hilo, pero esta regla evita bloqueos falsos si
-- el mensaje se inserta y la actualizacion posterior del hilo no se completa.
create or replace function public.whatsapp_sincronizar_ultimo_inbound()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.whatsapp_hilos
     set ultimo_inbound_at = greatest(
           coalesce(ultimo_inbound_at, new.creado_en),
           new.creado_en
         ),
         ultimo_mensaje_at = greatest(
           coalesce(ultimo_mensaje_at, new.creado_en),
           new.creado_en
         ),
         ultimo_mensaje_preview = case
           when new.creado_en >= coalesce(ultimo_mensaje_at, '-infinity'::timestamptz)
             then coalesce(nullif(new.cuerpo, ''), '[' || new.tipo_contenido || ']')
           else ultimo_mensaje_preview
         end,
         actualizado_en = now()
   where id = new.hilo_id;

  return new;
end;
$$;

drop trigger if exists whatsapp_mensaje_entrante_sincroniza_ventana
  on public.whatsapp_mensajes;

create trigger whatsapp_mensaje_entrante_sincroniza_ventana
after insert on public.whatsapp_mensajes
for each row
when (new.direccion = 'in')
execute function public.whatsapp_sincronizar_ultimo_inbound();

-- Repara los hilos existentes usando la fecha real de sus mensajes entrantes.
with ultimos as (
  select hilo_id, max(creado_en) as ultimo_in
  from public.whatsapp_mensajes
  where direccion = 'in'
  group by hilo_id
)
update public.whatsapp_hilos h
   set ultimo_inbound_at = u.ultimo_in,
       ultimo_mensaje_at = greatest(
         coalesce(h.ultimo_mensaje_at, u.ultimo_in),
         u.ultimo_in
       ),
       actualizado_en = now()
  from ultimos u
 where h.id = u.hilo_id
   and h.ultimo_inbound_at is distinct from u.ultimo_in;
