# BAYOL CELL AI BOARD — Plan maestro v1
Fecha: 2026-10-09
Estado: ESPECIFICACION / SIN DESPLIEGUE
Rama: feature/ai-board-plan-iphone-x-plus

## Objetivo
Construir un espacio de diagnostico profesional dentro de la vista existente Diagnostico del Taller BAYOL CELL para iPhone X en adelante, con visor BITMAP/boardview, diagnostico guiado por IA y chat humano entre tecnicos. El sistema debe ahorrar pasos y nunca inventar mediciones o conexiones.

## Alcance de modelos
Cobertura objetivo: iPhone X, XR, XS, XS Max y todas las generaciones posteriores, variantes normales, Plus, Pro, Pro Max, mini, e y Air cuando correspondan. Catalogo extensible, basado en identificador de hardware y revision de placa (no solo nombre comercial). La aparicion de un modelo en el selector NO significa que su boardview este disponible; mostrar estado exacto: sin datos, fotografias disponibles, componentes identificados, boardview parcial, boardview verificado.
La cobertura real se habilita progresivamente, segun archivos autorizados y verificados.

## Requisito de producto: NO SOLO CHATBOT
1. Chat IA por caso: texto, audio, imagenes, archivos, contexto de orden y mediciones; respuestas con evidencia y nivel de certeza.
2. Chat humano: individual y por grupos, mensajes, notas de voz, fotos, archivos, responder/citar, busqueda, indicadores de pendiente; asociacion opcional a caso tecnico.
3. Invocar IA desde chat humano solo con accion explicita y permisos; IA debe separar mensajes privados del caso compartido.
4. Historial persistente, notificaciones, estado leido, permisos, auditoria y adjuntos privados.
5. Diagnostico estructurado que complementa, no sustituye, el chat.

## UX — Vista Diagnostico
Dentro de nav('diagnostico'), usar pestanas BITMAP | Diagnostico IA | Chats | Biblioteca.
Desktop: dos paneles redimensionables, visor a izquierda, chat/mediciones a derecha; movil: una vista principal y panel intercambiable, sin modales anidados.
Flujo <=5 acciones para abrir desde orden: abrir orden -> diagnostico -> modelo precargado -> sintoma -> sesion de diagnostico.
Atajos: enviar medicion, adjuntar foto, ver punto en placa, guardar hallazgo, consultar companero, transformar caso en conocimiento.
Accesibilidad, busqueda por modelo, falla, componente, net y numero de parte; zoom/pan suaves; vista superior/inferior, capas solo si existen. Guardar estado de pestaña y scroll al actualizar sin duplicar ventanas.

## Motor de diagnostico
Entrada: modelo/variante/revision de placa; sintomas; historial (liquidos, golpes, cambios); mediciones reales + unidades, puntos, condiciones (apagado/encendido, fuente, temperatura), fotos.
Salida: hipotesis diferenciadas de hechos, proxima prueba concreta y segura, valor de referencia SOLO si se dispone de evidencia verificada; enlaces a puntos de placa y documentos.
No diagnosticar por un unico amperaje. No afirmar que reemplazar un IC es solucion sin comprobacion. Registrar incertidumbre y solicitar verificaciones antes de tecnicas destructivas. Seguridad ESD, desconexion bateria cuando aplique, limitacion de corriente y advertencia por riesgos termicos.

## Datos de placa y licencias
No usar un render aproximado como si fuera boardview electrico. Boardview real requiere geometria y datos net/pin/part de cada revision, obtenidos con licencia/permiso o creados y comprobados internamente. Separar esquema, foto, geometria, anotacion, medicion de referencia y fuente/permiso. Control de version, fecha, revisor tecnico y estado de verificacion por cada dato.

## Arquitectura objetivo (propuesta, aun no aprobada ni migrada)
Frontend: componentes JS/CSS independientes cargados de forma diferida SOLO en Diagnostico; adaptador a navegacion existente, sin frameworks ni modificaciones globales innecesarias.
Backend: Supabase Auth/Storage/Realtime/Postgres con RLS real por actor y sucursal/equipo/caso; Edge Functions como intermediario de IA. Nunca exponer API keys IA en navegador.
Tablas propuestas: ai_board_models, ai_board_revisions, ai_board_assets, ai_board_components, ai_board_nets, ai_board_pins, ai_board_measurement_refs, ai_board_cases, ai_board_case_measurements, ai_board_case_evidence, ai_board_chat_threads, ai_board_chat_members, ai_board_chat_messages, ai_board_message_attachments, ai_board_knowledge, ai_board_knowledge_sources, ai_board_audit.
Vincular ai_board_cases a ordenes_reparacion y opcionalmente equipos_refurbish, y actor a tecnicos/usuarios autentificados existentes mediante identity binding segura. Mantener adjuntos privados con URLs firmadas y caducidad.
Busqueda documental RAG con citas e IDs de fuente; no entrenar automaticamente con conversaciones. Publicar contenido interno solo tras aprobacion tecnica y control de versiones.

## Roles
Tecnico: ver casos asignados/compartidos, crear mediciones, chat autorizado.
Tecnico validador: aprobar mediciones y soluciones tecnicas.
Supervisor: administrar grupos y reasignaciones, revisar calidad.
Admin: permisos, datos tecnicos, auditoria y configuracion.
Permisos exigidos en servidor/RLS, no solo ocultando botones.

## Fases y puertas de calidad
F0 — Auditoria de Diagnostico existente, JS actual, navegacion, permisos y esquema real. Entregable: inventario de archivos/funciones, conflictos, riesgos y plan de integracion.
F1 — Prototipo UX navegable sin acceso a produccion: selector iPhone X+, estados de datos, BITMAP demostrativo claramente rotulado, chat IA/humano maqueta y flujo por orden.
F2 — Esquema SQL y RLS en entorno de prueba, storage privado, API autenticada, casos/mediciones/chat real.
F3 — Motor IA con contexto de orden, documentos, citas, tratamiento de errores y limites, pruebas de respuestas con fallas frecuentes.
F4 — Ingesta de boardviews legales, visor real con capas/pin/net, pruebas de integridad y exactitud por placa. Solo liberar modelos verificados.
F5 — Piloto con tecnicos, medicion de tiempos, revision de errores, hardening, accesibilidad y rendimiento.
F6 — Pull Request revisado y SOLO tras autorizacion expresa merge/publicacion en main.

## Criterios de aceptacion
- El modulo se encuentra bajo Diagnostico existente; no menu principal duplicado.
- Una orden puede crear/abrir caso sin duplicar equipo ni diagnostico.
- Chat IA y chat humano funcionan separadamente; autorizacion expresa para compartir contexto.
- Toda recomendacion electronica concreta muestra procedencia o se marca como hipotesis.
- Modelos sin boardview no muestran conexiones ficticias.
- Tecnicos no leen chats/casos ajenos sin pertenecer o permiso.
- No se rompen recepcion, ordenes, refurb, CRM ni rutas/estado actual.
- Controles tactiles y escritorio responsivos; no lag al abrir visor pesado.
- Tests: sintaxis JS, pruebas de permisos/RLS, casos clinicos de reparacion, regresion visual y carga.
- No publicar hasta QA tecnico y autorizacion explicita.

## Decisiones ya fijadas por el usuario
- Comenzar cobertura desde iPhone X en adelante.
- Incluir chatbot IA Y chat humano entre tecnicos.
- Trabajar primero el diseño y plan; formalizar arquitectura; desarrollar modulo DENTRO de Diagnostico del Taller.
- Respetar reglas de Git: rama independiente, no tocar main sin permiso.

## Pendientes imprescindibles antes de desarrollar
1. Auditar implementacion actual de la vista Diagnostico y su contrato de navegacion.
2. Inventariar activos boardview disponibles, licencia, revision de placa y pruebas de fiabilidad.
3. Definir consentimiento de comparticion de caso, retencion de chats y ubicacion del procesamiento IA.
4. Validar con tecnicos 3 flujos iniciales (no enciende, no carga, sin imagen).
5. Especificar costos de IA, almacenamiento, Realtime y limites por usuario.

Referencias tecnicas de orientacion: https://phoneboard.co/ ; https://support.apple.com/self-service-repair ; https://supabase.com/docs/guides/auth/row-level-security
