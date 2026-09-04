// Modulo compartido para las edge functions de mensajeria de canales
// servidos por Zernio (Instagram, Facebook, y cualquier otro que se agregue
// despues). NO incluye nada de whatsapp-webhook/whatsapp-enviar a proposito
// -- esas siguen separadas hasta que su fix de corrupcion de contactos
// (2026-09-03/04) lleve un ciclo estable en produccion sin nuevos hallazgos.
// Factoriza solo la parte que la auditoria del codebase confirmo como
// genuinamente generica entre canales: verificacion de firma, autorizacion
// por sucursal, el patron de llamada a Zernio, y resolucion de adjuntos.
//
// IMPORTANTE al desplegar: este archivo se copia dentro del bundle de CADA
// funcion que lo usa (instagram-webhook, instagram-enviar, ...) porque el
// deploy de Supabase Edge Functions es un bundle aislado por funcion. La
// fuente canonica vive aca -- si se edita, hay que re-copiar el contenido
// al desplegar cada funcion que lo importa.

import { createClient } from "npm:@supabase/supabase-js@2";

export function crearClienteDB(supabaseUrl: string, serviceRoleKey: string) {
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function verificarFirmaZernio(rawBody: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!secret) {
    console.error("Secreto de webhook no configurado — rechazando por seguridad");
    return false;
  }
  if (!signatureHeader) return false;
  const recibida = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const calculada = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (calculada.length !== recibida.length) return false;
  let diff = 0;
  for (let i = 0; i < calculada.length; i++) diff |= calculada.charCodeAt(i) ^ recibida.charCodeAt(i);
  return diff === 0;
}

export function identidadDesdeJWT(req: Request): { tipo: string | null; refId: string | null } {
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

// deno-lint-ignore no-explicit-any
export async function tieneAccesoASucursal(db: any, tipo: string | null, refId: string | null, sucursalId: string): Promise<boolean> {
  if (tipo === "usuario") return true;
  if (tipo === "tecnico" && refId) {
    const { data: tecnico } = await db.from("tecnicos").select("sucursal_id, tipo_empleado, rol").eq("id", refId).maybeSingle();
    if (!tecnico) return false;
    if (tecnico.tipo_empleado === "admin" || tecnico.rol === "admin") return true;
    return tecnico.sucursal_id === sucursalId;
  }
  return false;
}

export function esTimeout(e: unknown): boolean {
  return e instanceof DOMException && e.name === "TimeoutError";
}

const ZERNIO_TIMEOUT_MS = 20000;

export async function mandarAZernio(
  zernioApiKey: string,
  conversationId: string,
  accountId: string,
  campos: Record<string, unknown>,
  idempotencyKey?: string
) {
  const body: Record<string, unknown> = { accountId, ...campos };
  const headers: Record<string, string> = { Authorization: `Bearer ${zernioApiKey}`, "Content-Type": "application/json" };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const resp = await fetch(`https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ZERNIO_TIMEOUT_MS),
  });
  const data = await resp.json().catch(() => null);
  return { ok: resp.ok && !!data?.success, data, status: resp.status };
}

// Las URLs de adjuntos entrantes de Instagram/Facebook en el webhook son CDN
// de Meta firmadas que expiran segun el calendario de la plataforma. Se
// descargan aca mismo (no requieren el Bearer de Zernio, a diferencia de
// WhatsApp) y se suben a un bucket de Storage propio del canal.
// deno-lint-ignore no-explicit-any
export async function guardarAdjunto(db: any, bucket: string, urlCruda: string, categoria: string): Promise<string | null> {
  try {
    const r = await fetch(urlCruda, { signal: AbortSignal.timeout(ZERNIO_TIMEOUT_MS) });
    if (!r.ok) {
      console.error("descarga de adjunto fallo, status:", r.status);
      return null;
    }
    const buf = await r.arrayBuffer();
    const contentType = r.headers.get("content-type") || "application/octet-stream";
    const ext = contentType.split("/")[1]?.split(";")[0]?.replace(/[^a-z0-9]/gi, "") || "bin";
    const path = `${categoria}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(bucket).upload(path, buf, { contentType, upsert: false });
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

// Mapeo de attachments.type normalizado por Zernio -> categoria interna.
// Nota: Instagram/Facebook agregan "share" (posts/reels/story mentions
// reenviados) y "sticker", tipos que WhatsApp no tiene.
export function tipoDeAdjunto(tipo: string | undefined): string {
  const t = (tipo || "").toLowerCase();
  if (t.includes("image")) return "imagen";
  if (t.includes("audio")) return "audio";
  if (t.includes("video")) return "video";
  if (t.includes("share")) return "compartido";
  if (t.includes("sticker")) return "sticker";
  return "documento";
}

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
