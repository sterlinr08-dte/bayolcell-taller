# AI BOARD — Auditoría inicial del Diagnóstico e integración de prototipo
Fecha: 2026-10-09
Estado: auditoría parcial verificada por inspección de repositorio y metadatos de Supabase. No se ha alterado main ni se ha aplicado migración.

## Evidencia de repositorio
- Repositorio: sterlinr08-dte/bayolcell-taller, rama main de producción.
- taller.html: vista única existente `#v-diagnostico` con menú `nav('diagnostico',this)`. Tiene lector de iPhone por app de escritorio, formulario modelo/iOS/batería/consumo, síntomas, importador panic .ips, historial, resultados de IA y biblioteca.
- taller-app.js (~2.27 MB) contiene `nav(v,btn)` y permisos `diagnostico => diagnostico_ver`. Conserva `diagnosticarIA`, `guardarDiagnosticoIA`, `guardarCasoConocimiento`, `cargarConocimiento`, `guardarPanicHistorial`, etc.
- `diagnosticarIA()` envía modelo/iOS/batería/consumo/panic/síntomas/historial a Edge Function `bde-diagnostico`. Recibe un texto de diagnóstico; NO es todavía chat conversacional por mensajes persistidos.
- `guardarDiagnosticoIA()` inserta en `diagnosticos`; no vincula el registro automáticamente a `orden_id`.
- `guardarCasoConocimiento()` pide una solución por prompt y escribe `conocimiento_casos.exitoso=true` inmediatamente. Importante: esto NO representa verificación independiente de que realmente se reparó el equipo.
- El HTML existente recomienda ignorar el aviso "editor desconocido" al instalar el ejecutable; hay que sustituir ese mensaje por guía para verificar firma, editor y hash del instalador. No modificar sin revisión del instalador.

## Evidencia de esquema real consultado por lectura SQL
- `diagnosticos`: `id, orden_id, creado_por, modelo, sintomas, ia_diagnostico, ia_confianza, resultado_final, solucion_aplicada, exitoso` y otros.
- `diagnostico_imagenes`: `diagnostico_id, tipo, storage_path, analisis_ia, modelo, metadata`.
- `diagnosticos_tecnicos`: `orden_id, tecnico_id, problema_reportado, diagnostico_real, fallas_detectadas`, etc.
- `conocimiento_casos`: `modelo, panic_code, sintomas, solucion, exitoso, tiempo_minutos, piezas_usadas, veces_confirmado`.
- `panic_logs`: `diagnostico_id, modelo, panic_string, raw, analisis_ia`.
- `auth_actor_bindings`: relacion segura de `auth_user_id` con actor/rol/sucursal. Todas esas tablas tienen RLS habilitado, PERO eso por sí solo no demuestra que las políticas existentes sean suficientemente restrictivas.
- `ordenes_reparacion` contiene credenciales de acceso sensible (clave de dispositivo/cuentas). Nunca incluirlas en contexto de IA ni reutilizarlas para chats.

## Hallazgos priorizados
P0. Nunca enviar claves de clientes, IMEI innecesarios o identificadores personales a IA.
P1. Diferenciar casos aprobados de soluciones aportadas por un técnico; actualmente `exitoso=true` no constituye control de calidad.
P1. Chat entre técnicos: falta un modelo de pertenencia/permiso verificable por RLS; NO habilitar intercambio real antes de pruebas de aislamiento.
P1. Vinculación con órdenes: definir fuente única de modelo y relación con `diagnosticos.orden_id`.
P1. Boardviews: no existen datos certificados inspeccionados en esta fase; la placa genérica del prototipo debe marcarse DEMO y nunca mostrar pines/nets ficticios.
P2. `taller-app.js` es un archivo grande. Aislar UI del visor en `diagnostico-ai-board.js` y CSS modular; nunca duplicar la lógica `diagnosticarIA`.
P2. Considerar carga diferida y rendimiento antes de agregar librerías grandes o decodificar fotografías de alta resolución.
P2. Mensaje de instalación Windows de editor desconocido necesita revisión de seguridad.

## Primera implementación — rama experimental
Archivos nuevos:
- `diagnostico-ai-board.css`: estilos locales para Diagnóstico, paleta BAYOL CELL, responsive.
- `diagnostico-ai-board.js`: UI de 4 pestañas, catálogo iPhone X+, zoom SVG de ilustración genérica, navegación por rueda/pinza, importación de imagen local, sin subir nada al backend, persistencia solo de pestaña/modelo.
Cambio puntual:
- `taller.html`: dos referencias a esos archivos, sin alterar JS de taller ni el menú.

El módulo mueve los controles existentes a la pestaña Diagnóstico IA y el componente de conocimiento a Biblioteca. La pestaña Chats avisa con claridad que está pendiente: sin backend y sin mensajería ficticia. No hay boardview autenticado en esta versión.
Los datos de foto se mantienen como URL blob local, no se envían a terceros; el navegador puede perderla al recargar.

## Validación realizada y pendientes
- Inspección estática de `taller.html` y principales funciones JS; verificados IDs de la vista y función `nav`.
- Sintaxis del nuevo JS evaluada en entorno JavaScript (compilación sintáctica). Se ha corregido shorthand CSS no válido.
- Inspección de tablas SQL existentes; no se ejecutó escritura, migración o función remota.
- Falta test de navegador real con login de técnico autorizado, verificación de navegación, responsive, zoom/pinza, apertura de panic logs y prueba de compatibilidad con `bde-diagnostico`.
- Falta QA de seguridad/RLS del futuro chat y datos de boardview, latencia, consumo y licencia de fuentes.
- Falta confirmación de activos boardview y posteriores esquemas de DB.

## Siguiente fase
1. Validar prototipo aislado con prueba de navegador (desktop/iOS/Android).
2. Diseñar esquema y políticas RLS para chat humano, mediciones, boardview y referencias.
3. Implementar backend en entorno no productivo, con verificación de auth y RLS; conectar sesiones IA y mensajes.
4. Importar una placa real con licencia y revisar coordenadas/calibración, luego habilitar por revisión y modelo.
5. PR, revisión técnica y despliegue solo con permiso específico del dueño.

Fuentes de arquitectura:
- https://supabase.com/docs/guides/auth/row-level-security
- https://supabase.com/docs/guides/realtime/authorization
- https://developer.apple.com/design/human-interface-guidelines/
- https://openseadragon.github.io/
