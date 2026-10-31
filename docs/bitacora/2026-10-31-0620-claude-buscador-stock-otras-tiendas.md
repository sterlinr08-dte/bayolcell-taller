# 2026-10-31 06:20 — Claude — Buscar artículo: «Navarrete: 0 · 5 en otras» en vez de «Sin stock»

## Dueño
Captura del buscador de la Prefactura: el iPhone 14 128GB (2874) salía «SIN STOCK» con el botón apagado, pero abajo la existencia
decía Santiago 1, Moca 1, Taller 3. «Vi un error en la ventana de búsqueda». Eligió la **opción A**.

## Diagnóstico
No era un error de cálculo: `existe(a)` mira solo el almacén elegido en la prefactura (`rxAlmacen`, aquí Navarrete = 0).
El bloqueo es la regla del 23-oct (no se agrega lo que solo existe en otra tienda, sin aviso de traslado). Lo confuso era el
texto: «Sin stock» parecía «no hay ninguno».

## Cambio (opción A: solo texto, el bloqueo sigue igual)
- `taller-recepcion.js` **g15**: nuevas `enOtras(a)` (suma de las demás tiendas) y `almNombre()`. Si el almacén elegido está en 0
  y hay en otras: la ficha de la fila dice **«Navarrete: 0 · 5 en otras»** (ámbar) y el botón apagado dice **«5 en otras»**;
  el `aria-label` lo explica. Si no hay en ninguna tienda, sigue «Sin stock» en rojo.
- `taller-recepcion.css` **g10**: `.bcrx-stk.out.otras` ámbar, puede partir en dos líneas; la columna de existencia pasa de
  `96px` fijo a `minmax(96px, max-content)` para que el botón no tape la ficha en PC.
- `taller.html`: versiones g15 / g10.

## Pruebas
- Nueva `scripts/pruebas/prefactura-stock-otras.cjs`: 16/16 a 390 y 1280 (fila con otras, sin stock en ninguna, con stock aquí,
  detalle, sin desborde, sin errores JS). Capturas revisadas a 390 y 1280.
- Regresión: `prefactura-boton-precio.cjs` y `prefactura-delivery.cjs` «Todo bien».

## Qué hace solo
| Acción | Qué pasa |
|---|---|
| El almacén elegido está en 0 | La fila dice dónde falta y cuántos hay en las demás tiendas |
| No hay en ninguna tienda | Sigue «Sin stock» en rojo |
| Cambiar el almacén de la prefactura | La fila se recalcula con el nuevo almacén |

## Nota
Hay dos artículos del iPhone 14 128GB en Info Plus (2874 y 1985 «Con aviso»): viene así del catálogo, no del sistema.

## Estado
Rama `claude/buscador-stock-otras`, sin publicar. Falta el «Publícalo» del dueño.
