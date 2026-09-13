import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Proxy de Comentarios de Facebook (Zernio) para el CRM.
// La API key de Zernio vive SOLO aca (Deno.env); el navegador nunca la ve.
// Endpoints reales confirmados via /openapi.json (13 sept 2026):
//   GET  /v1/inbox/comments?accountId=X            -> publicaciones de la cuenta
//   GET  /v1/inbox/comments/{postId}?accountId=X   -> comentarios de esa publicacion
//   POST /v1/inbox/comments/{postId}                -> responder (publico o a un comentario)
//   POST /v1/inbox/comments/{postId}/{commentId}/private-reply -> Private Reply (DM)
//   POST /v1/inbox/comments/{postId}/{commentId}/like -> like al comentario
//   DELETE /v1/inbox/comments/{postId}/{commentId}/like -> retirar like
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const ZERNIO_KEY = Deno.env.get("ZERNIO_API_KEY") ?? "";
const BASE = "https://zernio.com/api/v1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function out(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

async function zernio(path: string, init?: RequestInit) {
  const resp = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${ZERNIO_KEY}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
  const body = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out({ ok: false, error: "method_not_allowed" }, 405);
  if (!req.headers.get("Authorization")?.startsWith("Bearer ")) return out({ ok: false, error: "missing_auth" }, 401);
  if (!ZERNIO_KEY) return out({ ok: false, error: "zernio_key_not_configured" }, 503);

  let body: any;
  try { body = await req.json(); } catch { return out({ ok: false, error: "invalid_json" }, 400); }
  const action = String(body.action || "");
  const postId = body.postId ? String(body.postId) : "";
  const commentId = body.commentId ? String(body.commentId) : "";
  const message = body.message ? String(body.message).trim() : "";
  const likeUri = body.likeUri ? String(body.likeUri) : "";
  const cursor = body.cursor ? String(body.cursor) : "";
  const limit = Number.isFinite(body.limit) ? Math.min(100, Math.max(1, Number(body.limit))) : null;

  const { data: cuenta } = await db.from("social_cuentas").select("zernio_account_id")
    .eq("plataforma", "facebook").eq("activo", true)
    .order("actualizado_en", { ascending: false }).limit(1).maybeSingle();
  const accountId = cuenta?.zernio_account_id;
  if (!accountId) return out({ ok: false, error: "account_not_configured" }, 409);

  try {
    if (action === "posts") {
      const qs = new URLSearchParams({ accountId, limit: String(limit || 25) });
      if (cursor) qs.set("cursor", cursor);
      const r = await zernio(`/inbox/comments?${qs.toString()}`);
      if (!r.ok) return out({ ok: false, error: "zernio_error", detail: r.body }, 502);
      return out({ ok: true, ...r.body });
    }

    if (action === "comments") {
      if (!postId) return out({ ok: false, error: "postId_required" }, 400);
      const qs = new URLSearchParams({ accountId, limit: String(limit || 50) });
      if (cursor) qs.set("cursor", cursor);
      const r = await zernio(`/inbox/comments/${encodeURIComponent(postId)}?${qs.toString()}`);
      if (!r.ok) return out({ ok: false, error: "zernio_error", detail: r.body }, 502);
      return out({ ok: true, ...r.body });
    }

    if (action === "like") {
      if (!postId || !commentId) return out({ ok: false, error: "postId_commentId_required" }, 400);
      const r = await zernio(`/inbox/comments/${encodeURIComponent(postId)}/${encodeURIComponent(commentId)}/like`, {
        method: "POST",
        body: JSON.stringify({ accountId }),
      });
      if (!r.ok || r.body?.success === false) return out({ ok: false, error: "zernio_like_failed", detail: r.body }, 502);
      return out({ ok: true, ...r.body });
    }

    if (action === "unlike") {
      if (!postId || !commentId) return out({ ok: false, error: "postId_commentId_required" }, 400);
      const qs = new URLSearchParams({ accountId });
      if (likeUri) qs.set("likeUri", likeUri);
      const r = await zernio(`/inbox/comments/${encodeURIComponent(postId)}/${encodeURIComponent(commentId)}/like?${qs.toString()}`, {
        method: "DELETE",
      });
      if (!r.ok || r.body?.success === false) return out({ ok: false, error: "zernio_unlike_failed", detail: r.body }, 502);
      return out({ ok: true, ...r.body });
    }

    if (action === "reply") {
      if (!postId || !message) return out({ ok: false, error: "postId_message_required" }, 400);
      const payload: any = { accountId, message };
      if (commentId) payload.commentId = commentId;
      const r = await zernio(`/inbox/comments/${encodeURIComponent(postId)}`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(payload),
      });
      if (!r.ok || r.body?.success === false) return out({ ok: false, error: "zernio_reply_failed", detail: r.body }, 502);
      return out({ ok: true, ...r.body });
    }

    if (action === "private_reply") {
      if (!postId || !commentId || !message) return out({ ok: false, error: "postId_commentId_message_required" }, 400);
      const r = await zernio(`/inbox/comments/${encodeURIComponent(postId)}/${encodeURIComponent(commentId)}/private-reply`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ accountId, message }),
      });
      if (!r.ok) return out({ ok: false, error: "zernio_private_reply_failed", detail: r.body }, 502);
      return out({ ok: true, ...r.body });
    }

    return out({ ok: false, error: "unknown_action" }, 400);
  } catch (e) {
    console.error("social-facebook-comentarios:", e instanceof Error ? e.message : String(e));
    return out({ ok: false, error: "upstream_failed" }, 502);
  }
});
