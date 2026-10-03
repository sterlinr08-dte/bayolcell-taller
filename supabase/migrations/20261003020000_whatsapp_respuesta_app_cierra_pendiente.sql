-- 3 oct 2026 — Un chat respondido desde la app de WhatsApp del celular seguía saliendo como «Atender»
-- (pendiente) en el CRM. El pendiente se calcula con whatsapp_hilos.ultima_respuesta_humana_at y ese campo
-- solo lo escribía el código de whatsapp-webhook / whatsapp-enviar ANTES de guardar el mensaje. Si ese paso se
-- perdía (reintento de Zernio, carrera entre eventos, otro camino de guardado) el mensaje quedaba en el chat
-- pero el hilo seguía «sin responder». Medido: 36 chats abiertos con una respuesta humana posterior a la marca.
-- Ahora lo garantiza la base: todo mensaje saliente NO automático que se guarda adelanta la marca (nunca la
-- atrasa). Los automáticos (saludo/IA, es_automatico = true) siguen sin cerrar el pendiente.

create or replace function public.whatsapp_cerrar_pendiente_al_responder()
returns trigger
language plpgsql
set search_path to ''
as $function$
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
         ultima_respuesta_humana_at = case
           when coalesce(new.es_automatico, false) then ultima_respuesta_humana_at
           else greatest(coalesce(ultima_respuesta_humana_at, new.creado_en), new.creado_en)
         end,
         actualizado_en = now()
   where id = new.hilo_id;

  return new;
end;
$function$;

-- Corrige los chats que ya quedaron marcados mal (solo adelanta la marca a la última respuesta humana real).
update public.whatsapp_hilos h
   set ultima_respuesta_humana_at = f.ult
  from (
    select hilo_id, max(creado_en) as ult
      from public.whatsapp_mensajes
     where direccion = 'out' and not coalesce(es_automatico, false)
     group by hilo_id
  ) f
 where f.hilo_id = h.id
   and (h.ultima_respuesta_humana_at is null or h.ultima_respuesta_humana_at < f.ult);
