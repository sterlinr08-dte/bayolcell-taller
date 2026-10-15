# 2026-10-15 01:00 — Claude — Enlaces exactos de Google Maps por sucursal (publicado)

## Solicitud del dueño
Pasó los enlaces de Compartir de Google Maps de las 3 sucursales (verificadas en el Perfil de Empresa) para dejar la ficha exacta (sigue a la bitácora 2026-10-15-0030). Se le dijo «con ese pongo los 3 y lo subo», y envió el último enlace.

## Enlaces (ficha de Google)
- Santiago: https://share.google/IMUZV4nGyNPCsbPei — Google la llama «BAYOL CELL SRL» (kgmid /g/11rxjq8405). Confirmado por el dueño que es Santiago.
- Moca: https://share.google/PBspeg3569Vzm6lEm — «BAYOL CELL SRL - MOCA» (kgmid /g/11sxwszd3q).
- Navarrete: https://share.google/36eYOmsL9WyZPzqXa — «BAYOL CELL NAVARRETE» (kgmid /g/11g0g52q32).

## Cambios
- `index.html`: `hasMap` de cada `MobilePhoneStore` con el enlace exacto; `sameAs` de cada sucursal = Instagram + `https://www.google.com/search?kgmid=…`; los 3 botones «Cómo llegar» del pie usan el enlace exacto.
- `tienda.html`: `mapa` de cada sucursal = enlace exacto.
- `catalogo.html`: `mapa` = enlace exacto y el botón «Cómo llegar» usa `href="${s.mapa}"` (antes armaba una búsqueda con texto).
- Ya no queda ningún enlace de búsqueda `google.com/maps/search` en las páginas.
- Verificado: JSON-LD válido; los scripts de `tienda.html` y `catalogo.html` compilan.

## Hallazgo (sin tocar)
`catalogo.html` tiene horarios distintos a los de `index.html`/JSON-LD: Moca 8:00–18:00 (Sáb 8:00–17:00) contra 8:30–18:00 Lun–Sáb; Navarrete domingo 9:00–13:00 contra 9:00–12:00. Preguntar al dueño cuál es el correcto (y que coincida con su Perfil de Google).
