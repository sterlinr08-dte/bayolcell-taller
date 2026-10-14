# 2026-10-13 12:15 — Claude: verificación de nivel 1 para las imágenes de batería y cristal trasero

Sigue a `2026-10-13-1300-claude-flyers-bateria-trasero.md`.

## Pedido del dueño
> «Verifica los precios nivel 1»

## Qué se hizo
- La copia de los niveles en `infoplus_articulos` era de las 06:00 UTC. Se ejecutó a mano el mismo trabajo diario, `infoplus-precios-diario` (función `infoplus-precios-sync`), que la refresca desde Info Plus. Respuesta: `{"ok":true,"total":2124,"con_multinivel":1760}`, a las 12:12 UTC.
- Se compararon todos los artículos BATERIA y TAPA de iPhone contra las dos imágenes:
  - **Batería:** los 23 precios coinciden con el nivel 1. Se usó la calidad «ORIGINAL»; donde no hay ORIGINAL, el artículo sin calidad.
  - **Cristal trasero:** todos coinciden.
- **Cambio:** se agregó **16 Pro, RD$3,850** (artículo 2073 «TAPA TRASERA IPHONE 16 PRO GOLD»), que faltaba. Se rehizo `assets/reparacion-cristal-trasero.webp`.

## Siguen pendientes de decisión del dueño
- **Batería del 11:** solo existe el artículo 2550 «BATERIA IPHONE 11 NORMAL 22222», con nivel 1 = 800. Parece un artículo mal cargado; la imagen vieja decía 1,400.
- **Cristal trasero 12 Pro / 12 Pro Max:** no hay artículo. La imagen lleva 2,500, el precio de la imagen vieja.
- **Cristal trasero 15 Plus:** 3,000 en negro y verde, 3,500 en amarillo, azul y rosado. La imagen lleva 3,500.
- **Otras rarezas (no cambian la imagen):** «TAPA IPHONE XS BLANCA» (2220) está en 3,000 y las demás X/XS en 1,500; «TAPA IPHONE 14 NORMAL BLANCA» (2602) está en 2,500 y las demás 14 en 3,000.
