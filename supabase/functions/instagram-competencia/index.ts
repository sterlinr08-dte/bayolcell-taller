// instagram-competencia — lee perfiles PÚBLICOS de Instagram de la competencia por la vía oficial
// de Meta (Graph API · Business Discovery) y los guarda en las tablas ig_competencia_* (9 oct 2026).
//
// - No recibe usuarios por parámetro: solo lee las cuentas activas de ig_competencia_cuentas
//   (se agregan por SQL). Así nadie puede usar el permiso de Meta para consultar cualquier cosa.
// - No devuelve datos de las publicaciones: solo un resumen (cuántas se guardaron y errores).
// - Freno: si hubo una corrida hace menos de 3 minutos, no hace nada (429).
// - Secrets del proyecto:
//     IG_GRAPH_TOKEN   (opcional; si falta se usa Zernio) permiso de usuario del sistema del Business Manager de Bayol Cell
//                      con instagram_basic, instagram_manage_insights, pages_read_engagement,
//                      pages_show_list y ads_read. Nunca va en el código ni en el chat.
//     IG_USER_ID       (opcional) id de Instagram de @bayolcell; por defecto 17841437425998828.
//     IG_GRAPH_VERSION (opcional) por defecto v23.0.
// - La llama la tarea programada diaria (pg_cron) y, a pedido, la IA con net.http_post.
//
// 9 oct 2026 (v2): si NO hay IG_GRAPH_TOKEN, usa Zernio (ya conectado al Instagram de BAYOL, secret
// ZERNIO_API_KEY que ya existía): GET /v1/accounts/{accountId}/instagram/business-discovery.
// Límites de esa vía: solo las 25 publicaciones más recientes por cuenta y sin número de vistas.
// Requiere que @bayolcell esté conectada en Zernio con «Facebook Login» (si no, Zernio responde 400
// instagram_business_discovery_requires_facebook_login y hay que reconectarla con la opción de Facebook).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOKEN = (Deno.env.get("IG_GRAPH_TOKEN") || "").trim();
const IG_USER_ID = (Deno.env.get("IG_USER_ID") || "17841437425998828").trim();
const VERSION = (Deno.env.get("IG_GRAPH_VERSION") || "v23.0").trim();
const ZERNIO_API_KEY = (Deno.env.get("ZERNIO_API_KEY") || "").trim();

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PERFIL = "username,name,biography,website,followers_count,follows_count,media_count";
const MEDIA_CON_VISTAS = "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,view_count";
const MEDIA_SIN_VISTAS = "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count";
const POR_PAGINA = 50;
const PAGINAS_PRIMERA_VEZ = 4; // hasta 200 publicaciones la primera vez
const PAGINAS_NORMAL = 2;      // luego, las 100 más recientes (para actualizar likes y vistas)

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
}

function limpiarError(t: string): string {
  // Nunca devolver ni guardar el permiso, aunque Meta lo repita en un mensaje.
  let r = t;
  for (const s of [TOKEN, ZERNIO_API_KEY]) if (s) r = r.split(s).join("[oculto]");
  return r.slice(0, 400);
}

async function pedir(username: string, after: string | null, conVistas: boolean) {
  const media = `media.limit(${POR_PAGINA})${after ? `.after(${after})` : ""}{${conVistas ? MEDIA_CON_VISTAS : MEDIA_SIN_VISTAS}}`;
  const fields = `business_discovery.username(${username}){${PERFIL},${media}}`;
  const url = `https://graph.facebook.com/${VERSION}/${IG_USER_ID}?fields=${encodeURIComponent(fields)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` }, signal: AbortSignal.timeout(20000) });
  const d = await r.json().catch(() => null);
  return { ok: r.ok && !!d?.business_discovery, status: r.status, d };
}

async function leerCuenta(username: string, primeraVez: boolean) {
  let conVistas = true;
  let after: string | null = null;
  let perfil: any = null;
  const posts: any[] = [];
  const paginas = primeraVez ? PAGINAS_PRIMERA_VEZ : PAGINAS_NORMAL;
  for (let p = 0; p < paginas; p++) {
    let r = await pedir(username, after, conVistas);
    if (!r.ok && conVistas && JSON.stringify(r.d?.error || "").includes("view_count")) {
      conVistas = false; // esta versión de la API no acepta vistas: seguir sin ellas
      r = await pedir(username, after, conVistas);
    }
    if (!r.ok) {
      const e = r.d?.error;
      throw new Error(limpiarError(`Meta ${r.status}: ${e?.message || "sin detalle"}${e?.code ? ` (código ${e.code}${e.error_subcode ? "/" + e.error_subcode : ""})` : ""}`));
    }
    const bd = r.d.business_discovery;
    if (!perfil) perfil = bd;
    for (const m of bd.media?.data || []) posts.push(m);
    after = bd.media?.paging?.cursors?.after || null;
    if (!after || (bd.media?.data || []).length < POR_PAGINA) break;
  }
  return { perfil, posts };
}

// Vía Zernio (sin permiso propio de Meta). Devuelve lo mismo que leerCuenta, con los nombres de Meta.
async function leerCuentaZernio(username: string, accountId: string) {
  const url = `https://zernio.com/api/v1/accounts/${encodeURIComponent(accountId)}/instagram/business-discovery?username=${encodeURIComponent(username)}&limit=25`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${ZERNIO_API_KEY}` }, signal: AbortSignal.timeout(20000) });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.profile) {
    const det = d?.error?.message || d?.error || d?.message || d?.code || "sin detalle";
    throw new Error(limpiarError(`Zernio ${r.status}: ${typeof det === "string" ? det : JSON.stringify(det)}`));
  }
  const p = d.profile;
  const perfil = { id: p.id, name: p.name, biography: p.biography, website: p.website,
    followers_count: p.followersCount, follows_count: p.followsCount, media_count: p.mediaCount };
  const posts = (d.media || []).map((m: any) => ({ id: m.id, caption: m.caption, media_type: m.mediaType,
    media_product_type: m.mediaProductType, permalink: m.permalink, timestamp: m.timestamp,
    like_count: m.likeCount, comments_count: m.commentsCount }));
  return { perfil, posts };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);
  const body = await req.json().catch(() => ({}));
  const origen = typeof body?.origen === "string" ? body.origen.slice(0, 20) : "manual";

  let fuente: "meta" | "zernio" | null = TOKEN ? "meta" : (ZERNIO_API_KEY ? "zernio" : null);
  let zernioCuenta: string | null = null;
  if (fuente === "zernio") {
    const { data: ig } = await db.from("instagram_cuentas").select("zernio_account_id").eq("activo", true)
      .not("zernio_account_id", "is", null).order("creado_en").limit(1).maybeSingle();
    zernioCuenta = ig?.zernio_account_id ?? null;
    if (!zernioCuenta) fuente = null;
  }
  if (!fuente) return json({ ok: false, error: "falta_permiso", mensaje: "No hay IG_GRAPH_TOKEN ni una cuenta de Instagram conectada en Zernio." }, 503);

  const { data: ultima } = await db.from("ig_competencia_corridas").select("inicio").order("inicio", { ascending: false }).limit(1).maybeSingle();
  if (ultima && Date.now() - new Date(ultima.inicio).getTime() < 3 * 60 * 1000) {
    return json({ ok: false, error: "muy_seguido", mensaje: "Hubo una lectura hace menos de 3 minutos." }, 429);
  }
  const { data: corrida } = await db.from("ig_competencia_corridas").insert({ origen }).select("id").single();

  const { data: cuentas } = await db.from("ig_competencia_cuentas").select("username").eq("activo", true).order("username");
  const resumen: any[] = [];
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Santo_Domingo" });

  for (const c of cuentas || []) {
    const username = c.username as string;
    try {
      const { count } = await db.from("ig_competencia_posts").select("id", { count: "exact", head: true }).eq("username", username);
      const { perfil, posts } = fuente === "meta" ? await leerCuenta(username, !count) : await leerCuentaZernio(username, zernioCuenta!);
      const ahora = new Date().toISOString();
      await db.from("ig_competencia_perfiles").upsert({
        username, fecha: hoy, ig_id: perfil?.id ?? null, nombre: perfil?.name ?? null, biografia: perfil?.biography ?? null,
        web: perfil?.website ?? null, seguidores: perfil?.followers_count ?? null, seguidos: perfil?.follows_count ?? null,
        publicaciones: perfil?.media_count ?? null, capturado_en: ahora,
      }, { onConflict: "username,fecha" });
      if (posts.length) {
        const filas = posts.map((m) => ({
          id: String(m.id), username, publicado_en: m.timestamp ?? null, tipo: m.media_type ?? null,
          producto: m.media_product_type ?? null, permalink: m.permalink ?? null, texto: m.caption ?? null,
          likes: m.like_count ?? null, comentarios: m.comments_count ?? null, actualizado_en: ahora,
          ...(fuente === "meta" ? { vistas: m.view_count ?? null } : {}), // Zernio no trae vistas: no borrar las que hubiera
        }));
        const { error } = await db.from("ig_competencia_posts").upsert(filas, { onConflict: "id" });
        if (error) throw new Error("guardar publicaciones: " + error.message);
      }
      await db.from("ig_competencia_cuentas").update({ ultima_sync: ahora, ultimo_error: null }).eq("username", username);
      resumen.push({ username, ok: true, fuente, publicaciones_leidas: posts.length, seguidores: perfil?.followers_count ?? null });
    } catch (e) {
      const msg = limpiarError(e instanceof Error ? e.message : String(e));
      await db.from("ig_competencia_cuentas").update({ ultimo_error: msg }).eq("username", username);
      resumen.push({ username, ok: false, error: msg });
    }
  }

  if (corrida?.id) await db.from("ig_competencia_corridas").update({ fin: new Date().toISOString(), resumen }).eq("id", corrida.id);
  return json({ ok: true, fuente, cuentas: resumen });
});
