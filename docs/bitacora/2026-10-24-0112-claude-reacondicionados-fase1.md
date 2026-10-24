# 2026-10-24 01:12 (RD) — Reacondicionados, fase 1 de la auditoría: candados, despacho único, piezas, costo y pantalla (rama, SIN publicar)

## Pedido del dueño
«Confirma, repara y arregla» la auditoría de ChatGPT (bitácora `2026-10-24-0130`, 15 ciertos + 6 parciales). Fase 1 = todo lo
que se arregla en el navegador más SQL pequeño y seguro. La fase 2 (permisos RLS por rol, transiciones en servidor, RPC
transaccionales de evaluación/devolución/lote) queda para el OK del dueño. Rama `claude/reacond-auditoria-fase1`.

## En la base (ya aplicado con el conector; migración `supabase/migrations/20261024050000_reacond_fase1_stock_transiciones.sql`)
- **R09** RPC `ajustar_stock_pieza(p_pieza_id, p_delta)`: ajuste atómico en servidor (`FOR UPDATE`), nunca baja de 0 y
  devuelve `truncado` si faltó stock. Antes el navegador calculaba desde su caché.
- **R14** Tabla `refurb_transiciones` + trigger `trg_refurb_transicion` (AFTER UPDATE en `equipos_refurbish`): cada cambio
  de `estado_evaluacion`, `fecha_despacho` o `completado` deja fila inmutable con actor (`app_actor_identity()`, email del JWT).
  `equipo_historial` sigue siendo la nota libre de la app. El `DROP TRIGGER IF EXISTS` del borrador lo retuvo el conector (como
  documenta MEMORIA): se reenvió sin él.

## En el código (por hallazgo)
| # | Arreglo | Dónde |
|---|---|---|
| R02+R04 | `_despTelConfirmar` captura los IDs **realmente enviados** antes de llamar a Info Plus; en la rama OK marca `vendido` + `fecha_despacho`, escribe historial y avisa con el Nº de Info Plus y los IMEI que quedaran sin cerrar; flag `_despEnCurso` contra doble clic; devuelve `{ok, documento, ids}`. El envoltorio smart ya no marca `pend.ids`; limpia `pendienteIP` al cerrar la ventana y solo descuenta piezas de `res.ids`. `_despGuardarHistorial` avisa si falla. | `taller-app.js` ~16592-16671, 15852; `taller-reacond-smart.js` r1 |
| R03/R08 | `_descontarPiezasAlCompletar`: excluye devueltas/rechazadas, lee errores, **reserva** la fila (`infoplus_desc_cant=-1`) antes de llamar a Info Plus y la libera a 0 si falla (columna NOT NULL), no pisa `recibida`, y si el guardado tras el OK falla avisa y deja fila en historial. | ~17478-17553 |
| R05 | `marcarListoVentaDirecto` bloquea con fallas abiertas (admin: justificación obligatoria al historial); el chequeo de piezas aplica a `listo_revision` y `listo_venta` desde cualquier origen. | ~14712-14760 |
| R06 | `completarTarea` ya no fuerza `listo_revision`: solo desde estados de taller y vía `cambiarEstadoProceso`; en Listo/Despachado conserva el estado. | ~14096-14145 |
| R07 (mínimo) | `guardarEvaluacion` lee errores y reinserta fallas/piezas previas si falla el insert; `crearTareasDesdeFallas` sincroniza (crea las nuevas, quita pendientes de fallas eliminadas del catálogo). | ~13195, ~14178 |
| R09 | `marcarPiezaRecibida` exige `entregada/aprobada` (si no: «Ya estaba recibida»); `ajustarStockInventario` usa la RPC. | ~14800-14830 |
| R10 | `_recalcularCostoRepuestos` excluye devueltas/rechazadas; `aprobarDevolucionPieza` recalcula en vez de restar desde caché. | ~17180, ~14881 |
| R11 (mínimo) | `guardarDevolucion` limpia `completado`, `fecha_completado`, `fecha_despacho` y avisa si falla el historial. | ~23397 |
| R13 | IMEI repetido con garantía: abre el equipo existente / registra devolución, no inserta; error 23505 con mensaje claro. | ~7439-7503 |
| R14 | `_histInsert()` reemplaza los 14 inserts a `equipo_historial` leyendo el error; `enviarRefurbExterno` deja historial. | 7783 y usos |
| R15 | Rentabilidad: «Despachados», «Despachados con precio», «Margen estimado (solo con precio)»; nota «La venta real está en Info Plus». | ~12345 |
| V01 | Pestañas 44 px / 13 px (también móvil); casilla de equipo dentro de etiqueta de 44×44. | `taller-visual-polish.css` a1, `taller-flota.js` c3 |
| V02 | Título de reparación: blanco sobre `#b45309→#92400e` (≥4.5:1). Las píldoras `#0891b2` 12 px citadas no se encontraron como literal; pendiente de ubicar con la captura del PDF. | `taller-app.js` 14454 |
| V03 | 30 ventanas con `role="dialog" aria-modal`; capa nueva `bc-dialogos.js`: foco al abrir, Tab/Shift+Tab encerrados, foco de vuelta al cerrar, role automático en ventanas creadas por código. | `taller.html`, `bc-dialogos.js` d1 |
| V04 | KPI del lote con `padding-left: 30px` para el punto de color. | `taller-visual-polish.css` |
| V05/V06 | Alerta «Piezas por conciliar» plegada en `<details>` (azul de consulta); no cuenta como sobrante la `recibida` ya descontada. | ~21512-21560 |

Versiones: `taller-app.min.js q3`, `taller-reacond-smart.js r1`, `taller-flota.js c3`, `crm-marketing-consent.js u13`,
`taller-visual-polish.css a1`, `bc-dialogos.js d1`.

## Pruebas
- Banco local (`pf-pc/reacond-fase1.cjs`) a 390, 440 y 1280 px: carga sin errores JS, capa smart r1 y `bc-dialogos` cargadas,
  30 ventanas con role, foco entra a la ventana y vuelve al botón al cerrar, pestañas 44 px / 13 px.
- `node --check` en los 4 archivos JS. RPC y trigger comprobados en la base (`pg_trigger` muestra `trg_refurb_transicion`).
- **Sin datos de reacondicionados en el banco:** las comprobaciones funcionales (T01–T12 del PDF) quedan para el dueño en la
  tienda con equipos de prueba; lista de 4 comprobaciones manuales del despacho en el PR.

## Pendiente
- Fase 2 (OK del dueño): RLS por permiso + trigger de transición (R01), RPC transaccionales (R07, R11, R12), idempotencia IP con
  referencia (R03), V05 completo. Conciliación de datos existentes solo con autorización.
- `precio_venta_real` nadie lo escribe hoy: «Despachados con precio» será 0 hasta que se cargue.

## Publicado (24-oct-2026, 07:25 RD)
- El dueño dijo «Publícalo». PR #114 fusionado en `main` por avance rápido (cabeza `b706432`), CI en verde (unit, chromium, webkit).
- Deploy = GitHub Pages desde `main`; versiones en vivo esperadas: `taller-app.min.js q3`, `taller-reacond-smart.js r1`, `bc-dialogos.js d1`.
- Fase 2 sigue esperando el OK del dueño.
