import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { crearClienteDB, verificarFirmaZernio, guardarAdjunto, tipoDeAdjunto } from "./_shared/inbox-common.ts";

// instagram-webhook — recibe eventos de Zernio para Instagram Direct.
//
// Identidad del contacto: a diferencia de WhatsApp, Instagram identifica al
// interlocutor por conversation.participantId (un IGSID estable, no un
// telefono) — Zernio documenta explicitamente que esta fuente es correcta
// tanto para mensajes entrantes como para el eco de mensajes salientes
// (message.sent): "the other party is conversation.participantId". No hay
// fallback a msg.sender como en WhatsApp porque en un eco msg.sender ES el
// propio negocio, y usarlo corrompería el contacto — la leccion del bug de
// WhatsApp (2026-09-03/04) se aplica aca desde el dia uno: se descarta
// cualquier evento cuyo participantId coincida con una cuenta de Instagram
// PROPIA conectada (trafico entre cuentas del negocio, no un cliente real).
//
// conversationId para enviar: Zernio documenta que para Instagram/Facebook
// el conversationId a usar en el envio es el id de thread NATIVO de la
// plataforma (conversation.platformConversationId), un valor opaco DISTINTO
// del participantId — "do not correlate the two by equality". Se guarda en
// instagram_hilos.zernio_conversation_id para que instagram-enviar lo use.
//
// Eventos manejados: message.received, message.sent, message.read
// (Instagram no emite message.delivered ni message.failed, a diferencia de
// WhatsApp — confirmado en la investigacion de la API de Zernio).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("ZERNIO_WEBHOOK_SECRET") ?? "";

const db = crearClienteDB(SUPABASE_URL, SERVICE_ROLE_KEY);

let cuentasCache: { id: string; sucursal_id: string; zernio_account_id: string | null; instagram_user_id: string | null }[] | null = null;

async function buscarCuentaPorZernioId(accountId?: string): Promise<{ sucursalId: string; cuentaId: string } | null> {
  if (!cuentasCache) {
    const { data } = await db
      .from("instagram_cuentas")
      .select("id, sucursal_id, zernio_account_id, instagram_user_id")
      .eq("activo", true);
    cuentasCache = data ?? [];
  }
  const c = cuentasCache.find((x) => x.zernio_account_id && x.zernio_account_id === accountId);
  return c ? { sucursalId: c.sucursal_id, cuentaId: c.id } : null;
}

// Ver comentario de cabecera: nunca crear/actualizar un hilo cuyo
// "cliente" resuelto sea en realidad una de nuestras propias cuentas.
function esCuentaPropia(participantId: string): boolean {
  if (!cuentasCache) return false;
  return cuentasCache.some((c) => c.instagram_user_id && c.instagram_user_id === participantId);
}

async function buscarMensajeLocalPorZernioId(id: string): Promise<string | null> {
  const { data, error } = await db.from("instagram_mensajes").select("id").eq("zernio_message_id", id).maybeSingle();
  if (error) {
    console.error("buscarMensajeLocalPorZernioId error:", error.message);
    return null;
  }
  return data?.id ?? null;
}

async function asegurarLead(sucursalId: string, hiloId: string, participantId: string, nombrePerfil: string | null, interes: string) {
  const { data: existente } = await db.from("leads").select("id").eq("hilo_id", hiloId).eq("canal", "instagram").maybeSingle();
  if (existente) return;
  const { error } = await db.from("leads").insert({
    sucursal_id: sucursalId,
    hilo_id: hiloId,
    canal: "instagram",
    nombre: nombrePerfil,
    telefono_e164: null,
    interes: interes.slice(0, 300),
    etapa: "nuevo",
  });
  if (error) console.error("crear lead instagram error:", error.message);
}

async function procesarMensaje(payload: any) {
  const msg = payload.message || {};
  const conv = payload.conversation || {};
  const account = payload.account || {};

  const destino = await buscarCuentaPorZernioId(account.id || account.accountId);
  if (!destino) {
    console.error("Sin cuenta de Instagram configurada para:", account.id, account.accountId);
    return;
  }
  const { sucursalId, cuentaId } = destino;

  const participantId: string | null = conv.participantId || null;
  if (!participantId) {
    console.error("Mensaje sin participantId identificable, se descarta");
    return;
  }
  if (esCuentaPropia(participantId)) {
    console.error(
      "El participante resuelto coincide con una cuenta de Instagram propia, se descarta el evento (trafico interno entre cuentas del negocio):",
      participantId,
      "cuenta:",
      account.id || account.accountId
    );
    return;
  }

  const esEntrante = msg.direction === "incoming";
  // El nombre solo se confia en mensajes entrantes — en un eco (message.sent)
  // el emisor es el propio negocio, no el cliente.
  const nombrePerfil = esEntrante ? (conv.participantName || null) : null;
  const participantUsername: string | null = conv.participantUsername || null;
  const ahora = new Date().toISOString();

  let tipoContenido = "text";
  let mediaPath: string | null = null;
  let originalType: string | null = null;
  const adjuntos = Array.isArray(msg.attachments) ? msg.attachments : [];
  if (adjuntos.length > 0) {
    const primero = adjuntos[0];
    tipoContenido = tipoDeAdjunto(primero.type || primero.originalType);
    originalType = primero.originalType || null;
    if (primero.url) mediaPath = await guardarAdjunto(db, "instagram-media", primero.url, tipoContenido);
  }
  const cuerpo = msg.text || (tipoContenido !== "text" ? `[${tipoContenido}]` : "");

  const quotedId: string | null = payload.metadata?.quotedMessageId || null;
  const respondeAId = quotedId ? await buscarMensajeLocalPorZernioId(quotedId) : null;

  const conversationId: string | null = conv.platformConversationId || conv.id || null;

  const { data: hiloExistente } = await db
    .from("instagram_hilos")
    .select("id, cliente_id, no_leidos_count, nombre_perfil, zernio_conversation_id")
    .eq("sucursal_id", sucursalId)
    .eq("participant_id", participantId)
    .maybeSingle();

  let hiloId: string;

  if (hiloExistente) {
    hiloId = hiloExistente.id;
    const actualizacion: Record<string, unknown> = {
      nombre_perfil: nombrePerfil ?? hiloExistente.nombre_perfil ?? undefined,
      participant_username: participantUsername ?? undefined,
      zernio_conversation_id: conversationId ?? hiloExistente.zernio_conversation_id ?? undefined,
      ultimo_mensaje_at: ahora,
      ultimo_mensaje_preview: cuerpo.slice(0, 200),
      actualizado_en: ahora,
    };
    if (esEntrante) {
      actualizacion.ultimo_inbound_at = ahora;
      actualizacion.no_leidos_count = (hiloExistente.no_leidos_count ?? 0) + 1;
    }
    await db.from("instagram_hilos").update(actualizacion).eq("id", hiloId);
  } else {
    const { data: nuevoHilo, error } = await db
      .from("instagram_hilos")
      .insert({
        sucursal_id: sucursalId,
        cuenta_id: cuentaId,
        participant_id: participantId,
        participant_username: participantUsername,
        zernio_conversation_id: conversationId,
        nombre_perfil: nombrePerfil,
        ultimo_mensaje_at: ahora,
        ultimo_inbound_at: esEntrante ? ahora : null,
        ultimo_mensaje_preview: cuerpo.slice(0, 200),
        no_leidos_count: esEntrante ? 1 : 0,
      })
      .select("id")
      .single();
    if (error || !nuevoHilo) {
      console.error("crear hilo instagram error:", error?.message);
      return;
    }
    hiloId = nuevoHilo.id;
  }

  const metadata: Record<string, unknown> = {};
  if (payload.metadata?.storyReply) metadata.storyReply = payload.metadata.storyReply;
  if (payload.metadata?.isStoryMention) metadata.isStoryMention = true;
  if (payload.metadata?.referral) metadata.referral = payload.metadata.referral;
  if (originalType) metadata.originalType = originalType;

  const zernioMsgId: string | null = msg.platformMessageId || msg.id || null;
  const registro = {
    hilo_id: hiloId,
    direccion: esEntrante ? "in" : "out",
    tipo_contenido: tipoContenido,
    cuerpo,
    media_path: mediaPath,
    zernio_message_id: zernioMsgId,
    responde_a_id: respondeAId,
    estado: esEntrante ? "recibido" : "enviado",
    es_automatico: false,
    metadata: Object.keys(metadata).length ? metadata : null,
  };
  const { error: msgError } = zernioMsgId
    ? await db.from("instagram_mensajes").upsert(registro, { onConflict: "zernio_message_id", ignoreDuplicates: true })
    : await db.from("instagram_mensajes").insert(registro);
  if (msgError) console.error("insertar mensaje instagram error:", msgError.message);

  if (esEntrante) {
    await asegurarLead(sucursalId, hiloId, participantId, nombrePerfil, cuerpo);
  }
}

async function procesarEstadoMensaje(payload: any) {
  const msg = payload.message || {};
  const idBuscado: string | null = msg.platformMessageId || msg.id || null;
  if (!idBuscado) return;
  const { error, count } = await db
    .from("instagram_mensajes")
    .update({ estado: "leido" }, { count: "exact" })
    .eq("zernio_message_id", idBuscado);
  if (error) console.error("actualizar estado instagram error:", error.message);
  else if (!count) console.error("actualizar estado instagram: no se encontro mensaje con zernio_message_id =", idBuscado);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();
  const firmaOk = await verificarFirmaZernio(rawBody, req.headers.get("X-Zernio-Signature"), WEBHOOK_SECRET);
  if (!firmaOk) {
    console.error("Webhook rechazado: firma invalida o ausente");
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const evento = payload.event as string;
    const plataforma: string | undefined = payload.message?.platform || payload.account?.platform;
    if (plataforma && plataforma !== "instagram") {
      console.error("Evento de otra plataforma llego a instagram-webhook, se ignora:", plataforma);
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (evento === "message.received" || evento === "message.sent") {
      await procesarMensaje(payload);
    } else if (evento === "message.read") {
      await procesarEstadoMensaje(payload);
    } else {
      console.error("Evento no manejado en instagram-webhook:", evento);
    }
  } catch (e) {
    console.error("instagram-webhook error:", e instanceof Error ? e.message : String(e));
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
