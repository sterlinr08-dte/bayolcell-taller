# 6-nov-2026 · Claude · Estado Mensual: notas de crédito restan y Navarrete en el selector

## Pedido del dueño
«Sí, corrige también el Estado Mensual.»

## Hecho
- Función `estado_mensual_cat` (APLICADA en la base, migración `20261106020000`): las líneas con factura `CN…` (notas de crédito) restan venta y costo. Permisos sin cambio (authenticated y service_role; anon no).
  - Octubre Navarrete: 1,453,427 → **1,351,427** (las 2 CN por 51,000 ahora restan). Total octubre: 4,509,637.
  - Como la función ya está aplicada, Estado Mensual y Punto de equilibrio publicados ya ven las CN restadas.
- `conta-equilibrio.js` (pe5): ya no resta las CN por su cuenta (lo hace la función); solo las menciona en el aviso. **Hasta publicar pe5, la pantalla publicada (pe4) las resta dos veces en Navarrete.**
- Estado Mensual: Navarrete (7) en el selector y en el cálculo (`taller-app.js`, 3 lugares del mapeo tienda→código); «Combinado (Santiago + Moca)» → «Todas las tiendas»; Navarrete en el selector de tienda de «Registrar gasto» y de asientos.
- `taller-app.min.js` regenerado (`?v=20261106-em1`).

## Estado
En la rama `claude/punto-equilibrio`; la publicación quedó a la espera del «publícalo» del dueño.

## Pendiente
- Otras funciones que leen `infoplus_ventas` directo (stats_*, infoplus_resumen_ventas_mensual, Celulares por modelo) todavía suman las CN.
