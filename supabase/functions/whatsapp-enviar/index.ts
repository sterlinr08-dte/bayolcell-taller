import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// whatsapp-enviar — responde un hilo de WhatsApp existente desde la bandeja.
//
// Regla de negocio clave: solo se puede responder libre si el hilo tiene un
// mensaje entrante del cliente en las ultimas 24h. Fuera de esa ventana hace
// falta una plantilla aprobada — ver bloque de plantilla mas abajo.
//
// Envio a una conversacion YA ABIERTA: POST
// /v1/inbox/conversations/{conversationId}/messages, usando el numero de
// telefono (E.164 sin '+') como conversationId — O el businessScopedUserId
// (prefijo "bsid:" en telefono_e164) para contactos que escribieron desde un
// anuncio "click to WhatsApp" y cuyo numero real Meta nunca revela (ver fix
// 2026-09-03 abajo).
//
// Responder citando (2026-09-03): body.responde_a_id (uuid de
// whatsapp_mensajes) es opcional. Si viene, se manda replyTo a Zernio con el
// wa_message_id del mensaje original — si el envio CON replyTo falla con un
// 4xx (Zernio rechazando el campo) se reintenta UNA vez sin ese campo antes
// de dar error, para que citar nunca bloquee el envio del mensaje en si. Un
// 5xx/timeout NO reintenta — es ambiguo (el mensaje pudo haberse enviado
// igual del lado de Zernio) y reintentar arriesgaba mandar el mismo mensaje
// dos veces al cliente real (fix 2026-09-04, auditoria). responde_a_id
// siempre se guarda localmente sin importar si Zernio acepto o no el campo.
//
// Adjuntos/ubicacion/contacto (2026-09-03): body.adjunto / body.ubicacion /
// body.contacto son opcionales y mutuamente excluyentes entre si (mensaje SI
// puede acompañar a un adjunto como caption). Zernio acepta dos formas de
// enviar: JSON (attachmentUrl — requiere una URL PUBLICAMENTE accesible; una
// signed URL de Supabase Storage cuenta) o multipart/form-data (sube el
// archivo binario directo, y con voiceNote:"true" Zernio TRANSCODIFICA el
// audio server-side a ogg/Opus). Para foto/documento/video se usa siempre la
// via JSON (mas simple, no hay que descargar/resubir bytes). Para NOTAS DE
// VOZ se usa siempre la via multipart, sin importar en que formato grabo el
// navegador — asi cubre iPhone/Safari (que graba audio/mp4, no ogg/Opus) sin
// ninguna deteccion de mime type: esta funcion descarga lo que el navegador
// ya subio a Storage (la misma signed URL) y lo reenvia a Zernio como
// multipart, dejando que Zernio transcodifique.
//
// Plantillas (2026-09-04): body.plantilla es opcional y mutuamente excluyente
// con adjunto/ubicacion/contacto — es el UNICO caso que se manda aun con la
// ventana de 24h cerrada (es exactamente el mecanismo de Meta para eso). El
// frontend ya manda el texto final (variables ya resueltas) en `mensaje` para
// que se guarde y se vea igual que cualquier otro mensaje de texto en el
// hilo; `plantilla.variables`/`variablesNombradas` solo se usan para armar el
// request real hacia Zernio. Contrato verificado en vivo contra
// docs.zernio.com (no adivinado): POST .../messages con
// { messageType:"template", template:{ name, language, variableMapping:{
// body_text:[[...]] | body_text_named_params:[{param_name,example}],
// header_handle:["url"] } } }.
//
// Fix 2026-09-03 (contactos de anuncios sin telefono real): un contacto que
// escribe desde un anuncio "click to WhatsApp" de Meta no tiene numero real
// visible — whatsapp-webhook guarda su businessScopedUserId prefijado
// "bsid:" en telefono_e164 en vez de forzar un numero falso. Aqui, si el
// hilo tiene ese prefijo, se manda el id tal cual (sin el prefijo) como
// conversationId — la Cloud API de Meta acepta el businessScopedUserId como
// destinatario igual que un numero para estas conversaciones.
//
// Fix 2026-09-04 (autorizacion por sucursal — auditoria): antes, cualquier
// cuenta con sesion valida podia enviar a CUALQUIER hilo_id de cualquier
// sucursal/linea con solo conocer el UUID — identidadDesdeJWT se leia recien
// DESPUES de enviar, solo para atribucion, nunca como control de acceso.
// Ahora se verifica ANTES de mandar nada: un 'usuario' (admin unico del
// sistema) pasa siempre; un 'tecnico' solo si es admin (tipo_empleado/rol) o
// si su sucursal_id coincide con la sucursal de la linea del hilo.
//
// Fix 2026-09-04 (timeout explicito a Zernio — auditoria): las llamadas a
// Zernio no tenian ningun limite de tiempo propio — si Zernio quedaba lento
// sin caerse, la funcion colgaba hasta el limite de la plataforma sin dar
// ningun feedback distinto de "no se pudo contactar". Ahora cada fetch a
// Zernio usa AbortSignal.timeout, y un timeout se reporta distinto de un
// error de red para que el frontend sepa que puede no ser seguro reintentar.
//
// Fix 2026-09-05 (reintento en "conversation not found"): el dueño reporto
// mensajes que fallaban con "No se pudo enviar el mensaje" a un contacto de
// anuncio (bsid) real, de forma intermitente -- el mismo hilo mandaba bien
// segundos/minutos antes y despues del fallo. Se confirmo en los logs de la
// funcion (function_logs, no function_edge_logs -- ahi solo esta el
// console.error real de Zernio) que la causa es Zernio devolviendo
// 404 {"code":"CONVERSATION_NOT_FOUND","error":"Conversation not found. Use
// the conversation id from the list conversations endpoint."} de forma
// intermitente para esa conversacion especifica. A diferencia de un
// 5xx/timeout (ambiguo, el mensaje pudo haberse enviado igual), un 404
// "conversation not found" es INEQUIVOCO: Zernio nunca proceso el envio, asi
// que reintentar aca no arriesga mandar el mensaje dos veces al cliente
// real. Se agrega un reintento automatico (hasta 2 veces, con una pausa
// corta) especificamente para este codigo de error, en los 3 tipos de envio
// (mensaje/adjunto, nota de voz, plantilla).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZERNIO_API_KEY = Deno.env.get("ZERNIO_API_KEY") ?? "";
const ZERNIO_TIMEOUT_MS = 20000;

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function identidadDesdeJWT(req: Request): { tipo: string | null; refId: string | null } {
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const payloadB64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    const meta = payload.user_metadata || {};
    return { tipo: meta.tipo ?? null, refId: meta.ref_id ?? null };
  } catch {
    return { tipo: null, refId: null };
  }
}

async function tieneAccesoALinea(tipo: string | null, refId: string | null, sucursalIdLinea: string): Promise<boolean> {
  if (tipo === "usuario") return true; // admin unico del sistema
  if (tipo === "tecnico" && refId) {
    const { data: tecnico } = await db.from("tecnicos").select("sucursal_id, tipo_empleado, rol").eq("id", refId).maybeSingle();
    if (!tecnico) return false;
    if (tecnico.tipo_empleado === "admin" || tecnico.rol === "admin") return true;
    return tecnico.sucursal_id === sucursalIdLinea;
  }
  return false;
}

function esTimeout(e: unknown): boolean {
  return e instanceof DOMException && e.name === "TimeoutError";
}

type ResultadoZernio = { ok: boolean; data: any; status: number };

// Ver "Fix 2026-09-05" arriba: Zernio a veces no reconoce todavia una
// conversacion recien creada/actualizada. Es un 404 inequivoco (nunca llego
// a procesar el envio), asi que reintentar es seguro.
function esConversacionNoEncontrada(resultado: ResultadoZernio): boolean {
  return resultado.status === 404 && resultado.data?.code === "CONVERSATION_NOT_FOUND";
}

async function esperar(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function reintentarSiConversacionNoEncontrada(
  resultado: ResultadoZernio,
  reintentar: () => Promise<ResultadoZernio>,
  maxIntentos = 2
): Promise<ResultadoZernio> {
  let actual = resultado;
  for (let intento = 1; intento <= maxIntentos && esConversacionNoEncontrada(actual); intento++) {
    console.error(`Zernio: conversacion no encontrada (404), reintentando ${intento}/${maxIntentos} en 2s...`);
    await esperar(2000);
    actual = await reintentar();
  }
  return actual;
}

async function mandarAZernio(conversationId: string, accountId: string, campos: Record<string, unknown>, replyTo?: string | null): Promise<ResultadoZernio> {
  const body: Record<string, unknown> = { accountId, ...campos };
  if (replyTo) body.replyTo = replyTo;
  const resp = await fetch(`https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ZERNIO_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ZERNIO_TIMEOUT_MS),
  });
  const data = await resp.json().catch(() => null);
  return { ok: resp.ok && !!data?.success, data, status: resp.status };
}

// Notas de voz: SIEMPRE via multipart (ver comentario de arriba). Descarga el
// archivo que el navegador ya subio a Storage (su signed URL) y lo reenvia a
// Zernio como form-data, dejando que transcodifique a ogg/Opus.
async function mandarAZernioNotaVoz(conversationId: string, accountId: string, audioUrl: string, replyTo?: string | null): Promise<ResultadoZernio> {
  const audioResp = await fetch(audioUrl, { signal: AbortSignal.timeout(ZERNIO_TIMEOUT_MS) });
  if (!audioResp.ok) throw new Error(`No se pudo descargar el audio subido (status ${audioResp.status})`);
  const blob = await audioResp.blob();
  const form = new FormData();
  form.append("accountId", accountId);
  form.append("attachment", blob, "nota-voz");
  form.append("voiceNote", "true");
  if (replyTo) form.append("replyTo", replyTo);
  const resp = await fetch(`https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    // Sin Content-Type a mano: fetch arma "multipart/form-data; boundary=..."
    // solo cuando el body es un FormData. Fijarlo manualmente rompe el boundary.
    headers: { Authorization: `Bearer ${ZERNIO_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(ZERNIO_TIMEOUT_MS),
  });
  const data = await resp.json().catch(() => null);
  return { ok: resp.ok && !!data?.success, data, status: resp.status };
}

const TIPO_A_ATTACHMENT: Record<string, string> = { imagen: "image", documento: "file", video: "video" };

interface Plantilla {
  nombre: string;
  idioma: string;
  variables?: string[];
  variablesNombradas?: { param_name: string; text: string }[];
  headerUrl?: string;
}

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
  const respondeAId = (body.responde_a_id as string) || null;
  const adjunto = (body.adjunto || null) as { url: string; path: string; tipo: string; nombre?: string; es_nota_voz?: boolean } | null;
  const ubicacion = (body.ubicacion || null) as { lat: number; lng: number } | null;
  const contacto = (body.contacto || null) as { nombre: string; telefono?: string } | null;
  const plantilla = (body.plantilla || null) as Plantilla | null;

  if (!hiloId) return json({ ok: false, error: "Falta hilo_id" }, 400);
  if (!mensaje && !adjunto && !ubicacion && !contacto && !plantilla) return json({ ok: false, error: "El mensaje esta vacio" }, 400);
  if (plantilla && (!plantilla.nombre || !plantilla.idioma)) return json({ ok: false, error: "Plantilla incompleta (falta nombre o idioma)" }, 400);

  const { data: hilo, error: hiloError } = await db
    .from("whatsapp_hilos")
    .select("id, linea_id, telefono_e164, ultimo_inbound_at")
    .eq("id", hiloId)
    .maybeSingle();
  if (hiloError || !hilo) return json({ ok: false, error: "Hilo no encontrado" }, 404);

  // La ventana de 24h solo aplica a mensajes libres — una plantilla aprobada
  // es exactamente el mecanismo de Meta para escribir CUANDO esta cerrada.
  if (!plantilla) {
    if (!hilo.ultimo_inbound_at) {
      return json({ ok: false, error: "ventana_cerrada", mensaje: "Este hilo no tiene mensajes entrantes todavia — hace falta una plantilla aprobada." }, 409);
    }
    const horasDesdeUltimoInbound = (Date.now() - new Date(hilo.ultimo_inbound_at).getTime()) / 3600000;
    if (horasDesdeUltimoInbound > 24) {
      return json({ ok: false, error: "ventana_cerrada", mensaje: "Pasaron mas de 24h desde el ultimo mensaje del cliente — hace falta una plantilla aprobada." }, 409);
    }
  }

  if (!hilo.linea_id) return json({ ok: false, error: "Hilo sin linea de WhatsApp asignada" }, 500);

  const { data: linea, error: lineaError } = await db
    .from("whatsapp_lineas")
    .select("zernio_account_id, sucursal_id")
    .eq("id", hilo.linea_id)
    .maybeSingle();
  if (lineaError || !linea?.zernio_account_id) return json({ ok: false, error: "Linea sin cuenta de Zernio configurada" }, 500);

  const { tipo, refId } = identidadDesdeJWT(req);
  const autorizado = await tieneAccesoALinea(tipo, refId, linea.sucursal_id);
  if (!autorizado) return json({ ok: false, error: "sin_permiso", mensaje: "No tenes acceso a esta linea/sucursal." }, 403);

  const conversationId = hilo.telefono_e164.startsWith("bsid:") ? hilo.telefono_e164.slice(5) : hilo.telefono_e164;

  let replyToWaId: string | null = null;
  if (respondeAId) {
    const { data: original } = await db.from("whatsapp_mensajes").select("wa_message_id").eq("id", respondeAId).maybeSingle();
    replyToWaId = original?.wa_message_id ?? null;
  }

  let resultado: ResultadoZernio;
  try {
    if (plantilla) {
      const variableMapping: Record<string, unknown> = {};
      if (plantilla.variables?.length) variableMapping.body_text = [plantilla.variables];
      if (plantilla.variablesNombradas?.length) variableMapping.body_text_named_params = plantilla.variablesNombradas;
      if (plantilla.headerUrl) variableMapping.header_handle = [plantilla.headerUrl];
      const enviarPlantilla = () =>
        mandarAZernio(conversationId, linea.zernio_account_id, {
          messageType: "template",
          template: { name: plantilla.nombre, language: plantilla.idioma, variableMapping },
        });
      resultado = await enviarPlantilla();
      resultado = await reintentarSiConversacionNoEncontrada(resultado, enviarPlantilla);
    } else if (adjunto?.es_nota_voz) {
      resultado = await mandarAZernioNotaVoz(conversationId, linea.zernio_account_id, adjunto.url, replyToWaId);
      if (!resultado.ok && replyToWaId && resultado.status >= 400 && resultado.status < 500 && !esConversacionNoEncontrada(resultado)) {
        console.error("Nota de voz con replyTo fallo (4xx), reintentando sin citar:", resultado.status, JSON.stringify(resultado.data));
        resultado = await mandarAZernioNotaVoz(conversationId, linea.zernio_account_id, adjunto.url, null);
      }
      resultado = await reintentarSiConversacionNoEncontrada(resultado, () =>
        mandarAZernioNotaVoz(conversationId, linea.zernio_account_id, adjunto.url, replyToWaId)
      );
    } else {
      const campos: Record<string, unknown> = {};
      if (adjunto) {
        campos.attachmentUrl = adjunto.url;
        campos.attachmentType = TIPO_A_ATTACHMENT[adjunto.tipo] || "file";
        if (adjunto.tipo === "documento" && adjunto.nombre) campos.attachmentName = adjunto.nombre;
        if (mensaje) campos.message = mensaje;
      } else if (ubicacion) {
        campos.location = { latitude: ubicacion.lat, longitude: ubicacion.lng };
      } else if (contacto) {
        campos.contacts = [{
          name: { formatted_name: contacto.nombre },
          ...(contacto.telefono ? { phones: [{ phone: contacto.telefono }] } : {}),
        }];
      } else {
        campos.message = mensaje;
      }
      resultado = await mandarAZernio(conversationId, linea.zernio_account_id, campos, replyToWaId);
      if (!resultado.ok && replyToWaId && resultado.status >= 400 && resultado.status < 500 && !esConversacionNoEncontrada(resultado)) {
        // el campo replyTo pudo ser lo que Zernio rechazo (4xx) — reintenta sin el.
        // Un 5xx/timeout NO reintenta: es ambiguo, el mensaje pudo haberse
        // enviado igual, y reintentar arriesgaba un doble envio real al cliente.
        console.error("Envio con replyTo fallo (4xx), reintentando sin citar:", resultado.status, JSON.stringify(resultado.data));
        resultado = await mandarAZernio(conversationId, linea.zernio_account_id, campos, null);
      }
      resultado = await reintentarSiConversacionNoEncontrada(resultado, () =>
        mandarAZernio(conversationId, linea.zernio_account_id, campos, replyToWaId)
      );
    }
  } catch (e) {
    if (esTimeout(e)) {
      console.error("Zernio no respondio a tiempo:", e instanceof Error ? e.message : String(e));
      return json({ ok: false, error: "zernio_timeout", mensaje: "Zernio no respondio a tiempo. No reintentes automaticamente — verifica el hilo antes de mandar de nuevo." }, 504);
    }
    console.error("fetch a Zernio fallo:", e instanceof Error ? e.message : String(e));
    return json({ ok: false, error: "No se pudo contactar a Zernio" }, 502);
  }

  if (!resultado.ok) {
    console.error("Zernio rechazo el envio:", resultado.status, JSON.stringify(resultado.data));
    if (esConversacionNoEncontrada(resultado)) {
      return json({ ok: false, error: "zernio_error", mensaje: "Zernio todavia no reconoce esta conversacion. Espera unos segundos y vuelve a intentar.", detalle: resultado.data }, 502);
    }
    return json({ ok: false, error: "zernio_error", detalle: resultado.data }, 502);
  }

  const ahora = new Date().toISOString();

  let tipoContenido = "text";
  let cuerpoGuardado: string | null = mensaje || null;
  let mediaPath: string | null = null;
  let preview = mensaje.slice(0, 200);

  if (adjunto) {
    tipoContenido = adjunto.es_nota_voz ? "audio" : adjunto.tipo;
    mediaPath = adjunto.path;
    preview = adjunto.es_nota_voz ? "🎤 Nota de voz"
      : adjunto.tipo === "imagen" ? "📷 Foto"
      : adjunto.tipo === "video" ? "🎬 Video"
      : `📎 ${adjunto.nombre || "Documento"}`;
  } else if (ubicacion) {
    tipoContenido = "ubicacion";
    cuerpoGuardado = JSON.stringify({ lat: ubicacion.lat, lng: ubicacion.lng });
    preview = "📍 Ubicación";
  } else if (contacto) {
    tipoContenido = "contacto";
    cuerpoGuardado = JSON.stringify({ nombre: contacto.nombre, telefono: contacto.telefono || null });
    preview = `👤 ${contacto.nombre}`;
  }

  const { error: msgError } = await db.from("whatsapp_mensajes").insert({
    hilo_id: hiloId,
    direccion: "out",
    tipo_contenido: tipoContenido,
    cuerpo: cuerpoGuardado,
    media_path: mediaPath,
    responde_a_id: respondeAId,
    wa_message_id: resultado.data?.data?.messageId ?? null,
    estado: "enviado",
    es_automatico: false,
    enviado_por_tipo: tipo,
    enviado_por_id: refId,
    plantilla_nombre: plantilla?.nombre ?? null,
    plantilla_variables: plantilla ? JSON.stringify(plantilla.variables ?? plantilla.variablesNombradas ?? null) : null,
  });
  if (msgError) console.error("insertar mensaje saliente error:", msgError.message);

  await db.from("whatsapp_hilos").update({
    ultimo_mensaje_at: ahora,
    ultimo_mensaje_preview: preview,
    // Solo los envíos iniciados por un empleado cierran el pendiente humano.
    ultima_respuesta_humana_at: ahora,
    actualizado_en: ahora,
  }).eq("id", hiloId);

  return json({ ok: true, messageId: resultado.data?.data?.messageId ?? null });
});
