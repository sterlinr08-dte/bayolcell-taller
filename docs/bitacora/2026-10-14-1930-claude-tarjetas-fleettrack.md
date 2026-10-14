# 2026-10-14 19:30 — Claude — Tarjetas estilo FleetTrack en Reacondicionados y Órdenes

## Pedido del dueño
Carrusel `Dee_Pr1FGm_` (Orbix Studio) → «Las dos» (Reacondicionados y Órdenes de Servicio).

## Hecho (rama de trabajo, sin publicar)
- `taller-app.js`: tarjeta nueva de equipo del lote y de orden (foto, etiqueta de color, técnico con avatar, barra de avance, 3 datos) y la vista de Órdenes con cuadros de resumen, buscador, filtros de color y cuadrícula.
- `taller.html`: la tabla de Órdenes de Servicio se cambió por `#ordKpis`, `#ordBusq`, `#ordChips` y `#ordersGrid`.
- `taller-flota.js` (nueva capa): estilos, fotos del catálogo y filtros de color del lote.
- Pruebas en copia local con datos inventados (1366 y 390 px), sin errores.

## Ojo al publicar
- El `taller-app.js` de la rama trae cambios de pantallas que no están en `main` (`?v=20261013-pt1`).
- Al publicar, aplicar SOLO este cambio sobre el `taller-app.js` de `main` (con `git diff` de este commit) y subir su `?v=`.
