import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
// 27-oct-2026 · Avisos en el teléfono de los empleados (app interna / PWA del taller).
// La llama el trigger trg_push_mensaje_entrante (header x-push-token, validado contra vault con push_token_valido) con
// { mensaje_id }. push_destinatarios decide a quién (mismas reglas con que el CRM le enseña el chat a cada persona).
// Las claves VAPID se crean aquí la primera vez y se guardan en _push_vapid (RLS sin políticas): nunca pasan por el chat.
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

async function claves(db: any) {
  const { data } = await db.from("_push_vapid").select("publica, privada").eq("id", 1).maybeSingle();
  if (data?.publica) return data;
  const k = webpush.generateVAPIDKeys();
  await db.from("_push_vapid").upsert({ id: 1, publica: k.publicKey, privada: k.privateKey }, { onConflict: "id", ignoreDuplicates: true });
  const { data: d2 } = await db.from("_push_vapid").select("publica, privada").eq("id", 1).maybeSingle();
  return d2;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = req.headers.get("x-push-token") || "";
  if (token.length < 32) return json({ ok: false, error: "No autorizado." }, 401);
  const { data: valido } = await db.rpc("push_token_valido", { p_token: token });
  if (valido !== true) return json({ ok: false, error: "No autorizado." }, 401);
  const body = await req.json().catch(() => ({}));
  const k = await claves(db);
  if (!k?.publica) return json({ ok: false, error: "Sin claves." }, 500);
  // { preparar: true } solo crea las claves (primera vez); no envía nada.
  if (body?.preparar === true) return json({ ok: true, preparado: true });
  const mensajeId = String(body?.mensaje_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(mensajeId)) return json({ ok: false, error: "mensaje_id" }, 400);
  webpush.setVapidDetails("mailto:sterlinr08@gmail.com", k.publica, k.privada);
  const { data: dest, error } = await db.rpc("push_destinatarios", { p_mensaje_id: mensajeId });
  if (error) return json({ ok: false, error: error.message }, 500);
  let enviados = 0;
  await Promise.all((dest || []).map(async (d: any) => {
    const carga = JSON.stringify({ t: d.titulo, b: d.cuerpo, h: d.hilo_id });
    try {
      await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, carga, { TTL: 3600, urgency: "high", topic: String(d.hilo_id).replace(/-/g, "").slice(0, 32) });
      enviados++;
      await db.rpc("push_resultado", { p_sus_id: d.sus_id, p_ok: true });
    } catch (e: any) {
      const st = Number(e?.statusCode || 0);
      await db.rpc("push_resultado", { p_sus_id: d.sus_id, p_ok: false, p_error: `${st} ${String(e?.body || e?.message || e).slice(0, 200)}`, p_baja: st === 404 || st === 410 });
    }
  }));
  return json({ ok: true, destinatarios: (dest || []).length, enviados });
});
