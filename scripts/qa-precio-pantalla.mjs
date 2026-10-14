// QA del cotizador exacto de pantallas (supabase/functions/_shared/precio-pantalla.ts).
// Uso: node --experimental-strip-types scripts/qa-precio-pantalla.mjs
// Los artículos de abajo son descripciones reales de Info Plus (14-oct-2026), con su nivel 1.
import { elegirPrecio, modeloDelMensaje, frasePrecio } from "../supabase/functions/_shared/precio-pantalla.ts";
import { readFileSync } from "node:fs";

const A = (descripcion, n1) => ({ descripcion, niveles: { "1": n1 }, precio: n1 });
const ART = [
  A("BISEL DE PANTALLA IPHONE 11", 2000), A("MICA CRISTAL DE PANTALLA IPHONE XR / 11 + OCA", 2000),
  A("PANTALLA IPHONE 11 NORMAL  ZY INCELL PREMIUM", 2000), A("PANTALLA IPHONE 11 NORMAL JK INCELL PREMIUM", 2000),
  A("PANTALLA IPHONE 11 OLED", 2600), A("PANTALLA IPHONE 11 PRO CLASE A", null),
  A("PANTALLA IPHONE 11 PRO INCELL JK", 2000), A("PANTALLA IPHONE 11 PRO MAX INCELL JK", 2500),
  A("PANTALLA IPHONE 11 PRO MAX OLED", 3500), A("PANTALLA IPHONE 11 PRO MAX ZY INCELL PREMIUM", 2500),
  A("PANTALLA IPHONE 11 PRO ZY INCELL PREMIUM", 2000),
  A("PANTALLA IPHONE 12 MINI INCELL", 3500), A("PANTALLA IPHONE 12 NORMAL / 12 PRO INCELL", 2500),
  A("PANTALLA IPHONE 12 NORMAL / 12 PRO OLED", 3500), A("PANTALLA IPHONE 12 PRO MAX INCELL JK  PREMIUM", 3000),
  A("PANTALLA IPHONE 12 PRO MAX OLED", 6000), A("PANTALLA IPHONE 12 PRO MAX OLED", 6500),
  A("PANTALLA IPHONE 13 NORMAL JK INCELL", 3700), A("PANTALLA IPHONE 13 NORMAL JK OLED", 5300),
  A("PANTALLA IPHONE 13 PRO JK INCELL PREMIUM", 4500), A("PANTALLA IPHONE 13 PRO MAX JK INCELL PREMIUM", 6000),
  A("PANTALLA IPHONE 13 PRO MAX ORIGINAL", 19000), A("PANTALLA IPHONE 13 MINI INCELL ZY", 3500),
  A("PANTALLA IPHONE 14 PRO MAX JK INCELL PREMIUM", 8000), A("PANTALLA IPHONE 14 PLUS JK INCELL PREMIUM", 4500),
  A("PANTALLA IPHONE 16 PLUS JK", 3200), A("PANTALLA IPHONE 16 NORMAL", 6000),
  A("PANTALLA  IPHONE   7G  PLUS  BLANCA ", 1000), A("PANTALLA IPHONE 7G NEGRA", 1000),
  A("PANTALLA   IPHONE   6GS   BLANCA ", 1000), A("PANTALLA IPHONE 6GS PLUS BLANCA ", 1200),
  A("PANTALLA 5G IPHONE NEGRA", 1000), A("MICA CRISTAL DE PANTALLA IPHONE 8G PLUS NEGRO", 1000),
];

let ok = 0, mal = 0;
function caso(nombre, texto, esperado) {
  const r = elegirPrecio(texto, ART);
  const bien = esperado === null ? !r.ok : (r.ok && r.precio === esperado.precio && r.modelo === esperado.modelo && (!esperado.calidad || r.calidad === esperado.calidad));
  if (bien) ok++; else { mal++; console.log("FALLA", nombre, "|", texto, "→", JSON.stringify(r)); }
}
const P = (modelo, precio, calidad) => ({ modelo, precio, calidad });

caso("pregunta del dueño", "¿A qué precio tiene la pantalla de iPhone 11?", P("iPhone 11", 2000, "certificada"));
caso("11 no es 11 Pro Max", "pantalla iphone 11", P("iPhone 11", 2000));
caso("11 Pro", "Cuanto vale la pantalla del 11 pro", P("iPhone 11 Pro", 2000));
caso("11 Pro Max", "precio pantalla iphone 11 pro max", P("iPhone 11 Pro Max", 2500));
caso("promax pegado", "pantalla iphone 11 promax", P("iPhone 11 Pro Max", 2500));
caso("OLED solo si la pide", "pantalla iphone 11 pro max oled", P("iPhone 11 Pro Max", 3500, "oled"));
caso("soft = OLED", "y la soft del 13?", P("iPhone 13", 5300, "oled"));
caso("12 cubre 12 Pro", "pantalla iphone 12 pro", P("iPhone 12 Pro", 2500));
caso("12 normal", "pantalla iphone 12", P("iPhone 12", 2500));
caso("12 mini", "pantalla 12 mini", P("iPhone 12 Mini", 3500));
caso("12 Pro Max certificada", "PANTALLA 12 Pro Max", P("iPhone 12 Pro Max", 3000));
caso("12 Pro Max OLED con 2 precios → persona", "pantalla 12 pro max oled", null);
caso("13", "PANTALLA 13", P("iPhone 13", 3700));
caso("13 Pro comentario", "PANTALLA 13 Pro", P("iPhone 13 Pro", 4500));
caso("13 Pro Max no da original", "pantalla iphone 13 pro max", P("iPhone 13 Pro Max", 6000, "certificada"));
caso("original si la pide", "pantalla original iphone 13 pro max", P("iPhone 13 Pro Max", 19000, "original"));
caso("14 Pro Max", "iphone14 pro max pantalla", P("iPhone 14 Pro Max", 8000));
caso("16 Plus sin etiqueta → persona", "pantalla iphone 16 plus", null);
caso("7 Plus LCD", "pantalla iphone 7 plus", P("iPhone 7 Plus", 1000));
caso("7G", "pantalla iphone 7", P("iPhone 7", 1000));
caso("6s plus", "pantalla iphone 6s plus", P("iPhone 6S Plus", 1200));
caso("5", "pantalla iphone 5", P("iPhone 5", 1000));
caso("sin modelo", "cuánto cuesta una pantalla?", null);
caso("dos modelos", "pantalla iphone 11 o 12", null);
caso("Samsung no", "pantalla samsung a12", null);
caso("Redmi note 11 no es iPhone 11", "pantalla redmi note 11", null);
caso("cristal/mica no", "cuanto el cristal del iphone 11", null);
caso("128gb no confunde", "pantalla iphone 12 128gb", P("iPhone 12", 2500));
caso("15 sin datos → persona", "pantalla iphone 15", null);
// Faltas de ortografía (caso real 14-oct: «XS más» se cotizó como XS).
ART.push(A("PANTALLA IPHONE XS MAX INCELL JK", 2000), A("PANTALLA IPHONE X / XS INCELL JK", 1200));
caso("XS más = XS Max", "Tienen pantalla de iPhone XS más", P("iPhone XS Max", 2000));
caso("XS max", "pantalla iphone xs max", P("iPhone XS Max", 2000));
caso("XS normal", "pantalla iphone xs", P("iPhone XS", 1200));
caso("11 pro mas", "pantalla iphone 11 pro mas", P("iPhone 11 Pro Max", 2500));
caso("promas pegado", "pantalla 11 promas", P("iPhone 11 Pro Max", 2500));
caso("13 pro maz", "pantalla 13 pro maz", P("iPhone 13 Pro Max", 6000));
caso("prp = pro", "pantalla iphone 13 prp", P("iPhone 13 Pro", 4500));
caso("pluss", "pantalla iphone 14 pluss", P("iPhone 14 Plus", 4500));
caso("12 mimi", "pantalla iphone 12 mimi", P("iPhone 12 Mini", 3500));
caso("por favor no confunde", "pantalla iphone 11 por favor", P("iPhone 11", 2000));
caso("dudosa → persona", "pantalla iphone 11 prix", null);
caso("11 más barata → no cotiza otro", "pantalla iphone 11 mas barata", null);

// modeloDelMensaje
const m = (t) => { const x = modeloDelMensaje(t); return x ? x.gen + "|" + x.variante : null; };
for (const [t, e] of [["iphone xs max", "XS|MAX"], ["iPhone XR", "XR|"], ["x favor la del 11", "11|"], ["x favor", null], ["iphone se", "SE|"]]) {
  if (m(t) === e) ok++; else { mal++; console.log("FALLA modelo", t, m(t)); }
}
const f = elegirPrecio("pantalla iphone 11", ART);
if (f.ok && frasePrecio(f) === "La pantalla del iPhone 11 (Calidad certificada) te sale en RD$2,000, con instalación incluida ✅") ok++; else { mal++; console.log("FALLA frase", f.ok && frasePrecio(f)); }

// Las copias deben ser iguales al original.
const base = readFileSync("supabase/functions/_shared/precio-pantalla.ts", "utf8");
for (const c of ["supabase/functions/whatsapp-ia-responder/_shared/precio-pantalla.ts", "supabase/functions/social-automatizaciones/_shared/precio-pantalla.ts"]) {
  let igual = false; try { igual = readFileSync(c, "utf8") === base; } catch {}
  if (igual) ok++; else { mal++; console.log("FALLA copia distinta o ausente:", c); }
}
console.log(`${ok} PASS / ${mal} FAIL`);
process.exit(mal ? 1 : 0);
