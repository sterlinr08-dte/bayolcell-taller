# 22-oct-2026 20:40 · Claude · Arreglo urgente: el descuento de cabecera en Info Plus es un por ciento

**Prueba real del dueño:** prefactura **118930** (iPhone 11 Pro Max, IMEI 353897105159703 comprobado, RD$ 500 de
descuento, comentario «500 pesos»). En Info Plus salió **Descuento % = 500.0000 → $ 64,950.00 → Total −51,960.00**.

## Causa
El `PreFacturaModel` toma `descuento` (cabecera) como **por ciento sobre el subtotal**. Mandábamos los pesos (500).
Antes de hoy ahí iba la suma de los descuentos por línea en pesos, así que el error ya existía; nunca se había
probado con descuento real.

## Arreglo (`main`, `taller-app.js` p10)
- `descuento` = pesos ÷ subtotal × 100 (4 decimales): 500 / 12,990 = 3.8491 % → Info Plus calcula $ 500.00.
- `descuentototal` = pesos del descuento RD$.
- El % por línea sigue solo en cada línea (`porcentaje`), no en la cabecera.
- `REGLAMENTOS.md` §2.2 actualizado.

## Pendiente de confirmar con otra prueba del dueño
1. Prefactura solo con RD$ 500 → Info Plus debe mostrar Descuento % 3.8491, $ 500.00, Total 12,490.
2. Prefactura solo con 10 % en la línea → ver si Info Plus baja el subtotal/total por la línea (si no, hay que decidir
   si el % de línea también debe ir a la cabecera).
3. Dónde salió el comentario «500 pesos» (Comentario o Contrato): la captura no llegó a esa parte.
La 118930 debe borrarse en Info Plus (total negativo).
