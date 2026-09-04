import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { crearClienteDB, identidadDesdeJWT, tieneAccesoASucursal, mandarAZernio, esTimeout, json, cors } from "./_shared/inbox-common.ts";

// instagram-enviar — responde un hilo de Instagram Direct existente.
//
// Instagram NO puede iniciar conversaciones en frio via API (politica de
// Meta) — esta funcion solo opera sobre hilos ya creados por un mensaje
// entrante real (instagram-webhook). No hay equivalente aqui al
// "ventana_cerrada -> hace falta plantilla" de WhatsApp: Instagram usa
// exactamente UN mecanismo para escribir fuera de la ventana de 24h —
// messagingType:"MESSAGE_TAG" + messageTag:"HUMAN_AGENT" (el UNICO tag que
// Instagram acepta, a diferencia de Facebook que tiene 4) — se aplica
// automaticamente aca cuando hace falta, no hay que elegir nada.
//
// conversationId: se usa hilo.zernio_conversation_id (el id de thread
// NATIVO de Instagram que guardo instagram-webhook), NO el participant_id
// — Zernio documenta explicitamente que para Instagram/Facebook estos dos
// valores son distintos y no deben confundirse.
//
// replyTo (citar un mensaje) no se implementa: Meta rechaza reply_to en el
// envio a Instagram y Zernio lo documenta como "silently ignored" — no
// tiene sentido mandarlo.
//
// Ubicacion/contacto/plantillas de WhatsApp no existen en Instagram — esos
// campos simplemente no aplican aca.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZERNIO_API_KEY = Deno.env.get("ZERNIO_API_KEY") ?? "";

const db = crearClienteDB(SUPABASE_URL, SERVICE_ROLE_KEY);

const TIPO_A_ATTACHMENT: Record<string, string> = { imagen: "image", documento: "file", video: "video", audio: "audio" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Metodo no permitido" }, 405);
  if (!ZERNIO_API_KEY) return json({ ok: false, error: "Falta ZERNIO_API_KEY en el proyecto" }, 500);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Body invalido" }, 400);
  }

  const hiloId = body.hilo_id as string;
  const mensaje = (body.mensaje as string || "").trim();
  const adjunto = (body.adjunto || null) as { url: string; tipo: string; nombre?: string } | null;

  if (!hiloId) return json({ ok: false, error: "Falta hilo_id" }, 400);
  if (!mensaje && !adjunto) return json({ ok: false, error: "El mensaje esta vacio" }, 400);

  const { data: hilo, error: hiloError } = await db
    .from("instagram_hilos")
    .select("id, cuenta_id, zernio_conversation_id, ultimo_inbound_at")
    .eq("id", hiloId)
    .maybeSingle();
  if (hiloError || !hilo) return json({ ok: false, error: "Hilo no encontrado" }, 404);
  if (!hilo.zernio_conversation_id) return json({ ok: false, error: "Hilo sin conversationId de Zernio — no se puede enviar" }, 500);
  if (!hilo.cuenta_id) return json({ ok: false, error: "Hilo sin cuenta de Instagram asignada" }, 500);

  const { data: cuenta, error: cuentaError } = await db
    .from("instagram_cuentas")
    .select("zernio_account_id, sucursal_id")
    .eq("id", hilo.cuenta_id)
    .maybeSingle();
  if (cuentaError || !cuenta?.zernio_account_id) return json({ ok: false, error: "Cuenta sin cuenta de Zernio configurada" }, 500);

  const { tipo, refId } = identidadDesdeJWT(req);
  const autorizado = await tieneAccesoASucursal(db, tipo, refId, cuenta.sucursal_id);
  if (!autorizado) return json({ ok: false, error: "sin_permiso", mensaje: "No tenes acceso a esta cuenta de Instagram." }, 403);

  const fueraDeVentana =
    !hilo.ultimo_inbound_at || (Date.now() - new Date(hilo.ultimo_inbound_at).getTime()) / 3600000 > 24;

  const campos: Record<string, unknown> = {};
  if (adjunto) {
    campos.attachmentUrl = adjunto.url;
    campos.attachmentType = TIPO_A_ATTACHMENT[adjunto.tipo] || "file";
    if (mensaje) campos.message = mensaje;
  } else {
    campos.message = mensaje;
  }
  if (fueraDeVentana) {
    campos.messagingType = "MESSAGE_TAG";
    campos.messageTag = "HUMAN_AGENT";
  }

  let resultado;
  try {
    resultado = await mandarAZernio(ZERNIO_API_KEY, hilo.zernio_conversation_id, cuenta.zernio_account_id, campos, crypto.randomUUID());
  } catch (e) {
    if (esTimeout(e)) {
      console.error("Zernio no respondio a tiempo:", e instanceof Error ? e.message : String(e));
      return json({ ok: false, error: "zernio_timeout", mensaje: "Zernio no respondio a tiempo." }, 504);
    }
    console.error("fetch a Zernio fallo:", e instanceof Error ? e.message : String(e));
    return json({ ok: false, error: "No se pudo contactar a Zernio" }, 502);
  }

  if (!resultado.ok) {
    console.error("Zernio rechazo el envio:", resultado.status, JSON.stringify(resultado.data));
    return json({ ok: false, error: "zernio_error", detalle: resultado.data }, 502);
  }

  const ahora = new Date().toISOString();
  let tipoContenido = "text";
  const cuerpoGuardado: string | null = mensaje || null;
  let preview = mensaje.slice(0, 200);

  if (adjunto) {
    tipoContenido = adjunto.tipo;
    preview =
      adjunto.tipo === "imagen" ? "📷 Foto"
      : adjunto.tipo === "video" ? "🎬 Video"
      : adjunto.tipo === "audio" ? "🎤 Audio"
      : `📎 ${adjunto.nombre || "Documento"}`;
  }

  // Instagram/Facebook: cuando se manda adjunto + texto juntos, Zernio lo
  // parte en 2 mensajes de Meta bajo el capó (no hay un solo body shape
  // para ambos) — messageId es el del adjunto, partialFailure indica si el
  // texto de seguimiento fue rechazado aunque el adjunto sí se entregó.
  const zernioMsgId: string | null = resultado.data?.data?.messageId ?? null;
  const partialFailure = resultado.data?.data?.partialFailure ?? null;

  const { error: msgError } = await db.from("instagram_mensajes").insert({
    hilo_id: hiloId,
    direccion: "out",
    tipo_contenido: tipoContenido,
    cuerpo: cuerpoGuardado,
    zernio_message_id: zernioMsgId,
    estado: "enviado",
    es_automatico: false,
    enviado_por_tipo: tipo,
    enviado_por_id: refId,
    metadata: partialFailure ? { partialFailure } : null,
  });
  if (msgError) console.error("insertar mensaje saliente instagram error:", msgError.message);

  await db
    .from("instagram_hilos")
    .update({ ultimo_mensaje_at: ahora, ultimo_mensaje_preview: preview, actualizado_en: ahora })
    .eq("id", hiloId);

  return json({ ok: true, messageId: zernioMsgId, partialFailure });
});
