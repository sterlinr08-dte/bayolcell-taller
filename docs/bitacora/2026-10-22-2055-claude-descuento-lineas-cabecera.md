# 22-oct-2026 20:55 · Claude · Info Plus no aplica el % por línea: todo el descuento va a la cabecera

**Dueño (2.ª prueba real):** el comentario funciona; el descuento en pesos ya cuadra; el **por ciento de la línea no**.

## Arreglo (`main`, `taller-app.js` p11)
- `descuento` (cabecera, %) = (descuento de líneas + descuento RD$) ÷ subtotal × 100, con 4 decimales.
- `descuentototal` = pesos totales del descuento.
- `detallesPreFactura[].porcentaje` = **0** siempre, para que Info Plus nunca lo cuente dos veces si algún día lo aplica.
- `REGLAMENTOS.md` §2.2 actualizado.

Ejemplo: 12,990 con 10 % en la línea y RD$ 500 → descuento 1,799 → 13.8491 % → Info Plus: $ 1,799.00, total 11,191.

## Pendiente
Prueba del dueño con 10 % en la línea (y otra con 10 % + RD$ 500): el total de Info Plus debe ser igual al del taller.
