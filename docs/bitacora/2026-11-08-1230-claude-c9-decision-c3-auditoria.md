# Untangle: decisión del dueño sobre C9 y auditoría de datos para C3 (08-nov-2026, 12:30 RD)

## C9, códigos de vendedores
El dueño eligió la **B**: la tabla `CODIGOS_IP` sigue dentro de `conta-equilibrio.js` y Claude la cambia cuando el dueño avise. No se crea tabla nueva.

## C3, préstamos: revisión de lo guardado antes de tocar nada
`conta_equilibrio`, fila de comunes (`codlocalidad = 0`):
- Solo existe **octubre 2026**. Noviembre todavía no se ha guardado.
- `variables` = `{ itbis_pct: 0 }`. **No hay lista de préstamos** (`prestamos`) **ni capital** (`capital`).
- Hay un gasto fijo **«Préstamos (cuota del mes)» = RD$ 395,825.26**.

## Riesgo encontrado (de dinero; no se cambió nada)
Según la regla del 6-nov, solo los **intereses** son gasto; el **capital** no es gasto, pero sale de la caja. Si esos RD$ 395,825.26 son la **cuota completa** (intereses + capital), el punto de equilibrio de octubre sale **más alto de lo real**, porque está contando el capital como gasto.

Para corregirlo hace falta que el dueño dé, por cada préstamo, el banco, cuánto es interés y cuánto es capital. Se anotan en «Préstamos» (Gastos comunes) y el sistema llena los intereses solo. **No se toca dinero sin su respuesta.**

## Pendientes de la auditoría
- C3: esperando el desglose de los préstamos.
- C8 (pestaña de Contabilidad): toca `taller-app.js` y es poco beneficio; queda para cuando el dueño quiera.
- Todo lo demás está hecho y publicado: C1, C2, C5, C10, C7, C4 y C6 (PR #250 a #257).
