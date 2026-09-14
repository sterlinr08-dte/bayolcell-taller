import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// resolver-link-mapa — recibe un link de Google Maps (o el link que WhatsApp
// arma al compartir una ubicacion, que tambien es un link de Maps) y saca
// las coordenadas, para que un admin pueda pegar el link tal cual en vez de
// buscar los numeros a mano.
//
// Pedido 14 sept 2026: "guardar el GPS que sea mas facil, igual que WhatsApp
// o Google Maps, atraves de un link". Los links que da el boton "Compartir"
// de la app (maps.app.goo.gl/..., goo.gl/maps/...) son ACORTADOS -- las
// coordenadas solo aparecen en la URL final despues de seguir la
// redireccion, y el navegador no puede seguir esa redireccion el mismo
// (CORS/otro dominio) -- por eso hace falta esta funcion en el servidor.
//
// verify_jwt:true (solo CRM autenticado la puede llamar) + un allowlist de
// dominios de Google Maps -- sin esto, la funcion seria un fetch abierto a
// cualquier URL que alguien quisiera pasarle (riesgo de SSRF).

const DOMINIOS_PERMITIDOS = [
  "maps.app.goo.gl",
  "goo.gl",
  "g.co",
  "maps.google.com",
  "www.google.com",
  "google.com",
];

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
}

// Formatos de coordenadas que aparecen en URLs de Google Maps, en orden de
// confianza (el primero que matchee gana).
function extraerCoordenadas(url: string): { lat: number; lng: number } | null {
  let m = url.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  m = url.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  m = url.match(/[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  m = url.match(/[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "Metodo no permitido" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Body invalido" }, 400);
  }
  const urlCruda = String(body.url || "").trim();
  if (!urlCruda) return json({ ok: false, error: "Falta el link" }, 400);

  let url: URL;
  try {
    url = new URL(urlCruda);
  } catch {
    return json({ ok: false, error: "Eso no parece un link válido" }, 400);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return json({ ok: false, error: "El link tiene que ser http o https" }, 400);
  }
  if (!DOMINIOS_PERMITIDOS.some((d) => url.hostname === d || url.hostname.endsWith("." + d))) {
    return json({ ok: false, error: "Solo se aceptan links de Google Maps (maps.app.goo.gl, goo.gl/maps, google.com/maps, etc.)" }, 400);
  }

  // Primero se intenta sacar las coordenadas del link tal cual lo pego el
  // admin (ya viene completo, ej. lo copio de la barra de direcciones).
  let coords = extraerCoordenadas(urlCruda);
  let finalUrl = urlCruda;

  // Si es un link acortado (o no traia coordenadas), se sigue la
  // redireccion para llegar a la URL final de Google Maps.
  if (!coords) {
    try {
      const resp = await fetch(url.toString(), {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BayolCellBot/1.0)" },
        signal: AbortSignal.timeout(15000),
      });
      finalUrl = resp.url || urlCruda;
      coords = extraerCoordenadas(finalUrl);
      // Algunos links cortos redirigen a una pagina que solo trae las
      // coordenadas en el HTML (no en la URL) -- se busca ahi tambien.
      if (!coords) {
        const html = await resp.text();
        coords = extraerCoordenadas(html);
      }
    } catch (e) {
      console.error("resolver-link-mapa: fallo siguiendo el link:", e instanceof Error ? e.message : String(e));
      return json({ ok: false, error: "No se pudo abrir ese link" }, 502);
    }
  }

  if (!coords) {
    return json({ ok: false, error: "No se encontraron coordenadas en ese link — prueba abrirlo en Google Maps y copiar el link desde ahí" });
  }
  return json({ ok: true, lat: coords.lat, lng: coords.lng, url_final: finalUrl });
});
