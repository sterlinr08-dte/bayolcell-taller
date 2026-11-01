# Prefactura al instante: sin la etiqueta «Comprobando…» (1-nov-2026)

Sigue a `…-1948-claude-prefactura-articulo-instantaneo.md`. El dueño preguntó «¿o sea que ahora va a decir comprobando?» y pidió «Quítala y publícala».

- Se quitó la etiqueta gris de `taller-prefactura.js` (`pintarCarrito`), su CSS en `taller-prefactura.css` y la de la tabla vieja en `taller-app.js`.
- Lo demás queda igual: la línea entra al instante, Info Plus confirma detrás, si no hay existencia la línea se pone roja y Guardar espera la comprobación.
- `taller-app.min.js` regenerado. Prueba `prefactura-instantanea.cjs` ajustada (ahora comprueba que NO hay etiqueta): 16/16 OK. `prefactura-delivery`, `prefactura-boton-precio`, `ui-global`: OK.
- Autorizado a publicar por el dueño en el mismo mensaje.
