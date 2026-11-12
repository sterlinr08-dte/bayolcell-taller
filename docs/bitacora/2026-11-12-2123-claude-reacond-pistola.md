# Claude · Reacondicionados: lista de parados, flujo corto y «Pasar con pistola» (sin publicar)

## Pedido del dueño (12-nov-2026)
De la auditoría de agilidad eligió «1, 2 y 3»: limpiar parados, flujo corto de 4 pasos y mover con la pistola.

## 1 · Parados (solo lectura)
Se le entregó por el chat un Excel con 117 equipos sin moverse hace más de 7 días (modelo, IMEI, técnico, días, despacho de Info Plus si existe), con columnas para «¿Está en el taller?» y «Decisión». **No se cambió ningún dato**: espera sus decisiones.
- Solo 2 de los 62 «Listos» tienen despacho de Info Plus hecho desde este sistema (DA00003680).
- IMEI repetidos en la lista: 356485670514606 (Listo y Reparación externa) y 356295375890361 (dos «En reparación»), lote HISTORICO.

## 2 y 3 · Capa nueva `taller-reacond-pistola.js` (k1)
- Botón «Pasar con pistola» en el tablero «Lo que está parado». Se escanea el QR del label (IMEI) o se escriben los últimos 5 números; cada equipo muestra su paso siguiente y «Aplicar N» los mueve en lote:
  - Evaluado → En reparación (pide técnico; sugiere el de menos carga con `BayolReacondSmart.sugerir`).
  - En reparación / espera de pieza / reparación externa / calidad → **Listo para venta en un paso** (flujo corto; deja historial «pistola, flujo corto»).
  - Listo para venta → abre «Despachar listos en bloque» de siempre con solo los escaneados marcados (Info Plus o solo taller: decide la persona).
  - Recibido / En evaluación: no se mueve (falta evaluar). Despachado: no se toca.
- Avisa tareas sin marcar y piezas pendientes; no las cierra. Los candados del servidor no cambian (quien no es admin sigue sin poder saltarlos).
- Solo admin o `piezas_aprobar_extra`. Apagar: `localStorage.bc_reacond_pistola_off='1'` o `BC_REACOND_PISTOLA=false`.
- `taller.html`: se agrega el script `taller-reacond-pistola.js?v=20261112-k1`. No se tocó `taller-app.js`.

## Pruebas
`scripts/pruebas/reacond-pistola.cjs` a 390 y 1280 px: 30 comprobaciones OK (paso por estado, búsqueda, lote de 9, sin técnico no aplica, estados e historial, despacho con solo los escaneados, campo 48/16, botón 54, nada menor de 44, sin barra horizontal, sin errores de JS).

## Corrección a la auditoría
Dije «Tareas del equipo: 0 registros». Miré la tabla equivocada (`equipo_tareas`). Las tareas viven en `tareas_trabajo`: 656 de equipos, 224 pendientes; ninguna creada después del 22-oct está marcada hecha. Corregido en la página de la auditoría.

## Pendiente
Publicar (falta el OK). Decisiones del dueño sobre los 117 parados.
