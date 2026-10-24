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
// SUPERADO por el fix del 2026-09-12 de abajo: ya no puede pasar que "un
// hilo reciba mensajes por dos lineas distintas", porque el hilo ahora se
// busca/crea por (linea_id, telefono_e164) — dos lineas del mismo cliente
// son, por diseno, DOS hilos separados (cada linea es un numero distinto).
//
// Fix 2026-09-04 (agente de IA): tras procesar un mensaje entrante real de
// un cliente, se dispara whatsapp-ia-responder (fire-and-forget, envuelto
// en try/catch propio) para que Claude Haiku decida si responde preguntas
// simples directo o redacta una sugerencia para que un tecnico la revise.
// Nunca puede romper ni retrasar el procesamiento normal del webhook.
//
// Fix 2026-09-09 (conversationId real — RAIZ del "conversation not found"):
// se guarda whatsapp_hilos.zernio_conversation_id con el conversation.id que
// Zernio manda en cada evento. Para un contacto con telefono el atajo de usar
// el telefono como conversationId funcionaba (platformConversationId ==
// telefono), pero para un contacto de ANUNCIO el hilo se identifica como
// `bsid:<contactId>` y el contactId NO es un conversationId — por eso
// whatsapp-enviar/whatsapp-ia-responder recibian 404 al responderles. Medido:
// ningun mensaje salio del sistema hacia un contacto de anuncio entre el
// 2026-09-04 18:12 y ese fix.
//
// Fix 2026-09-11 (mensajes que llegaban en blanco): ver el bloque "RESULTADO
// DEL DIAGNOSTICO" mas abajo. Resumen: cuando WhatsApp no entrega el contenido
// de un mensaje, ahora se guarda un texto que explica el motivo real y que
// hacer, en vez de un "[Contenido de WhatsApp no visible]" que parecia una
// falla del sistema.
//
// Auditoria 2026-09-12 — 3 fixes:
//
// F15 (mezcla de conversaciones entre lineas de una misma sucursal): el hilo
// se buscaba/creaba por (sucursal_id, telefono_e164) — si un cliente le
// escribia a DOS lineas de la misma sucursal (ej. Santiago "Reparacion" y
// Santiago "Servicio al Cliente"), el segundo mensaje caia en el hilo creado
// por la primera linea y el empleado de la otra linea nunca lo veia. Otras
// partes del sistema (whatsapp-campanas.ensureHilo, whatsapp-importar-
// historial) ya buscaban por (linea_id, telefono_e164) -- solo este webhook
// (el camino en vivo) seguia con la clave vieja. Se corrigio la busqueda para
// usar linea_id (ya resuelto arriba via buscarLineaPorCuenta) + telefono, y
// la tabla ahora tiene su UNIQUE en (linea_id, telefono_e164) en vez de
// (sucursal_id, telefono_e164) -- ver migracion whatsapp_hilos_unique_por_linea.
// Verificado antes de migrar: 0 hilos con linea_id NULL, sin colisiones.
//
// F16 (fiabilidad ante repeticiones/fallos):
//  (a) no_leidos_count se incrementaba en el UPDATE del hilo ANTES de saber
//      si el insert del mensaje (upsert ignoreDuplicates por wa_message_id)
//      fue una fila NUEVA o un duplicado — un reintento de Zernio del MISMO
//      evento volvia a sumar el contador aunque el mensaje no se duplicara.
//      Ahora el mensaje se inserta primero (ya con el hiloId resuelto) y
//      no_leidos_count solo sube si el insert devolvio una fila (mensaje
//      nuevo, no ignorado por duplicado).
//  (b) ultimo_inbound_at/ultimo_mensaje_at/ultima_respuesta_humana_at y el
//      creado_en del mensaje usaban new Date() (hora del SERVIDOR) en vez del
//      timestamp del EVENTO -- afecta la ventana de 24h y el orden si hay
//      demora o reintento. Ahora se usa timestampDeEvento(payload), que
//      busca la fecha en varios campos posibles del payload de Zernio
//      (message.createdAt/timestamp/sentAt, conversation.updatedTime,
//      timestamp/createdAt de raiz) y cae a la hora del servidor solo si
//      ninguno viene o no es una fecha valida.
//  (c) el Deno.serve envolvia todo en try/catch y SIEMPRE respondia 200,
//      incluso ante una excepcion real de procesamiento -- Zernio nunca
//      reintentaba un fallo genuino. Ahora: (1) fallas de configuracion/datos
//      ya irrecuperables (cuenta sin linea mapeada, telefono no identificable,
//      numero propio) se siguen registrando y respondiendo 200 -- reintentar
//      no las arregla y Zernio reintentaria para siempre; (2) fallas reales
//      de escritura en la base (crear el hilo, insertar el mensaje, o
//      actualizar el estado de un mensaje) ahora SE LANZAN como excepcion, y
//      el catch de nivel superior responde 500 para que Zernio SI reintente.
//      La validacion de firma HMAC sigue devolviendo 401 sin pasar por este
//      catch (no cambia).

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

// F16(b): timestamp del EVENTO tal como lo manda Zernio, en vez de la hora en
// que este servidor termino de procesarlo. Se prueban varios campos posibles
// (el objeto "message" que entrega el webhook comparte esquema con el objeto
// "message" que devuelve la API REST de mensajes de Zernio -- ese SI trae
// createdAt, confirmado en whatsapp-importar-historial -- y con
// conversation.updatedTime, tambien usado ahi como fecha de conversacion) y
// se cae a null si ninguno es una fecha valida; el llamador usa la hora del
// servidor como ultimo recurso.
function timestampDeEvento(payload: any): string | null {
  const candidatos = [
    payload?.message?.createdAt,
    payload?.message?.timestamp,
    payload?.message?.sentAt,
    payload?.message?.sentTime,
    payload?.conversation?.updatedTime,
    payload?.timestamp,
    payload?.createdAt,
  ];
  for (const c of candidatos) {
    if (c === undefined || c === null || c === "") continue;
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
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

// Fix 2026-10-03 (chats ENTRE sucursales): la regla de arriba descartaba
// TAMBIEN los mensajes legitimos entre dos lineas del negocio (una empleada de
// Navarrete escribiendole desde su WhatsApp al de Santiago) -- desde el
// 2026-09-23 ningun chat interno se guardaba (logs: "se descarta el evento"
// varias veces por hora). Ahora:
//  - "self" (el contacto es la MISMA linea que recibe el evento) se sigue
//    descartando siempre: eso solo puede ser un dato cruzado de Zernio.
//  - "cross-line" (el contacto es OTRA linea del negocio) se acepta si se puede
//    comprobar que es real: en un ENTRANTE el remitente (sender) debe ser ese
//    mismo numero; en un espejo SALIENTE (message.sent) debe existir ya el hilo
//    de esa linea con ese numero (lo crea el primer entrante real).
function numeroDeLinea(lineaId: string): string {
  const l = lineasCache?.find((x) => x.id === lineaId);
  return l?.whatsapp_numero ? normalizarTelefono(l.whatsapp_numero) : "";
}
async function chatEntreSucursalesValido(lineaId: string, telefonoE164: string, msg: any, esEntrante: boolean): Promise<boolean> {
  const tel = (telefonoE164 || "").replace(/\D/g, "");
  if (!tel) return false;
  const propio = numeroDeLinea(lineaId);
  if (propio && propio === tel) return false; // "self": nunca
  if (esEntrante) {
    const remitente = normalizarTelefono(String(msg?.sender?.phoneNumber || msg?.sender?.username || msg?.from || ""));
    if (remitente) return remitente === tel;
  }
  const { data } = await db
    .from("whatsapp_hilos")
    .select("id")
    .eq("linea_id", lineaId)
    .in("telefono_e164", [tel, "+" + tel])
    .limit(1);
  if (data && data.length) return true;
  // Primer mensaje de un chat entre sucursales escrito desde el celular (espejo
  // saliente): el hilo de ESTA linea aun no existe. Se verifica por el otro lado:
  // la linea del contacto ya tiene un chat con el numero de esta linea (lo crea
  // el entrante real, que Zernio entrega antes que el espejo).
  const lineaDelContacto = lineasCache?.find((l) => l.whatsapp_numero && normalizarTelefono(l.whatsapp_numero) === tel);
  if (!lineaDelContacto || !propio) return false;
  const { data: otroLado } = await db
    .from("whatsapp_hilos")
    .select("id")
    .eq("linea_id", lineaDelContacto.id)
    .in("telefono_e164", [propio, "+" + propio])
    .limit(1);
  return !!(otroLado && otroLado.length);
}

// Los chats viejos entre sucursales se guardaron con "+" delante; los nuevos
// llegan sin "+". Para no abrir un chat repetido, se usa la forma que ya exista.
async function telefonoDeHiloExistente(lineaId: string, telefonoE164: string): Promise<string> {
  const tel = (telefonoE164 || "").replace(/\D/g, "");
  if (!tel || telefonoE164.startsWith("bsid:")) return telefonoE164;
  const { data } = await db
    .from("whatsapp_hilos")
    .select("telefono_e164")
    .eq("linea_id", lineaId)
    .in("telefono_e164", [tel, "+" + tel])
    .order("ultimo_mensaje_at", { ascending: false, nullsFirst: false })
    .limit(1);
  return data && data.length ? data[0].telefono_e164 : telefonoE164;
}

// Identificador del contacto para esta conversacion. conversation.* primero
// (correcto para entrante Y para espejo saliente); sender solo como ultimo
// respaldo opaco, y solo si el mensaje es entrante (en un espejo saliente
// sender es la propia linea del negocio, nunca el cliente).
//
// Fix 2026-09-04 (v4 — bsid duplicado por conversacion): confirmado en
// produccion con varios pares de hilos reales (mismo cliente, mismos
// segundos, mismo texto) que terminaban en DOS hilos distintos. Causa: para
// un mensaje entrante, el codigo preferia msg.sender.businessScopedUserId
// sobre conversation.contactId -- pero businessScopedUserId es un dato del
// REMITENTE de ESE mensaje puntual y no siempre es el mismo entre dos
// mensajes de la misma persona, mientras que contactId es estable a nivel
// de conversacion (el propio comentario de arriba ya lo decia, pero el
// codigo no lo aplicaba asi). Ahora contactId siempre gana cuando esta
// presente, sin importar la direccion; businessScopedUserId queda como
// ultimo respaldo solo cuando no hay contactId (y el mensaje es entrante).
function identificarContacto(payload: any): string | null {
  const conv = payload.conversation || {};
  const msg = payload.message || {};
  if (esTelefono(conv.participantId)) return normalizarTelefono(conv.participantId);
  if (esTelefono(conv.participantUsername)) return normalizarTelefono(conv.participantUsername);
  if (conv.contactId) return `bsid:${conv.contactId}`;
  const scoped = msg.direction === "incoming" ? msg.sender?.businessScopedUserId : null;
  if (scoped) return `bsid:${scoped}`;
  return null;
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
  if (t.includes("image") || t.includes("sticker")) return "imagen";
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

// ---- 24-oct-2026 · Formulario nativo de financiamiento (Meta Flow) ----
const PROVINCIAS_FLOW: Record<string, string> = { Dajabon: "Dajabón", Distrito_Nacional: "Distrito Nacional", El_Seibo: "El Seibo", Elias_Pina: "Elías Piña", Hato_Mayor: "Hato Mayor", Hermanas_Mirabal: "Hermanas Mirabal", La_Altagracia: "La Altagracia", La_Romana: "La Romana", La_Vega: "La Vega", Maria_Trinidad_Sanchez: "María Trinidad Sánchez", Monsenor_Nouel: "Monseñor Nouel", Monte_Cristi: "Monte Cristi", Monte_Plata: "Monte Plata", Puerto_Plata: "Puerto Plata", Samana: "Samaná", San_Cristobal: "San Cristóbal", San_Jose_de_Ocoa: "San José de Ocoa", San_Juan: "San Juan", San_Pedro_de_Macoris: "San Pedro de Macorís", Sanchez_Ramirez: "Sánchez Ramírez", Santiago_Rodriguez: "Santiago Rodríguez", Santo_Domingo: "Santo Domingo" };
function buscarNfmReply(obj: any, prof = 0): any {
  if (!obj || typeof obj !== "object" || prof > 6) return null;
  if (obj.nfm_reply && typeof obj.nfm_reply === "object") return obj.nfm_reply;
  if (obj.type === "nfm_reply" && (obj.response_json || obj.response)) return obj;
  for (const k of Object.keys(obj)) {
    const v = (obj as any)[k];
    if (v && typeof v === "object") { const r = buscarNfmReply(v, prof + 1); if (r) return r; }
  }
  return null;
}
function normalizarDatosFlow(raw: any): Record<string, string> {
  const s = (k: string) => String(raw?.[k] ?? "").trim();
  const prov = s("provincia");
  return {
    equipo: s("equipo"), precio: s("precio"), referencia: s("referencia"),
    cedula: s("cedula").replace(/\D/g, ""), nombres: s("nombres"), telefono: s("telefono"), plazo: s("plazo").replace(/\D/g, ""),
    provincia: PROVINCIAS_FLOW[prov] || prov.replace(/_/g, " "), municipio: s("municipio"), sector: s("sector"), calle: s("calle"), casa: s("casa"),
  };
}
function textoRespuestaFlow(d: Record<string, string>): string {
  return ["📋 SOLICITUD DE FINANCIAMIENTO (formulario)", `Equipo: ${d.equipo}`, `Precio: ${d.precio}`, `Cédula: ${d.cedula}`, `Nombre: ${d.nombres}`, `Teléfono: ${d.telefono}`,
    d.plazo ? `Plazo deseado: ${d.plazo} meses` : "", `Dirección: ${d.calle} No. ${d.casa}, ${d.sector}, ${d.municipio}, ${d.provincia}`].filter(Boolean).join("\n");
}
// 24-oct-2026 (dueño: «sí» a pedir las fotos): al llegar la respuesta del formulario se le piden al cliente, una sola vez,
// la foto de la cédula y el comprobante de domicilio. Mensaje automático, marcado como tal.
function textoPedirFotosFlow(nombre: string | null): string {
  const n = String(nombre || "").trim(); const saludo = n && !/^[+\d\s()-]+$/.test(n) ? `Gracias, ${n.split(/\s+/)[0]}.` : "Gracias.";
  // Dueño (24-oct): no pedir cédula ni documentos aquí; el banco evalúa primero.
  return `${saludo} Ya recibimos su solicitud de financiamiento y la pasamos al banco para que la evalúe. Esté siempre pendiente por si lo llaman del banco, por si necesitan alguna información adicional; en cuanto nos digan algo, le avisamos por aquí.\n\nBAYOL CELL`;
}
async function pedirFotosFlow(accountId: string | null, conversationId: string | null, hiloId: string, solicitudId: string | null, nombre: string | null) {
  if (!ZERNIO_API_KEY || !accountId || !conversationId || !solicitudId) return;
  try {
    const { data: ya } = await db.from("fin_solicitudes_whatsapp").select("fotos_pedidas_en").eq("id", solicitudId).maybeSingle();
    if (ya?.fotos_pedidas_en) return;
    const texto = textoPedirFotosFlow(nombre);
    const resp = await fetch(`https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${ZERNIO_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, message: texto }), signal: AbortSignal.timeout(20000),
    });
    const d = await resp.json().catch(() => null);
    if (!resp.ok || !d?.success) { console.error("flow financiamiento: no se pudo pedir las fotos", resp.status, d?.error || d?.message); return; }
    const ahora = new Date().toISOString();
    await db.from("whatsapp_mensajes").insert({ hilo_id: hiloId, direccion: "out", tipo_contenido: "text", cuerpo: texto, wa_message_id: d?.data?.messageId || d?.messageId || null, estado: "enviado", es_automatico: true, creado_en: ahora, meta: { flow: { auto: "pedir_fotos" } } });
    await db.from("whatsapp_hilos").update({ ultimo_mensaje_at: ahora, ultimo_mensaje_preview: "📎 Se pidieron la cédula y el comprobante" }).eq("id", hiloId);
    await db.from("fin_solicitudes_whatsapp").update({ fotos_pedidas_en: ahora }).eq("id", solicitudId);
  } catch (e) { console.error("flow financiamiento: pedir fotos", e); }
}

async function procesarMensaje(payload: any) {
  const msg = payload.message || {};
  const account = payload.account || {};
  const destino = await buscarLineaPorCuenta(account.id, account.accountId, account.username);
  if (!destino) {
    // Config/dato irrecuperable (cuenta de Zernio sin linea mapeada en
    // whatsapp_lineas) -- reintentar no lo arregla, se descarta con 200.
    console.error("Sin linea/sucursal para cuenta:", account.id, account.accountId, account.username);
    return;
  }
  const { sucursalId, lineaId } = destino;

  let telefonoE164 = identificarContacto(payload);
  if (!telefonoE164) {
    console.error("Mensaje sin telefono ni id de contacto identificable, se descarta");
    return;
  }
  const esEntrante = msg.direction === "incoming";
  if (esNumeroDeLineaPropia(telefonoE164) && !(await chatEntreSucursalesValido(lineaId, telefonoE164, msg, esEntrante))) {
    console.error(
      "Contacto resuelto coincide con el numero de una linea propia del negocio y no es un chat entre sucursales verificable, se descarta el evento:",
      telefonoE164,
      "evento:",
      payload.event,
      "cuenta:",
      account.id || account.accountId || account.username
    );
    return;
  }
  // Chat entre sucursales aceptado: reusar el hilo existente aunque este guardado con "+".
  if (esNumeroDeLineaPropia(telefonoE164)) telefonoE164 = await telefonoDeHiloExistente(lineaId, telefonoE164);
  // Un saludo automatico se guarda antes de que Zernio pueda reflejar su
  // evento message.sent. Si este es ese reflejo, no puede cerrar el pendiente
  // de atencion humana del cliente.
  const waId = idMensaje(msg);
  let esRespuestaHumana = !esEntrante;
  if (!esEntrante && waId) {
    const { data: mensajeYaGuardado } = await db
      .from("whatsapp_mensajes")
      .select("es_automatico")
      .eq("wa_message_id", waId)
      .maybeSingle();
    if (mensajeYaGuardado?.es_automatico) esRespuestaHumana = false;
  }
  // El nombre solo es confiable cuando viene del REMITENTE en un mensaje
  // ENTRANTE (ahi sender = el cliente). En un espejo saliente sender es la
  // propia linea del negocio — no usar su nombre como si fuera el del cliente.
  const nombrePerfil = esEntrante ? (msg.sender?.name || null) : null;
  // F16(b): timestamp del EVENTO (Zernio/Meta) en vez de la hora del servidor.
  const eventoTs = timestampDeEvento(payload) ?? new Date().toISOString();
  const ahora = new Date().toISOString(); // solo para "actualizado_en" (bookkeeping de escritura, no del evento)

  let tipoContenido = "text";
  let mediaPath: string | null = null;
  const adjuntos = Array.isArray(msg.attachments) ? msg.attachments : [];
  if (adjuntos.length > 0) {
    const primero = adjuntos[0];
    tipoContenido = tipoDeAdjunto(primero.type || primero.originalType || primero.mimeType);
    if (primero.url) mediaPath = await guardarAdjunto(primero.url, tipoContenido);
  }
  let textoCrudo = typeof msg.text === "string" ? msg.text.trim() : "";
  const metaZ = payload.metadata || {};
  // 24-oct-2026 · Respuesta de un formulario nativo (Meta Flow): llega como `nfm_reply` dentro del evento. Se busca la
  // clave en el payload (Zernio no documenta en qué nivel la pone) y el JSON de la respuesta se guarda ordenado.
  const nfm = buscarNfmReply(payload);
  let flowRespuesta: { flow_token: string | null; datos: Record<string, string> } | null = null;
  if (nfm) {
    let raw: any = null;
    try { raw = typeof nfm.response_json === "string" ? JSON.parse(nfm.response_json) : (nfm.response_json || nfm.response || null); } catch { raw = null; }
    if (raw && typeof raw === "object") {
      const datos = normalizarDatosFlow(raw);
      flowRespuesta = { flow_token: String(raw.flow_token || nfm.flow_token || "") || null, datos };
      tipoContenido = "flow_respuesta";
      textoCrudo = textoRespuestaFlow(datos);
    }
  }
  // Reacción (18-oct-2026): Zernio solo manda el texto "[reaction]", sin el emoji ni el mensaje al que reacciona
  // (revisado en social_webhook_eventos). Guardarla mostraba una burbuja "[reaction]" que no existe en WhatsApp.
  // No se guarda ni mueve el hilo.
  if (adjuntos.length === 0 && textoCrudo === "[reaction]") return;
  // Zernio no entrega el contenido de ciertos mensajes historicos/especiales.
  // Guardamos una etiqueta clara en vez de mostrar su marcador tecnico.
  //
  // RESULTADO DEL DIAGNOSTICO (2026-09-11, 37 casos reales de 24h):
  // cuando Zernio manda "[Unsupported message]" el payload viene VACIO de
  // contenido -- attachments:[], sin campo "contacts", sin vCard, sin nada.
  // Se reviso el historial completo: 0 de 37 traian algo aprovechable. O sea
  // que el contenido NO se puede recuperar; no es que no lo parseemos, es que
  // nunca llega. (La doc de Zernio tampoco expone "contacts" al listar los
  // mensajes, asi que tampoco sirve ir a buscarlo despues por la API.)
  //
  // Lo unico que SI viene es el motivo, en metadata.unsupported.code. Antes
  // todos estos casos se guardaban con el mismo texto vago "[Contenido de
  // WhatsApp no visible]", que al empleado le parece una falla del sistema y
  // no le dice que hacer. Ahora cada motivo dice que paso y como verlo.
  const sinSoporte = payload.metadata?.unsupported || null;
  let textoNoDisponible: string | null = null;
  // Solo se reemplaza el cuerpo si REALMENTE no hay nada que mostrar: si el
  // mensaje trae texto de verdad o un adjunto que si bajamos, ese contenido
  // manda, aunque Zernio haya adjuntado ademas una marca de "sin soporte".
  const hayContenidoReal = (!!textoCrudo && textoCrudo !== "[Unsupported message]") || adjuntos.length > 0 || !!flowRespuesta;
  if (!hayContenidoReal && (textoCrudo === "[Unsupported message]" || sinSoporte)) {
    const code = Number(sinSoporte?.code) || 0;
    if (code === 131060) {
      // Lo mas comun (29 de 37): el cliente borro el mensaje, o es un reenvio
      // viejo que WhatsApp ya no entrega.
      textoNoDisponible = "⚠️ Mensaje no disponible — el cliente lo elimino, o WhatsApp ya no lo entrega.";
    } else if (code === 131051 && String(sinSoporte?.type || "").toLowerCase() === "album") {
      // 22-oct-2026: con meta.sin_soporte (v37) se vio que Meta marca type "album" cuando el cliente manda varias
      // fotos juntas. Antes salía como «contacto compartido», que confundía.
      textoNoDisponible = "🖼️ El cliente mandó un álbum de fotos. WhatsApp no lo pasa al sistema: ábrelo en el teléfono para verlo.";
    } else if (code === 131051) {
      // Tipo que la API de WhatsApp no reenvia a sistemas externos. Aca cae,
      // entre otros, el contacto compartido.
      textoNoDisponible = "📇 WhatsApp no envia este tipo de mensaje (por ejemplo un contacto compartido) a sistemas externos. Abrelo desde el celular para verlo.";
    } else {
      textoNoDisponible = "⚠️ WhatsApp no entrego el contenido de este mensaje. Abrelo desde el celular para verlo.";
    }
  }

  // Se deja de volcar el payload COMPLETO en los logs: traia datos de clientes
  // y ya sabemos que no aporta nada (37/37 sin contenido). Solo se registra el
  // motivo. El payload entero se guarda UNICAMENTE si algun dia llega uno que
  // SI traiga algo aprovechable -- ese seria el unico caso que justificaria
  // escribir un parser, y ahi si hace falta verlo entero.
  if (textoNoDisponible) {
    const traeAlgo = !!(msg as any).contacts || (Array.isArray(msg.attachments) && msg.attachments.length > 0);
    if (traeAlgo) {
      console.error("mensaje sin soporte PERO con contenido aprovechable -- payload completo:", JSON.stringify(payload));
    } else {
      console.error("mensaje sin soporte (sin contenido recuperable) code:", sinSoporte?.code ?? "n/d", sinSoporte?.title ?? "");
    }
  }

  // Contacto compartido y ubicación (18-oct-2026): Zernio SÍ manda el número (metadata.contacts) y las coordenadas
  // (metadata.location); antes se guardaba solo el texto "👤 Nombre" / "📍 Location". Se guardan con el mismo formato
  // JSON que ya usa whatsapp-enviar, así la tarjeta de la pantalla los dibuja igual que los que salen del CRM.
  let cuerpoEspecial: string | null = null;
  let previewEspecial: string | null = null;
  if (!textoNoDisponible && adjuntos.length === 0 && Array.isArray(metaZ.contacts) && metaZ.contacts.length > 0) {
    const c = metaZ.contacts[0] || {};
    const tel0 = Array.isArray(c.phones) && c.phones.length ? c.phones[0] : null;
    const nombre = c.name?.formatted_name || c.name?.first_name || textoCrudo.replace(/^👤\s*/u, "") || "Contacto";
    tipoContenido = "contacto";
    cuerpoEspecial = JSON.stringify({
      nombre,
      telefono: tel0?.phone || (tel0?.wa_id ? `+${tel0.wa_id}` : ""),
      wa_id: tel0?.wa_id || null,
      mas: metaZ.contacts.length - 1,
    });
    previewEspecial = `👤 ${nombre}`;
  } else if (!textoNoDisponible && adjuntos.length === 0 && metaZ.location && metaZ.location.latitude != null && metaZ.location.longitude != null) {
    const etiqueta = textoCrudo.replace(/^📍\s*/u, "");
    tipoContenido = "ubicacion";
    cuerpoEspecial = JSON.stringify({
      lat: Number(metaZ.location.latitude),
      lng: Number(metaZ.location.longitude),
      nombre: metaZ.location.name || (etiqueta && etiqueta !== "Location" ? etiqueta : null),
      direccion: metaZ.location.address || null,
    });
    previewEspecial = "📍 Ubicación";
  }
  // Reenviado y anuncio de origen (lo que WhatsApp muestra como «Reenviado» y la tarjeta del anuncio).
  const metaMsg: Record<string, unknown> = {};
  // 22-oct-2026 (dueño: «agrega lo de llamada entrante en el chat»). Las líneas de Bayol están en coexistencia
  // (app WhatsApp Business + API) y Zernio documenta que ahí las llamadas NO pasan por la API. Para comprobar si
  // Meta deja alguna huella de una llamada (p. ej. un mensaje 131051 «tipo desconocido»), se guardan los datos
  // técnicos del motivo — sin texto del cliente — en meta.sin_soporte. Solo diagnóstico; no cambia lo que se ve.
  if (sinSoporte && typeof sinSoporte === "object") {
    const ss = sinSoporte as Record<string, unknown>;
    const ed = (ss.error_data && typeof ss.error_data === "object") ? ss.error_data as Record<string, unknown> : {};
    metaMsg.sin_soporte = {
      code: ss.code ?? null,
      title: typeof ss.title === "string" ? ss.title.slice(0, 120) : null,
      tipo: typeof ss.type === "string" ? ss.type.slice(0, 60) : null,
      detalle: String(ss.details ?? ss.message ?? ed.details ?? "").slice(0, 300) || null,
      claves: Object.keys(ss).slice(0, 20),
      claves_meta: Object.keys(metaZ).slice(0, 30),
      tipo_msg: (msg as any).type ?? (msg as any).messageType ?? null,
    };
  }
  if (flowRespuesta) metaMsg.flow = { nombre: "bayolcell_financiamiento", flow_token: flowRespuesta.flow_token, datos: flowRespuesta.datos };
  if (metaZ.forwarded || metaZ.frequentlyForwarded || metaZ.frequently_forwarded) metaMsg.reenviado = true;
  if (metaZ.referral && typeof metaZ.referral === "object") {
    const r = metaZ.referral;
    metaMsg.anuncio = {
      titulo: r.headline && r.headline !== "api.whatsapp.com" ? String(r.headline).slice(0, 120) : null,
      texto: typeof r.body === "string" ? r.body.slice(0, 400) : null,
      imagen: r.image_url || r.thumbnail_url || null,
      url: r.source_url || null,
      tipo: r.source_type || null,
    };
  }

  const cuerpo = textoNoDisponible
    ?? cuerpoEspecial
    ?? (textoCrudo || (tipoContenido !== "text" ? `[${tipoContenido}]` : ""));
  const preview = previewEspecial ?? cuerpo;

  // conversationId REAL de Zernio -- lo unico que sirve para responder por la API. Para un
  // contacto con telefono, pasar el telefono funciona de casualidad (Zernio manda
  // platformConversationId == telefono); para un contacto de ANUNCIO no hay telefono, el hilo se
  // guarda como `bsid:<contactId>` y el contactId NO es el conversationId -- de ahi el 404
  // "Conversation not found" al intentar responderle. Mismo principio ya documentado para
  // Instagram ("do not correlate the two by equality", ver
  // 20260904010200_instagram_hilos_agregar_conversation_id.sql).
  const conversationIdZernio: string | null =
    payload.conversation?.id || payload.message?.conversationId || null;

  const quotedWaId: string | null = payload.metadata?.quotedMessageId || null;
  const respondeAId = quotedWaId ? await buscarMensajeLocalPorWaId(quotedWaId) : null;

  // F15: se busca/crea el hilo por (linea_id, telefono_e164) -- ya no por
  // (sucursal_id, telefono_e164). lineaId ya viene resuelto de
  // buscarLineaPorCuenta arriba (la misma linea con la que se crea el hilo si
  // no existe), asi que la busqueda y la creacion usan siempre la misma clave.
  const { data: hiloExistente } = await db
    .from("whatsapp_hilos")
    .select("id, cliente_id, no_leidos_count, nombre_perfil")
    .eq("linea_id", lineaId)
    .eq("telefono_e164", telefonoE164)
    .maybeSingle();

  let hiloId: string;
  let clienteId: string | null;

  if (hiloExistente) {
    hiloId = hiloExistente.id;
    clienteId = hiloExistente.cliente_id;
    if (!clienteId) clienteId = await buscarClientePorTelefono(telefonoE164);
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
        ultimo_mensaje_at: eventoTs,
        ultimo_inbound_at: esEntrante ? eventoTs : null,
        ultima_respuesta_humana_at: esRespuestaHumana ? eventoTs : null,
        ultimo_mensaje_preview: preview.slice(0, 200),
        no_leidos_count: esEntrante ? 1 : 0,
        zernio_conversation_id: conversationIdZernio,
      })
      .select("id")
      .single();
    if (error || !nuevoHilo) {
      // F16(c): fallo real de escritura en un paso critico (sin hilo no hay
      // donde guardar nada) -- se lanza para que el catch de nivel superior
      // responda 500 y Zernio reintente, en vez de perder el mensaje en
      // silencio con un 200.
      throw new Error(`crear hilo fallo: ${error?.message ?? "sin fila devuelta"}`);
    }
    hiloId = nuevoHilo.id;
  }

  // F16(a): el mensaje se inserta ANTES de decidir si el hilo existente debe
  // sumar no_leidos_count -- asi solo suma cuando esta insercion trajo una
  // fila REALMENTE nueva (upsert con ignoreDuplicates: un reintento de Zernio
  // del mismo wa_message_id no devuelve fila, y por lo tanto no vuelve a
  // sumar el contador ni dispara el agente de IA otra vez).
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
        meta: Object.keys(metaMsg).length ? metaMsg : null,
        estado: esEntrante ? "recibido" : "enviado",
        es_automatico: false,
        // F16(b): fecha del EVENTO, no la del procesamiento -- mismo criterio
        // que ya usa whatsapp-importar-historial para no desordenar el hilo.
        creado_en: eventoTs,
        // Guarda el motivo real (codigo de WhatsApp) de los mensajes que llegan
        // sin contenido. Antes solo quedaba en los logs, que se borran a las
        // 24h -- y sin esto no hay forma de medir cuantos se pierden ni por que.
        error_detalle: sinSoporte ? `unsupported:${sinSoporte.code ?? "?"} ${sinSoporte.title ?? ""}`.trim() : null,
      },
      { onConflict: "wa_message_id", ignoreDuplicates: true }
    )
    .select("id")
    .maybeSingle();
  if (flowRespuesta && mensajeGuardado?.id) {
    // 24-oct-2026 · Enlazar la respuesta con la solicitud enviada (fin_solicitudes_whatsapp) por su flow_token.
    try {
      const ahoraIso = new Date().toISOString();
      let solicitudId: string | null = null;
      if (flowRespuesta.flow_token) {
        const { data: upd } = await db.from("fin_solicitudes_whatsapp")
          .update({ estado: "respondido", datos: flowRespuesta.datos, respuesta_wa_message_id: idMensaje(msg), mensaje_in_id: mensajeGuardado.id, respondido_en: eventoTs })
          .eq("flow_token", flowRespuesta.flow_token).eq("estado", "enviado").select("id");
        solicitudId = upd && upd.length ? upd[0].id : null;
        if (!solicitudId) { const { data: ya } = await db.from("fin_solicitudes_whatsapp").select("id").eq("flow_token", flowRespuesta.flow_token).maybeSingle(); solicitudId = ya?.id || null; }
      }
      if (!solicitudId) {
        const { data: nueva } = await db.from("fin_solicitudes_whatsapp").insert({
          hilo_id: hiloId, linea_id: lineaId, sucursal_id: sucursalId, telefono: telefonoE164, flow_token: flowRespuesta.flow_token, estado: "respondido",
          datos: flowRespuesta.datos, equipo: flowRespuesta.datos.equipo || null, referencia: flowRespuesta.datos.referencia || null,
          respuesta_wa_message_id: idMensaje(msg), mensaje_in_id: mensajeGuardado.id, respondido_en: eventoTs, creado_en: ahoraIso,
        }).select("id").maybeSingle();
        solicitudId = nueva?.id || null;
      }
      await pedirFotosFlow(account.id || account.accountId || null, conversationIdZernio, hiloId, solicitudId, nombrePerfil ?? hiloExistente?.nombre_perfil ?? null);
    } catch (e) { console.error("flow financiamiento: no se pudo enlazar la respuesta", e); }
  }
  if (msgError) {
    // F16(c): fallo real (no un duplicado ignorado -- eso no es un error,
    // llega aca sin `msgError` y con `mensajeGuardado` en null). Se lanza
    // para que Zernio reintente en vez de dar por enviado un mensaje que
    // nunca quedo guardado.
    throw new Error(`insertar mensaje fallo: ${msgError.message}`);
  }
  const esMensajeNuevo = !!mensajeGuardado?.id;

  if (hiloExistente) {
    const actualizacion: Record<string, unknown> = {
      // No pisar un nombre ya guardado con null (el espejo saliente no trae nombre confiable)
      nombre_perfil: nombrePerfil ?? hiloExistente.nombre_perfil ?? undefined,
      ultimo_mensaje_at: eventoTs,
      ultimo_mensaje_preview: preview.slice(0, 200),
      cliente_id: clienteId ?? undefined,
      actualizado_en: ahora,
    };
    // Solo se escribe cuando Zernio lo manda; nunca se pisa con null un id ya guardado.
    if (conversationIdZernio) actualizacion.zernio_conversation_id = conversationIdZernio;
    if (esEntrante) {
      actualizacion.ultimo_inbound_at = eventoTs;
      // F16(a): solo sube si el mensaje realmente se guardo por primera vez.
      if (esMensajeNuevo) actualizacion.no_leidos_count = (hiloExistente.no_leidos_count ?? 0) + 1;
    } else if (esRespuestaHumana) {
      actualizacion.ultima_respuesta_humana_at = eventoTs;
    }
    const { error: updError } = await db.from("whatsapp_hilos").update(actualizacion).eq("id", hiloId);
    if (updError) {
      // Fallo real actualizando el resumen del hilo (preview/no_leidos/ventana
      // de 24h) -- el mensaje YA quedo guardado arriba, pero el hilo quedaria
      // con datos viejos/incorrectos si no se reintenta. Se lanza igual.
      throw new Error(`actualizar hilo fallo: ${updError.message}`);
    }
  }

  if (esEntrante && esMensajeNuevo) {
    await asegurarLead(sucursalId, hiloId, lineaId, telefonoE164, nombrePerfil, preview, clienteId);
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
  // 18-oct-2026: wa_aplicar_estado (SQL) nunca baja una palomita (un «entregado» tardío no pisa un «leído») y, si el
  // mensaje todavía no existe (el espejo de un mensaje escrito desde el celular llega DESPUÉS de su «entregado»), guarda
  // el estado en whatsapp_estados_pendientes; el trigger de inserción lo aplica cuando el mensaje entra.
  const { data: resultado, error } = await db.rpc("wa_aplicar_estado", {
    p_wamid: idBuscado,
    p_estado: estado,
    p_error: errorDetalle,
  });
  if (error) {
    // F16(c): fallo real de escritura -> 500 para que Zernio reintente.
    throw new Error(`actualizar estado fallo: ${error.message}`);
  }
  if (resultado === "pendiente") console.log("estado guardado en espera de su mensaje:", estado);
}

// Reacciones (fase 3, 18-oct-2026): evento propio `reaction.received` de Zernio. Se guarda la reacción de cada lado
// (cliente / negocio) en whatsapp_mensajes.reacciones con wa_aplicar_reaccion. Quitar una reacción llega con emoji vacío.
// Si el mensaje al que se reacciona no está en el CRM (muy viejo o de antes de conectar la línea), se ignora.
async function procesarReaccion(payload: any) {
  const r = payload.reaction || {};
  const wamid: string | null = r.platformMessageId || r.messageId || null;
  if (!wamid) return;
  const deNegocio = r.fromMe === true || r.direction === "outgoing" || r.sender?.isMe === true ||
    payload.message?.direction === "outgoing";
  const emoji = r.action === "removed" ? "" : String(r.emoji || r.rawEmoji || "");
  const { data, error } = await db.rpc("wa_aplicar_reaccion", {
    p_wamid: wamid,
    p_quien: deNegocio ? "negocio" : "cliente",
    p_emoji: emoji,
  });
  if (error) throw new Error(`guardar reaccion fallo: ${error.message}`);
  if (data === "sin_mensaje") console.log("reaccion a un mensaje que no esta en el CRM");
}

async function procesarEliminado(payload: any) {
  const msg = payload.message || {};
  const wamid = idMensaje(msg);
  if (!wamid) return;
  const { data: antes } = await db.from("whatsapp_mensajes").select("id, hilo_id, cuerpo, tipo_contenido, meta, estado").eq("wa_message_id", wamid).maybeSingle();
  const { error } = await db.rpc("wa_aplicar_estado", { p_wamid: wamid, p_estado: "eliminado", p_error: null });
  if (error) throw new Error(`marcar eliminado fallo: ${error.message}`);
  if (antes && antes.estado !== "eliminado") {
    const meta = (antes.meta && typeof antes.meta === "object") ? { ...antes.meta } : {};
    meta.eliminado = { en: payload.deletedAt || new Date().toISOString(), por_tipo: "whatsapp", por_id: null, cuerpo: antes.cuerpo, tipo_contenido: antes.tipo_contenido };
    await db.from("whatsapp_mensajes").update({ meta }).eq("id", antes.id);
    const { data: ult } = await db.from("whatsapp_mensajes").select("id").eq("hilo_id", antes.hilo_id).order("creado_en", { ascending: false }).limit(1).maybeSingle();
    if (ult?.id === antes.id) await db.from("whatsapp_hilos").update({ ultimo_mensaje_preview: "🚫 Mensaje eliminado", actualizado_en: new Date().toISOString() }).eq("id", antes.hilo_id);
  }
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
    } else if (evento === "reaction.received") {
      await procesarReaccion(payload);
    } else if (evento === "message.deleted") {
      // 22-oct-2026: el negocio eliminó un mensaje para todos (desde el CRM o desde la app del teléfono). Se marca
      // «eliminado» sin borrar la fila. Zernio dice que en WhatsApp solo llega por borrados del negocio.
      await procesarEliminado(payload);
    } else {
      console.error("Evento no manejado:", evento);
    }
  } catch (e) {
    // F16(c): un fallo REAL de procesamiento (excepcion no esperada, o una de
    // las lanzadas arriba por un error genuino de escritura) responde >=500
    // para que Zernio reintente la entrega -- antes esto siempre caia en un
    // 200 silencioso. La validacion de firma HMAC (arriba) no pasa por este
    // catch y sigue devolviendo 401, sin reintento.
    console.error("whatsapp-webhook error (fallo real, se pide reintento a Zernio):", e instanceof Error ? e.message : String(e));
    return new Response(JSON.stringify({ received: false, error: "processing_failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
