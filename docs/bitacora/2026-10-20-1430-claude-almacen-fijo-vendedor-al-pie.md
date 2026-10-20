# 2026-10-20 14:30 — Claude — Prefactura: almacén fijo para empleados; «Vendedor» al pie junto a «Pedir reseña» (rama, sin publicar)

## Dueño
«Vendedor ponlo al lado de reseña y ponerlo fijo para los empleados que tengan su almacén asignado; solo el administrador puede
mover a cualquier almacén.»

## Cambios
- `taller-app.js` (`_rpInit`, v 20261020-h1): el **almacén** queda **fijo** (deshabilitado, gris, con explicación) cuando el usuario
  NO es administrador y tiene almacén asignado por su sucursal (`_miAlmacenInfoplus`: Moca→4, Navarrete→7, Santiago→1).
  El administrador puede escoger cualquier almacén (se recuerda en su equipo, como antes). Sin almacén asignado: se puede escoger.
  El **vendedor** ya era fijo para quien tiene su código de Info Plus (sin cambio).
- `taller-prefactura.js/.css` (v 20261020-h1): la franja queda en 3 casillas (Facturar a · Precio · Almacén); «Vendedor» baja al pie,
  al lado de Prefacturas · Nueva · Pedir reseña; el aviso «usuario no enlazado» va debajo a todo el ancho; los campos fijos se ven grises.

## Pruebas
`almfijo.mjs` 20/0 (empleada de Moca: almacén 4 y fijo; admin: libre; vendedor al pie; sin desbordes 390/1280),
`pftest.mjs` 49/0, `pfopc.mjs` 52/0 (actualizada: vendedor al pie).
