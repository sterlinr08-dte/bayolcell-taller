import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { identidadVerificada, tieneAccesoARedSocial } from "./_shared/inbox-common.ts";
import { corregirTexto, metaConOrtografia, fusionarOrtografiaEnFila } from "./_shared/ortografia.ts";

// social-enviar — responde un hilo de Facebook (social_hilos) por Zernio.
//
// 2-nov-2026 (plan de ortografía v2, hallazgo 1): la v4 desplegada solo revisaba que
// existiera «Authorization: Bearer …». Ahora la identidad se resuelve en el servidor
// (sesión + auth_actor_bindings) y se exige acceso a redes sociales, IGUAL que
// instagram-enviar, ANTES de leer el hilo, de llamar a la IA o de enviar.
// El contrato con el frontend no cambia: body { hiloId, text } → { ok, messageId },
// más texto_enviado y ortografia (opcionales).

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const key = Deno.env.get("ZERNIO_API_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
// deno-lint-ignore no-explicit-any
const out = (x: any, s = 200) => new Response(JSON.stringify(x), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const t0 = Date.now();
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out({ ok: false, error: "method_not_allowed" }, 405);
  if (!req.headers.get("Authorization")?.startsWith("Bearer ")) return out({ ok: false, error: "missing_auth" }, 401);

  const { tipo, refId } = await identidadVerificada(db, req);
  if (!(await tieneAccesoARedSocial(db, tipo, refId))) return out({ ok: false, error: "sin_permiso" }, 403);

  // deno-lint-ignore no-explicit-any
  let b: any;
  try {
    b = await req.json();
  } catch {
    return out({ ok: false, error: "invalid_json" }, 400);
  }
  const hiloId = String(b?.hiloId || "");
  const mensaje = String(b?.text || "").trim();
  if (!hiloId || !mensaje) return out({ ok: false, error: "hiloId_text_required" }, 400);

  const { data: hilo } = await db.from("social_hilos").select("id,zernio_conversation_id,cuenta_id").eq("id", hiloId).maybeSingle();
  if (!hilo) return out({ ok: false, error: "thread_not_found" }, 404);
  const { data: cuenta } = await db.from("social_cuentas").select("zernio_account_id,plataforma").eq("id", hilo.cuenta_id).maybeSingle();
  if (!cuenta || !key) return out({ ok: false, error: "account_not_configured" }, 409);

  // Ortografía: DESPUÉS de identidad, permisos y datos del hilo; ANTES de armar el envío.
  // Interruptor en crm_ortografia_config (apagado). Ante cualquier falla devuelve el original.
  const orto = await corregirTexto(mensaje, { db, canal: "facebook", apiKey: ANTHROPIC_API_KEY, hiloId, cuentaId: hilo.cuenta_id, empleadoId: refId });
  const text = orto.texto;

  const r = await fetch("https://zernio.com/api/v1/inbox/conversations/" + encodeURIComponent(hilo.zernio_conversation_id) + "/messages", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ accountId: cuenta.zernio_account_id, text }),
    signal: AbortSignal.timeout(15000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d?.success === false) return out({ ok: false, error: "zernio_send_failed", detail: d }, 502);

  const now = new Date().toISOString();
  const messageId = d.data?.messageId ?? d.messageId ?? null;
  const { error: msgError } = await db.from("social_mensajes").insert({
    hilo_id: hilo.id, direccion: "out", tipo_contenido: "text", cuerpo: text, zernio_message_id: messageId, estado: "enviado",
    enviado_por_tipo: tipo, enviado_por_id: refId,
    metadata: metaConOrtografia({ zernio: d }, orto), creado_en: now,
  });
  if (msgError) console.error("insertar mensaje saliente facebook error:", msgError.message);
  // Webhook adelantado: el eco ya creó la fila -> solo se fusiona la marca, nunca se reenvía.
  if (msgError?.code === "23505" && orto.corregido) await fusionarOrtografiaEnFila(db, "social_mensajes", "metadata", "zernio_message_id", messageId, orto);
  await db.from("social_hilos").update({ ultimo_mensaje_at: now, ultimo_mensaje_preview: text, actualizado_en: now }).eq("id", hilo.id);

  console.log(JSON.stringify({ evento: "envio", canal: "facebook", ms_envio_total: Date.now() - t0, ms_corrector: orto.ms, ortografia: orto.motivo }));
  return out({
    ok: true, messageId, texto_enviado: text,
    ...(orto.corregido ? { ortografia: { corregido: true, original: orto.original } } : {}),
  });
});
