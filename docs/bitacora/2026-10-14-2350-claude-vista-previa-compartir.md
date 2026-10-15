# 2026-10-14 23:50 — Claude — Vista previa al compartir bayolcell.com (imagen de portada + etiquetas)

## Solicitud del dueño
Al compartir `bayolcell.com` por WhatsApp salía solo título y texto, sin imagen. Pidió las opciones 1 (imagen de portada) y 3 (ajustes técnicos).

## Diagnóstico
- `og:image` apuntaba a `assets/logo.png`: cuadrado 700×700 con fondo transparente (226 KB). WhatsApp lo muestra chico o no lo muestra.
- Faltaban `og:image:width/height/type`, `og:site_name`, etiquetas `twitter:*` y `apple-touch-icon`.
- `catalogo.html` y `pantallas.html` no tenían ninguna etiqueta `og:`.

## Cambios
- Nuevo `assets/og-bayolcell.jpg` (1200×630, 91 KB): fondo oscuro de la web con brillo rojo, logo, «Tu solución móvil completa.», etiquetas Celulares / Financiamiento / Reparación / Plan canje, «Santiago · Moca · Navarrete» y botón `bayolcell.com`. Celulares: `assets/catalogo/ip16pro.webp` de la propia web. Sin precios, teléfonos ni datos privados.
- Nuevo `assets/apple-touch-icon.png` (180×180, logo sobre fondo oscuro).
- `index.html`, `tienda.html`, `catalogo.html`, `pantallas.html`: bloque único de vista previa (og:site_name, title, description, type, url, locale, image + secure_url/type/width/height/alt, twitter:card `summary_large_image` + title/description/image) y `apple-touch-icon`. Se quitaron las etiquetas og/twitter viejas para no duplicar.
- Sin cambios de diseño visible, JS, Supabase ni Edge Functions.

## Rama / estado
- Rama `claude/og-compartir` (desde `main` 1a54155). **No publicado**: espera «publícalo».

## Nota para después de publicar
WhatsApp guarda en caché la vista previa de cada enlace. Para ver la nueva de inmediato: compartir `https://bayolcell.com/?v=2` o pasar el enlace por el Depurador de Facebook (developers.facebook.com/tools/debug → «Volver a extraer»).

## Pendiente opcional
Opción 2 (imagen propia por página) y opción 4 (ficha de negocio para Google; la web ya trae JSON-LD `MobilePhoneStore`, revisar que esté completo).
