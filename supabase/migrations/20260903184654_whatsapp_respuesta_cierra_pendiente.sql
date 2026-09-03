-- Una respuesta saliente, venga del CRM o directamente de WhatsApp, deja el
-- hilo atendido siempre que sea posterior al ultimo mensaje del cliente.
-- La regla vive en la base para que no dependa de un proveedor o webhook.
create or replace function public.whatsapp_cerrar_pendiente_al_responder()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.whatsapp_hilos
     set ultimo_mensaje_at = greatest(
           coalesce(ultimo_mensaje_at, new.creado_en),
           new.creado_en
         ),
         ultimo_mensaje_preview = case
           when new.creado_en >= coalesce(ultimo_mensaje_at, '-infinity'::timestamptz)
             then coalesce(nullif(new.cuerpo, ''), '[' || new.tipo_contenido || ']')
           else ultimo_mensaje_preview
         end,
         no_leidos_count = case
           when ultimo_inbound_at is null or new.creado_en >= ultimo_inbound_at then 0
           else no_leidos_count
         end,
         actualizado_en = now()
   where id = new.hilo_id;

  return new;
end;
$$;

drop trigger if exists whatsapp_mensaje_saliente_cierra_pendiente
  on public.whatsapp_mensajes;

create trigger whatsapp_mensaje_saliente_cierra_pendiente
after insert on public.whatsapp_mensajes
for each row
when (new.direccion = 'out')
execute function public.whatsapp_cerrar_pendiente_al_responder();

-- Corrige los hilos que ya fueron respondidos pero conservaron el contador.
with fechas as (
  select
    hilo_id,
    max(creado_en) filter (where direccion = 'in') as ultimo_in,
    max(creado_en) filter (where direccion = 'out') as ultimo_out
  from public.whatsapp_mensajes
  group by hilo_id
)
update public.whatsapp_hilos h
   set no_leidos_count = 0,
       ultimo_mensaje_at = greatest(
         coalesce(h.ultimo_mensaje_at, f.ultimo_out),
         f.ultimo_out
       ),
       actualizado_en = now()
  from fechas f
 where h.id = f.hilo_id
   and f.ultimo_out > coalesce(f.ultimo_in, '-infinity'::timestamptz)
   and (
     h.no_leidos_count <> 0
     or h.ultimo_mensaje_at is null
     or h.ultimo_mensaje_at < f.ultimo_out
   );
