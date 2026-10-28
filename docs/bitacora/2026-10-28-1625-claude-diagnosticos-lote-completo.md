# 2026-10-28 16:25 — Claude — Excel de diagnósticos: siempre el lote completo

## Pedido del dueño
«Sobre el diagnóstico: el del lote completo, no en estado de diagnóstico, porque quiero saber el reporte de todo el lote».

## Causa
La primera versión (PR #139) respetaba los filtros de la pantalla. Con la pestaña o el filtro «Diagnóstico» puestos, el Excel salía solo con esos equipos.

## Cambio (`taller-app.js` → `taller-app.min.js?v=20261028-d2`)
- `exportarDiagnosticosLoteExcel()` ya no usa los filtros: estado, técnico, búsqueda y fecha.
- Lee frescos de la base **todos** los equipos del lote abierto (`equipos_refurbish` por `lote_id`). Si la consulta falla, usa el caché del lote.
- Se actualizó el texto de ayuda del botón.

## Pruebas
`scripts/pruebas/diagnosticos-lote.cjs`: 13 de 13. El filtro de estado queda puesto en «Diagnóstico» y aun así salen los 3 equipos del lote, incluido uno que solo está en la base y no en el caché.

## Rama / PR
`claude/diag-lote-completo`, PR sin publicar.
