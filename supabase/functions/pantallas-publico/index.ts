// pantallas-publico — precio PÚBLICO del cambio de pantalla de UN modelo (13-oct-2026).
// Lo usa el catálogo web (catalogo.html, pestaña «Pantallas»): el cliente escribe su modelo y
// ve SOLO ese precio. Pedido del dueño: «sin tener que enviarle el catálogo completo a los
// clientes sino el precio del modelo que busca».
//
// Reglas (CLAUDE.md, «REGLA DEL DUEÑO (13 oct 2026)»):
// - Solo precio de NIVEL 1 (cliente final). Nunca costo, nivel 2/3 ni precio_especial.
// - Al cliente nunca se le dice «Incell»: es «Calidad certificada».
// - La OLED se llama solamente «Calidad Soft OLED» y solo sale si el cliente la busca
//   (escribe «oled» o «soft»); no se ofrece sola.
// - Nunca devuelve la lista completa: exige una búsqueda (≥ 2 caracteres) y devuelve a lo sumo 6.
// - Respeta el interruptor del catálogo web (config_taller.catalogo_publicado).
// verify_jwt: false (página pública con la publishable key, igual que catalogo-publico).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "public, max-age=120" } });

const MAX_RESULTADOS = 6;
const ES_PANTALLA = /\b(PANTALLA|DISPLAY|LCD)\b/;
const NO_PANTALLA = /\b(MICA|MICAS|GLASS|VIDRIO|CRISTAL|PROTECTOR|BISEL|MOLDE|TAPA|HUELLA|FLEX|LENTE|CAMARA|BATERIA|PEGAMENTO|ADHESIVO|HERRAMIENTA|SEPARADOR|PLANCHA)\b/;
const CERTIFICADA = "Calidad certificada";
const SOFT_OLED = "Calidad Soft OLED";
const MARCAS_OPCIONALES = new Set(["IPHONE", "SAMSUNG", "GALAXY", "MOTOROLA", "MOTO", "XIAOMI", "REDMI", "HUAWEI", "PANTALLA", "CELULAR", "DE", "PARA", "EL", "LA", "MI"]);

const MARCAS: Record<string, string> = {
  IPHONE: "iPhone", IPAD: "iPad", SAMSUNG: "Samsung", GALAXY: "Galaxy", MOTO: "Moto", MOTOROLA: "Motorola", REDMI: "Redmi", XIAOMI: "Xiaomi",
  POCO: "Poco", HUAWEI: "Huawei", HONOR: "Honor", ALCATEL: "Alcatel", ZTE: "ZTE", TCL: "TCL", LG: "LG", NOKIA: "Nokia", TECNO: "Tecno",
  INFINIX: "Infinix", ITEL: "Itel", OPPO: "Oppo", VIVO: "Vivo", REALME: "Realme", COOLPAD: "Coolpad", BLADE: "Blade", NOTE: "Note",
  PLUS: "Plus", PRO: "Pro", MAX: "Max", MINI: "Mini", LITE: "Lite", ULTRA: "Ultra", PRIME: "Prime", PLAY: "Play", POWER: "Power",
  STYLUS: "Stylus", EDGE: "Edge", SPARK: "Spark", HOT: "Hot", SMART: "Smart",
};
const RUIDO = /^(PANTALLA|PANT\.?|DISPLAY|LCD|COMPLETA|CON|SIN|MARCO|JK|ZY|GX|RJ|HE|PREMIUM|CALIDAD|ORIGINAL|ORIG|OLED|INCELL|IN-CELL|TFT|AMOLED|HARD|SOFT|NEGRA|NEGRO|BLANCA|BLANCO|DORADA|DORADO|AZUL|ROJA|ROJO|VERDE|MORADO|ROSADA|GRIS|PLATEADA|COLOR|NUEVA|NUEVO|Y|DE|PARA|TOUCH|TACTIL|MODULO|\/)$/;

// Igual que crm-cotizar-pantalla.js (mantener los dos alineados).
function nombreLimpio(desc: string): string {
  const palabras = String(desc || "").toUpperCase().replace(/[(),]/g, " ").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let codigos = 0;
  for (const w of palabras) {
    if (out.length >= 6) break;
    if (RUIDO.test(w)) continue;
    if (/\d{3,}/.test(w) && out.length >= 2) { codigos++; if (codigos > 1 || /^[A-Z]{1,3}-/.test(w) || /^XT\d/.test(w)) break; }
    out.push(MARCAS[w] || (/^[A-Z]\d+[A-Z]$/.test(w) ? w.slice(0, -1) + w.slice(-1).toLowerCase() : /\d/.test(w) ? w : w.charAt(0) + w.slice(1).toLowerCase()));
  }
  if (out.length && out[0] !== "iPhone" && /^(\d|X|XR|XS|SE)/.test(out[0]) && /IPHONE/.test(String(desc).toUpperCase())) out.unshift("iPhone");
  return out.join(" ").replace(/\s+/g, " ").trim() || String(desc || "").trim();
}
function calidadDe(desc: string): string {
  const d = String(desc || "").toUpperCase();
  if (/\bOLED\b|\bAMOLED\b/.test(d)) return SOFT_OLED;
  if (/\bIN-?CELL\b/.test(d)) return CERTIFICADA;
  if (/\bORIGINAL\b|\bORIG\b/.test(d)) return "Original";
  return "";
}
function precioNivel1(a: { niveles?: Record<string, unknown> | null; precio?: unknown }): number {
  const n = a.niveles && a.niveles["1"];
  if (n != null && n !== "") return Number(n) || 0;
  return Number(a.precio) || 0;
}
const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

async function buscar(palabras: string[]) {
  let q = db.from("infoplus_articulos").select("descripcion, niveles, precio").or("descripcion.ilike.%PANTALLA%,descripcion.ilike.%DISPLAY%,descripcion.ilike.%LCD%").limit(60);
  for (const p of palabras) q = q.ilike("descripcion", `%${p}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "metodo" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const crudo = normalizar(String(body?.q || "")).slice(0, 40);
    if (crudo.replace(/\s/g, "").length < 2) return json({ ok: true, items: [], motivo: "escribe_modelo" });

    const { data: cfg } = await db.from("config_taller").select("catalogo_publicado").limit(1).maybeSingle();
    if (cfg && cfg.catalogo_publicado === false) return json({ ok: true, publicado: false, items: [] });

    const quiereOled = /\b(OLED|SOFT)\b/.test(crudo);
    const palabras = crudo.split(" ").filter((w) => w && !["OLED", "SOFT", "CALIDAD", "CERTIFICADA"].includes(w)).slice(0, 5);
    let filas = palabras.length ? await buscar(palabras) : [];
    if (!filas.length) {
      const esenciales = palabras.filter((w) => !MARCAS_OPCIONALES.has(w));
      if (esenciales.length && esenciales.length < palabras.length) filas = await buscar(esenciales);
    }

    const vistos = new Set<string>();
    const items = filas
      .filter((a) => { const d = String(a.descripcion || "").toUpperCase(); return ES_PANTALLA.test(d) && !NO_PANTALLA.test(d); })
      .map((a) => ({ nombre: nombreLimpio(a.descripcion), calidad: calidadDe(a.descripcion), precio: precioNivel1(a) }))
      .filter((x) => x.precio > 0 && (quiereOled || x.calidad !== SOFT_OLED))
      .filter((x) => { const k = `${x.nombre}|${x.calidad}|${x.precio}`; if (vistos.has(k)) return false; vistos.add(k); return true; })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }) || a.precio - b.precio)
      .slice(0, MAX_RESULTADOS);

    // Lista blanca final: solo estos tres campos salen a internet.
    return json({ ok: true, items: items.map(({ nombre, calidad, precio }) => ({ nombre, calidad, precio })) });
  } catch (e) {
    console.error("pantallas-publico:", e instanceof Error ? e.message : String(e));
    return json({ ok: false, error: "no_disponible" }, 500);
  }
});
