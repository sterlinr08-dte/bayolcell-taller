# 2026-10-24 01:30 (RD) — Auditoría de ChatGPT sobre Reacondicionados, contrastada (solo lectura)

## Pedido del dueño
PDF «Auditoria_Reacondicionados_BAYOL_CELL_2026-10-24» (15 hallazgos de proceso R01–R15 y 6 de pantalla V01–V06):
«confirma, repara y arregla». Tres revisores en paralelo contrastaron cada hallazgo con `main` (0485814) y la base real
(solo SELECT sobre `pg_policies`, `pg_trigger`, `pg_indexes`, `equipo_piezas_pedidas`). **Sin cambios de código ni de datos.**

## Resultado: 15 ciertos, 6 parciales, 0 falsos
| # | Hallazgo | Veredicto | Evidencia resumida |
|---|---|---|---|
| R01 | RLS no protege filas | **Cierto** | Una sola política `ALL` por tabla (`app_is_admin() OR app_actor_es_tecnico_activo()`); 0 triggers en `equipos_refurbish`; `estado_despachar` solo se revisa en cliente |
| R02 | El asistente cierra la selección equivocada | **Parcial** | Marca los IDs originales de `pendienteIP` aunque se cambie la selección en la ventana IP; «cerrar tras error marca» es falso, pero un `pendienteIP` huérfano sí marca equipos viejos en un despacho posterior |
| R03 | Ajuste IP repetible | **Cierto** | `_descontarPiezasAlCompletar` no revisa el error del update de `infoplus_desc_cant`; `eliminarPiezaInfoPlus` borra aunque IP falle |
| R04 | Despacho no cierra igual por todas las entradas | **Cierto** | `_despTelConfirmar` nunca actualiza `equipos_refurbish`; historial best-effort; desde la barra del lote el equipo queda en Listo |
| R05 | Rutas que evitan calidad | **Cierto** | `marcarListoVentaDirecto` no mira tareas; piezas solo se revisan desde `tecnico_recibio` |
| R06 | Completar tarea retrocede un despachado | **Cierto** | `completarTarea` fuerza `listo_revision` sin mirar estado, piezas, historial ni error |
| R07 | Reevaluar pierde fallas / tareas viejas | **Cierto** | Borra fallas y piezas antes de insertar; `crearTareasDesdeFallas` devuelve 0 si ya hay tareas |
| R08 | Descuento no distingue rechazadas | **Parcial** | Filtra solo código + descuento 0 (hoy las devueltas/rechazadas no tienen código: 0 casos); pone `aprobada`; errores de lectura → 0/0 |
| R09 | Recepción descuenta más de una vez | **Cierto** | Sin estado previo exigido; stock desde caché con `Math.max(0, …)` |
| R10 | Costo sin regla única | **Cierto** | Suma todas las filas; devolución resta desde caché; en BD hay 3 devueltas y 2 rechazadas que un recálculo sumaría |
| R11 | Devolución no abre ciclo limpio | **Cierto** | 3 llamadas sueltas; no limpia `completado`/`fecha_completado`/`fecha_despacho`; sin tareas nuevas |
| R12 | Importación a medias | **Cierto** | `codigo_lote` UNIQUE; bloques de 200 sin rollback |
| R13 | Garantía promete lo que el índice no admite | **Cierto** | Índice único solo excluye 2 IMEI fijos; `es_garantia` solo salta la validación JS → error 23505 |
| R14 | Historial no garantizado | **Cierto** | 14 inserts a `equipo_historial` sin leer error; `guardarEvaluacion` y `enviarRefurbExterno` sin historial; 0 triggers |
| R15 | Rentabilidad toma despacho como venta | **Parcial** | `vendido` = Despachado (CLAUDE.md) y la pantalla lo suma como venta con `precio_venta_real` |
| V01 | Botones con letra chica, casillas 20×20 | **Parcial** | CSS: tabs 42 px (39 en móvil), casilla 20×20 sin `<label>`; px exactos del PDF no medidos |
| V02 | Contraste título reparación / píldoras piezas | **Cierto** | Blanco sobre `#f59e0b→#d97706` (2.2–3.2:1) y sobre `#0891b2` (3.7:1) |
| V03 | Ventanas sin `role=dialog`, KPI como div | **Cierto** | 0 `role="dialog"` en `.modal-backdrop`; KPI `div onclick` |
| V04 | El punto de color pisa el rótulo del KPI | **Cierto** | `taller-visual-polish.css` (2 ids) gana a `taller-flota.js` y vuelve el padding a 12 px |
| V05 | Demasiadas acciones; alerta de 36 filas | **Parcial** | La alerta se pinta antes de la lista; el resto es observación de UI |
| V06 | «Piezas no utilizadas» cuenta las en uso | **Parcial** | Lógica confirmada (`recibida` cuenta como sobrante); nombres repetidos vienen de Info Plus; naranja/rojo confirmado |

## Plan propuesto (en rama, sin publicar)
- **Fase 1 — cliente + SQL pequeño (hoy):** R02+R04 (cerrar el despacho con los IDs realmente enviados dentro de la propia
  confirmación), R03 (reservar la fila antes de llamar a IP, leer errores, no borrar si IP falla), R05, R06, R08, R09 (RPC
  atómica de stock), R10, R11 (campos + error), R13 (mensaje claro), R14 (trigger de historial), R15 (rótulos), V01–V04 y V06.
- **Fase 2 — servidor transaccional (requiere OK del dueño por riesgo):** R01 (políticas por permiso + trigger de transición),
  R07 (RPC `guardar_evaluacion`), R11 (RPC devolución), R12 (RPC lote), R03 idempotencia con columna de referencia IP, V05.
- **Conciliación de datos** (32 sin fecha, 60/36 con tareas, 14 piezas, 9 solicitudes): solo con autorización específica.
