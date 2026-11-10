// 10-nov-2026 · Pieza en foto → candidatos de Info Plus (nota interna). Datos inventados. Correr: deno run scripts/qa-pieza-foto.ts
import { leerPieza, palabrasEquipo, coincide, precioNivel1, existenciaTotal, buscarCandidatos, notaInterna } from "../supabase/functions/whatsapp-ia-responder/_shared/pieza-foto.ts";
const ok = (n: string, c: boolean, d?: unknown) => { console.log((c ? "OK   " : "FALLO") + " " + n + (d !== undefined ? " · " + JSON.stringify(d) : "")); if (!c) Deno.exitCode = 1; };
ok("lee pieza válida", JSON.stringify(leerPieza({ pieza: "marco", equipo: "Apple iPhone 14 Plus" })) === '{"pieza":"MARCO","equipo":"APPLE IPHONE 14 PLUS"}');
ok("rechaza pieza desconocida o sin equipo", leerPieza({ pieza: "cartucho", equipo: "x" }) === null && leerPieza({ pieza: "PANTALLA", equipo: "" }) === null && leerPieza(null) === null && leerPieza({ pieza: "BATERIA", equipo: "null" }) === null);
ok("palabras del equipo sin APPLE", palabrasEquipo("APPLE IPHONE 14 PLUS").join() === "IPHONE,14,PLUS");
ok("coincide exacto", coincide("MARCO IPHONE 14 PLUS NEGRO MIDNIGHT", "MARCO", ["IPHONE", "14", "PLUS"]));
ok("housing cuenta como marco", coincide("HOUSING IPHONE 14 PLUS AZUL", "MARCO", ["IPHONE", "14", "PLUS"]));
ok("14 no acepta 14 PRO", !coincide("PANTALLA IPHONE 14 PRO INCELL", "PANTALLA", ["IPHONE", "14"]));
ok("14 acepta «12 / 14 PRO» con barra", coincide("PANTALLA IPHONE 14 / 14 PRO INCELL", "PANTALLA", ["IPHONE", "14"]));
ok("otra pieza no coincide", !coincide("BATERIA IPHONE 14 PLUS", "MARCO", ["IPHONE", "14", "PLUS"]));
ok("8 PLUS no es 8", !coincide("BATERIA IPHONE 8 PLUS", "BATERIA", ["IPHONE", "8"]));
ok("precio nivel 1 y nunca costo", precioNivel1({ niveles: { "1": 4000, "2": 1500 }, precio: 3000 }) === 4000 && precioNivel1({ precio: 0 }) === 0);
ok("existencia suma almacenes", existenciaTotal({ existencias: { "1": 2, "6": 1 } }) === 3);
const filas = [
  { codigo: "1279", descripcion: "MARCO IPHONE 14 PLUS NEGRO MIDNIGHT", niveles: { "1": 4000, "2": 900 }, existencias: { "1": 0 }, costo: 650 },
  { codigo: "1280", descripcion: "HOUSING IPHONE 14 PLUS AZUL", niveles: { "1": 3500 }, existencias: { "1": 2, "3": 1 } },
  { codigo: "1281", descripcion: "MARCO IPHONE 14 PRO MAX NEGRO", niveles: { "1": 5000 }, existencias: { "1": 1 } },
  { codigo: "1600", descripcion: "BATERIA IPHONE 14 PLUS", niveles: { "1": 1800 }, existencias: { "1": 4 } },
  { codigo: "1700", descripcion: "MARCO IPHONE 14 PLUS SIN PRECIO", niveles: { "1": 0 }, existencias: {} },
];
let filtro = "";
const db = { from: (t: string) => ({ select: (_c: string) => ({ ilike: (_k: string, v: string) => ({ or: (o: string) => { filtro = t + ":" + v + "|" + o; return { limit: async () => ({ data: filas, error: null }) }; } }) }) }) };
const c = await buscarCandidatos(db, { pieza: "MARCO", equipo: "APPLE IPHONE 14 PLUS" });
ok("busca por el número del modelo y los nombres de la pieza", filtro === "infoplus_articulos:%14%|descripcion.ilike.%MARCO%,descripcion.ilike.%HOUSING%,descripcion.ilike.%CHASIS%", filtro);
ok("candidatos: con existencia primero; sin PRO MAX, sin batería, sin precio 0", c.map((x) => x.codigo).join() === "1280,1279", c);
const nota = notaInterna({ pieza: "MARCO", equipo: "IPHONE 14 PLUS" }, c) || "";
ok("nota interna con código, precio y existencia; sin costo", /1280 HOUSING IPHONE 14 PLUS AZUL RD\$ 3,500 \(3 en tiendas\)/.test(nota) && /1279 .* \(sin existencia\)/.test(nota) && !/650|900/.test(nota) && /confírmela/.test(nota), nota);
ok("sin candidatos no hay nota", notaInterna({ pieza: "MARCO", equipo: "X" }, []) === null);
const err = { from: () => ({ select: () => ({ ilike: () => ({ or: () => ({ limit: async () => ({ data: null, error: { message: "x" } }) }) }) }) }) };
ok("si la base falla: sin candidatos, sin error", (await buscarCandidatos(err, { pieza: "MARCO", equipo: "IPHONE 14" })).length === 0);
