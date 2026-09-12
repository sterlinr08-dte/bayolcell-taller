import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Importa de forma idempotente las conversaciones de Instagram Direct que
// Zernio ya tiene guardadas -- mensajes que llegaron antes de que el
// webhook estuviera activo, o cualquier historial que Zernio conserve.
// Mismo patron que whatsapp-importar-historial: NO crea leads, NO marca
// no_leidos_count desde el historial (se deja en 0 -- no tiene sentido
// "des-leer" retroactivamente algo que ya paso).
//
// Contrato verificado EN VIVO contra Zernio el 12 sept 2026 (no adivinado,
// via zernio-probe): GET /inbox/conversations?accountId&platform=instagram
// &limit&sortOrder&cursor devuelve {data:[{id, accountId, participantId,
// participantName, participantUsername, lastMessage, updatedTime, status,
// unreadCount, ...}], pagination:{hasMore,nextCursor}}. El campo `id` de
// cada conversacion es el valor que hay que guardar en
// instagram_hilos.zernio_conversation_id (lo que despues usa instagram-enviar
// para responder).
//
// GET /inbox/conversations/{id}/messages?accountId&limit&sortOrder&cursor
// devuelve {messages:[{id, conversationId, message, senderId, senderName,
// direction:'incoming'|'outgoing', createdAt, attachments:[{url,type,
// payload,originalType}], ...}], pagination:{...}}. OJO: el texto viene en
// el campo `message` (no `text` como en el payload del webhook -- son dos
// formas distintas de la misma API).
//
// Fix 2026-09-12 (real, encontrado al primer envio real post-importacion):
// faltaba guardar `ultimo_inbound_at` (fecha del ultimo mensaje ENTRANTE) al
// importar -- sin eso, instagram-enviar veia el hilo como "fuera de la
// ventana de 24h" aunque el cliente hubiera escrito hace minutos, y agregaba
// el tag MESSAGE_TAG/HUMAN_AGENT que Meta rechaza porque esa funcion de la
// app de Instagram TODAVIA NO esta aprobada por Facebook (error real de
// Zernio: "To use 'Human Agent', your use of this endpoint must be reviewed
// and approved by Facebook"). Ahora se calcula tambien el ultimo mensaje
// entrante y se guarda en ultimo_inbound_at, igual que ya hace
// whatsapp-importar-historial con `ultimoEntrante`.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZERNIO_API_KEY = Deno.env.get("ZERNIO_API_KEY") ?? "";
const ZERNIO_BASE = "https://zernio.com/api/v1";

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

async function zernioGet(path: string, query: Record<string, string | number | undefined>) {
  const url = new URL(`${ZERNIO_BASE}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { headers: { Authorization: `Bearer ${ZERNIO_API_KEY}` }, signal: AbortSignal.timeout(20000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Zernio GET fallo", response.status, path, JSON.stringify(data));
    throw new Error(`Zernio respondio ${response.status}`);
  }
  return data;
}

function tipoDeAdjunto(tipo: string | undefined): string {
  const t = (tipo || "").toLowerCase();
  if (t.includes("image")) return "imagen";
  if (t.includes("audio")) return "audio";
  if (t.includes("video")) return "video";
  if (t.includes("share")) return "compartido";
  if (t.includes("sticker")) return "sticker";
  return "documento";
}

function tipoYTexto(mensaje: any): { tipo: string; cuerpo: string | null } {
  const texto = String(mensaje?.message ?? "").trim();
  const adjunto = Array.isArray(mensaje?.attachments) ? mensaje.attachments[0] : null;
  if (!adjunto) return { tipo: "text", cuerpo: texto || null };
  const tipo = tipoDeAdjunto(adjunto?.type || adjunto?.originalType);
  if (texto) return { tipo, cuerpo: texto };
  const nombres: Record<string, string> = {
    imagen: "[Foto del historial]",
    video: "[Video del historial]",
    audio: "[Audio del historial]",
    compartido: adjunto?.payload?.title ? `[Publicación compartida: ${String(adjunto.payload.title).slice(0, 120)}]` : "[Publicación compartida]",
    sticker: "[Sticker]",
    documento: "[Documento del historial]",
  };
  return { tipo, cuerpo: nombres[tipo] ?? "[Mensaje del historial]" };
}

function fechaIso(valor: unknown): string | null {
  const fecha = new Date(String(valor ?? ""));
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

async function buscarOCrearHilo(cuenta: any, conversacion: any, participantId: string): Promise<string> {
  const { data: existente } = await db
    .from("instagram_hilos")
    .select("id, zernio_conversation_id")
    .eq("sucursal_id", cuenta.sucursal_id)
    .eq("participant_id", participantId)
    .maybeSingle();
  if (existente) {
    if (!existente.zernio_conversation_id) {
      await db.from("instagram_hilos").update({ zernio_conversation_id: String(conversacion.id) }).eq("id", existente.id);
    }
    return existente.id;
  }

  const fecha = conversacion?.updatedTime || new Date().toISOString();
  const { data: creado, error } = await db.from("instagram_hilos").insert({
    sucursal_id: cuenta.sucursal_id,
    cuenta_id: cuenta.id,
    participant_id: participantId,
    participant_username: conversacion?.participantUsername || null,
    zernio_conversation_id: String(conversacion.id),
    nombre_perfil: conversacion?.participantName || conversacion?.participantUsername || null,
    ultimo_mensaje_at: fecha,
    ultimo_mensaje_preview: conversacion?.lastMessage || "Historial importado",
    no_leidos_count: 0,
  }).select("id").single();
  if (error) throw error;
  return creado.id;
}

async function importarMensajes(cuenta: any, conversacion: any, hiloId: string, soloContar: boolean) {
  let cursor: string | undefined;
  let vistos = 0, insertados = 0, paginas = 0;

  do {
    const respuesta = await zernioGet(`/inbox/conversations/${encodeURIComponent(conversacion.id)}/messages`, {
      accountId: cuenta.zernio_account_id, limit: 100, sortOrder: "desc", cursor,
    });
    const mensajes = Array.isArray(respuesta?.messages) ? respuesta.messages : [];
    vistos += mensajes.length;

    if (!soloContar && mensajes.length) {
      const filas = mensajes.flatMap((mensaje: any) => {
        const creadoEn = fechaIso(mensaje?.createdAt);
        if (!mensaje?.id || !creadoEn) return [];
        const direccion: "in" | "out" = mensaje.direction === "outgoing" ? "out" : "in";
        const contenido = tipoYTexto(mensaje);
        return [{
          hilo_id: hiloId,
          direccion,
          tipo_contenido: contenido.tipo,
          cuerpo: contenido.cuerpo,
          zernio_message_id: String(mensaje.id),
          estado: direccion === "in" ? "recibido" : "enviado",
          es_automatico: false,
          media_path: null,
          creado_en: creadoEn,
        }];
      });
      if (filas.length) {
        const { data, error } = await db.from("instagram_mensajes")
          .upsert(filas, { onConflict: "zernio_message_id", ignoreDuplicates: true })
          .select("id");
        if (error) throw error;
        insertados += data?.length ?? 0;
      }
    }

    paginas += 1;
    cursor = respuesta?.pagination?.hasMore && respuesta?.pagination?.nextCursor ? String(respuesta.pagination.nextCursor) : undefined;
  } while (cursor && paginas < 20);

  if (!soloContar) {
    const [{ data: ultimo }, { data: ultimoEntrante }] = await Promise.all([
      db.from("instagram_mensajes").select("creado_en,cuerpo,tipo_contenido").eq("hilo_id", hiloId).order("creado_en", { ascending: false }).limit(1).maybeSingle(),
      db.from("instagram_mensajes").select("creado_en").eq("hilo_id", hiloId).eq("direccion", "in").order("creado_en", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (ultimo) {
      const cambios: Record<string, unknown> = {
        ultimo_mensaje_at: ultimo.creado_en,
        ultimo_mensaje_preview: ultimo.cuerpo || `[${ultimo.tipo_contenido}]`,
        actualizado_en: new Date().toISOString(),
      };
      if (ultimoEntrante?.creado_en) cambios.ultimo_inbound_at = ultimoEntrante.creado_en;
      await db.from("instagram_hilos").update(cambios).eq("id", hiloId);
    }
  }

  return { vistos, insertados, truncado: Boolean(cursor) };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Metodo no permitido" }, 405);
  if (!ZERNIO_API_KEY) return json({ ok: false, error: "Falta ZERNIO_API_KEY" }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { /* body opcional */ }
  const cursor = body.cursor ? String(body.cursor) : undefined;
  const limite = Math.max(1, Math.min(Number(body.limit) || 10, 20));
  const soloContar = body.dry_run === true;

  const { data: cuenta, error: cuentaError } = await db
    .from("instagram_cuentas")
    .select("id, sucursal_id, zernio_account_id, instagram_user_id")
    .eq("activo", true)
    .limit(1)
    .maybeSingle();
  if (cuentaError || !cuenta?.zernio_account_id) return json({ ok: false, error: "No hay cuenta de Instagram configurada" }, 404);

  try {
    const respuesta = await zernioGet("/inbox/conversations", {
      accountId: cuenta.zernio_account_id, platform: "instagram", limit: limite, sortOrder: "desc", cursor,
    });
    const conversaciones = Array.isArray(respuesta?.data) ? respuesta.data : [];
    let mensajesVistos = 0, mensajesInsertados = 0, conversacionesImportadas = 0, truncadas = 0, propias = 0;

    for (const conversacion of conversaciones) {
      if (!conversacion?.id) continue;
      if (conversacion.accountId && conversacion.accountId !== cuenta.zernio_account_id) continue;
      const participantId = String(conversacion.participantId ?? "").trim();
      if (!participantId) continue;
      // Trafico interno entre cuentas propias -- ver instagram-webhook (esCuentaPropia).
      if (cuenta.instagram_user_id && participantId === cuenta.instagram_user_id) { propias += 1; continue; }

      const hiloId = soloContar ? "dry-run" : await buscarOCrearHilo(cuenta, conversacion, participantId);
      const resultado = await importarMensajes(cuenta, conversacion, hiloId, soloContar);
      mensajesVistos += resultado.vistos;
      mensajesInsertados += resultado.insertados;
      truncadas += resultado.truncado ? 1 : 0;
      conversacionesImportadas += 1;
    }

    return json({
      ok: true,
      dry_run: soloContar,
      conversaciones_leidas: conversaciones.length,
      conversaciones_importadas: conversacionesImportadas,
      conversaciones_propias_ignoradas: propias,
      mensajes_leidos: mensajesVistos,
      mensajes_insertados: mensajesInsertados,
      conversaciones_truncadas: truncadas,
      siguiente_cursor: respuesta?.pagination?.hasMore ? respuesta?.pagination?.nextCursor ?? null : null,
    });
  } catch (error) {
    console.error("Importar historial instagram fallo", error instanceof Error ? error.message : String(error));
    return json({ ok: false, error: "No se pudo leer el historial de Zernio" }, 502);
  }
});
