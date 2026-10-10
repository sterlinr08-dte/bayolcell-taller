// publicar-reel-redmi17 — APAGADA (10 oct 2026). Ya publicó el Reel del Redmi 17 en @bayolcell (post Zernio 6acac2539179d7dba1f013e9).
// Esta versión NO publica nada: solo consulta el estado de esa publicación (lectura). Cualquier otra cosa responde 410.
// (La versión 1, de un solo uso, publicaba un video y un texto FIJOS con Idempotency-Key fija; ver docs/bitacora/2026-10-10-2256-claude-reel-redmi17.md.)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ZERNIO_API_KEY = (Deno.env.get("ZERNIO_API_KEY") || "").trim();
const POST_ID = "6acac2539179d7dba1f013e9";

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") return json({ ok: false, error: "Función apagada: la publicación ya se hizo." }, 410);
  if (!ZERNIO_API_KEY) return json({ ok: false, error: "Falta ZERNIO_API_KEY" }, 503);
  try {
    const r = await fetch(`https://zernio.com/api/v1/posts/${POST_ID}`, { headers: { Authorization: `Bearer ${ZERNIO_API_KEY}` }, signal: AbortSignal.timeout(20000) });
    const d: any = await r.json().catch(() => null);
    const p = d?.post ?? d;
    return json({ ok: r.ok, status: p?.status ?? null, publishedAt: p?.publishedAt ?? null,
      platforms: (p?.platforms || []).map((x: any) => ({ status: x.status, url: x.platformPostUrl ?? null, error: x.errorMessage ?? null })) });
  } catch (e) {
    return json({ ok: false, error: "No se pudo consultar Zernio" }, 502);
  }
});
