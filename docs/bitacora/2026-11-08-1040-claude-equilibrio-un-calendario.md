# Punto de equilibrio: una sola cuenta de días hábiles (paso 2 de untangle) (08-nov-2026, 10:40 RD)

## Regla nueva del dueño (08-nov-2026)
«Continúa siempre que falte un paso luego de publicar el anterior.» Cuando se publica un paso de una serie, se sigue con el siguiente sin preguntar. **Publicar sigue necesitando su «publícalo»** en cada entrega.

## Cambio (`conta-equilibrio.js`, versión `20261108-pe18`)
- Un solo calendario: `diasRango` es la base. `contarDias`, `diasHastaAyer` y los días por defecto (`diasDefecto`) salen de ahí. Antes había dos bucles distintos contando días.
- «Días que quedan» (`diasQuedan`) se calcula una vez por tienda (`x.quedan`) y una vez para la General (`g.quedan`). Antes la fórmula estaba copiada 5 veces, una de ellas en el reporte.
- Se quitó `fISO`, que no se usaba.
- **No cambia ninguna cifra.**

## Prueba de que no cambió nada
Foto de todas las cifras con el archivo de antes y con el de después:
- 7 fechas simuladas: 1, 2, 8 (domingo), 9, 15 (domingo), 16 y 30 de noviembre.
- 3 meses: octubre (pasado), noviembre (en curso) y diciembre (futuro).
- Las 4 pestañas y las 2 quincenas de vendedores, más el resultado de `calcular()`.

Resultado: **252 comparaciones, 0 diferencias**. El reporte del mes (HTML) sale idéntico en 3 fechas. Sin errores de JavaScript.

## Pregunta abierta para el dueño (no se tocó)
En la General, «debe vender por día» divide entre los días de lunes a sábado, pero «le falta por día» usa los días de Navarrete (abre domingos). Son dos criterios en la misma tarjeta; hay que decidir cuál usar.

## Estado
- Rama `claude/equilibrio-dias`. No publicado: espera el «publícalo».
- Siguiente paso de la serie: paso 3 (base común para Equilibrio y Ventas).
