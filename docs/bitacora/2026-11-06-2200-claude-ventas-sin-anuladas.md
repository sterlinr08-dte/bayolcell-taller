# 6-nov-2026 · Claude · Ventas: la copia ya quita lo anulado en Info Plus + Punto de equilibrio publicado con correcciones

## Pedido del dueño
«Verificar por qué las ventas difieren de las que hacemos desde Info Plus hasta con 10 mil pesos» y luego «Sí, hazlas todas y publícalo».

## Causa
`infoplus-ventas-sync` guardaba con «actualizar si existe» y nunca borraba: facturas anuladas y líneas corregidas en Info Plus seguían en `infoplus_ventas`.

## Arreglo (APLICADO)
- `infoplus-ventas-sync` **v19** (código en `supabase/functions/infoplus-ventas-sync/index.ts`): después de guardar, compara con la copia del mismo rango de fechas y quita lo que Info Plus ya no devuelve, con respaldo en la tabla nueva `infoplus_ventas_borradas` (solo lectura con permiso de Contabilidad). Frenos: no borra si Info Plus devuelve 0 líneas ni si faltaría más del 10 % del rango. `body.dias` (por defecto 7, máximo 62).
- Tarea nueva diaria **job 13** `infoplus-ventas-limpieza-40d` (2:37 a. m. RD) con 40 días. La de cada hora (job 2) sigue con 7.
- Corridas de hoy: 7 días → quitó 6 líneas, RD$9,050 (exactamente la diferencia de la semana); 40 días → quitó 37 líneas, RD$62,550 (sep 1,300; oct 62,100; nov 8,200).
- Octubre después de limpiar: Santiago 2,685,550 · Moca 472,660 · Navarrete 1,453,427 (incluye las 2 notas de crédito, que el punto de equilibrio resta).

## Punto de equilibrio publicado (main 2e9c8fc)
Correcciones de la auditoría (bitácora 2026-11-06-2100) + renglón «Ganancia que necesita» (venta − costo − variables frente a los gastos fijos).

## Pendiente
- Notas de crédito: la copia las guarda en positivo; el punto de equilibrio las resta, pero otros reportes (Estado Mensual) todavía no.
