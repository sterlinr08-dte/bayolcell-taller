# 2026-10-31 18:00 — Claude — Buscador más grande en PC y engranaje de la impresora con color de estado

Dueño (foto del buscador en la laptop): «esta ventana del buscador debería ser más grande; también poner en color verde el ícono de
herramienta de la impresora para entender que está conectada».

## Cambios (rama `claude/impresion-facil`, junto con la impresión fácil)
- `taller-prefactura.css` **n20**: la ventana flotante de «Buscar artículo» pasa de máx. 860×640 a **1120 × (alto de pantalla − 48)**.
  A 1440×900 mide 1120×852 y muestra 10 artículos a la vez (antes ~5). En el celular sigue a pantalla completa.
- `bc-impresion-facil.js/.css` **bif4**: el engranaje de la Prefactura (`.ibtn-imp`) va **verde** (`#047857` sobre `#ecfdf5`, punto
  verde) con QZ conectado y con **punto naranja** si no. Título/aria «Impresora conectada / sin conectar». Mira el socket real
  (`qz.websocket.isActive()`), no solo `_qzConectado` (que queda en true si se cierra QZ). En segundo plano intenta conectar cada 15 s
  (sin la ventana abierta), así el engranaje se pone verde solo al abrir QZ Tray. En el celular no cambia.

## Pruebas
- `scripts/pruebas/impresion-facil.cjs`: 35/35 — se suman engranaje naranja sin QZ / verde con QZ (390 y 1280), buscador
  ≥ 1100×800 a 1280×900 y a pantalla completa en el celular.
- Capturas revisadas a ojo: engranaje naranja y verde; buscador a 1440 con 10 artículos.

## Estado
Sin publicar. Falta el «Publícalo».
