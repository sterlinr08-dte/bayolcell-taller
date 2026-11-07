# Meta del vendedor también en pesos (07-nov-2026)

**Pedido del dueño:** preguntó «¿Dónde le fijo la meta a los vendedores?». Se le ofreció poner el % o escribir el monto en pesos, y respondió «Ambos».

## Cambio (`conta-equilibrio.js`, versión pe11, rama `claude/metas-periodo`)
- Cada vendedor tiene ahora dos campos (48 px, letra de 16 px): el **%** y la **meta del mes en RD$**, con comas de miles.
- Si se escribe el monto, se calcula el % (monto ÷ meta del mes de la tienda) y se guarda en `variables.vend_pct`. Si se escribe el %, se calcula el monto.
- Las metas de las quincenas se recalculan solas.
- Si la tienda no tiene meta, sale el aviso «Fije primero la meta del mes de la tienda».
- En el celular los dos campos van en una sola línea.

## Prueba
- En Playwright, Michelle con RD$360,000 sobre una meta de 900,000 queda en 40 %.
- El aviso «Suma 105.5 %» aparece cuando corresponde.
- No hay controles de menos de 44 px ni desplazamiento hacia los lados, a 390 y a 1280 px.
