# 2026-10-28 15:30 — Claude — Reacondicionados: Excel «Diagnósticos» por lote

## Pedido del dueño
- «Vamos a hacer un reporte del taller en los reacondicionados con los diagnósticos por lote».
- Eligió **«Solo equipo por equipo»** (sin resumen arriba) y formato **Excel**.

## Fuente de verdad (revisada en la base, solo lectura)
- `equipos_refurbish`: modelo, capacidad, código de artículo, IMEI, color, `estado_evaluacion`, técnico asignado y `notas_diagnostico` (lo que escribe el técnico; `diagnostico_inicial` está vacío y queda como respaldo).
- `tareas_trabajo` con `tipo='equipo'`: las fallas de cada equipo (pendiente / hecha).
- `refurb_evaluaciones` está vacía; no se usa.
- Piezas: `cache.piezasReacond`. En este reporte van solo los nombres, sin costos.

## Cambio
- Nuevo botón **«Diagnósticos (Excel)»** dentro del lote, junto a los reportes de costos.
  - Lo ve cualquiera que vea el lote, porque no lleva costos.
  - `_datosReporteCostosLote(true)` reutiliza los mismos filtros de la pantalla sin exigir administrador.
- `exportarDiagnosticosLoteExcel()`: una fila por equipo.
  - Columnas: #, Modelo, Código, IMEI (como texto), Color, Estado, Técnico, Diagnóstico, Fallas pendientes, Fallas hechas, Piezas, y los conteos Pend. y Hechas.
  - Las fallas se leen frescas de `tareas_trabajo`, en tandas de 100. Si falla la consulta, usa el caché.
- `taller-app.min.js?v=20261028-d1`.

## Pruebas
- `scripts/pruebas/diagnosticos-lote.cjs`: banco local con datos inventados y usuario **no** administrador. Pasan los 12 controles: nombre del archivo, solo el lote abierto, nota con saltos de línea, fallas pendientes y hechas, pieza sin costo, color, técnico, capacidad y ningún error de JavaScript.
- Vista con datos reales del lote C00002051 (consulta de solo lectura) para mostrarle al dueño.
- No se tocó la base de datos.

## Nota
El botón sigue el tamaño de la barra de herramientas del lote, que ya existía (botones pequeños). Si el dueño quiere esa barra a 44 px, se cambia completa en otra entrega.

## Rama / PR
`claude/reporte-diagnostico-lote`, PR sin publicar.
