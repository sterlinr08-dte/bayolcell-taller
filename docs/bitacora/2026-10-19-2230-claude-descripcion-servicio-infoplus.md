# 19-oct-2026 — La línea de servicio lleva el equipo, el IMEI y la falla a Info Plus

## Pedido del dueño
«sí, ponlo y publícalo». Se refiere a la solución propuesta después de la prueba de la 118709 (`2026-10-19-2200-claude-prueba-campos-118709.md`).

## Problema
La API de prefactura no tiene Comentarios, y el campo `contrato` no se ve en la pantalla de InfoplusWEB. Por eso la cajera no veía de qué equipo era la prefactura.

## Solución (`taller-app.js`, `?v=20261019-d1`)
- **Nueva función `_rpDescInfoplus(it, i)`**, que se usa al armar `detallesPreFactura` en `_rpCrearPrefactura`:
  - A la línea de **servicio** le agrega `· equipo · IMEI … · falla`. Si no hay servicio, se lo agrega a la **primera línea**.
  - Las demás líneas van igual, con un máximo de 100 letras.
- **Límite de 100 letras.** Es el largo máximo de descripción que hay en Info Plus: la descripción más larga de `infoplus_articulos` mide exactamente 100. Si la falla no cabe, se corta con «…».
- **No repite** un dato que ya esté en la descripción.
- **Solo cambia lo que se manda a Info Plus.** El carrito del taller y lo guardado en `recepcion_prefacturas` no se tocan.

## Pruebas (`pfdesc.mjs`, banco local, 390 y 1280 px)
- La línea del artículo va igual.
- La línea de servicio queda así (100 letras):
  > «Servicio técnico: cambio de batería · Samsung Galaxy A32 · IMEI 356789012345678 · No carga, batería…»
- `pftest`: 47 PASS.

## Publicación
Se publica con el «publícalo» del dueño.

El otro pedido del dueño de esta misma tarde (ver los diferentes precios en el buscador de artículos) va en una entrega aparte, `2026-10-19-2240`, pendiente de su visto bueno.
