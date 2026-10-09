# AI BOARD — integración con main y bloqueo de staging

El propietario autorizó continuar el cierre y eligió la organización Supabase `sterlinr08`. Se incorporaron a la rama feature los cinco commits existentes en main hasta `4bad1f4f496f4be21860156c4e99eaeb2c674b1d`, sin escribir en main ni publicar. El único conflicto fue la carga de scripts en taller.html: se conservaron `taller-app.js?v=20261009-im2` y `crm-marketing-consent.js?v=20261009-b3`, junto con todos los scripts AI BOARD. Los otros siete archivos se toman exactamente del árbol de main; no se reescribieron sus funciones.

La incorporación incluye la migración previa `20261009000000_placas_mapas.sql` que ya pertenecía a main. No se ejecutó. Una consulta exclusivamente de lectura verificó que las tablas técnicas del taller existen pero contienen 0 mapas y 0 puntos. No hay placa real para certificar.

Se verificó sintaxis del JavaScript principal de main, CRM, buscador, sidebar y los tres bloques inline de taller.html. Las pruebas de AI BOARD se repitieron después de la resolución.

## Staging

La operación Supabase `get_cost` devolvió `UNAVAILABLE`: «MCP tool get_cost was not returned by tools/list». No se obtuvo precio ni confirmation ID; no se creó infraestructura de pago. La autorización general de continuar no permite inventar esa confirmación de coste. No hay secretos Anthropic ni credenciales staging en este runtime. No se solicitaron ni imprimieron secretos productivos.

`tools/ai-board/staging_smoke.mjs` está preparado para probar Auth de dos usuarios sintéticos, pertenencia, RLS, dos respuestas reales, persistencia, reintento idempotente y denegación cruzada. Crea una conversación temporal y la elimina al finalizar. Rechaza expresamente el proyecto productivo antes de cualquier petición. Requiere un entorno separado con el backend instalado, cuentas y diagnóstico sintéticos, y configuración del proveedor. No se ha ejecutado contra Supabase/Anthropic real.

La creación de staging requiere un conector que exponga Branching/Billing o el panel Supabase. No usar otro proyecto activo del propietario como staging sin designación explícita. Siguen pendientes fotografías/mapas legítimos, revisión técnica, iPhone físico y aprobación concreta de publicación tras QA.
