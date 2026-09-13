import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const secret = Deno.env.get("ZERNIO_WEBHOOK_SECRET") ?? "";

function hex(bytes: ArrayBuffer) { return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join(""); }
async function signature(body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
}
function json(data: unknown, status=200) { return new Response(JSON.stringify(data), {status, headers: {"Content-Type":"application/json"}}); }

// Fix 2026-09-13 (bug real, encontrado por Sterling: "no llegan mensajes" de
// Instagram/Facebook): Zernio esta mandando los eventos de Instagram A ESTE
// webhook (social-webhook), no al webhook dedicado de Instagram
// (instagram-webhook). Antes, esta funcion descartaba en silencio (200
// ignored:true) todo evento que no fuera facebook/tiktok -- confirmado en
// social_webhook_eventos: 32 eventos de Instagram, todos ignorados. En vez
// de duplicar aca toda la logica de Instagram (leads, adjuntos, cuenta
// propia, etc. -- ya construida y probada en instagram-webhook), se
// REENVIA tal cual el mismo body+firma a instagram-webhook, que la procesa
// con su logica real. whatsapp NO se reenvia (sigue llegando bien por su
// propio webhook dedicado; reenviarlo tambien arriesgaria procesarlo dos
// veces).
//
// Facebook (13 sept 2026): revisado -- solo hay 1 evento historico
// ("message.delivered" de un mensaje NUESTRO saliente), cero mensajes
// entrantes de clientes reales. No es un bug de esta funcion; sugiere que
// Zernio/Meta no esta mandando los webhooks de Messenger todavia (falta
// habilitar la suscripcion de mensajeria de la pagina del lado de Zernio).
async function reenviarAInstagram(raw: string, firma: string) {
  const base = Deno.env.get("SUPABASE_URL")!;
  const resp = await fetch(`${base}/functions/v1/instagram-webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Zernio-Signature": firma },
    body: raw,
  });
  return resp.status;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ok:false,error:"method_not_allowed"},405);
  const raw = await req.text();
  if (!secret) return json({ok:false,error:"webhook_secret_not_configured"},503);
  const supplied = req.headers.get("X-Zernio-Signature") ?? "";
  const expected = await signature(raw);
  if (supplied.length !== expected.length || !crypto.subtle) return json({ok:false,error:"invalid_signature"},401);
  let mismatch=0; for(let i=0;i<expected.length;i++) mismatch |= supplied.charCodeAt(i)^expected.charCodeAt(i);
  if (mismatch) return json({ok:false,error:"invalid_signature"},401);
  let p:any; try { p=JSON.parse(raw); } catch { return json({ok:false,error:"invalid_json"},400); }
  const eventId = p.id ?? p.eventId ?? crypto.randomUUID();
  const event = p.event ?? "";
  const msg = p.message ?? {};
  const accountId = p.account?.id ?? p.account?.accountId ?? msg.accountId ?? null;
  const platform = p.account?.platform ?? msg.platform ?? null;
  const { error: evErr } = await db.from("social_webhook_eventos").insert({zernio_event_id:eventId,evento:event,plataforma:platform,cuenta_zernio_id:accountId,payload:p});
  if (evErr && evErr.code !== "23505") return json({ok:false,error:"event_store_failed"},500);
  const yaProcesado = evErr?.code === "23505";
  if (platform === "instagram") {
    if (yaProcesado) return json({ok:true,deduplicated:true});
    try {
      const status = await reenviarAInstagram(raw, supplied);
      return json({ok:true,forwarded_to:"instagram-webhook",status});
    } catch (e) {
      console.error("social-webhook: fallo reenviando a instagram-webhook", e instanceof Error ? e.message : String(e));
      return json({ok:false,error:"forward_to_instagram_failed"},502);
    }
  }
  if (yaProcesado) return json({ok:true,deduplicated:true});
  if (!accountId || !["facebook","tiktok"].includes(platform)) return json({ok:true,ignored:true});
  const { data: cuenta } = await db.from("social_cuentas").select("id,sucursal_id").eq("zernio_account_id",accountId).eq("activo",true).maybeSingle();
  if (!cuenta) return json({ok:true,unmapped_account:true});
  const conv = p.conversation ?? {};
  const conversationId = conv.id ?? msg.conversationId ?? null;
  if (!conversationId) return json({ok:true,no_conversation:true});
  const participant = conv.participant ?? {};
  const participantId = conv.participantId ?? participant.id ?? msg.sender?.id ?? null;
  const participantUsername = conv.participantUsername ?? participant.username ?? msg.sender?.username ?? null;
  const participantName = conv.participantName ?? participant.name ?? msg.sender?.name ?? null;
  const incoming = msg.direction === "incoming" || event === "message.received";
  const now = p.timestamp ?? new Date().toISOString();
  const preview = msg.text ?? msg.body ?? (msg.attachments?.length ? "Adjunto" : "");
  const { data: hilo, error: hiloErr } = await db.from("social_hilos").upsert({
    cuenta_id:cuenta.id,sucursal_id:cuenta.sucursal_id,zernio_conversation_id:conversationId,
    participant_id:participantId,participant_username:participantUsername,participant_name:participantName,
    ultimo_mensaje_at:now,ultimo_mensaje_preview:preview,ultimo_inbound_at:incoming?now:undefined,
    no_leidos_count:incoming?undefined:undefined,actualizado_en:now
  }, {onConflict:"cuenta_id,zernio_conversation_id"}).select("id,no_leidos_count").single();
  if (hiloErr || !hilo) return json({ok:false,error:"thread_upsert_failed"},500);
  if (event.startsWith("message.")) {
    const status = event==="message.failed" ? "fallido" : event==="message.read" ? "leido" : event==="message.delivered" ? "entregado" : (incoming?"recibido":"enviado");
    const mid = msg.id ?? msg.platformMessageId ?? null;
    const {error:mErr}=await db.from("social_mensajes").upsert({
      hilo_id:hilo.id,direccion:incoming?"in":"out",tipo_contenido:msg.type ?? (msg.attachments?.length?"media":"text"),
      cuerpo:msg.text ?? msg.body ?? null,zernio_message_id:mid,estado:status,media_url:msg.attachments?.[0]?.url ?? null,
      metadata:p,creado_en:now
    },{onConflict:"zernio_message_id"});
    if(mErr && mErr.code!=="23505") return json({ok:false,error:"message_upsert_failed"},500);
    if(incoming) await db.from("social_hilos").update({no_leidos_count:(hilo.no_leidos_count??0)+1}).eq("id",hilo.id);
  }
  return json({ok:true,processed:true});
});
