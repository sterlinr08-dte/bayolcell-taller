// pieza-foto — candidatos de Info Plus para una PIEZA que el cliente manda en foto (10-nov-2026).
// Pedido del dueño (referencia Spekgen, «Visión»): que con la foto de una pieza el agente busque el código
// y el precio, como hace con los equipos.
//
// Reglas (agente supervisado, .claude/rules/agente-atencion-supervisado.md):
// - Los candidatos van SOLO a la nota interna de la sugerencia («razon»), que ve el empleado. Nunca al texto
//   para el cliente ni a un envío automático: una foto no confirma la pieza exacta.
// - El modelo de IA solo dice QUÉ pieza y de QUÉ equipo cree que es; la búsqueda y el precio los pone este código,
//   leyendo infoplus_articulos en vivo. Solo nivel 1 (cliente final). Nunca costo.
// - Si no hay coincidencias claras, no se muestra nada.

export type PiezaFoto = { pieza: string; equipo: string };
export type Candidato = { codigo: string; descripcion: string; precio: number; existencia: number };

// Tipos de pieza que se aceptan del modelo → palabras con que Info Plus las nombra.
const SINONIMOS: Record<string, string[]> = {
  PANTALLA: ["PANTALLA", "DISPLAY", "LCD"],
  BATERIA: ["BATERIA"],
  FLEX: ["FLEX"],
  PIN: ["PIN", "CENTRO DE CARGA"],
  CAMARA: ["CAMARA"],
  LENTE: ["LENTE"],
  TAPA: ["TAPA", "BACK COVER"],
  MARCO: ["MARCO", "HOUSING", "CHASIS"],
  HOUSING: ["HOUSING", "MARCO", "CHASIS"],
  BOCINA: ["BOCINA", "ALTAVOZ", "AURICULAR", "SPEAKER"],
  MICROFONO: ["MICROFONO"],
  BOTON: ["BOTON"],
  CRISTAL: ["CRISTAL", "GLASS"],
  BANDEJA: ["BANDEJA", "SIM TRAY"],
  CARGADOR: ["CARGADOR"],
  CABLE: ["CABLE"],
};

export function normalizar(s: string): string {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

// Lee lo que devolvió el modelo; si no es una pieza conocida o no trae equipo, null.
export function leerPieza(x: unknown): PiezaFoto | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const pieza = normalizar(String(o.pieza ?? "")).split(" ")[0] || "";
  const equipo = normalizar(String(o.equipo ?? "")).slice(0, 60);
  if (!SINONIMOS[pieza] || !equipo || equipo === "NULL") return null;
  return { pieza, equipo };
}

// Palabras del equipo que deben aparecer en la descripción: «IPHONE 14 PLUS» → [IPHONE, 14, PLUS].
// «APPLE» y palabras de relleno no cuentan (Info Plus casi nunca las usa).
export function palabrasEquipo(equipo: string): string[] {
  const fuera = new Set(["APPLE", "CELULAR", "TELEFONO", "MODELO", "DE", "EL", "LA", "DEL", "GALAXY"]);
  return normalizar(equipo).split(" ").filter((w) => w && !fuera.has(w)).slice(0, 4);
}

// ¿La descripción nombra exactamente ese equipo? «14» no debe aceptar «14 PRO» si el cliente no dijo PRO.
export function coincide(desc: string, pieza: string, palabras: string[]): boolean {
  const d = " " + normalizar(desc) + " ";
  if (!SINONIMOS[pieza].some((p) => d.includes(" " + p + " ") || d.startsWith(" " + p))) return false;
  if (!palabras.every((w) => d.includes(" " + w + " "))) return false;
  for (const v of ["PRO", "MAX", "PLUS", "MINI", "ULTRA", "LITE"]) {
    if (!palabras.includes(v) && new RegExp(" " + v + " ").test(d)) {
      // Se acepta si la descripción cubre varios modelos con «/» y uno de ellos es el pedido sin variante.
      if (!/\//.test(desc)) return false;
    }
  }
  return true;
}

export function precioNivel1(a: { niveles?: unknown; precio?: unknown }): number {
  const n = a.niveles && typeof a.niveles === "object" ? (a.niveles as Record<string, unknown>)["1"] : null;
  const v = Number(n ?? a.precio ?? 0);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

export function existenciaTotal(a: { existencias?: unknown; existencia?: unknown }): number {
  if (a.existencias && typeof a.existencias === "object") {
    return Object.values(a.existencias as Record<string, unknown>).reduce((s: number, v) => s + (Number(v) || 0), 0);
  }
  return Number(a.existencia) || 0;
}

// Busca en Info Plus. db = cliente de Supabase con service role (solo lectura aquí).
// deno-lint-ignore no-explicit-any
export async function buscarCandidatos(db: any, p: PiezaFoto, max = 3): Promise<Candidato[]> {
  const palabras = palabrasEquipo(p.equipo);
  if (!palabras.length) return [];
  // Filtro grueso en la base: el número del modelo (o la palabra más larga) Y alguno de los nombres de la pieza.
  // El filtro fino (modelo exacto) lo hace coincide().
  const ancla = palabras.find((w) => /\d/.test(w)) || [...palabras].sort((a, b) => b.length - a.length)[0];
  const piezas = SINONIMOS[p.pieza].map((x) => `descripcion.ilike.%${x}%`).join(",");
  const { data, error } = await db.from("infoplus_articulos")
    .select("codigo, descripcion, precio, niveles, existencias, existencia")
    .ilike("descripcion", `%${ancla}%`).or(piezas).limit(300);
  if (error || !Array.isArray(data)) return [];
  return data
    .filter((a: { descripcion?: string }) => coincide(String(a.descripcion || ""), p.pieza, palabras))
    .map((a: Record<string, unknown>) => ({ codigo: String(a.codigo), descripcion: String(a.descripcion || "").trim(), precio: precioNivel1(a), existencia: existenciaTotal(a) }))
    .filter((c: Candidato) => c.precio > 0)
    .sort((a: Candidato, b: Candidato) => (b.existencia > 0 ? 1 : 0) - (a.existencia > 0 ? 1 : 0) || a.precio - b.precio)
    .slice(0, max);
}

const rd = (n: number) => "RD$ " + Math.round(n).toLocaleString("en-US");

// Nota interna para el empleado. Ej.: «Foto: MARCO de IPHONE 14 PLUS · Info Plus: 1279 MARCO IPHONE 14 PLUS NEGRO RD$ 4,000 (3 en tiendas)».
export function notaInterna(p: PiezaFoto, c: Candidato[]): string | null {
  if (!c.length) return null;
  const items = c.map((x) => `${x.codigo} ${x.descripcion.slice(0, 48)} ${rd(x.precio)}${x.existencia > 0 ? ` (${x.existencia} en tiendas)` : " (sin existencia)"}`);
  return `Foto: ${p.pieza} de ${p.equipo} · Info Plus: ${items.join(" · ")} · confírmela antes de cotizar`.slice(0, 480);
}
