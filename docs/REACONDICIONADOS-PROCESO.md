# Reacondicionados — mapa del proceso, permisos y estado de la auditoría

Escrito el 26-oct-2026 con el código de `main` (af7016f) y las migraciones de las fases 1 y 2. Si algo de aquí choca con el
código o una bitácora más nueva, manda lo más nuevo. Fuentes: bitácoras `2026-10-24-0130` (auditoría contrastada),
`2026-10-24-0112` (fase 1), `2026-10-24-0745` (fase 2) y `2026-10-26-…-claude-reacond-proceso` (esta entrega).

## 1. El camino de un teléfono, paso a paso

| # | Paso | Estado en el sistema | Quién lo hace | Qué pasa | ¿Se puede deshacer? |
|---|---|---|---|---|---|
| 1 | Compra y lote | `pendiente` (Recibido) | Quien tiene «Crear/editar lotes» | Se importa la compra de Info Plus o el manifiesto de Excel; el servidor crea el lote y todos sus equipos de una vez (si falla uno, no se crea nada). | Sí: quitar el equipo o eliminar el lote (pide confirmación con el detalle). |
| 2 | Evaluar | `en_evaluacion` → `evaluado` | Técnico asignado, o quien tenga «Cambiar estado» / «Editar equipos de otros» | Se marcan fallas y piezas. El servidor guarda fallas, piezas, costo y tareas juntas (si algo falla, no se pierde nada). | Sí: volver a evaluar mientras no esté Despachado. |
| 3 | Asignar técnico | `en_proceso` (En reparación) | Administración (o «Repartir evaluados» del tablero) | El equipo pasa al técnico con sus tareas. | Sí: «Reasignar» (pide motivo, queda en el historial). |
| 4 | Reparar | `tecnico_recibio`, `espera_pieza`, `reasignado`, `reparacion_externa` | Técnico | Pide piezas, las recibe (el stock baja una sola vez), marca tareas hechas. Reparación externa pide a dónde va. | Sí: reabrir una tarea; devolver una pieza (la aprueba administración). |
| 5 | Enviar a calidad | `listo_revision` | Técnico | Solo sin piezas pendientes ni tareas abiertas (el admin puede forzarlo dejando el motivo). | Sí: calidad lo devuelve al técnico. |
| 6 | Control de calidad | `listo_venta` (Listo para venta) | Quien tiene «Aprobar piezas extras» (no el mismo técnico) | Aprueba o devuelve al técnico con lo que falta. | Sí: «Devolver al técnico». |
| 7 | Registrar salida | `vendido` (Despachado) + fecha | Quien tiene «Marcar como Despachado» | Solo desde Listo para venta. Con «Despachar teléfonos» se hace además el documento en Info Plus (por modelo, costo promedio, con IMEI). Al despachar se descuentan solas las piezas de Info Plus que faltaban. | En el taller sí (volver a Listo). **El documento de Info Plus no se deshace desde aquí.** |
| 8 | Cerrar salida | `vendido` + `completado` | Administración | Cierre administrativo; el equipo sigue disponible para garantías. Solo para Despachados. | Sí: «Reabrir salida» (pide confirmación). |
| 9 | Devolución / garantía | `vendido` → `en_proceso` | Quien tiene «Registrar devoluciones» | El servidor registra la devolución, limpia las fechas de salida y abre un ciclo nuevo con el técnico. | Eliminar la devolución pide «Eliminar devoluciones». |

Notas:
- «Despachado» es salida del taller hacia el almacén, **no es venta**. La venta real está en Info Plus.
- Cada cambio de estado, fecha de despacho o cierre deja una fila fija en `refurb_transiciones` con quién lo hizo (no se puede borrar desde la app).
- Las piezas descontadas de Info Plus llevan una referencia `[PZ-…]` en el comentario del ajuste. Si una pieza queda «descontando…», se busca esa referencia en Info Plus antes de usar «Liberar».

## 2. Permisos por rol

Los permisos se dan por rol en Configuración → Roles. El **administrador no tiene candados**. Lo que dice «servidor» lo exige la base aunque alguien se salte la pantalla.

| Acción | Permiso | Dónde se exige |
|---|---|---|
| Ver el módulo | `reacond_ver` (`reacond_ver_todos` para ver los de todos) | Pantalla |
| Crear lote o agregar equipos | `compras_crear` | Servidor |
| Eliminar lote o equipos | `compras_eliminar` | Servidor |
| Cambiar el costo de compra | `compras_ver_costos` | Servidor |
| Evaluar / mover de estado un equipo propio | `reacond_editar_propios` | Servidor |
| Evaluar / mover cualquier equipo | `estado_cambiar` o `reacond_editar_otros` | Servidor |
| Aprobar control de calidad (Listo para venta) | `piezas_aprobar_extra` | Servidor |
| Entregar piezas al técnico | `piezas_entregar` | Pantalla |
| Registrar salida (Despachado) | `estado_despachar`, solo desde Listo para venta | Servidor |
| Despachar teléfonos en Info Plus | Administrador | Pantalla |
| Cerrar / reabrir salida | Administrador (o `estado_despachar` para cerrar desde la ficha) | Pantalla (servidor: solo desde Listo o Despachado) |
| Registrar devolución | `devoluciones_registrar` (solo abre Despachado → En reparación) | Servidor |
| Eliminar devolución | `devoluciones_eliminar` | Servidor |
| Liberar una reserva de Info Plus | `piezas_aprobar_extra` | Pantalla |

Roles de hoy (fase 2, 24-oct): administración (Loribel, Yves y el usuario admin) sin candados; técnicos con
`reacond_editar_propios` y aprobación de calidad según su rol; servicio al cliente con «Registrar devoluciones».
Si alguien que sí debe poder hacer algo recibe «No tiene permiso…», se le da el permiso en su rol; no se toca la base.

## 3. Hallazgos de la auditoría y su estado real (revisado en `main` el 26-oct)

| # | Hallazgo | Estado | Cómo quedó / qué falta |
|---|---|---|---|
| R01 | Permisos no protegían filas | **Resuelto en parte** | Guardia en servidor para equipos, lotes y devoluciones. Piezas, tareas, fallas e historial siguen con la política abierta (propuesta para otra fase). |
| R02 | El asistente cerraba la selección equivocada | Resuelto | Se cierran los equipos realmente enviados; la selección vieja se limpia al cerrar la ventana. |
| R03 | Ajuste de Info Plus repetible | Resuelto | Reserva en servidor con referencia `[PZ-…]`; no se borra una pieza si Info Plus no acepta devolverla. |
| R04 | El despacho no cerraba igual por todas las entradas | **Resuelto (26-oct)** | Faltaba: «Cerrar salida» cerraba equipos en Listo sin despacharlos ni descontar piezas, y «Despachar teléfonos» aceptaba equipos ya Despachados. Ahora la capa `taller-reacond-proceso.js` lo impide. Pendiente de servidor: F3-1 de la propuesta. |
| R05 | Rutas que evitaban calidad | **Resuelto (26-oct)** en pantalla | Faltaba «Pasar a → Listo para venta» en bloque (se saltaba tareas y piezas) y «Registrar salida» desde cualquier estado para el admin. La capa ahora bloquea el bloque y pide confirmación al admin. Pendiente de servidor: F3-2. |
| R06 | Completar tarea retrocedía un Despachado | Resuelto | Solo ofrece pasar a calidad si el equipo sigue en el taller. |
| R07 | Reevaluar perdía fallas o tareas | Resuelto | RPC `reacond_guardar_evaluacion` todo o nada. |
| R08 | Descuento no distinguía rechazadas | Resuelto | Excluye devueltas y rechazadas; lee errores. |
| R09 | Recepción de pieza descontaba más de una vez | Resuelto | Solo desde entregada/aprobada; stock con RPC atómica. |
| R10 | Costo sin regla única | Resuelto para lo nuevo | Recalcula sin devueltas ni rechazadas. Datos viejos: propuesta A5. |
| R11 | Devolución no abría ciclo limpio | Resuelto | RPC `reacond_registrar_devolucion`. |
| R12 | Importación a medias | Resuelto | RPC `reacond_crear_lote`. «Eliminar lote» ya no sigue si la base no dejó borrar los equipos (26-oct). |
| R13 | Garantía chocaba con el índice | Resuelto | Abre el equipo existente o registra la devolución; mensaje claro. |
| R14 | Historial no garantizado | Resuelto | Trigger `refurb_transiciones` para estados; `_histInsert` lee errores. Quedan 4 notas del tablero rápido (`taller-reacond-smart.js`) que no leen el error; el rastro del estado igual queda. |
| R15 | Rentabilidad tomaba despacho como venta | Resuelto (rótulos) | «Despachados», «Margen estimado». `precio_venta_real` nadie lo escribe todavía. |
| V01 | Botones chicos | Resuelto | Pestañas y casillas de 44 px. **Nuevo:** los botones de la ventana de confirmación miden 33 px en PC (capa de otra parte del sistema). |
| V02 | Contraste | Resuelto en parte | Título de reparación corregido; las píldoras `#0891b2` no aparecen en Reacondicionados (están en Incentivos y Contabilidad). |
| V03 | Ventanas sin rol | Resuelto | `bc-dialogos.js`. |
| V04 | Punto del KPI pisaba el rótulo | Resuelto | |
| V05 | Alerta antes de la lista | Resuelto | Lista primero, «por conciliar» plegado al final. |
| V06 | «Piezas no utilizadas» contaba las en uso | Resuelto | |

### Datos viejos por conciliar (solo con autorización)
Archivo `supabase/migrations/20261026150000_PROPUESTA_reacond_conciliacion_datos.sql` (no se aplica solo; trae primero
consultas que solo leen):
- **32 Despachados sin fecha** → A1 les pone la fecha de su primera transición o historial.
- **60 tareas abiertas en 36 equipos ya Listos/Despachados** → A2 las cierra con nota (o se revisan a mano: decide el dueño).
- **14 piezas de Info Plus sin descontar** en Despachados → sin SQL: se descuentan desde la ficha (escribe en Info Plus).
- **9 solicitudes de pieza sin equipo** → A4 rechaza las de más de 30 días sin entregar (o se enlazan: decide el dueño).
- **Costos de repuestos que no cuadran** → A5 los recalcula con la regla única.

Candados de servidor que faltan: `supabase/migrations/20261026151000_PROPUESTA_reacond_candados_fase3.sql` (F3-1 y F3-2).
