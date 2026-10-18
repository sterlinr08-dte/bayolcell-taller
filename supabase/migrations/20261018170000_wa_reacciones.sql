-- WhatsApp del CRM igual que el original, fase 3 (18-oct-2026): reacciones con su emoji.
--
-- Zernio manda las reacciones como evento propio `reaction.received` (docs.zernio.com/webhooks/inbox):
-- reaction.action = added|removed, reaction.emoji (vacío al quitarla), reaction.platformMessageId = wamid del mensaje
-- al que se reacciona. El viejo texto "[reaction]" de message.sent no traía nada de eso (fase 1 lo oculta).
-- Se guarda una reacción por lado, como en WhatsApp: {"cliente": "👍", "negocio": "❤️"}.
-- Solo lectura/actualización de esa columna. No borra nada.

alter table public.whatsapp_mensajes add column if not exists reacciones jsonb;
comment on column public.whatsapp_mensajes.reacciones is 'Reacción actual de cada lado: {"cliente": emoji, "negocio": emoji}. La escribe wa_aplicar_reaccion.';

create or replace function public.wa_aplicar_reaccion(p_wamid text, p_quien text, p_emoji text)
returns text language plpgsql security invoker set search_path = public as $$
declare
  v_n integer;
begin
  if p_wamid is null or p_quien not in ('cliente', 'negocio') then
    return 'ignorado';
  end if;
  update public.whatsapp_mensajes
     set reacciones = case
           when nullif(btrim(coalesce(p_emoji, '')), '') is null then nullif(coalesce(reacciones, '{}'::jsonb) - p_quien, '{}'::jsonb)
           else coalesce(reacciones, '{}'::jsonb) || jsonb_build_object(p_quien, left(btrim(p_emoji), 16))
         end
   where wa_message_id = p_wamid;
  get diagnostics v_n = row_count;
  return case when v_n > 0 then 'aplicado' else 'sin_mensaje' end;
end $$;
revoke all on function public.wa_aplicar_reaccion(text, text, text) from public, anon, authenticated;
grant execute on function public.wa_aplicar_reaccion(text, text, text) to service_role;

-- ── Reversa ──
-- drop function if exists public.wa_aplicar_reaccion(text, text, text);
-- alter table public.whatsapp_mensajes drop column if exists reacciones;
