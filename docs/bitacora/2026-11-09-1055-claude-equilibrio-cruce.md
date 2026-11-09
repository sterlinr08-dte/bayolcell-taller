# Punto de equilibrio: «≈ N ventas» y la gráfica «El cruce»

**Pedido del dueño.** Mandó un reel de @latinastogether (CalculaKit, 27-oct) con una calculadora de punto de equilibrio. De las ideas que se le mostraron, eligió dos: «Faltan N ventas» y «Gráfica El cruce».

## Cambios
- **`conta-equilibrio.js` (pe26)**
  - En la tarjeta «Le falta», debajo del monto, sale «≈ N ventas de RD$ X».
    - X es la venta promedio por factura: lo vendido ÷ las facturas del mes.
    - Si el mes lleva menos de 20 facturas, X sale del mes anterior.
    - N = lo que falta ÷ X, redondeado hacia arriba.
  - Gráfica nueva «El cruce», por tienda y en General:
    - una línea azul con la venta acumulada día a día (`ventas_diarias_vendedor`);
    - una línea roja, punteada, en el punto de equilibrio;
    - una proyección punteada hasta fin de mes, igual que `x.proy`;
    - un punto en el día en que se cubren los gastos.
  - Debajo de la gráfica dice qué pasa: «Día N: cubrió los gastos», «Al ritmo actual cubre los gastos el día N» o «No cubre los gastos este mes».
  - La línea diaria se ajusta a `x.vn` (ITBIS y notas de crédito) para que termine donde dice «Lleva vendido».
  - No se cambió ningún cálculo.
- **Migración `20261109190000_facturas_por_tienda.sql`**
  - Agrega la RPC de solo lectura `facturas_por_tienda(p_ini, p_fin)`.
  - Cuenta las facturas distintas sin «CN%» por tienda.
  - Es SECURITY DEFINER, pide `app_puede_contabilidad()` y anon no la puede usar.
  - **No está aplicada.** Se aplica al publicar.
  - Si no existe o falla, el JS solo oculta el «≈ N ventas».

## Datos reales de referencia (octubre, solo lectura)
Venta promedio por factura:

| Tienda | Promedio |
|---|---|
| Santiago | RD$ 2,335 (1,150 facturas) |
| Moca | RD$ 3,030 (156 facturas) |
| Navarrete | RD$ 4,276 (328 facturas) |

Las líneas de factura son el doble de las facturas. Por eso se cuentan facturas y no artículos.

## Pruebas
- **Arnés h8 con `facturas_por_tienda` simulado:** se probó Santiago, General y Navarrete al 10 de noviembre, y Moca en octubre.
  - Mensajes que salieron: «Al ritmo actual cubre los gastos el día 18 / 22 / 27» y «No cubrió los gastos este mes».
  - «≈ 256 ventas de RD$ 2,157».
  - Sin errores de JS ni scroll horizontal a 390 y 1280 px.
- **`cmp2`:** `calcular()` da idéntico en las 21 fechas contra main.

**Rama:** `claude/equilibrio-cruce`. Sin publicar.

## Ajuste de microcopy
El dueño escribió: «hay mucho texto explicativo… utiliza el reglamento microcopy». Se acortaron los textos de la pantalla, no los del Reporte ni del Excel:

| Dónde | Cambio |
|---|---|
| Tarjetas | «Debe vender», «Vendido», «Ganancia necesaria», «Falta», «Con cuota del préstamo», «Proyección» |
| Textos debajo de las tarjetas | Solo el dato: «RD$ X por día», «≈ N ventas», «Margen X %», «Sin gastos comunes», «Bajo el equilibrio» |
| Avisos | De 2 a 6 palabras, por ejemplo «Sin ventas en Info Plus este mes», «Ventas sin ITBIS (18 %)», «Préstamos con cuota total: equilibrio más alto» |
| Notas al pie | «Estimado antes del ISR · No sustituye a la contadora» y «Por días hábiles (lun–sáb)». Se quitó la nota de la sugerida, porque el botón ya dice «Usar sugerida RD$ X». |
| El cruce | «✓ Gana desde el día N», «Ganaría desde el día N», «Al ritmo actual no llega», «No cubrió los gastos». Leyenda: «Vendido» y «Equilibrio». |
