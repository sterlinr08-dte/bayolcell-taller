# 3-nov-2026 08:30 RD — Publicado: Rapidez 1 «guardar rápido» (Claude)

## Solicitud del dueño
«PUBLICALO TODAVIA» después de ver el PR #208 listo (bit. 2026-11-03-0700). Se tomó como «publícalo» para esa entrega.

## Publicación
- PR #208 pasó de borrador a listo y se unió a `main` (squash): `37f64a1`.
- CI del PR: unit, browser chromium y browser webkit en verde.
- En vivo (bayolcell.com/taller.html): carga `taller-app.min.js?v=20261103-gr1` y el archivo trae `_bcTablasARecargar`.

## Qué revisar en vivo
- Consola: `BayolPerformance.ultimaCarga` dice qué tablas recargó la última vez y si fue completa.
- Si algo se ve viejo en un equipo: `localStorage.bc_guardar_rapido_off='1'` y recargar (vuelve a como antes).

## Pendientes
- PR #206 (nombre del empleado en el CRM) también toca `taller-app.js`: al unirlo hay que regenerar `taller-app.min.js`.
- `buscador-motion` y `raspa-y-gana` fallan también en `main` (aparte).
- Siguiente opción de rapidez: el 2 (traer solo lo nuevo en el respaldo de 5 min), si el dueño lo pide.
