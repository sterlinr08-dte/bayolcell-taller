# Punto de equilibrio: tarjeta «Su semana» (idea de Halvi)

**Pedido.** El dueño eligió «bayol: punto equilibrio» después de ver la referencia Halvi (`*-claude-ref-halvi.md`).

**Cambio.** Solo en `conta-equilibrio.js` (pe27). Se agrega la tarjeta «Su semana», antes de «El cruce», por tienda y en General:

- **4 cifras arriba:**
  - Hoy (o «Último día» en un mes pasado), en verde si llegó a la meta del día y en rojo si no;
  - promedio de los días que se vendió;
  - mejor día;
  - comparación contra los 7 días anteriores (+ en verde, − en rojo).
- **7 barras:**
  - los días pasados van rayados en gris, con borde verde si llegaron a la meta;
  - hoy va en rojo sólido.
- **Línea punteada de la meta del día**, con su etiqueta. Es `x.peDia`: lo que hay que vender por día para cubrir los gastos.
- **De dónde salen los datos:** `ventas_diarias_vendedor` (mes anterior y este), ajustado a `x.vn` igual que «El cruce».
- **Además:** «El cruce» en la PC salía enorme. El SVG se limita a 420 px de ancho y va centrado.

**No cambió:** ningún cálculo, ni la base de datos.

**Pruebas.** Arnés h8 a 390 y 1280 px, en Santiago, General, Navarrete y Moca de octubre: sin errores y sin scroll horizontal.

**Rama:** `claude/equilibrio-semana`. Sin publicar.
