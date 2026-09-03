import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Importa de forma idempotente las conversaciones que Zernio ya conserva,
// incluyendo el historial de WhatsApp Business App sincronizado durante el
// alta en modo Coexistence. No crea leads ni aumenta no_leidos_count.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
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
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function usuarioAutenticado(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  const auth = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await auth.auth.getUser();
  return error ? null : data.user;
}

async function zernioGet(path: string, query: Record<string, string | number | undefined>) {
  const url = new URL(`${ZERNIO_BASE}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${ZERNIO_API_KEY}` },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Zernio GET fallo", response.status, path, JSON.stringify(data));
    throw new Error(`Zernio respondio ${response.status}`);
  }
  return data;
}

function telefonoDeConversacion(conversacion: any): string | null {
  const original = String(conversacion?.participantId ?? "").trim();
  if (!original) return null;
  if (original.startsWith("bsid:")) return original;
  const digitos = original.replace(/\D/g, "");
  if (digitos.length >= 10 && digitos.length <= 15) return `+${digitos}`;
  return `bsid:${original}`;
}

function tipoYTexto(mensaje: any) {
  const texto = String(mensaje?.message ?? "").trim();
  const adjunto = Array.isArray(mensaje?.attachments) ? mensaje.attachments[0] : null;
  const tipoZernio = String(adjunto?.type ?? "").toLowerCase();
  const tipos: Record<string, string> = {
    image: "imagen",
    video: "video",
    audio: "audio",
    file: "documento",
    sticker: "imagen",
    share: "text",
  };
  const tipo = tipos[tipoZernio] ?? "text";
  if (texto) return { tipo, cuerpo: texto };
  const nombres: Record<string, string> = {
    imagen: "[Foto del historial]",
    video: "[Video del historial]",
    audio: "[Audio del historial]",
    documento: adjunto?.filename ? `[Documento: ${adjunto.filename}]` : "[Documento del historial]",
  };
  return { tipo, cuerpo: nombres[tipo] ?? "[Mensaje del historial]" };
}

function estadoMensaje(mensaje: any, direccion: "in" | "out") {
  if (direccion === "in") return "recibido";
  const estado = String(mensaje?.deliveryStatus ?? "sent").toLowerCase();
  if (estado === "delivered") return "entregado";
  if (estado === "read") return "leido";
  if (estado === "failed") return "fallido";
  return "enviado";
}

function fechaIso(valor: unknown): string | null {
  const fecha = new Date(String(valor ?? ""));
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

async function buscarOCrearHilo(linea: any, conversacion: any, telefono: string) {
  const { data: exacto } = await db
    .from("whatsapp_hilos")
    .select("id")
    .eq("linea_id", linea.id)
    .eq("telefono_e164", telefono)
    .maybeSingle();
  if (exacto) return { id: exacto.id, conflicto: false };

  // La restriccion historica de la tabla era sucursal+telefono. No se fuerza
  // un hilo de otra linea porque eso mezclaria conversaciones diferentes.
  const { data: otraLinea } = await db
    .from("whatsapp_hilos")
    .select("id, linea_id")
    .eq("sucursal_id", linea.sucursal_id)
    .eq("telefono_e164", telefono)
    .maybeSingle();
  if (otraLinea && otraLinea.linea_id !== linea.id) return { id: null, conflicto: true };

  const fecha = conversacion?.updatedTime || new Date().toISOString();
  const { data: creado, error } = await db.from("whatsapp_hilos").insert({
    sucursal_id: linea.sucursal_id,
    linea_id: linea.id,
    telefono_e164: telefono,
    nombre_perfil: conversacion?.participantName || telefono,
    ultimo_mensaje_at: fecha,
    ultimo_mensaje_preview: conversacion?.lastMessage || "Historial importado",
    no_leidos_count: 0,
    estado: conversacion?.status === "archived" ? "archivado" : "abierto",
  }).select("id").single();
  if (error) throw error;
  return { id: creado.id, conflicto: false };
}

async function importarMensajes(linea: any, conversacion: any, hiloId: string, soloContar: boolean) {
  let cursor: string | undefined;
  let vistos = 0;
  let insertados = 0;
  let paginas = 0;

  do {
    const respuesta = await zernioGet(
      `/inbox/conversations/${encodeURIComponent(conversacion.id)}/messages`,
      { accountId: linea.zernio_account_id, limit: 100, sortOrder: "desc", cursor },
    );
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
          wa_message_id: String(mensaje.id),
          estado: estadoMensaje(mensaje, direccion),
          error_detalle: mensaje?.deliveryError?.message ?? null,
          es_automatico: false,
          creado_en: creadoEn,
          media_path: null,
        }];
      });
      if (filas.length) {
        const { data, error } = await db
          .from("whatsapp_mensajes")
          .upsert(filas, { onConflict: "wa_message_id", ignoreDuplicates: true })
          .select("id");
        if (error) throw error;
        insertados += data?.length ?? 0;
      }
    }

    paginas += 1;
    cursor = respuesta?.pagination?.hasMore && respuesta?.pagination?.nextCursor
      ? String(respuesta.pagination.nextCursor)
      : undefined;
  } while (cursor && paginas < 20);

  if (!soloContar) {
    const [{ data: ultimo }, { data: ultimoEntrante }] = await Promise.all([
      db.from("whatsapp_mensajes").select("creado_en,cuerpo,tipo_contenido").eq("hilo_id", hiloId).order("creado_en", { ascending: false }).limit(1).maybeSingle(),
      db.from("whatsapp_mensajes").select("creado_en").eq("hilo_id", hiloId).eq("direccion", "in").order("creado_en", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (ultimo) {
      const cambiosHilo: Record<string, unknown> = {
        ultimo_mensaje_at: ultimo.creado_en,
        ultimo_inbound_at: ultimoEntrante?.creado_en ?? null,
        ultimo_mensaje_preview: ultimo.cuerpo || `[${ultimo.tipo_contenido}]`,
        actualizado_en: new Date().toISOString(),
      };
      if (conversacion?.participantName) cambiosHilo.nombre_perfil = conversacion.participantName;
      await db.from("whatsapp_hilos").update(cambiosHilo).eq("id", hiloId);
    }
  }

  return { vistos, insertados, truncado: Boolean(cursor) };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Metodo no permitido" }, 405);
  if (!ZERNIO_API_KEY) return json({ ok: false, error: "Falta ZERNIO_API_KEY" }, 500);
  if (!await usuarioAutenticado(req)) return json({ ok: false, error: "No autorizado" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch { /* body opcional */ }
  const lineaId = String(body.linea_id ?? "");
  const cursor = body.cursor ? String(body.cursor) : undefined;
  const limite = Math.max(1, Math.min(Number(body.limit) || 10, 20));
  const soloContar = body.dry_run === true;
  if (!lineaId) return json({ ok: false, error: "Falta linea_id" }, 400);

  const { data: linea, error: lineaError } = await db
    .from("whatsapp_lineas")
    .select("id,sucursal_id,nombre,zernio_account_id")
    .eq("id", lineaId)
    .eq("activo", true)
    .maybeSingle();
  if (lineaError || !linea?.zernio_account_id) return json({ ok: false, error: "Linea no encontrada o sin Zernio" }, 404);

  try {
    const respuesta = await zernioGet("/inbox/conversations", {
      accountId: linea.zernio_account_id,
      platform: "whatsapp",
      limit: limite,
      sortOrder: "desc",
      cursor,
    });
    const conversaciones = Array.isArray(respuesta?.data) ? respuesta.data : [];
    let mensajesVistos = 0;
    let mensajesInsertados = 0;
    let conversacionesImportadas = 0;
    let conflictosLinea = 0;
    let truncadas = 0;

    for (const conversacion of conversaciones) {
      if (!conversacion?.id) continue;
      if (conversacion.accountId && conversacion.accountId !== linea.zernio_account_id) continue;
      const telefono = telefonoDeConversacion(conversacion);
      if (!telefono) continue;
      const hilo = soloContar
        ? { id: "dry-run", conflicto: false }
        : await buscarOCrearHilo(linea, conversacion, telefono);
      if (hilo.conflicto || !hilo.id) {
        conflictosLinea += 1;
        continue;
      }
      const resultado = await importarMensajes(linea, conversacion, hilo.id, soloContar);
      mensajesVistos += resultado.vistos;
      mensajesInsertados += resultado.insertados;
      truncadas += resultado.truncado ? 1 : 0;
      conversacionesImportadas += 1;
    }

    return json({
      ok: true,
      linea: linea.nombre,
      dry_run: soloContar,
      conversaciones_leidas: conversaciones.length,
      conversaciones_importadas: conversacionesImportadas,
      mensajes_leidos: mensajesVistos,
      mensajes_insertados: mensajesInsertados,
      conflictos_de_linea: conflictosLinea,
      conversaciones_truncadas: truncadas,
      siguiente_cursor: respuesta?.pagination?.hasMore ? respuesta?.pagination?.nextCursor ?? null : null,
    });
  } catch (error) {
    console.error("Importar historial fallo", error instanceof Error ? error.message : String(error));
    return json({ ok: false, error: "No se pudo leer el historial de Zernio" }, 502);
  }
});
