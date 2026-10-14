// precio-pantalla — precio EXACTO del cambio de pantalla de iPhone para respuestas automáticas (14-oct-2026).
// Pedido del dueño: «que la IA responda cuando el cliente pregunta de manera específica (¿a qué precio la pantalla
// de iPhone 11?), que no dé un precio por otro, y que no dé precio OLED a menos que el cliente pregunte por la OLED».
//
// El precio lo decide ESTE código, nunca el modelo de IA:
// - Solo iPhone (los nombres de Android en Info Plus son muy variados para asegurar el modelo exacto).
// - Solo nivel 1 (cliente final), leído en vivo de infoplus_articulos. Nunca costo ni niveles 2/3.
// - Modelo exacto: «11» no es «11 Pro» ni «11 Pro Max». Si el mensaje no deja claro el modelo, no hay precio.
// - Calidad por defecto: «Calidad certificada» (Incell). En 5/6/7/8/SE vale también la LCD sin etiqueta.
//   OLED («Calidad Soft OLED») solo si el cliente escribe OLED/Soft; «Original» solo si escribe original.
// - Si para ese modelo y calidad hay dos precios distintos, no se cotiza (lo confirma una persona).
// - Excluye micas, cristal, bisel, tapas, etc.
// Copias: whatsapp-ia-responder/_shared y social-automatizaciones/_shared (scripts/qa-precio-pantalla.mjs
// comprueba que las tres sean iguales).

export type Calidad = "certificada" | "oled" | "original";
export type Modelo = { gen: string; variante: string }; // gen: 5,6,6S,7,8,SE,X,XS,XR,11..17 · variante: "",PLUS,PRO,PRO MAX,MINI,MAX
export type Cotizacion =
  | { ok: true; modelo: string; calidad: Calidad; calidadTexto: string; precio: number }
  | { ok: false; motivo: "no_es_pregunta" | "sin_modelo" | "no_iphone" | "sin_precio" | "precios_distintos" | "cristal" };

const CALIDAD_TEXTO: Record<Calidad, string> = { certificada: "Calidad certificada", oled: "Calidad Soft OLED", original: "Original" };
const NO_PANTALLA = /\b(MICA|MICAS|GLASS|VIDRIO|CRISTAL|PROTECTOR|BISEL|MOLDE|TAPA|HUELLA|FLEX|LENTE|CAMARA|BATERIA|PEGAMENTO|ADHESIVO|HERRAMIENTA|SEPARADOR|PLANCHA|OCA)\b/;
const OTRAS_MARCAS = /\b(SAMSUNG|GALAXY|MOTO|MOTOROLA|REDMI|XIAOMI|POCO|HUAWEI|HONOR|ALCATEL|ZTE|TCL|LG|NOKIA|TECNO|INFINIX|ITEL|OPPO|VIVO|REALME|NOTE|IPAD|PIXEL)\b/;
const LCD_SIN_ETIQUETA = new Set(["5", "5S", "5C", "6", "6S", "7", "8", "SE"]);

export function normalizar(s: string): string {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()
    .replace(/[^A-Z0-9/ ]+/g, " ").replace(/\s+/g, " ").trim();
}

// Lee el modelo que viene después de una generación de iPhone: «11 PRO MAX», «12 NORMAL», «7G PLUS», «XS MAX», «6GS».
const RE_GEN = /\b(1[1-7]|[5-8]G?S?|5C|SE|XS|XR|X)\b(?:\s+(PRO\s+MAX|PROMAX|PRO|PLUS|MINI|MAX|NORMAL))?/g;
function limpiarGen(g: string): string {
  return g.replace(/^([5-8])G(S?)$/, "$1$2"); // 7G → 7, 6GS → 6S
}
function limpiarVar(v: string | undefined): string {
  const x = String(v || "").replace(/\s+/g, " ").replace("PROMAX", "PRO MAX");
  return x === "NORMAL" ? "" : x;
}
export function nombreModelo(m: Modelo): string {
  const v = m.variante.split(" ").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
  return ("iPhone " + m.gen + (v ? " " + v : "")).trim();
}
const clave = (m: Modelo) => m.gen + "|" + m.variante;

// Modelos que cubre un artículo de Info Plus: «IPHONE 12 NORMAL / 12 PRO INCELL» → 12 y 12 Pro.
export function modelosDeArticulo(desc: string): Modelo[] {
  const d = normalizar(desc);
  const i = d.indexOf("IPHONE");
  if (i < 0) return [];
  // La parte del modelo: después de IPHONE (o antes, en «PANTALLA 5G IPHONE»).
  const tramo = d.slice(i + 6).trim() || d.slice(0, i);
  const out: Modelo[] = [];
  const partes = tramo.split("/");
  for (let k = 0; k < partes.length; k++) {
    RE_GEN.lastIndex = 0;
    const m = RE_GEN.exec(partes[k].trim());
    if (!m || m.index > 2) { if (k === 0) { const pre = d.slice(0, i); RE_GEN.lastIndex = 0; const p = RE_GEN.exec(pre); if (p) out.push({ gen: limpiarGen(p[1]), variante: limpiarVar(p[2]) }); } break; }
    out.push({ gen: limpiarGen(m[1]), variante: limpiarVar(m[2]) });
  }
  return out;
}

export function calidadDeArticulo(desc: string): Calidad | "lcd" | "clase_a" | null {
  const d = normalizar(desc);
  if (/\b(OLED|AMOLED)\b/.test(d)) return "oled";
  if (/\b(ORIGINAL|ORIGNAL|ORIG)\b/.test(d)) return "original";
  if (/\bCLASE A\b/.test(d)) return "clase_a";
  if (/\bIN ?CELL\b|\bINCELL\b/.test(d)) return "certificada";
  return "lcd";
}

// ¿El cliente pregunta el precio de una pantalla? (o comentó «PANTALLA …» en una publicación)
export function esPreguntaDePantalla(texto: string): boolean {
  const t = normalizar(texto);
  return /\b(PANTALLA|PANTALLAS|DISPLAY|LCD|TOUCH|TACTIL)\b/.test(t);
}

// Modelo de iPhone que pide el cliente. null si no está claro (ninguno, o dos modelos distintos).
export function modeloDelMensaje(texto: string): Modelo | null {
  const t = normalizar(texto).replace(/\bIPHONE(\d)/g, "IPHONE $1").replace(/\bI ?PHONE\b|\bIFONE\b|\bAIFON\b/g, "IPHONE");
  const tieneIphone = /\bIPHONE\b/.test(t);
  if (!tieneIphone && OTRAS_MARCAS.test(t)) return null;
  const encontrados = new Map<string, Modelo>();
  RE_GEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE_GEN.exec(t))) {
    const gen = limpiarGen(m[1]);
    // Sin la palabra iPhone, un número suelto solo vale si es una generación reciente (11–17) o X/XR/XS/SE.
    if (!tieneIphone && !/^(1[1-7]|XS|XR|X|SE)$/.test(gen)) continue;
    // «X» suelta es muy ambigua sin «iPhone» (p. ej. «x favor»).
    if (!tieneIphone && gen === "X") continue;
    const mod = { gen, variante: limpiarVar(m[2]) };
    encontrados.set(clave(mod), mod);
  }
  return encontrados.size === 1 ? [...encontrados.values()][0] : null;
}

export function calidadPedida(texto: string): Calidad {
  const t = normalizar(texto);
  if (/\b(OLED|AMOLED|SOFT)\b/.test(t)) return "oled";
  if (/\b(ORIGINAL|ORIGINALES)\b/.test(t)) return "original";
  return "certificada";
}

type Articulo = { descripcion: string; niveles?: Record<string, unknown> | null; precio?: unknown };
export function precioNivel1(a: Articulo): number {
  const n = a.niveles && (a.niveles as Record<string, unknown>)["1"];
  if (n != null && n !== "") return Number(n) || 0;
  return Number(a.precio) || 0;
}

// Elige el precio de los artículos ya leídos (función pura: se prueba sin base de datos).
export function elegirPrecio(texto: string, articulos: Articulo[]): Cotizacion {
  const t = normalizar(texto);
  if (/\b(MICA|CRISTAL|GLASS|VIDRIO)\b/.test(t)) return { ok: false, motivo: "cristal" };
  const modelo = modeloDelMensaje(texto);
  if (!modelo) return { ok: false, motivo: OTRAS_MARCAS.test(t) && !/\bIPHONE\b/.test(t) ? "no_iphone" : "sin_modelo" };
  const cal = calidadPedida(texto);
  const precios = new Set<number>();
  for (const a of articulos) {
    const d = normalizar(a.descripcion);
    if (!/\b(PANTALLA|DISPLAY|LCD)\b/.test(d) || NO_PANTALLA.test(d)) continue;
    if (!modelosDeArticulo(a.descripcion).some((m) => clave(m) === clave(modelo))) continue;
    const c = calidadDeArticulo(a.descripcion);
    const sirve = c === cal || (cal === "certificada" && c === "lcd" && LCD_SIN_ETIQUETA.has(modelo.gen));
    if (!sirve) continue;
    const p = precioNivel1(a);
    if (p > 0) precios.add(p);
  }
  if (!precios.size) return { ok: false, motivo: "sin_precio" };
  if (precios.size > 1) return { ok: false, motivo: "precios_distintos" };
  return { ok: true, modelo: nombreModelo(modelo), calidad: cal, calidadTexto: CALIDAD_TEXTO[cal], precio: [...precios][0] };
}

// Lee de la base solo las pantallas de esa generación de iPhone y elige el precio.
// deno-lint-ignore no-explicit-any
export async function cotizarPantalla(db: any, texto: string): Promise<Cotizacion> {
  const modelo = modeloDelMensaje(texto);
  if (!modelo) return elegirPrecio(texto, []);
  const { data, error } = await db.from("infoplus_articulos").select("descripcion, niveles, precio")
    .ilike("descripcion", "%IPHONE%").ilike("descripcion", `%${modelo.gen.replace(/S$/, "")}%`)
    .or("descripcion.ilike.%PANTALLA%,descripcion.ilike.%DISPLAY%,descripcion.ilike.%LCD%").limit(200);
  if (error) throw error;
  return elegirPrecio(texto, data || []);
}

export const fmtRD = (n: number) => "RD$" + Math.round(n).toLocaleString("en-US");

// Frase lista para el cliente (la arma el código, no la IA).
export function frasePrecio(c: Extract<Cotizacion, { ok: true }>): string {
  return `La pantalla del ${c.modelo} (${c.calidadTexto}) te sale en ${fmtRD(c.precio)}, con instalación incluida ✅`;
}
