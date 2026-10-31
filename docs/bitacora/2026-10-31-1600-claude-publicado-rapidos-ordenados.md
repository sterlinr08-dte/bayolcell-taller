# 2026-10-31 16:00 — Claude — PUBLICADO: accesos rápidos ordenados

Dueño: «Publícalo». PR **#172** (squash `b9632fe`): `taller-prefactura.css` n19 / `.js` i32.

## Verificación
- `taller.html` en bayolcell.com sirve n19/i32; el JS contiene `ti-device-sim` y el CSS el cuadrito `.ic`.
- Intento de captura **en vivo** con Playwright desde la sesión: el proxy de la nube cortó muchas descargas a la vez
  (`ERR_TOO_MANY_RETRIES` en ~17 archivos) y la página salió a medias; no es falla del sitio (los mismos archivos responden 200 con curl).
- Comprobación segura: sha1 de `taller.html`, `taller-prefactura.css/js`, `taller-recepcion.css/js`, `bc-buscador-motion.css/js`,
  `taller-tactil.css` y `bc-form-espaciado.css` en vivo = repo `main`. Por tanto lo que se ve en vivo es lo mismo que las capturas del
  banco (con la fuente Tabler real) revisadas a 390 y 1280.

## Nota para próximas entregas
Para «mirar en vivo», si el proxy corta, comparar sha1 vivo vs repo y mirar la captura del banco con la fuente de íconos cargada
(`scratchpad/tabler`). Detalle del cambio: bit. 2026-10-31-1530.
