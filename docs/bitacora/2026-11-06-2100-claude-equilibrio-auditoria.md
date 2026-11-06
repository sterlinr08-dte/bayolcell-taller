# 6-nov-2026 · Claude · Punto de equilibrio: auditoría (5 contadores + auxiliar) y correcciones (rama, sin publicar)

## Auditoría
Contador general, fiscal, de costos, auditor de datos, controller y auxiliar. Veredicto: fórmula correcta (la hoja hecha a mano = pantalla, versión publicada = repo, tabla protegida). Los números salían optimistas por los datos de entrada.

## Correcciones (dueño: «SÍ haz las 7 correcciones»; ITBIS: «todas esas ventas no tienen ITBIS por el momento»)
1. «Aporte de la tienda» (sin gastos comunes) en cada tienda y en la tabla General.
2. «Resultado a la fecha»: en el mes en curso compara contra los gastos de los días transcurridos. Hoy cuenta como día que queda.
3. «Intereses de préstamos» como gasto; «Abono a capital» aparte (no es gasto) con «Para cubrir también el capital».
4. Regalía 8.33 % (las vacaciones ya van en el sueldo); conceptos nuevos «Prestaciones (cesantía y preaviso)» y «Depreciación».
5. Variables nuevas: incentivos de técnicos y piezas usadas en reparaciones.
6. Tarjeta: comisión del banco (3 %) × parte de la venta con tarjeta (50 %), sobre el total con ITBIS.
7. Margen de seguridad, columna Contribución, nota «estimado con Info Plus, antes del ISR», General por día de lunes a sábado, aviso de doble conteo de comisiones.
- A: «Parte de las ventas que lleva ITBIS» = 0 % (dueño). B: notas de crédito CN se restan (venta − 2 × CN, igual con el costo); octubre Navarrete −RD$102,000. C: comunes repartidos según la venta del mes anterior (recomendado; opciones: este mes, iguales, manual).
- Sin migración: los datos nuevos van en el jsonb `variables`.

## Pruebas (copia local, Supabase simulado)
- Santiago oct con gastos de prueba: fijos 246,930 (TSS 24,435 + regalía 12,495), contribución 33.48 %, PE 806,673; Navarrete con CN restadas 1,382,527, contribución 20.13 %; PE de caja con capital 40,000 = 1,424,957. Cuentas a mano coinciden.
- Medidas a 390 y 1280: 0 controles por debajo de 44 px, campos 48 px/16 px, sin desborde. 0 errores.

## Diferencia de ventas con Info Plus (~RD$10,000), causa encontrada
- `infoplus-ventas-sync` (v18) guarda con «actualizar si existe» y **nunca borra**: líneas anuladas o editadas en Info Plus siguen en la copia.
  - 30-oct a 6-nov: Info Plus devuelve RD$1,057,150; la copia tiene RD$1,066,200 → **sobran 6 líneas, RD$9,050** (CO00099005, CO00098884, CO00098786|2550, CO00098958, CO00098956, CO00098812).
  - Octubre: 21 líneas fantasma por RD$39,500.
- Notas de crédito CN sumadas como venta (RD$51,000 en oct, Navarrete).
- La sync solo relee 7 días; los cambios posteriores no llegan.
- Arreglo propuesto (pendiente del OK del dueño): que la sync borre, dentro del rango que relee, las líneas que Info Plus ya no devuelve, y relea 35 días.
