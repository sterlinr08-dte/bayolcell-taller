# Punto de equilibrio: números negativos e ITBIS (C7 de untangle) (08-nov-2026, 10:50 RD)

Corrección siguiente según la regla del dueño («continúa siempre que falte un paso»).

## Antes
- `num()` borraba el signo «-» sin avisar: si alguien escribía «-500», el sistema calculaba con 500 y el campo seguía mostrando «-500».
- El factor del ITBIS (`1 + 0.18 × g18`) estaba copiado en 3 lugares.
- La validación «el reparto manual suma 100 %» estaba copiada en 2 lugares.

## Cambio (`conta-equilibrio.js` pe21)
- **Negativos:** un solo oyente en fase de captura sobre los campos numéricos del Punto de equilibrio y de la hoja de vendedores.
  - Si se escribe «-», se quita del campo a la vista, antes de que el campo lo lea, y sale el aviso «Solo números positivos.» (como mucho una vez cada 4 s).
  - Lo que se ve es lo que se calcula.
  - En el iPhone el teclado decimal no tiene «-»; esto cubre la PC.
- **ITBIS:** `factorItbis(g18)`, una sola vez.
- **Reparto:** `sumaReparto(com)` y `repartoCuadra(com)`, usados en el aviso y al guardar.
- **Sin cambio de cifras.**
- Se revisó la base: no hay ningún monto ni porcentaje negativo guardado en `conta_equilibrio`.

## Pruebas
- Comparación completa pe20 → pe21: 7 fechas × 3 meses × 6 pestañas + `calcular()`. **273 comparaciones, 0 diferencias.**
- Al escribir «-500» en un gasto, el campo queda en «500», se guarda 500 y sale el aviso. Sin errores.

## Estado
- Rama `claude/equilibrio-negativos`. No publicado: espera el «publícalo».
- Faltan, en este orden: C4 (claves fijas para Nómina, TSS y regalía), C6 (periodos como datos), C9 (códigos de vendedores como datos), C8 (pestaña de Contabilidad, toca `taller-app.js`: la decide el dueño) y C3 (préstamos: antes hay que revisar los datos guardados).
