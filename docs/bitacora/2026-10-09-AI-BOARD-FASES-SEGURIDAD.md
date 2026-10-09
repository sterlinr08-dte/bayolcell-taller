# AI BOARD — continuación real del traspaso

Fecha: 2026-10-09. Rama: `feature/ai-board-plan-iphone-x-plus`. PR: #108, borrador. Reanudar desde este documento después de `2026-10-09-AI-BOARD-TRASPASO.md`.

## Fase 1: backend e historial seguro

Commit verificable: `ac196ff10f6c9a48e64ad2ed9027f73d1ae086be`.

Se leyó la bitácora, el diff del PR, el HTML y los archivos nuevos, y se recuperó `taller-app.js` por blob (GitHub Contents no devolvía su contenido por superar 1 MB). No hay AGENTS.md en el árbol de esta rama. Se inspeccionaron SOLO metadatos de Supabase: columnas, políticas RLS, funciones de identidad/permiso y código del endpoint existente.

Hallazgos: el motor existente usa Anthropic/Claude, no OpenAI. `app_puede_diagnostico` en frontend no cubre autorización de servidor. Las políticas de `diagnosticos` y órdenes son amplias y no garantizan aislamiento por caso. No se consultaron registros de clientes ni claves de órdenes.

Implementado en código de rama:

- Endpoint independiente `supabase/functions/ai-board-chat`, sin modificar el endpoint productivo `bde-diagnostico`.
- Verificación Auth `/user`, rechazo de usuarios anónimos, RPC de permisos y lectura de sesión usando JWT del solicitante. Service-role se limita a finalizar el turno ya autorizado.
- Lista cerrada de campos de entrada, tamaño real de cuerpo limitado, consentimiento obligatorio, limpieza de identificadores conocidos, errores sin textos del proveedor ni credenciales.
- Historial multi-turn: hasta siete pares completados, orden cronológico, presupuesto de contexto y mediciones asociadas a cada turno; nunca órdenes completas ni panic logs automáticos.
- Esquema de prueba `supabase/ai-board/schema.sql`: sesiones privadas por Auth user/diagnóstico, acceso del dueño del caso o técnico actualmente asignado a la orden; políticas de lectura reevalúan autorización. Mensajes sin escritura directa desde clientes. Reserva atómica, idempotencia, cuotas por usuario y finalización solo servidor.
- Prompt técnico separado: evidencia, hipótesis y próxima prueba; sin probabilidades o referencias eléctricas inventadas ni publicación automática de soluciones.

## Fase 2: integración, visor y pruebas

- Chat recupera sesiones y últimos 40 turnos, crea conversaciones/diagnósticos mínimos, elimina conversaciones bajo RLS, conserva borrador en error y limpia datos ante cambio de identidad.
- Reintentos ambiguos conservan request UUID para evitar dobles respuestas. Enviar repetidamente mientras hay una llamada en curso no duplica consultas.
- Seleccionar conversación sincroniza el modelo del BITMAP. Incluir mediciones es opt-in y exige coincidencia con el modelo del formulario.
- El botón de IA legado dentro de Diagnóstico abre el chat seguro; no se modifica `taller-app.js` ni se llama al endpoint antiguo desde el chat nuevo. Panic logs y Biblioteca conservan sus controles.
- BITMAP deja de cargar la ilustración ficticia. Importación local de boardview de datos con fuente/revisión/modelo, lados, componentes y pines aportados, selección y búsqueda por designador/red. Sin fuentes validadas sigue mostrando estado pendiente.
- Correcciones: foto anterior no cruza modelos, imágenes se decodifican antes de mostrarse, carreras de carga se cancelan, foto se limpia al cambiar usuario, zoom anclado al puntero, pestañas accesibles con teclado, captura de gestos no impide selección de componentes. Controles de zoom tienen texto visible aunque falte fuente de iconos.

## Verificación ejecutada

- 13 tests Node del handler/API, con Anthropic y REST simulados: autorización previa, minimización, mensajes/mediciones, presupuesto, idempotencia, cuotas, errores proveedor/guardado y límite de bytes.
- 7 tests PostgreSQL local PGlite 0.5.8: DDL real, RLS con roles `anon`/`authenticated`/`service_role`, casos propios/ajenos, asignación revocada, modelo incorrecto, mensajes no falsificables, reserva/finalización/idempotencia/cuotas, creación de caso e identidad inactiva.
- 2 tests de formato boardview: modelo/revisión/procedencia, geometría, duplicados, números y exclusión de campos ejecutables.
- 6 tests Chromium con el DOM real extraído de `taller.html` y el SDK simulado: montaje único/3 pestañas, herramientas legadas, teclado, consentimiento/doble envío/seguimiento/recuperación, borrador en error/cambio de usuario durante respuesta, viewport móvil 390×850 sin overflow horizontal, imágenes corruptas/modelo, componente/pines/redes, creación/eliminación.
- Sintaxis JS/MJS y `git diff --check`: correctos.
- Se inspeccionó captura móvil. Chromium se obtuvo por paquete npm porque la descarga estándar de Playwright produjo archivos ZIP inválidos en este entorno.

Estas pruebas son de desarrollo aislado. NO son una prueba E2E autenticada contra Supabase/Anthropic reales ni validan hardware. No se generaron costes de IA ni se desplegó un backend. La base de producción no se modificó.

## Pendientes concretos para continuar

1. Aplicar esquema y desplegar endpoint en un entorno Supabase de prueba; verificar bindings reales, privilegios, JWT vencido, asignación revocada y fallos de red con usuarios de prueba. Revisar advisors allí. No aplicar SQL a producción.
2. Validar una conversación real con Claude en staging usando las credenciales servidor ya elegidas para el proyecto. Mantener separación respecto a `bde-diagnostico`.
3. Incorporar al menos una placa legítima de iPhone X+ con modelo y revisión documentados y validar selección eléctrica con el técnico. No hay placa real ni licencia verificada disponible actualmente.
4. Añadir pirámides multirresolución de fotografías; el visor vectorial de datos ya existe, pero raster todavía no usa tiles.
5. Resolver aprobación humana de Biblioteca, retención automática del historial, paginación más allá de 30 sesiones/40 turnos/50 casos y QA Safari/iPhone real. La eliminación manual de conversaciones ya existe.
6. PR sigue en borrador. Revisar divergencia/conflictos con `main` antes de proponer merge. El PR ya figuraba no fusionable al iniciar; no se reescribió la rama ni se tocó main.

## Cómo ejecutar

`cd tests/ai-board && npm ci && npx playwright install chromium && npm test`.

En este entorno se usaron rutas de runtime con `AI_BOARD_PGLITE_MODULE`, `AI_BOARD_PLAYWRIGHT_MODULE`, `AI_BOARD_CHROMIUM_PATH=/tmp/chromium` y `AI_BOARD_SCREENSHOT_DIR` para pruebas y captura. Son opciones de pruebas, nunca requisitos del producto.

Referencias: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/functions/auth ; https://platform.claude.com/docs/en/api/errors ; https://developer.apple.com/design/human-interface-guidelines/
