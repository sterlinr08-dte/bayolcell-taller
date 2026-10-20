# 2026-10-20 02:00 — Claude — Prefactura más compacta («muchos espacios vacíos»)

Sigue a `2026-10-20-0130-claude-prefactura-pulida.md`. Rama `claude/prefactura-limpia`, **sin publicar**.

## Solicitud del dueño
Después de ver el video de la demo: «Muchos espacios vacíos».

## Cambios (solo diseño; `taller-prefactura.js` y `.css`, versión `?v=20261020-e3`)
- **PC:** cada artículo en **una sola línea** tipo tabla (# · Artículo · Precio · Cant. · Desc. · Importe · quitar), con fila de títulos
  `.bcpf-ith` una sola vez arriba; las etiquetas por línea se ocultan en PC. Fila de ~95 px (antes ~190 px).
- **Cabecera:** el estado («Pendiente de crear») va debajo de «Prefactura de Info Plus», sin fila propia.
- **Facturar a / Condiciones:** menos relleno; la nota «No cobra ni descuenta inventario…» pasó debajo del total.
- **Celular:** el importe va en la misma línea que el código; «Cant.» al lado del selector (una línea menos por artículo).
- La lógica no cambió.

## Pruebas
- `pfopc` 52/52, `pftest` 47/47 (ajustada: el 2.º artículo ahora es `:nth-child(3)` por la fila de títulos), `pfdesc` 14/14,
  `info2` 80/80; capa apagada `rxfun` 12/12, `rxppk` 23/23, `admalm` 18/18.

## Pendiente
- Que el dueño lo vea; prueba real del descuento en Info Plus (con su autorización); «publícalo».
