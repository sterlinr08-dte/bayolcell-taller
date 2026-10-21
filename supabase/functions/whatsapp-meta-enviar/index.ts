import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// whatsapp-meta-enviar — 21-oct-2026 (prueba de WhatsApp en el CRM sin Zernio).
// Responde un chat de una línea de PRUEBA conectada DIRECTO a Meta (WhatsApp Cloud API). Mismo contrato que
// whatsapp-enviar (hilo_id, mensaje, plantilla) y mismos permisos (sesión + auth_actor_bindings + sucursal de la
// línea), así la bandeja no cambia. Solo texto y plantillas en esta prueba; fotos, audio, ubicación y contacto
// se agregan si la prueba sale bien.
//
// Secreto (lo pone el dueño en Supabase; nunca en el repo ni en el chat):
//   WA_CLOUD_TOKEN   token de acceso de Meta (temporal de 24 h al empezar; luego uno permanente de usuario del sistema).
// Opcional: WA_GRAPH_VERSION (por defecto v23.0).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WA_TOKEN = Deno.env.get("WA_CLOUD_TOKEN") ?? "";
const GRAPH = "https://graph.facebook.com/" + (Deno.env.get("WA_GRAPH_VERSION") || "v23.0");

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// Igual que whatsapp-enviar (8 oct 2026): la identidad sale de la sesión y de auth_actor_bindings.
async function identidadVerificada(req: Request): Promise<{ tipo: string | null; refId: string | null }> {
  const nada = { tipo: null, refId: null };
  try {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return nada;
    const { data: sesion, error } = await db.auth.getUser(token);
    if (error || !sesion?.user?.id) return nada;
    const { data: v } = await db.from("auth_actor_bindings").select("actor_type, actor_ref_id")
      .eq("auth_user_id", sesion.user.id).eq("activo", true).maybeSingle();
    return v?.actor_type && v?.actor_ref_id ? { tipo: v.actor_type, refId: v.actor_ref_id } : nada;
  } catch { return nada; }
}
async function tieneAccesoALinea(tipo: string | null, refId: string | null, sucursalId: string): Promise<boolean> {
  if (tipo === "usuario") return true;
  if (tipo === "tecnico" && refId) {
    const { data: t } = await db.from("tecnicos").select("sucursal_id, tipo_empleado, rol, activo").eq("id", refId).maybeSingle();
    if (!t || t.activo === false) return false;
    if (t.tipo_empleado === "admin" || t.rol === "admin") return true;
    return t.sucursal_id === sucursalId;
  }
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Metodo no permitido" }, 405);
  if (!WA_TOKEN) return json({ ok: false, error: "Falta el token de Meta (WA_CLOUD_TOKEN)" }, 500);
  let body: any;
  try { body = await req.json(); } catch { return json({ ok: false, error: "Body invalido" }, 400); }

  const hiloId = body.hilo_id as string;
  const mensaje = String(body.mensaje || "").trim();
  const plantilla = body.plantilla || null;
  if (!hiloId) return json({ ok: false, error: "Falta hilo_id" }, 400);
  if (body.adjunto || body.ubicacion || body.contacto) return json({ ok: false, error: "no_disponible", mensaje: "En la línea de prueba de Meta solo se envía texto por ahora." }, 400);
  if (!mensaje && !plantilla) return json({ ok: false, error: "El mensaje esta vacio" }, 400);

  const { data: hilo } = await db.from("whatsapp_hilos")
    .select("id, linea_id, telefono_e164, ultimo_inbound_at, asignado_tipo, asignado_id").eq("id", hiloId).maybeSingle();
  if (!hilo) return json({ ok: false, error: "Hilo no encontrado" }, 404);
  const { data: linea } = await db.from("whatsapp_lineas")
    .select("sucursal_id, whatsapp_phone_number_id, zernio_account_id").eq("id", hilo.linea_id).maybeSingle();
  if (!linea?.whatsapp_phone_number_id || linea.zernio_account_id) return json({ ok: false, error: "Esta línea no es la de prueba de Meta" }, 400);

  if (!plantilla) {
    const horas = hilo.ultimo_inbound_at ? (Date.now() - new Date(hilo.ultimo_inbound_at).getTime()) / 3600000 : Infinity;
    if (horas > 24) return json({ ok: false, error: "ventana_cerrada", mensaje: "Pasaron más de 24 h desde el último mensaje del cliente: hace falta una plantilla aprobada." }, 409);
  }

  const { tipo, refId } = await identidadVerificada(req);
  const esSuAsignado = !!refId && hilo.asignado_id === refId && hilo.asignado_tipo === tipo;
  if (!esSuAsignado && !(await tieneAccesoALinea(tipo, refId, linea.sucursal_id))) {
    return json({ ok: false, error: "sin_permiso", mensaje: "No tiene acceso a esta línea." }, 403);
  }

  const para = String(hilo.telefono_e164).replace(/\D/g, "");
  const envio: Record<string, unknown> = { messaging_product: "whatsapp", to: para };
  if (plantilla) {
    const params = (plantilla.variables || []).map((t: unknown) => ({ type: "text", text: String(t) }));
    envio.type = "template";
    envio.template = { name: plantilla.nombre, language: { code: plantilla.idioma || "es" }, ...(params.length ? { components: [{ type: "body", parameters: params }] } : {}) };
  } else {
    envio.type = "text";
    envio.text = { body: mensaje, preview_url: true };
  }

  let resp: Response, data: any;
  try {
    resp = await fetch(`${GRAPH}/${linea.whatsapp_phone_number_id}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(envio), signal: AbortSignal.timeout(20000),
    });
    data = await resp.json().catch(() => null);
  } catch (e) {
    return json({ ok: false, error: "No se pudo contactar a Meta", detalle: e instanceof Error ? e.message : String(e) }, 502);
  }
  if (!resp.ok) {
    // El mensaje de error de Meta no trae el token; se devuelve para saber qué falta (número no verificado, token vencido…).
    return json({ ok: false, error: "Meta rechazó el envío", detalle: data?.error?.message ?? null, codigo: data?.error?.code ?? null }, 502);
  }
  const wamid = data?.messages?.[0]?.id ?? null;
  const ahora = new Date().toISOString();
  const texto = mensaje || `[Plantilla ${plantilla?.nombre}]`;
  const { error: e } = await db.from("whatsapp_mensajes").insert({
    hilo_id: hiloId, direccion: "out", tipo_contenido: "text", cuerpo: texto, wa_message_id: wamid,
    estado: "enviado", es_automatico: false, enviado_por_tipo: tipo, enviado_por_id: refId,
    plantilla_nombre: plantilla?.nombre ?? null,
  });
  if (!e) {
    await db.from("whatsapp_hilos").update({ ultimo_mensaje_at: ahora, ultimo_mensaje_preview: texto.slice(0, 200), ultima_respuesta_humana_at: ahora, actualizado_en: ahora }).eq("id", hiloId);
  }
  return json(e ? { ok: true, messageId: wamid, guardado_local: false, aviso: "Se envió, pero no quedó guardado en el historial." } : { ok: true, messageId: wamid });
});
