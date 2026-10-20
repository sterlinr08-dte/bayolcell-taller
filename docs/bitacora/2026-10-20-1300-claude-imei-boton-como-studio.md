# 2026-10-20 13:00 — Claude — IMEI con botón e ícono, como STUDIO (rama, sin publicar)

Sigue a `2026-10-20-1230-claude-muestra-pasada-al-sistema.md`.

## Dueño
«Donde dice escanea el IMEI, en STUDIO los artículos que tienen IMEI hay un ícono que es mejor, más compatible.»

## Cambio (`taller-prefactura.js` / `.css` v `20261020-g1`)
- En la línea del celular ya no hay un campo de texto: hay un botón con ícono de código de barras
  («Escanear IMEI» en naranja si falta; «IMEI n» en azul cuando ya tiene), como `nxFacSerial` de STUDIO (solo el diseño).
- El botón abre una ventanita «IMEI · artículo»: campo listo para el lector, Enter agrega, la lista muestra los IMEI con «×»
  para quitar y el campo se limpia para el siguiente; «Listo»/«Volver»/Escape cierran. La cantidad se ajusta sola.
- Al agregar un celular (o repetir uno que ya está), la ventanita se abre sola en esa línea.
- Mismas funciones de siempre: `_rpImeiKey` → `_rpAgregarImei`, `_rpQuitarImei` (validaciones de IMEI repetido y existencia intactas).
- Se quitó la ficha «IMEI n/n» repetida bajo el nombre.
- Los IMEI siguen escaneándose o escribiéndose: Info Plus de Bayol no entrega una lista de seriales disponibles (pregunta 4 a Dagoberto).

## Pruebas
`pftest.mjs` 49/0 (nuevas: botón + ventanita con el cursor listo, «IMEI 1», «Listo» cierra), `pfopc.mjs` 52/0; capturas 390 y 1280.
