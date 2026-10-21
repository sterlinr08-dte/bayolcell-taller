# 21-oct-2026 17:00 · Claude · Error del descuento al convertir la prefactura en Info Plus

## Lo que vio el dueño (capturas)
- En el taller, la prefactura **118852** era: batería Samsung RD$1,500, 10 % de descuento, total **RD$1,350**.
- Al convertirla en factura en InfoplusWEB salió:
  - **Descuento % = 150.0000**;
  - $ 2,045.46;
  - Subtotal 1,363.64;
  - **Total −681.82**.

## Causa
- El taller mandaba en el encabezado `descuento: 150` y `descuentototal: 150` (el **monto**), y además `porcentaje: 10` en la línea.
- Info Plus lee el `descuento` del encabezado como **porcentaje general**: 150 pesos se volvieron 150 %.
- Era lo pendiente de la bitácora 2026-10-20-0130, que avisaba: «falta confirmar cómo Info Plus interpreta porcentaje/descuento».

## Corrección (rama `claude/prefactura-limpia`, sin publicar)
- `taller-app.js` (`_rpCrearPrefactura`):
  - `descuento: 0`;
  - `descuentototal` sigue con el monto;
  - el descuento va solo por línea en `porcentaje`.
- `taller.html`: `taller-app.js?v=20261021-d1`.

## Falta confirmar con una prueba real (requiere el OK del dueño para escribir en Info Plus)
- Hacer una prefactura con descuento, convertirla en InfoplusWEB **sin guardar la factura** y ver si el total da el neto (por ejemplo 1,350).
- Si Info Plus no aplica el `porcentaje` de la línea, la opción es mandar el precio ya rebajado en la línea.
- La factura de la 118852 la corrige el dueño a mano: Descuento % en 0 (o en 10 si la línea no trae el descuento).
