# 3-nov-2026 07:00 RD — Rapidez 1: al guardar se recarga solo lo que cambió (Claude)

## Solicitud del dueño
Tras la auditoría de rapidez (bit. 2026-11-03-0100): «Sí, empieza con el 1» = que al guardar no se vuelvan a bajar las 17 tablas.

## Diagnóstico
- 85 lugares hacen `await loadAll()` después de guardar; `_loadAllImpl` pedía siempre las 17 tablas (~460 KB) y la acción esperaba.
- **Corrección a la bitácora 0100:** el respaldo automático no es cada 60 s: `taller-performance-phase1.js` (cargado por
  `crm-marketing-consent.js`) lo pasó a **5 min**. El canal de tiempo real global solo escucha `alarma_videos` (filtrada) y
  `orden_notas`; cada nota nueva de otro empleado recargaba las 17 tablas.
- Disparadores de la base en las 17 tablas (pg_trigger, 3-nov): ninguno escribe de una tabla del taller en otra
  (solo guardias y `refurb_transiciones`). Por eso recargar solo la tabla escrita es seguro.

## Cambio (rama `claude/guardar-rapido`, sin publicar)
`taller-app.js` (+ `taller-app.min.js` regenerado, `taller.html` `?v=20261103-gr1`):
- Al crear `supabaseClient` se envuelven `from(t).insert/update/upsert/delete` → anotan la tabla `t`; `rpc()` y
  `functions.invoke()` → «no se sabe qué tocó» salvo una lista de solo lectura (`stats_*`, directorios de WhatsApp,
  `crm_no_leidos_count`, `whatsapp-enviar`, `social-*`, etc.). En supabase-js v2 `functions` es un getter: se envuelve el getter
  (probado con supabase-js 2.118 real).
- `_loadAllImpl` usa una lista única `_BC_CARGAS` (mismas 17 consultas, mismo orden y filtros). Recarga solo lo anotado;
  **carga todo como antes** si no hay nada anotado (entrada, respaldo 5 min, botón Actualizar), si hubo una RPC/función que
  escribe, si la última completa tiene > 5 min, o si una carga parcial falló (la siguiente va completa).
- Tiempo real: `onCambioRealtime` anota la tabla del aviso → una nota nueva recarga solo `orden_notas`.
- Avisos de eventos (`detectarEventosYNotificar`) reciben el cache completo; las tablas no recargadas son iguales → sin avisos falsos.
- `renderAll()` sigue igual (se mide en el siguiente paso).
- Apagar en un equipo: `localStorage.bc_guardar_rapido_off = '1'`. Registro: `BayolPerformance.ultimaCarga`.

## Pruebas
- `scripts/pruebas/guardar-rapido.cjs`: 13/13 (completa al entrar; guardar orden → solo órdenes; borrar; dos tablas;
  RPC que escribe → completa; RPC de lectura → parcial; apagado; > 5 min; nota por tiempo real; sin errores JS).
- Resto del banco (26 pruebas): 24 bien; `buscador-motion` (línea nueva no rueda, tiempo agotado) y `raspa-y-gana` (3) **fallan igual en `main` sin este cambio** → no son de esta rama (pendiente aparte).

## Riesgos / pendientes
- Un guardado que pase por una RPC no listada sigue cargando todo (igual que hoy, sin pérdida).
- PR #206 también toca `taller-app.js`: el que entre segundo regenera `taller-app.min.js` (lo hace el robot en `main`).
- Siguiente: medir en vivo con `BayolPerformance` y seguir con el 2 (traer solo lo nuevo) si el dueño quiere.
