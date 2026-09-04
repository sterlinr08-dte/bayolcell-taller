import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// whatsapp-webhook — recibe eventos de Zernio (capa sobre la Cloud API de Meta).
// Una sucursal puede tener varias LINEAS de WhatsApp; se busca por
// whatsapp_lineas.zernio_account_id.
//
// Fix 2026-09-02 (adjuntos): attachment.url es una ruta relativa que exige
// el Bearer token de la API para descargarse (confirmado en vivo).
//
// Fix 2026-09-02 (estados de entrega/lectura): Zernio manda DOS ids por
// mensaje en el payload — payload.message.id (id interno de Zernio, tipo
// Mongo ObjectId) y payload.message.platformMessageId (el wamid real de
// WhatsApp). wa_message_id en nuestra tabla siempre guarda el wamid (asi lo
// guarda whatsapp-enviar desde la respuesta de Zernio al mandar). El codigo
// anterior comparaba contra payload.message.id (el interno), que nunca
// coincide — por eso message.delivered/message.read nunca actualizaban nada.
// Ahora se usa platformMessageId (con id como respaldo) en ambos lados.
//
// Fix 2026-09-02/03 (el cliente no podia citar): metadata.quotedMessageId va
// al nivel RAIZ del payload (hermano de "message"), no anidado dentro de
// "message" — confirmado en vivo con un caso real.
//
// Fix 2026-09-03 (identidad del contacto — v2): la primera version de este
// fix (usar msg.sender.phoneNumber, y businessScopedUserId de respaldo) solo
// es correcta para mensajes ENTRANTES. Un mensaje "outgoing" espejado por
// Coexistence (el empleado le escribio al cliente desde la app de WhatsApp
// del celular, no desde este sistema) llega como evento message.sent — pero
// ahi msg.sender es LA PROPIA LINEA DEL NEGOCIO (el que mando el mensaje),
// no el cliente. Usar sender.phoneNumber/businessScopedUserId en ese caso
// identifica mal al contacto. La fuente correcta, que funciona IGUAL para
// mensajes entrantes y para espejos salientes, es payload.conversation —
// describe la conversacion (con quien es el hilo), no el mensaje puntual.
//
// Fix 2026-09-03/04 (v3 — auditoria confirmo que v2 seguia corrompiendo
// datos en produccion): Zernio a veces manda conversation.participantId/
// participantUsername con formato de telefono valido PERO que en realidad
// es el numero de una de nuestras propias 5 lineas de WhatsApp (confirmado
// con 10 hilos reales corruptos, algunos "self" — la propia linea del hilo —
// y otros "cross-line" — el numero de OTRA linea del negocio). v2 nunca
// verificaba esto: aceptaba cualquier valor con forma de telefono sin
// chequear si en realidad era un numero propio. Ahora, antes de crear o
// actualizar cualquier hilo/lead, se descarta el evento si el telefono
// resuelto coincide con el whatsapp_numero de CUALQUIER linea activa del
// negocio (no solo la que disparo el evento) — nunca se usa como fallback
// silencioso. Ademas, el respaldo bsid (contactos de anuncios sin telefono
// real) ahora solo usa msg.sender.businessScopedUserId cuando el mensaje es
// ENTRANTE (en un espejo saliente sender es la propia linea, no el cliente),
// prefiriendo conversation.contactId (estable a nivel de conversacion) en
// cualquier otro caso.
//
// Fix 2026-09-04 (linea_id de un hilo ya no se pisa en cada mensaje): antes,
// cada mensaje de un hilo existente reescribia whatsapp_hilos.linea_id con
// la linea del mensaje mas reciente, mientras que leads.linea_id se fija una
// sola vez al crear el lead y nunca se resincroniza — un hilo que recibe
// mensajes por dos lineas distintas terminaba con linea_id desincronizado
// de su propio lead. Ahora el hilo conserva la linea con la que se creo,
// igual que el lead asociado.
//
// Fix 2026-09-04 (agente de IA): tras procesar un mensaje entrante real de
// un cliente, se dispara whatsapp-ia-responder (fire-and-forget, envuelto
// en try/catch propio) para que Claude Haiku decida si responde preguntas
// simples directo o redacta una sugerencia para que un tecnico la revise.
// Nunca puede romper ni retrasar el procesamiento normal del webhook.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("ZERNIO_WEBHOOK_SECRET") ?? "";
const ZERNIO_API_KEY = Deno.env.get("ZERNIO_API_KEY") ?? "";

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function esTelefono(v: unknown): v is string {
  return typeof v === "string" && /^\+?\d{7,15}$/.test(v);
}

function normalizarTelefono(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return "1" + digits;
  return digits;
}

function idMensaje(msg: any): string {
  return msg?.platformMessageId || msg?.id;
}

// Identificador del contacto para esta conversacion. conversation.* primero
// (correcto para entrante Y para espejo saliente); sender solo como ultimo
// respaldo opaco, y solo si el mensaje es entrante (en un espejo saliente
// sender es la propia linea del negocio, nunca el cliente).
function identificarContacto(payload: any): string | null {
  const conv = payload.conversation || {};
  const msg = payload.message || {};
  if (esTelefono(conv.participantId)) return normalizarTelefono(conv.participantId);
  if (esTelefono(conv.participantUsername)) return normalizarTelefono(conv.participantUsername);
  const scoped = (msg.direction === "incoming" ? msg.sender?.businessScopedUserId : null) || conv.contactId;
  if (scoped) return `bsid:${scoped}`;
  return null;
}

async function verificarFirma(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!WEBHOOK_SECRET) {
    console.error("ZERNIO_WEBHOOK_SECRET no configurado — rechazando por seguridad");
    return false;
  }
  if (!signatureHeader) return false;
  const recibida = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const calculada = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (calculada.length !== recibida.length) return false;
  let diff = 0;
  for (let i = 0; i < calculada.length; i++) diff |= calculada.charCodeAt(i) ^ recibida.charCodeAt(i);
  if (diff !== 0) console.error("Firma HMAC no coincide");
  return diff === 0;
}

let lineasCache: { id: string; sucursal_id: string; zernio_account_id: string | null; whatsapp_numero: string | null }[] | null = null;

async function buscarLineaPorCuenta(accountId?: string, accountId2?: string, accountUsername?: string): Promise<{ sucursalId: string; lineaId: string } | null> {
  if (!lineasCache) {
    const { data } = await db.from("whatsapp_lineas").select("id, sucursal_id, zernio_account_id, whatsapp_numero").eq("activo", true);
    lineasCache = data ?? [];
  }
  const porCuenta = lineasCache.find(
    (l) => l.zernio_account_id && (l.zernio_account_id === accountId || l.zernio_account_id === accountId2)
  );
  if (porCuenta) return { sucursalId: porCuenta.sucursal_id, lineaId: porCuenta.id };
  if (accountUsername) {
    const tel = normalizarTelefono(accountUsername);
    const porTelefono = lineasCache.find((l) => l.whatsapp_numero && normalizarTelefono(l.whatsapp_numero) === tel);
    if (porTelefono) return { sucursalId: porTelefono.sucursal_id, lineaId: porTelefono.id };
  }
  return null;
}

// El fallback de identificarContacto puede, por rarezas de datos de Zernio,
// devolver el numero de una de nuestras propias lineas de WhatsApp en vez
// del numero real del cliente (ver fix v3 arriba). Nunca crear/actualizar
// un hilo/lead con un telefono que en realidad es una linea propia activa.
function esNumeroDeLineaPropia(telefonoE164: string): boolean {
  if (!lineasCache) return false;
  const tel = (telefonoE164 || "").replace(/\D/g, "");
  if (!tel) return false;
  return lineasCache.some((l) => l.whatsapp_numero && normalizarTelefono(l.whatsapp_numero) === tel);
}

async function buscarClientePorTelefono(telefonoE164: string) {
  if (telefonoE164.startsWith("bsid:")) return null;
  const { data, error } = await db.from("clientes").select("id").eq("whatsapp_e164", telefonoE164).maybeSingle();
  if (error) {
    console.error("buscarClientePorTelefono error:", error.message);
    return null;
  }
  return data?.id ?? null;
}

function tipoDeAdjunto(tipo: string | undefined): string {
  const t = (tipo || "").toLowerCase();
  if (t.includes("image")) return "imagen";
  if (t.includes("audio") || t.includes("voice")) return "audio";
  if (t.includes("video")) return "video";
  return "documento";
}

function resolverUrlAdjunto(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://zernio.com${url.startsWith("/") ? "" : "/"}${url}`;
}

async function guardarAdjunto(urlCruda: string, categoria: string): Promise<string | null> {
  try {
    const url = resolverUrlAdjunto(urlCruda);
    const headers: Record<string, string> = {};
    if (ZERNIO_API_KEY) headers["Authorization"] = `Bearer ${ZERNIO_API_KEY}`;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      console.error("descarga de adjunto fallo, status:", r.status, "url:", url);
      return null;
    }
    const buf = await r.arrayBuffer();
    const contentType = r.headers.get("content-type") || "application/octet-stream";
    const ext = contentType.split("/")[1]?.split(";")[0]?.replace(/[^a-z0-9]/gi, "") || "bin";
    const path = `${categoria}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from("whatsapp-media").upload(path, buf, { contentType, upsert: false });
    if (error) {
      console.error("subir adjunto a storage error:", error.message);
      return null;
    }
    return path;
  } catch (e) {
    console.error("guardarAdjunto error:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

async function buscarMensajeLocalPorWaId(waId: string): Promise<string | null> {
  const { data, error } = await db.from("whatsapp_mensajes").select("id").eq("wa_message_id", waId).maybeSingle();
  if (error) {
    console.error("buscarMensajeLocalPorWaId error:", error.message);
    return null;
  }
  return data?.id ?? null;
}

async function asegurarLead(sucursalId: string, hiloId: string, lineaId: string, telefonoE164: string, nombrePerfil: string | null, interes: string, clienteId: string | null) {
  const { data: leadExistente } = await db.from("leads").select("id").eq("hilo_id", hiloId).maybeSingle();
  if (leadExistente) return;

  const { data: hilo } = await db.from("whatsapp_hilos").select("campana_id").eq("id", hiloId).maybeSingle();
  const campanaId = hilo?.campana_id ?? null;

  let asignadoTipo: string | null = null;
  let asignadoId: string | null = null;
  if (campanaId) {
    const { data: campana } = await db.from("campanas").select("asignado_tipo, asignado_id").eq("id", campanaId).maybeSingle();
    asignadoTipo = campana?.asignado_tipo ?? null;
    asignadoId = campana?.asignado_id ?? null;
  }

  const { error } = await db.from("leads").insert({
    sucursal_id: sucursalId,
    linea_id: lineaId,
    hilo_id: hiloId,
    cliente_id: clienteId,
    nombre: nombrePerfil,
    telefono_e164: telefonoE164,
    interes: interes.slice(0, 300),
    etapa: "nuevo",
    campana_id: campanaId,
    asignado_tipo: asignadoTipo,
    asignado_id: asignadoId,
  });
  if (error) console.error("crear lead error:", error.message);
}

// Dispara el agente de IA para este hilo en segundo plano. Zernio espera
// una respuesta 2xx en pocos segundos o reintenta la entrega del webhook
// (duplicando el procesamiento) — por eso esto NUNCA se espera (await)
// antes de devolver la respuesta del webhook. EdgeRuntime.waitUntil deja
// que el fetch siga corriendo despues de responder, sin arriesgar que Deno
// mate el isolate a mitad de la llamada (lo que pasaria con un fetch
// disparado sin mas una vez que la funcion ya devolvio su Response). Si
// Anthropic esta caido, sin API key configurada, o la sucursal tiene el
// agente apagado, el webhook sigue funcionando exactamente igual.
function dispararAgenteIA(hiloId: string, mensajeClienteId: string | null) {
  const promesa = fetch(`${SUPABASE_URL}/functions/v1/whatsapp-ia-responder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ hilo_id: hiloId, mensaje_cliente_id: mensajeClienteId }),
  }).catch((e) => console.error("no se pudo disparar whatsapp-ia-responder:", e instanceof Error ? e.message : String(e)));
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(promesa);
}

async function procesarMensaje(payload: any) {
  const msg = payload.message || {};
  const account = payload.account || {};
  const destino = await buscarLineaPorCuenta(account.id, account.accountId, account.username);
  if (!destino) {
    console.error("Sin linea/sucursal para cuenta:", account.id, account.accountId, account.username);
    return;
  }
  const { sucursalId, lineaId } = destino;

  const telefonoE164 = identificarContacto(payload);
  if (!telefonoE164) {
    console.error("Mensaje sin telefono ni id de contacto identificable, se descarta");
    return;
  }
  if (esNumeroDeLineaPropia(telefonoE164)) {
    console.error(
      "Contacto resuelto coincide con el numero de una linea propia del negocio, se descarta el evento:",
      telefonoE164,
      "evento:",
      payload.event,
      "cuenta:",
      account.id || account.accountId || account.username
    );
    return;
  }
  const esEntrante = msg.direction === "incoming";
  // El nombre solo es confiable cuando viene del REMITENTE en un mensaje
  // ENTRANTE (ahi sender = el cliente). En un espejo saliente sender es la
  // propia linea del negocio — no usar su nombre como si fuera el del cliente.
  const nombrePerfil = esEntrante ? (msg.sender?.name || null) : null;
  const ahora = new Date().toISOString();

  let tipoContenido = "text";
  let mediaPath: string | null = null;
  const adjuntos = Array.isArray(msg.attachments) ? msg.attachments : [];
  if (adjuntos.length > 0) {
    const primero = adjuntos[0];
    tipoContenido = tipoDeAdjunto(primero.type || primero.originalType || primero.mimeType);
    if (primero.url) mediaPath = await guardarAdjunto(primero.url, tipoContenido);
  }
  const cuerpo = msg.text || (tipoContenido !== "text" ? `[${tipoContenido}]` : "");

  const quotedWaId: string | null = payload.metadata?.quotedMessageId || null;
  const respondeAId = quotedWaId ? await buscarMensajeLocalPorWaId(quotedWaId) : null;

  const { data: hiloExistente } = await db
    .from("whatsapp_hilos")
    .select("id, cliente_id, no_leidos_count, nombre_perfil")
    .eq("sucursal_id", sucursalId)
    .eq("telefono_e164", telefonoE164)
    .maybeSingle();

  let hiloId: string;
  let clienteId: string | null;

  if (hiloExistente) {
    hiloId = hiloExistente.id;
    clienteId = hiloExistente.cliente_id;
    if (!clienteId) clienteId = await buscarClientePorTelefono(telefonoE164);
    const actualizacion: Record<string, unknown> = {
      // No pisar un nombre ya guardado con null (el espejo saliente no trae nombre confiable)
      nombre_perfil: nombrePerfil ?? hiloExistente.nombre_perfil ?? undefined,
      // linea_id NO se toca aqui: se fija una sola vez al crear el hilo,
      // igual que leads.linea_id, para que ambos queden siempre consistentes.
      ultimo_mensaje_at: ahora,
      ultimo_mensaje_preview: cuerpo.slice(0, 200),
      cliente_id: clienteId ?? undefined,
      actualizado_en: ahora,
    };
    if (esEntrante) {
      actualizacion.ultimo_inbound_at = ahora;
      actualizacion.no_leidos_count = (hiloExistente.no_leidos_count ?? 0) + 1;
    }
    await db.from("whatsapp_hilos").update(actualizacion).eq("id", hiloId);
  } else {
    clienteId = await buscarClientePorTelefono(telefonoE164);
    const { data: nuevoHilo, error } = await db
      .from("whatsapp_hilos")
      .insert({
        sucursal_id: sucursalId,
        linea_id: lineaId,
        telefono_e164: telefonoE164,
        cliente_id: clienteId,
        nombre_perfil: nombrePerfil,
        ultimo_mensaje_at: ahora,
        ultimo_inbound_at: esEntrante ? ahora : null,
        ultimo_mensaje_preview: cuerpo.slice(0, 200),
        no_leidos_count: esEntrante ? 1 : 0,
      })
      .select("id")
      .single();
    if (error || !nuevoHilo) {
      console.error("crear hilo error:", error?.message);
      return;
    }
    hiloId = nuevoHilo.id;
  }

  const { data: mensajeGuardado, error: msgError } = await db
    .from("whatsapp_mensajes")
    .upsert(
      {
        hilo_id: hiloId,
        direccion: esEntrante ? "in" : "out",
        tipo_contenido: tipoContenido,
        cuerpo,
        media_path: mediaPath,
        wa_message_id: idMensaje(msg),
        responde_a_id: respondeAId,
        estado: esEntrante ? "recibido" : "enviado",
        es_automatico: false,
      },
      { onConflict: "wa_message_id", ignoreDuplicates: true }
    )
    .select("id")
    .maybeSingle();
  if (msgError) console.error("insertar mensaje error:", msgError.message);

  if (esEntrante) {
    await asegurarLead(sucursalId, hiloId, lineaId, telefonoE164, nombrePerfil, cuerpo, clienteId);
    dispararAgenteIA(hiloId, mensajeGuardado?.id ?? null);
  }
}

async function procesarEstadoMensaje(payload: any, evento: string) {
  const mapaEstado: Record<string, string> = {
    "message.delivered": "entregado",
    "message.read": "leido",
    "message.failed": "fallido",
  };
  const estado = mapaEstado[evento];
  if (!estado) return;
  const msg = payload.message || {};
  const idBuscado = idMensaje(msg);
  const errorDetalle = payload.error ? JSON.stringify(payload.error).slice(0, 500) : null;
  const { error, count } = await db
    .from("whatsapp_mensajes")
    .update({ estado, error_detalle: errorDetalle }, { count: "exact" })
    .eq("wa_message_id", idBuscado);
  if (error) console.error("actualizar estado error:", error.message);
  else if (!count) console.error("actualizar estado: no se encontro mensaje con wa_message_id =", idBuscado);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();
  const firmaOk = await verificarFirma(rawBody, req.headers.get("X-Zernio-Signature"));
  if (!firmaOk) {
    console.error("Webhook rechazado: firma invalida o ausente");
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const evento = payload.event as string;
    if (evento === "message.received" || evento === "message.sent") {
      await procesarMensaje(payload);
    } else if (evento === "message.delivered" || evento === "message.read" || evento === "message.failed") {
      await procesarEstadoMensaje(payload, evento);
    } else {
      console.error("Evento no manejado:", evento);
    }
  } catch (e) {
    console.error("whatsapp-webhook error:", e instanceof Error ? e.message : String(e));
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
