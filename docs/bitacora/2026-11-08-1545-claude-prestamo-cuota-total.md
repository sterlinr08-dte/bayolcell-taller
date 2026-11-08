# Préstamos: opción «Cuota total» (08-nov-2026, 15:45 RD)

## Pedido
El dueño confirmó que los RD$ 395,825.26 de octubre («Préstamos (cuota del mes)») son **interés + capital**. Pidió: «Vamos a poner opción cuota total; más adelante» (el desglose lo dará después).

## Cambio (`conta-equilibrio.js` pe24)
- Cada préstamo tiene dos botones: **«Intereses y capital»** o **«Cuota total»** (`modo: 'total'`, `cuota`).
  - **Cuota total:** se anota la cuota completa y toda cuenta como gasto, igual que antes. Sale un aviso: «el capital está contando como gasto y el punto de equilibrio sale más alto; sepárelos cuando tenga el desglose».
  - **Intereses y capital:** como siempre. Los intereses van a gasto y el capital va aparte, a «Para pagar también la cuota del préstamo».
- Al pasar de una opción a la otra se llevan los números: de «Cuota total» a «Intereses y capital» la cuota entra en Intereses para empezar; de vuelta, se suman.
- **Lo guardado a la antigua (caso de octubre):** al tocar «+ Agregar préstamo», el monto de «Préstamos (cuota del mes)» entra como **Cuota total**, sin cambiar ninguna cifra.
- Totales: «Sin separar», «Intereses», «Capital» y «Cuota del mes». El reporte y el Excel marcan «(cuota total, sin separar)».
- `interesDe`, `capitalDe`, `esTotal` y `hayCuotaTotal` en un solo lugar; también los usan el reporte y el Excel.

## Pruebas
- Caso como octubre (cuota completa como gasto, sin lista):
  - antes del cambio, punto de equilibrio = RD$ 3,522,241;
  - al agregar el préstamo entra como Cuota total RD$ 395,825.26 y el punto de equilibrio sigue en RD$ 3,522,241;
  - al pasar a «Intereses y capital» no cambia nada hasta escribir el desglose;
  - con un desglose de ejemplo (150,000 de interés y 245,825.26 de capital), el punto de equilibrio baja a RD$ 2,683,091 y «para pagar la cuota completa» queda en RD$ 3,522,241.
- Comparación completa pe23 → pe24 con préstamos ya separados: 273 comparaciones. Las únicas diferencias son los dos botones nuevos en Gastos comunes; las cifras son idénticas.
- Botones de 44 px o más a 390 y 1280 px. Sin errores de JavaScript.

## Estado
- Rama `claude/prestamo-cuota-total`. No publicado: espera el botón «Publícalo».
- **No se cambiaron datos guardados.** El desglose real de octubre queda pendiente del dueño.
