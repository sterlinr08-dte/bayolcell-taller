# 2026-10-20 12:30 — Claude — La muestra HTML de la Prefactura pasa al sistema (rama, sin publicar)

Sigue a `2026-10-20-1130-claude-publicada-prefactura-limpia.md`.

## Dueño
«Pasa la muestra al sistema».

## Cambios (rama `claude/prefactura-limpia`, NO publicado)
- `taller-prefactura.js` / `.css` (v `20261020-f1`):
  - PC más ancha (980 → 1200 px), barra fija y lista de prefacturas igual.
  - «Facturar a · Precio del cliente · Almacén · Vendedor» en **una sola franja** (en celular: cliente y precio arriba,
    almacén y vendedor lado a lado).
  - Cada artículo en **una fila** en PC: # · Artículo · IMEI / serie · Precio · Desc. · Cant. · Importe · quitar. El IMEI tiene
    su columna (los ya escaneados salen como fichas debajo). En celular sigue en tarjeta.
  - **Clic en el nombre del artículo**: ventana con el precio de cada nivel (Cliente final · Por mayor · Extremo; el del cliente
    en azul); tocar un precio lo usa en la línea (`_rpPrecio`). Ahí mismo se cambia la descripción (`_rpDesc`), que antes era
    un campo en la fila.
- `taller-recepcion.js` / `.css` (v `20261020-f1`), buscador «igual que STUDIO» (`ppkDetailHTML`):
  - ficha «STOCK: n» / «SIN STOCK» / «SERVICIO» (el 1121 ya no sale «sin existencia»);
  - si el cliente paga otro nivel, el precio de lista sale tachado encima;
  - cliente elegido debajo del buscador («Nombre — Por mayor (se carga solo)»);
  - detalle: un recuadro por nivel (— si no tiene), existencia de **cada almacén** en fichas (rojo si 0), «Elegir — RD$ …»;
  - botón «← Cerrar» con texto.
- No toca guardar, Info Plus, la base ni los cálculos.

## Pendiente (espera a Info Plus)
Crédito y mínimo por nivel, línea roja bajo el mínimo y clave de administrador (mensaje a Dagoberto preparado).

## Pruebas
Banco local 390 y 1280: `pfopc.mjs` 52/0, `pftest.mjs` 47/0; usar un precio de la ventana cambia la línea (2000 → 1100);
sin desbordes, sin errores de consola.
