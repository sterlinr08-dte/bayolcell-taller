# 2026-10-17 08:39 — Claude · Migración `20261008000000_ajuste_permisos` APLICADA

## Pedido del dueño
«Aplica la migración de permisos de Bayol también.»

## Antes de aplicar (solo lectura)
- No estaba aplicada: `taller_incentivos` y `taller_incentivo_reportes` tenían solo la política abierta `app_authenticated_all`.
- `set_taller_existencia` seguía igual que cuando se preparó la migración (8-oct). La migración no pisaba ningún cambio posterior.
- El cron `campanas-activar-programadas` corre como `postgres`, así que no lo afecta quitarle el permiso a `authenticated`.

## Cómo se aplicó
- Por la API no se pudo: la herramienta pide confirmación por las 9 sentencias `drop` (reemplazan políticas) y se cuelga.
- El dueño pegó el archivo completo en el SQL Editor del proyecto `vkhwdvjtowrhkhqavnvk`.

## Verificado después (solo lectura)
- Existe `app_actor_tecnico_id()` y `anon` no lo ejecuta.
- `taller_incentivos` tiene políticas por operación (delete, insert, select y update) y el disparador `taller_incentivos_control_cambios`.
- `taller_incentivo_reportes`: lectura para el personal y escritura solo para el administrador.
- `set_taller_existencia` exige administrador o `catalogo_articulos` y rechaza una carga vacía. `anon` no la ejecuta.
- `campanas_activar_programadas`:
  - `authenticated` y `anon` ya no la ejecutan;
  - quedó con `search_path=public`;
  - el cron siguió bien después del cambio: 12:37, 12:38 y 12:39 UTC, `succeeded`.
- Ningún dato cambió: siguen las 672 filas de incentivos. No quedó ninguna transacción abierta.

## Pendiente
- La prueba `supabase/tests/prueba_ajuste_permisos.sql` se corre con psql (BEGIN … ROLLBACK). No se corrió desde aquí: la herramienta de consultas se cuelga con resultados intermedios.
- Vigilar que los técnicos puedan registrar y corregir sus tickets y que la validación y el pago sigan funcionando para el administrador.
