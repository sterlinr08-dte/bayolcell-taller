# AI BOARD — Ejecución y bloqueo verificado (2026-10-09)
## Confirmado
- PR #108 fusionado en main, frontend experimental presente.
- El PR #110 (rama actual) conserva `diagnosticarIA()` del botón clásico y añade prueba automatizada.
- Supabase de producción `vkhwdvjtowrhkhqavnvk` no tiene tablas `ai_board_*` ni Edge Function `ai-board-chat`; no es posible afirmar chat persistente operativo.
- `list_branches` en Supabase respondió `[]`: no existe staging branch actual.
- PR #110 contiene propuestas de endurecimiento de RLS para `placas_mapas` y un documento de control de acceso de `storage.objects`. **Ninguna política fue alterada en producción.**

## Pruebas / próximos cambios
1. Crear rama Supabase de desarrollo con confirmación de costos requerida y datos sintéticos; no copiar datos personales.
2. Ejecutar en la rama SQL `supabase/ai-board/schema.sql`, `library.sql`, `maintenance.sql`, comprobar integridad, permisos entre dos usuarios y llamada real a Edge Function `ai-board-chat`.
3. Revisar efecto de políticas actuales de `placas_mapas` / `storage.objects` sobre otras funciones del taller; reemplazar reglas amplias sin romper flujos heredados, solo tras pruebas.
4. Revisar GitHub Actions en PR #110 antes de fusionar.
5. Los boardviews reales para iPhone X+ aún no han sido aportados o validados; no confundir demo/JSON de terceros con datos certificados.
6. Ejecutar smoke test autenticado en PC/móvil y registrar evidencia.

## Reglas
No alterar Supabase producción ni `main` automáticamente. Los archivos preparados son propuestas para QA y cambio controlado. El propietario encargó completar el proyecto; queda pendiente infraestructura y verificación real.
