# 2026-10-20 15:30 — Claude — CRM «Precios» como ventana emergente (rama, sin publicar)

Sigue a `2026-10-20-1515-claude-crm-precios-como-prefactura.md`.

## Dueño
«En Info Plus cuando se consulta un artículo es una ventana» → «Vamos a poner la ventana de consulta como emergente.»

## Cambio (`crm-consulta-precio.js/.css` v 20261020-c1)
- Ventana emergente centrada (860×640 máx.) con **barra de título oscura** «Consulta de artículos · Precio cliente final» y **✕**
  (se pone roja al pasar), como una ventana de programa; el fondo solo se oscurece un poco.
- En la PC se **mueve arrastrando la barra** (no se sale de la pantalla). En el celular sigue a pantalla completa.
- Por dentro, igual que antes (panel de la Prefactura). La animación de entrada ya no sujeta la posición (fill `backwards`).

## Pruebas
`crmprecio.mjs` 21/0 (nueva: arrastrar mueve la ventana; 390 y 1280).
