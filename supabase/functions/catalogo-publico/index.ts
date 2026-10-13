import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Catalogo PUBLICO. Precio EN VIVO nivel 1 (cliente final) de Info Plus + disponibilidad. No expone costos.
//  - categoria 'celular' (por defecto): lo que el admin eligio en catalogo_items. Interruptor config_taller.catalogo_publicado.
//  - categoria 'pantalla' (13 oct 2026): TODAS las pantallas de Info Plus con precio nivel 1, solas.
//    Interruptor config_taller.catalogo_pantallas_publicado. Para esconder una: catalogo_items categoria='pantalla' visible=false.

const stockTotal = (a: any) => {
  if (a && a.existencias && typeof a.existencias === 'object') { let s = 0; for (const k in a.existencias) s += Number(a.existencias[k]) || 0; return s; }
  return Number(a && a.existencia) || 0;
};
const precioN1 = (a: any) => {
  if (a && a.niveles && a.niveles['1'] != null && a.niveles['1'] !== '') return Number(a.niveles['1']) || 0;
  return Number(a && a.precio) || 0;
};

const SIGLAS = new Set(['LG', 'ZTE', 'HTC', 'TCL', 'OLED', 'LCD', 'JK', 'ZY', 'GX', 'SL', 'LTE', 'XL', 'XR', 'XS', 'SE', 'II', 'OEM', 'HD']);
const MINUS = new Set(['CON', 'DE', 'DEL', 'Y', 'O']);
const ARREGLOS: [RegExp, string][] = [[/\bHAWEI\b/g, 'HUAWEI'], [/\bORIGNAL\b/g, 'ORIGINAL'], [/\bPREMIUN\b/g, 'PREMIUM'], [/\bSPACK\b/g, 'SPARK'], [/\bMOTOROLLA\b/g, 'MOTOROLA'], [/\bREVVEL\b/g, 'REVVL'], [/\bREAME\b/g, 'REALME'], [/\bREMI\b/g, 'REDMI'], [/\bSAMS?\b/g, 'SAMSUNG'], [/\bFINIX\b/g, 'INFINIX'], [/\bTABLE\b/g, 'TABLET'], [/\bPEQUEñA\b/g, 'PEQUEÑA']];
// Nombre legible para el cliente: sin «PANTALLA», errores de tipeo corregidos, iPhone 7G → iPhone 7, sin «bisel» (va como etiqueta).
function nombreBonito(desc: string) {
  let s = String(desc || '').toUpperCase().replace(/^\s*PANTALLAS?\s*(\+\s*TOUCH|TOUCH)?\s+/, '').replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ');
  for (const [re, r] of ARREGLOS) s = s.replace(re, r);
  if (/IPHONE/.test(s)) s = s.replace(/^(\d)G IPHONE/, 'IPHONE $1').replace(/\b(\d{1,2})G(S?)\b/g, '$1$2');
  s = s.replace(/\b(CON\s+)?BISEL\b/g, ' ').replace(/\bCON MARCO\b/g, ' ').replace(/\s+/g, ' ').replace(/[\s\/]+$/, '').trim();
  return s.split(' ').map((w, i) => {
    if (w === 'IPHONE') return 'iPhone';
    if (w === 'NXTPAPER') return 'NxtPaper';
    if (w === 'ITEL') return 'Itel';
    if (i > 0 && MINUS.has(w)) return w.toLowerCase();
    if (SIGLAS.has(w) || /\d/.test(w) || (w.length <= 2 && /^[A-Z]+$/.test(w))) return w;
    return w.charAt(0) + w.slice(1).toLowerCase();
  }).join(' ');
}
// Marca para los filtros de la pagina (reglas en orden; la primera que coincide gana).
const MARCAS: [string, RegExp][] = [
  ['iPhone / Apple', /IPHONE|APPLE WATCH/],
  ['Tabletas', /TABLET|\bTAB\b|TABLE\b|KINDLE|AMAZON|\bT1\d\d\b|\bT2\d0\b|\bT280\b/],
  ['Otras marcas', /M-HORSE|NOKIA|ONE ?PLUS|OUKITEL|\bHTC\b|COOLPAD|REALME|REAME|OPPO/],
  ['Xiaomi', /REDMI|XIAOMI|POCO/],
  ['Infinix / Tecno / Itel', /INFINIX|FINIX|TECNO|\bITEL\b/],
  ['Motorola', /MOTO|\bXT\d{4}/],
  ['ZTE', /ZTE|BLADE|ZMAX|\bZ\d{3,4}|MAVE/],
  ['TCL / Alcatel / Revvl', /\bTCL\b|ALCATEL|REVV?E?L|PIXI|IDOL|\bOT[- ]?\d|\b50\d\d[A-Z]?\b|\b4060\b|\b9008\b|\b3V\b/],
  ['Huawei', /HUAWEI|HAWEI|HONOR|\bP20\b|\bP30\b|P SMART|\bP9\b|ANE-LX|\bY\d\b|\bY9S\b/],
  ['LG', /\bLG\b|STYLO|ARISTO|TRIBUTE|X POWER|THINQ|THING|RISIO|\bK\d{1,2}S?\b|\bQ\d{3}\b|\bLS\d{3}\b|\bMS2\d0\b|\bV[2-7]0\b|\bX210\b|\bM210\b|\bLM-?[A-Z]/],
  ['Samsung', /SAMSUNG|\bSAMS?\b|GALAXY|SM-|\b[AJM]-?\d|\bG\d{3}|\bS2\d\b|\bNOTE \d{2}\b|I9060|\bS3\d7/],
  ['Google', /GOOGLE|PIXEL/],
];
function marca(desc: string) { const d = ' ' + String(desc || '').toUpperCase() + ' '; for (const [m, re] of MARCAS) if (re.test(d)) return m; return 'Otras marcas'; }
function etiquetas(desc: string) {
  const d = String(desc || '').toUpperCase(); const t: string[] = [];
  if (/\bOLED\b/.test(d)) t.push('OLED');
  if (/INCELL/.test(d)) t.push('Incell');
  if (/ORIGI?NAL|\bOEM\b/.test(d)) t.push('Original');
  if (/BISEL|MARCO/.test(d)) t.push('Con marco');
  return t;
}

async function pantallas(supa: any) {
  const { data: arts } = await supa.from('infoplus_articulos').select('codigo,descripcion,precio,niveles,existencias,existencia').ilike('descripcion', 'PANTALLA%');
  const { data: ocultas } = await supa.from('catalogo_items').select('codigo').eq('categoria', 'pantalla').eq('visible', false);
  const fuera = new Set((ocultas || []).map((o: any) => String(o.codigo)));
  const out: any[] = [];
  for (const a of (arts || [])) {
    if (fuera.has(String(a.codigo))) continue;
    const p = precioN1(a);
    if (!(p > 0)) continue;
    const m = marca(a.descripcion);
    let nombre = nombreBonito(a.descripcion);
    const pref = ({ Samsung: 'Samsung', LG: 'LG', Huawei: 'Huawei' } as Record<string, string>)[m];
    if (pref && !nombre.toUpperCase().includes(pref.toUpperCase()) && !/GALAXY/i.test(nombre)) nombre = pref + ' ' + nombre;
    out.push({ codigo: String(a.codigo), nombre, marca: m, etiquetas: etiquetas(a.descripcion), precio: p, disponible: stockTotal(a) > 0 });
  }
  out.sort((x, y) => x.marca.localeCompare(y.marca, 'es') || x.nombre.localeCompare(y.nombre, 'es', { numeric: true }));
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    let categoria = 'celular';
    try { const b = await req.json(); if (b && b.categoria) categoria = String(b.categoria); } catch (_e) { /* GET */ }

    let tienda: any = { nombre: 'BAYOL CELL', telefono: '', direccion: '' };
    let publicado = false, pantPublicado = false;
    try {
      const { data: ct } = await supa.from('config_taller').select('nombre,telefono,direccion,catalogo_publicado,catalogo_pantallas_publicado').limit(1).maybeSingle();
      if (ct) { tienda = { nombre: ct.nombre, telefono: ct.telefono, direccion: ct.direccion }; publicado = !!ct.catalogo_publicado; pantPublicado = !!ct.catalogo_pantallas_publicado; }
    } catch (_e) {}

    if (categoria === 'pantalla') {
      if (!pantPublicado) return json({ ok: true, publicado: false, tienda, categoria, items: [] });
      return json({ ok: true, publicado: true, tienda, categoria, items: await pantallas(supa) });
    }

    if (!publicado) return json({ ok: true, publicado: false, tienda, categoria, items: [] });

    const { data: items } = await supa.from('catalogo_items').select('*').eq('categoria', categoria).eq('visible', true).order('destacado', { ascending: false }).order('orden', { ascending: true });
    const lista = items || [];
    const codigos = lista.map((it: any) => String(it.codigo));
    const artMap: Record<string, any> = {};
    if (codigos.length) {
      const { data: arts } = await supa.from('infoplus_articulos').select('codigo,descripcion,precio,niveles,existencias,existencia,referencia').in('codigo', codigos);
      for (const a of (arts || [])) artMap[String(a.codigo)] = a;
    }
    const out = lista.map((it: any) => {
      const a = artMap[String(it.codigo)] || null;
      return {
        codigo: it.codigo,
        nombre: it.nombre_publico || (a && a.descripcion) || 'Celular',
        foto_url: it.foto_url || null,
        capacidad: it.capacidad || (a && a.referencia) || '',
        color: it.color || '',
        nota: it.nota || '',
        destacado: !!it.destacado,
        precio: a ? precioN1(a) : 0,
        disponible: a ? stockTotal(a) > 0 : false
      };
    });
    return json({ ok: true, publicado: true, tienda, categoria, items: out });
  } catch (e) {
    return json({ ok: false, error: String((e as any)?.message || e) });
  }
});
