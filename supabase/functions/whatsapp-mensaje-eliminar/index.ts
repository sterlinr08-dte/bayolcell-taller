import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// whatsapp-mensaje-eliminar — «Eliminar para todos» un mensaje NUESTRO (22-oct-2026, pedido del dueño).
//
// Llama a Zernio: DELETE /v1/inbox/conversations/{conversationId}/messages/{platformMessageId}?accountId=…
// (docs.zernio.com/platforms/whatsapp: «message.deleted: The business deletes a sent message with DELETE …»).
// OJO: la página del endpoint todavía dice «WhatsApp: Not supported (returns 400)». Si Zernio responde 400, aquí
// se devuelve `no_soportado` con un texto claro y NO se toca el mensaje local.
//
// Reglas:
//  · solo mensajes salientes (direccion = out) con wa_message_id;
//  · misma autorización que whatsapp-enviar: admin, técnico de la sucursal de la línea, o el empleado al que le
//    transfirieron ese chat;
//  · si Zernio acepta, el mensaje queda estado = 'eliminado' (el texto se conserva en meta.eliminado para auditoría,
//    pero el CRM muestra «Este mensaje fue eliminado», como WhatsApp).

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

async function identidadVerificada(req: Request): Promise<{ tipo: string | null; refId: string | null }> {
  const sinIdentidad = { tipo: null, refId: null };
  try {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return sinIdentidad;
    const { data: sesion, error } = await db.auth.getUser(token);
    if (error || !sesion?.user?.id) return sinIdentidad;
    const { data: vinculo } = await db.from("auth_actor_bindings").select("actor_type, actor_ref_id")
      .eq("auth_user_id", sesion.user.id).eq("activo", true).maybeSingle();
    if (!vinculo?.actor_type || !vinculo?.actor_ref_id) return sinIdentidad;
    return { tipo: vinculo.actor_type, refId: vinculo.actor_ref_id };
  } catch { return sinIdentidad; }
}

async function tieneAccesoALinea(tipo: string | null, refId: string | null, sucursalIdLinea: string): Promise<boolean> {
  if (tipo === "usuario") return true;
  if (tipo === "tecnico" && refId) {
    const { data: t } = await db.from("tecnicos").select("sucursal_id, tipo_empleado, rol, activo").eq("id", refId).maybeSingle();
    if (!t || t.activo === false) return false;
    if (t.tipo_empleado === "admin" || t.rol === "admin") return true;
    return t.sucursal_id === sucursalIdLinea;
  }
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Metodo no permitido" }, 405);
  if (!ZERNIO_API_KEY) return json({ ok: false, error: "Falta ZERNIO_API_KEY en el proyecto" }, 500);

  let body: any;
  try { body = await req.json(); } catch { return json({ ok: false, error: "Body invalido" }, 400); }
  const mensajeId = String(body.mensaje_id || "");
  if (!mensajeId) return json({ ok: false, error: "Falta mensaje_id" }, 400);

  const { data: m } = await db.from("whatsapp_mensajes")
    .select("id, hilo_id, direccion, estado, wa_message_id, cuerpo, tipo_contenido, meta, creado_en")
    .eq("id", mensajeId).maybeSingle();
  if (!m) return json({ ok: false, error: "Mensaje no encontrado" }, 404);
  if (m.direccion !== "out") return json({ ok: false, error: "solo_propios", mensaje: "Solo se pueden eliminar los mensajes que mandó el negocio." }, 400);
  if (m.estado === "eliminado") return json({ ok: true, ya_eliminado: true });
  if (!m.wa_message_id) return json({ ok: false, error: "sin_id", mensaje: "Este mensaje no tiene identificador de WhatsApp; no se puede eliminar desde aquí." }, 400);

  const { data: hilo } = await db.from("whatsapp_hilos").select("id, linea_id, zernio_conversation_id, telefono_e164, asignado_tipo, asignado_id")
    .eq("id", m.hilo_id).maybeSingle();
  if (!hilo?.linea_id) return json({ ok: false, error: "Hilo no encontrado" }, 404);
  const { data: linea } = await db.from("whatsapp_lineas").select("zernio_account_id, sucursal_id").eq("id", hilo.linea_id).maybeSingle();
  if (!linea?.zernio_account_id) return json({ ok: false, error: "Linea sin cuenta de Zernio" }, 500);

  const { tipo, refId } = await identidadVerificada(req);
  const esSuAsignado = !!refId && !!tipo && hilo.asignado_id === refId && hilo.asignado_tipo === tipo;
  if (!(esSuAsignado || await tieneAccesoALinea(tipo, refId, linea.sucursal_id))) {
    return json({ ok: false, error: "sin_permiso", mensaje: "No tiene acceso a esta línea." }, 403);
  }

  const conversationId = hilo.zernio_conversation_id
    || (String(hilo.telefono_e164 || "").startsWith("bsid:") ? String(hilo.telefono_e164).slice(5) : String(hilo.telefono_e164 || ""));
  if (!conversationId) return json({ ok: false, error: "sin_conversacion", mensaje: "Zernio no tiene esta conversación." }, 400);

  let status = 0; let data: any = null;
  try {
    const url = `https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(m.wa_message_id)}?accountId=${encodeURIComponent(linea.zernio_account_id)}`;
    const resp = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${ZERNIO_API_KEY}` }, signal: AbortSignal.timeout(ZERNIO_TIMEOUT_MS) });
    status = resp.status;
    data = await resp.json().catch(() => null);
  } catch (e) {
    const timeout = e instanceof DOMException && e.name === "TimeoutError";
    return json({ ok: false, error: timeout ? "zernio_timeout" : "zernio_red", mensaje: "No se pudo contactar a Zernio. Intente de nuevo." }, 502);
  }
  if (!(status >= 200 && status < 300 && data?.success !== false)) {
    console.error("Zernio no eliminó el mensaje:", status, JSON.stringify(data));
    if (status === 400) {
      return json({ ok: false, error: "no_soportado", mensaje: "WhatsApp no permitió eliminar este mensaje desde el sistema. Bórrelo desde la app del teléfono.", detalle: data }, 502);
    }
    if (status === 404) {
      return json({ ok: false, error: "no_encontrado", mensaje: "Zernio ya no encuentra este mensaje.", detalle: data }, 502);
    }
    return json({ ok: false, error: "zernio_error", mensaje: "Zernio rechazó la eliminación.", detalle: data }, 502);
  }

  // Aceptado: el mensaje queda como «eliminado». El contenido se guarda aparte para auditoría.
  const meta = (m.meta && typeof m.meta === "object") ? { ...m.meta } : {};
  meta.eliminado = { en: new Date().toISOString(), por_tipo: tipo, por_id: refId, cuerpo: m.cuerpo, tipo_contenido: m.tipo_contenido };
  const { error: updError } = await db.from("whatsapp_mensajes").update({ estado: "eliminado", meta }).eq("id", m.id);
  if (updError) {
    console.error("mensaje eliminado en WhatsApp pero no se pudo marcar local:", updError.message);
    return json({ ok: true, guardado_local: false, aviso: "Se eliminó en WhatsApp, pero el CRM no pudo marcarlo. Recargue el chat." });
  }
  // Si era el último mensaje del chat, la lista debe reflejarlo.
  const { data: ult } = await db.from("whatsapp_mensajes").select("id").eq("hilo_id", m.hilo_id).order("creado_en", { ascending: false }).limit(1).maybeSingle();
  if (ult?.id === m.id) await db.from("whatsapp_hilos").update({ ultimo_mensaje_preview: "🚫 Mensaje eliminado", actualizado_en: new Date().toISOString() }).eq("id", m.hilo_id);
  return json({ ok: true });
});
