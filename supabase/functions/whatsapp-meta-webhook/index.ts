import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// whatsapp-meta-webhook — 21-oct-2026 (dueño: «ver si WhatsApp funciona en el CRM sin Zernio»).
// Recibe los mensajes DIRECTO de Meta (WhatsApp Cloud API), sin Zernio, y los guarda en las mismas tablas del CRM
// (whatsapp_hilos / whatsapp_mensajes), así se ven en la misma bandeja.
//
// Prueba aislada: solo atiende líneas de whatsapp_lineas que tienen whatsapp_phone_number_id y NO tienen
// zernio_account_id (la línea de prueba con el número gratis de Meta). Las líneas de Zernio no se tocan.
// No dispara el agente de IA (es una prueba).
//
// Secretos (los pone el dueño en Supabase → Edge Functions → Secrets; nunca en el repo ni en el chat):
//   WA_VERIFY_TOKEN  palabra que el dueño inventa y repite en Meta al registrar el webhook.
//   WA_APP_SECRET    «Clave secreta de la app» (Meta → Configuración de la app → Básica). Firma cada aviso.
// verify_jwt: false (Meta no manda sesión); la seguridad es la firma X-Hub-Signature-256.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERIFY_TOKEN = Deno.env.get("WA_VERIFY_TOKEN") ?? "";
const APP_SECRET = Deno.env.get("WA_APP_SECRET") ?? "";

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function firmaValida(raw: string, cabecera: string | null): Promise<boolean> {
  if (!APP_SECRET || !cabecera?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
  const hex = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
  const recibida = cabecera.slice(7);
  if (recibida.length !== hex.length) return false;
  let dif = 0;
  for (let i = 0; i < hex.length; i++) dif |= hex.charCodeAt(i) ^ recibida.charCodeAt(i);
  return dif === 0;
}

// Texto que se guarda según el tipo (la prueba cubre texto; lo demás queda anotado para verlo en la bandeja).
function contenido(m: any): { tipo: string; cuerpo: string } {
  switch (m.type) {
    case "text": return { tipo: "text", cuerpo: m.text?.body ?? "" };
    case "button": return { tipo: "text", cuerpo: m.button?.text ?? "" };
    case "interactive": return { tipo: "text", cuerpo: m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "" };
    case "image": return { tipo: "text", cuerpo: "[Foto]" + (m.image?.caption ? " " + m.image.caption : "") };
    case "audio": return { tipo: "text", cuerpo: "[Nota de voz]" };
    case "video": return { tipo: "text", cuerpo: "[Video]" + (m.video?.caption ? " " + m.video.caption : "") };
    case "document": return { tipo: "text", cuerpo: "[Documento] " + (m.document?.filename ?? "") };
    case "location": return { tipo: "text", cuerpo: `[Ubicación] ${m.location?.latitude},${m.location?.longitude}` };
    case "sticker": return { tipo: "text", cuerpo: "[Sticker]" };
    default: return { tipo: "text", cuerpo: `[${m.type || "mensaje"}]` };
  }
}

async function lineaDePrueba(phoneNumberId: string) {
  const { data } = await db.from("whatsapp_lineas").select("id, sucursal_id, zernio_account_id")
    .eq("whatsapp_phone_number_id", phoneNumberId).eq("activo", true).maybeSingle();
  return data && !data.zernio_account_id ? data : null;
}

async function guardarEntrante(linea: { id: string; sucursal_id: string }, m: any, nombre: string | null) {
  const tel = "+" + String(m.from || "").replace(/\D/g, "");
  const ts = m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString();
  const { tipo, cuerpo } = contenido(m);
  const preview = cuerpo.slice(0, 200);

  const { data: hilo } = await db.from("whatsapp_hilos").select("id, no_leidos_count, nombre_perfil")
    .eq("linea_id", linea.id).eq("telefono_e164", tel).maybeSingle();
  let hiloId = hilo?.id as string | undefined;
  if (!hiloId) {
    const { data: nuevo, error } = await db.from("whatsapp_hilos").insert({
      sucursal_id: linea.sucursal_id, linea_id: linea.id, telefono_e164: tel, nombre_perfil: nombre,
      ultimo_mensaje_at: ts, ultimo_inbound_at: ts, ultimo_mensaje_preview: preview, no_leidos_count: 0,
    }).select("id").single();
    if (error || !nuevo) throw new Error(`crear hilo: ${error?.message}`);
    hiloId = nuevo.id;
  }
  const { data: guardado, error: e2 } = await db.from("whatsapp_mensajes").upsert({
    hilo_id: hiloId, direccion: "in", tipo_contenido: tipo, cuerpo, wa_message_id: m.id,
    estado: "recibido", es_automatico: false, creado_en: ts,
  }, { onConflict: "wa_message_id", ignoreDuplicates: true }).select("id").maybeSingle();
  if (e2) throw new Error(`guardar mensaje: ${e2.message}`);
  if (!guardado?.id) return; // reintento de Meta del mismo mensaje
  const { error: e3 } = await db.from("whatsapp_hilos").update({
    nombre_perfil: nombre ?? hilo?.nombre_perfil ?? undefined, ultimo_mensaje_at: ts, ultimo_inbound_at: ts,
    ultimo_mensaje_preview: preview, no_leidos_count: (hilo?.no_leidos_count ?? 0) + 1, actualizado_en: new Date().toISOString(),
  }).eq("id", hiloId);
  if (e3) throw new Error(`actualizar hilo: ${e3.message}`);
}

const ESTADOS: Record<string, string> = { delivered: "entregado", read: "leido", failed: "fallido" };

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  // Verificación al registrar el webhook en Meta
  if (req.method === "GET") {
    const ok = url.searchParams.get("hub.mode") === "subscribe" && VERIFY_TOKEN && url.searchParams.get("hub.verify_token") === VERIFY_TOKEN;
    return ok ? new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 }) : new Response("no", { status: 403 });
  }
  if (req.method !== "POST") return new Response("no", { status: 405 });
  const raw = await req.text();
  if (!(await firmaValida(raw, req.headers.get("x-hub-signature-256")))) return new Response("firma", { status: 401 });
  let body: any;
  try { body = JSON.parse(raw); } catch { return new Response("json", { status: 400 }); }
  try {
    for (const entry of body.entry || []) {
      for (const ch of entry.changes || []) {
        const v = ch.value || {};
        const linea = v.metadata?.phone_number_id ? await lineaDePrueba(String(v.metadata.phone_number_id)) : null;
        if (!linea) continue;
        const nombres = new Map((v.contacts || []).map((c: any) => [String(c.wa_id), c.profile?.name ?? null]));
        for (const m of v.messages || []) await guardarEntrante(linea, m, (nombres.get(String(m.from)) as string) ?? null);
        for (const s of v.statuses || []) {
          const estado = ESTADOS[s.status]; if (!estado) continue;
          const err = s.errors ? JSON.stringify(s.errors).slice(0, 500) : null;
          const { error } = await db.rpc("wa_aplicar_estado", { p_wamid: s.id, p_estado: estado, p_error: err });
          if (error) throw new Error(`estado: ${error.message}`);
        }
      }
    }
  } catch (e) {
    console.error("whatsapp-meta-webhook:", e instanceof Error ? e.message : String(e));
    return new Response("error", { status: 500 }); // Meta reintenta
  }
  return new Response("ok", { status: 200 });
});
