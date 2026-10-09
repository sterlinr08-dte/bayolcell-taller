# BITÁCORA DE TRASPASO — BAYOL CELL AI BOARD
Fecha: 2026-10-09
Proyecto: BAYOL CELL Taller (diagnóstico electrónico para iPhone X en adelante)
Estado: DESARROLLO EXPERIMENTAL, NO APROBADO PARA PRODUCCIÓN

## 0. LEER PRIMERO EN EL PRÓXIMO CHAT
**No reiniciar la planificación ni preguntar por el alcance. Reanudar PROGRAMACIÓN de inmediato desde esta rama.**
Repositorio: `sterlinr08-dte/bayolcell-taller`
Rama de trabajo: `feature/ai-board-plan-iphone-x-plus`
PR abierto en BORRADOR: https://github.com/sterlinr08-dte/bayolcell-taller/pull/108
Rama de producción: `main`. **NO fusionar a main, NO publicar ni migrar BD de producción sin autorización expresa.**

### Decisiones del propietario
1. Todo integrado **DENTRO DE Diagnóstico** del Taller, sin crear un módulo principal duplicado.
2. Catálogo objetivo iPhone **X en adelante**, variantes y revisiones de placa.
3. **Tres pestañas y solo tres:** BITMAP, Diagnóstico IA y Biblioteca.
4. **NO crear chat entre técnicos**, ni grupos ni infraestructura de mensajes humanos.
5. **SÍ crear chat conversacional técnico con IA**, capaz de preguntas de seguimiento, eventualmente historial seguro vinculado a cada diagnóstico.
6. Diseño visual original inspirado en los principios de Apple HIG, adaptado a BAYOL CELL: rojo #E31E24, blanco, grises, tactilidad cuidada, fluido en móvil y PC.
7. Zoom profundo profesional: capas SVG/boardview + pirámides multirresolución para fotografías. **No prometer nitidez infinita de imágenes raster de baja resolución.**
8. Nunca presentar placa demo como mapa real ni inventar pines, nets, voltajes o componentes.

## 1. Estado VERIFICADO en GitHub (2026-10-09)
### Archivos y código realmente guardados
- `taller.html`: carga `diagnostico-ai-board.css?v=20261009a`, `diagnostico-ai-chat.css?v=20261009c`, `diagnostico-ai-board.js?v=20261009a` y `diagnostico-ai-chat.js?v=20261009c`. Añadido chat EN RAMA mediante commit `6dc70b12c624cdb6f02f448f4540f77f9b2316a1`.
- `diagnostico-ai-board.js`: genera UI de tres pestañas dentro de `#v-diagnostico`; selector desde iPhone X, demo genérica SVG con zoom y pan/gestos, carga de fotografía LOCAL, sin guardar ni subir imágenes, desplaza controles existentes bajo pestaña IA y casos de conocimiento bajo Biblioteca. La figura es **demostrativa, NO boardview real**.
- `diagnostico-ai-board.css`: estilos premium específicos de Diagnóstico, responsive.
- `diagnostico-ai-chat.js`: primera interfaz de conversación IA temporal; incorpora preguntas y respuestas en memoria del navegador, formulario de envío, consentimiento explícito, lectura opcional de síntomas/consumo, control UI con RPC `app_puede_diagnostico`, invoca función existente `bde-diagnostico`; NO sube panic logs automáticamente ni almacena mensajes en BD; NO es solución final.
- `diagnostico-ai-chat.css`: estilos de interfaz conversacional delimitados por `#v-diagnostico`.
- Docs ya existentes: `docs/AI_BOARD_PLAN_MAESTRO_2026-10-09.md` (v2), `docs/AI_BOARD_UX_DIAGNOSTICO_2026-10-09.md` (v2), `docs/AI_BOARD_AUDITORIA_IMPLEMENTACION_2026-10-09.md`.

### Comprobaciones realizadas
- Fetch de los 5 archivos desde la rama: **TODOS existentes**.
- `taller.html` referencia JS y CSS de board y de chat: **OK**.
- Única vista `#v-diagnostico`, tabs exactamente 3, ninguna pestaña chat humano: **OK**.
- Sintaxis JS nueva validada por compilación estática V8 `new Function`: **OK** para `diagnostico-ai-board.js` y `diagnostico-ai-chat.js`.
- CSS del chat restringido al selector `#v-diagnostico`: **OK**.
- `main` NO modificado mediante estas acciones. No hubo despliegue, migración SQL ni modificación de Edge Functions.
- **NO** se han ejecutado pruebas integrales con navegador autenticado / iPhone / Android / hardware real. Las comprobaciones estáticas **NO** demuestran funcionamiento end-to-end.

## 2. Arquitectura actual que NO se debe romper
- `taller.html` + `taller-app.js`, Supabase JS v2, estilos del sistema y navegación global `nav('diagnostico',this)`.
- Permiso de navegación existente `diagnostico_ver` y RPC `app_puede_diagnostico`.
- El código legado actual `diagnosticarIA()` llama a Edge Function `bde-diagnostico`, recibiendo diagnóstico único; otras funciones guardan diagnósticos, importan panic logs y consultan `conocimiento_casos`.
- Tablas existentes verificadas: `diagnosticos` (incluye `orden_id`), `diagnostico_imagenes`, `diagnosticos_tecnicos`, `panic_logs`, `conocimiento_casos`, `auth_actor_bindings`; tienen RLS habilitado, pero sus políticas y privilegios deben auditarse para nuevas funcionalidades.
- `ordenes_reparacion` contiene datos sensibles, entre ellos claves; no pasar registros de órdenes completos al LLM.
- La función `bde-diagnostico` verificada en Supabase tiene `verify_jwt=true`, pero su código observado NO verifica explícitamente pertenencia/permiso de usuario en servidor y usa service-role para consultar conocimiento. **Prioridad crítica**: autorización real en backend y filtrado estricto de contexto antes de lanzar.

## 3. Lo que TODAVÍA FALTA — priorizado para programar
### PRIORIDAD 0 — seguridad y pruebas
- Inspeccionar el diff del PR #108 y la integración DOM exacta del módulo: verificar en navegador real que `board.js` y `chat.js` montan en orden correcto y que no rompen formularios, panic logs, biblioteca o navegación del taller.
- El código de chat hace `supabaseClient.rpc('app_puede_diagnostico')` **en navegador**: no sustituye el control de acceso obligatorio en Edge Function. Crear endpoint nuevo de prueba protegido por JWT + permisos/actor, validaciones, cuotas y minimización de datos. No modificar la Edge Function productiva sin autorización.
- No presentar como privada/persistente una sesión que solo vive en memoria. Revisar errores de interfaz si falla red o cambia modelo. Hay filtrado básico de IMEI/correo en el cliente: **no es anonimización exhaustiva**; añadir minimización robusta en servidor y control de datos sensibles.
- Ejecutar QA navegador PC/móvil, permisos, navegación tras refresco y accesibilidad. No hay resultado de esos tests todavía.

### PRIORIDAD 1 — chat IA real
- Diseñar/implementar sesiones y mensajes por diagnóstico con RLS que garantice que cada técnico solo acceda a casos autorizados. Preferible integrar `diagnosticos.orden_id`; no duplicar órdenes o clientes.
- Conversación multi-turn real, con mensajes y estado guardados, carga anterior, respuesta con fuentes/hipótesis/próxima prueba. El endpoint actual produce un bloque diagnóstico fijo; el chat experimental lo reutiliza con contexto temporal, no es una API nativa conversacional.
- Agregar adjuntos de foto/voz solo al contar con storage privado, políticas, protección de tamaño/tipos, antivirus/validación apropiada y consentimiento.
- Validación técnica humana antes de publicar una solución como verificada en Biblioteca. El legado permite guardar `exitoso=true` sin revisión adicional: no confiar en ello como corroboración científica.

### PRIORIDAD 2 — BITMAP técnico real
- Inventariar assets legítimos de boardview/schematic y permisos de uso. Ingesta por revisión de placa y modelo.
- Desarrollar visor real con componentes/redes/pines/capas y fuentes verificables. Para fotografías: tiles multirresolución solo si original de alta calidad; zoom vectorial para geometría.
- Sin datos: mostrar explícitamente estado 'Sin boardview verificado'. SVG actual es ilustración genérica, jamás usarla para diagnosis eléctrica.

### PRIORIDAD 3 — estabilidad/publicación
- Probar con técnicos: no enciende, no carga y sin imagen; rendimiento en iPhone real y desktop.
- Auditar impacto en CRM, órdenes, lectura USB, panic logs, navegación, CSS scoped y memoria.
- Mantener PR en borrador hasta QA y autorización expresa de publicar. La rama necesita revisión/rebase si `main` cambia.

## 4. Primera tarea CONCRETA del siguiente chat
1. **Abrir GitHub PR #108 y la rama anterior.** Leer esta bitácora.
2. Inspeccionar `taller.html`, `diagnostico-ai-board.js`, `diagnostico-ai-chat.js`. Revisar problemas reales de DOM, orden de scripts, dependencia de `supabaseClient`, estado de pestaña y consola.
3. Corregir fallos y añadir pruebas automatizables de la interfaz. Ejecutarlas; registrar resultados concretos en nueva bitácora.
4. En una rama/entorno de prueba, implementar backend seguro y persistencia real, tras revisar políticas y esquema de Supabase. No ejecutar DDL contra la base productiva sin autorización.
5. Actualizar el PR #108, documentar SHA/paths/resultados verificables. Nunca responder solo 'continuamos' o 'ya está' sin cambios reales.

## 5. Definición de TERMINADO (no se cumple hoy)
- BITMAP con por lo menos una placa **real validada** por revisión, zoom fluido, capas y selección fiable.
- IA chat con seguimiento, historial persistido por caso y backend autorizado/seguro.
- Biblioteca con validación real de soluciones.
- iPhone X+ como catálogo, con estados de cobertura honestos; habilitación técnica progresiva.
- Navegador PC y móvil probados, sin regresiones del Taller.
- PR revisado, autorización de merge/publicación, deploy y verificación postdeploy.

## 6. Mensaje sugerido para iniciar otro chat
> Continúa PROGRAMANDO BAYOL CELL AI BOARD desde `docs/bitacora/2026-10-09-AI-BOARD-TRASPASO.md`, rama `feature/ai-board-plan-iphone-x-plus`, PR #108. No vuelvas a planificar ni repitas lo ya decidido. Comprueba la implementación real, corrige el chat IA experimental, prueba la interfaz, fortalece el backend e implementa el historial seguro en un entorno de prueba. Deja commits y bitácora con verificaciones. No toques `main` ni Supabase de producción sin mi autorización.

## 7. Resumen de honestidad
**CÓDIGO DISPONIBLE EN RAMA:** visor demo, UI Apple-inspired, chat IA temporal enlazado y biblioteca previa.
**NO TERMINADO:** chat IA persistente, autorización servidor nueva, boardviews reales, validación de diagnósticos, pruebas navegador, publicación.
**USO REAL EN PRODUCCIÓN:** sin cambios.
