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

## Agregado: 4 ideas más de Halvi (el dueño eligió 1, 2, 3 y 4)
1. **Píldoras arriba**, debajo de la barra del equilibrio. Se deslizan de lado:
   - «Hoy» (en un mes pasado, «Vendido»), con fondo rojo;
   - Facturas del mes (`facturas_por_tienda`);
   - Venta promedio (`promVenta`);
   - Margen.
2. **Cuadritos de hoy por vendedor**, en «Meta por vendedor»:
   - son 6 cuadros que se llenan en rojo con lo vendido hoy contra lo que necesita por día (lo que falta de la quincena ÷ los días que quedan);
   - solo salen en el mes en curso y si el vendedor aún no cumplió.
3. **Tarjeta negra «Hoy · tienda»**:
   - muestra lo vendido hoy, la meta de hoy (la misma de «Meta por periodo»; si no hay meta, lo que pide el equilibrio por día), una barra, «Falta X · ≈ N ventas» o «✓ Meta de hoy cumplida»;
   - en General tiene flechas ‹ › de 44 px y puntos para pasar por las 3 tiendas (`_hoy`);
   - solo sale en el mes en curso.
4. **«Contra el mes pasado»**, con rangos:
   - Margen contra el del mes pasado ± 3 puntos;
   - Venta promedio contra la del mes pasado ± 10 %;
   - una barra con la franja normal y un punto, más la etiqueta Bajo (rojo), Normal o Alto (verde).

Se refactorizó `ventasQueFaltan` para que use `promVenta`, y se agregaron `ventaDia` y `hoyISO`. No cambió ningún cálculo del equilibrio. Probado en el arnés a 390 y 1280 px: sin errores y sin scroll horizontal.
