# 24-oct-2026 07:45 (RD) · Reacondicionados, fase 2: candados en el servidor — Claude

## Solicitud del dueño
Tras publicar la fase 1 (PR #114), el dueño dijo «Ok» y eligió la **opción A: Fase 2 completa, con permisos por rol en la base**
(puntos de control: se le ofrecieron A, B y C). Alcance: R01, R03, R07, R11, R12 y V05 de la auditoría contrastada
(`2026-10-24-0130-claude-auditoria-reacondicionados-contrastada.md`). **Sin publicar.**

## Mapa que se usó (fuente de verdad)
- 1 usuario administrador y 9 técnicos con 6 roles (`roles_taller.permisos`); `app_actor_tiene_permiso()` ya existía y
  devuelve `true` para el usuario tradicional. `app_is_admin()` incluye a los técnicos admin (LORIBEL, YVES).
- Una sola política `ALL` por tabla (`app_is_admin() OR app_actor_es_tecnico_activo()`): cualquier técnico activo podía
  escribir cualquier fila. 280 equipos en 10 estados (135 `vendido`, 87 `listo_venta`, 22 `evaluado`, 22 `en_proceso`…).
- Permisos del catálogo que ya gobernaban los botones en pantalla: `compras_crear`, `compras_eliminar`, `compras_ver_costos`,
  `estado_cambiar`, `estado_despachar`, `reacond_editar_propios`, `reacond_editar_otros`, `piezas_aprobar_extra`,
  `devoluciones_registrar`, `devoluciones_eliminar`. El servidor ahora exige **los mismos**: nadie necesita permisos nuevos.

## Qué se hizo
### Base (`supabase/migrations/20261024130000_reacond_fase2_servidor.sql`, idempotente)
- **R01 · `trg_refurb_guardia`** (BEFORE INSERT/UPDATE/DELETE en `equipos_refurbish`). El administrador no tiene candados.
  Para los demás: crear equipos pide `compras_crear`; borrar, `compras_eliminar`; cambiar `costo_compra`, `compras_ver_costos`;
  **despachar o cerrar salida pide `estado_despachar` y solo desde Listo para venta**; salir de Despachado solo a En reparación
  (`devoluciones_registrar`) o a Listo para venta; aprobar calidad (`listo_revision → listo_venta`) pide `piezas_aprobar_extra`;
  cualquier otro cambio de estado pide `estado_cambiar`, `reacond_editar_otros` o `reacond_editar_propios` sobre un equipo suyo.
  Los mensajes de rechazo están en español y la pantalla los muestra tal cual.
- `trg_refurb_lotes_guardia` (lotes: `compras_crear` / `compras_eliminar`) y `trg_equipo_devoluciones_guardia`
  (`devoluciones_registrar` / `devoluciones_eliminar`).
- **R07 · `reacond_guardar_evaluacion(...)`**: fallas, piezas por descontar, costo (sin devueltas ni rechazadas), estado y
  sincronización de tareas en **una transacción**; si algo falla, no se pierde nada. Rechaza evaluar un equipo Despachado.
- **R11 · `reacond_registrar_devolucion(...)`**: registro + equipo con ciclo limpio (`completado`, `fecha_despacho`,
  `fecha_completado` en blanco) + historial, todo o nada; exige que el equipo esté Despachado.
- **R12 · `reacond_crear_lote(p_lote, p_equipos)`**: lote y todos sus equipos en una transacción; código repetido o IMEI
  repetido → mensaje claro y **no queda lote a medias**.
- **R03 · `infoplus_ref` + `infoplus_codajuste`** en `equipo_piezas_pedidas`, y RPC `reacond_ip_reservar(pieza, ref)` /
  `reacond_ip_liberar(pieza)`. La referencia `[PZ-xxxxxxxx-…]` viaja en el comentario del ajuste de Info Plus: si el ajuste se
  hizo pero no se pudo anotar, la pieza queda reservada y se encuentra en Info Plus por esa referencia.

**Estado real en la base (importante):** el conector MCP aplicó las 3 funciones de guardia y las 2 RPC de Info Plus
(con sus columnas). **El bloque con las 3 RPC grandes quedó retenido** (traen `DELETE` dentro y el conector pide una
confirmación que nunca llega), y **los 3 `create trigger` todavía no se corrieron**. Hasta que el dueño pegue el archivo
completo en el SQL Editor (o el conector lo acepte por bloques), las funciones de guardia existen pero **no están enganchadas**
y la pantalla nueva diría «falta aplicar la actualización de la base» al evaluar, devolver o crear lotes.
**Orden obligatorio: primero la base, después publicar la rama.**

### Pantalla (`taller-app.js` → `taller-app.min.js q4`, `taller.html`)
- `guardarEvaluacion`, `guardarDevolucion`, `crearLoteDesdeCompraInfoPlus` y `crearLoteDesdeManifiesto` ya no escriben tablas
  desde el navegador: llaman a su RPC con `_rpcReacond()` (muestra el mensaje del servidor; si la RPC no existe, avisa que
  falta la actualización de la base).
- `_descontarPiezasAlCompletar` y `_descontarPiezaPendiente` reservan la fila con `reacond_ip_reservar` + referencia antes de
  tocar Info Plus (el manual no reservaba: carrera real); guardan `infoplus_codajuste`; el aviso de «descontado sin anotar»
  trae la referencia. `eliminarPiezaInfoPlus` **ya no borra** la pieza si Info Plus rechaza la devolución.
- Botón **Liberar** (admin) junto a «descontando…» para soltar una reserva colgada, con advertencia de verificar antes en
  Info Plus por la referencia. Botones Descontar/Liberar a 44 px, letra 12 px.
- **V05:** la lista de solicitudes va primero y «piezas por conciliar» queda plegada al final.

## Pruebas
- `scripts/pruebas/reacond-fase2.cjs` (banco local, RPC simuladas) a **390, 440 y 1280 px: OK en los tres**, 0 errores JS:
  evaluación → RPC con 2 fallas, 1 pieza (la ya descontada no viaja), 2 tareas, nota por falla, sin escribir tablas;
  devolución → RPC, sin escribir tablas; lote manifiesto → RPC con 2 equipos, sin escribir tablas; error del servidor se
  muestra tal cual; RPC ausente → aviso de base sin actualizar; alerta V05 después de la tabla; botones 44 px;
  descuento automático: 1 reserva con `[PZ-…]` en el comentario y `AJ-77` anotado.
- `reacond-fase1.cjs` sigue pasando (regresión). `node --check` y minificado OK.
- **Pendiente en la base real** (cuando estén los triggers): probar con identidad de técnico simulada (`request.jwt.claims`)
  dentro de una transacción con ROLLBACK: despachar desde `en_proceso` (debe rechazar), técnico de servicio actualizando un
  equipo (debe rechazar), devolución de un equipo no despachado (debe rechazar), lote con IMEI repetido (no debe crear nada).

## Archivos
`taller-app.js`, `taller-app.min.js(+.map)`, `taller.html` (q4), `supabase/migrations/20261024130000_reacond_fase2_servidor.sql`,
`scripts/pruebas/reacond-fase2.cjs`, `scripts/pruebas/README.md`, `docs/MEMORIA.md`.
Rama `claude/reacond-fase2` (desde `main` 6b4ea5f). PR: ver siguiente entrada o el PR en GitHub.

## Riesgos y pendientes
- Un técnico que hoy haga algo que su rol no autoriza (p. ej. un rol de servicio al cliente moviendo equipos) verá el rechazo del
  servidor. Es el comportamiento buscado; si pasa con alguien que sí debe poder, se corrige dándole el permiso en Configuración
  → Roles, no tocando la base.
- Las tablas de piezas, tareas, fallas e historial conservan la política abierta (los técnicos las escriben a diario); su
  endurecimiento queda para otra fase si el dueño lo pide.
- Conciliación de datos existentes: solo con autorización específica (sin cambios).
