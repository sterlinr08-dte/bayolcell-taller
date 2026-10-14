# 2026-10-14 14:00 — Claude — Vitrina «Destacados» en el catálogo de celulares

## Pedido del dueño
Reel `DeevGxgEbNJ` («Hover Expanding Cards UI Upgrade») «para el catálogo de Bayol Cell».

## Hecho
- `catalogo.html`: sección `#vitrina` arriba de las marcas (`pintarVitrina`, `vitAbrir`, `vitTocar`, estilos `.vit`/`.vt`).
  - Franjas verticales con la foto del equipo; la abierta crece, las demás quedan angostas y oscurecidas.
  - 7 equipos en PC y 5 en celular: los marcados como destacados primero y luego los disponibles con foto de mayor precio.
  - La franja abierta muestra nombre, «Desde RD$…» (precio nivel 1 más bajo disponible) y «Ver».
  - «Ver» baja a su tarjeta y la resalta.
  - Gira sola cada 3,6 s solo cuando está en pantalla, hasta que la persona la toca. Con «reducir movimiento» no gira.
  - Se esconde al buscar.
- La fila se agregó en `docs/REFERENCIAS-DISENO.md`.
- Probado con Playwright y los datos reales del catálogo (1366 y 390 px): sin errores ni desborde. Toca → se abre; «Ver» → baja a la tarjeta.

## Pendiente
Publicar cuando el dueño diga.
