# 07-nov-2026 · Correcciones de la auditoría de Contabilidad (opción C) — RAMA, sin aplicar

Dueño: «C» (corregir todo). Auditoría en `2026-11-07-0900-claude-auditoria-contabilidad.md`.

## Cambios preparados
1. **Notas de crédito una sola vez.**
   - `conta-equilibrio.js` ya no resta `2 × CN`: la resta la hace `estado_mensual_cat`.
   - El aviso ahora dice «Incluye N nota(s) de crédito…, ya restadas de la venta».
   - Versión `?v=20261107-pe5`.
   - Navarrete octubre queda en venta neta RD$1,351,427 (antes la pantalla mostraba 1,249,427).
2. **Migración en el repo:** `supabase/migrations/20261106201708_estado_mensual_cat_resta_notas_credito.sql`, con el texto idéntico al aplicado el 6-nov.
3. **Ventas y costos solo con permiso de Contabilidad** (migración `20261107100000_contabilidad_permisos.sql`):
   - La política `infoplus_ventas_auth_read` (`true`) pasa a ser `infoplus_ventas_contabilidad_read` (`app_puede_contabilidad()`).
   - `estado_mensual_cat`, `infoplus_resumen_ventas_mensual` y `stats_rentabilidad`, que devuelven costo o margen, pasan a ser envolturas que exigen ese permiso. La original queda como `_…_base`, sin acceso desde el navegador.
   - Quién las usa hoy: Contabilidad, Estado mensual, asientos automáticos de Info Plus y Estadísticas, que es solo del dueño. El aviso de código de vendedor lo usa el admin.
   - El dueño (único actor «usuario») y los admin siguen viendo todo.
   - **No se tocaron:** `stats_ventas`, `stats_clientes`, `stats_ventas_canal`, `stats_reposicion`, `stats_sin_rotacion` e `infoplus_cxc_por_cliente`, porque no devuelven margen o los usan otras pantallas.
4. **`infoplus-ventas-sync` v20:**
   - Exige la cabecera `x-sync-token`, que se compara con el secreto de Vault `ventas_sync_token` mediante la RPC `app_token_valido`, de uso exclusivo de `service_role`.
   - Rango máximo de 62 días.
   - Las tareas 2 y 13 mandan el token, que se lee de Vault en el mismo cron.
   - El valor del token lo genera la base (`gen_random_bytes`) y nunca sale de ella.
5. **Permisos de sobra:** se quitan todos los de `anon` y los de escritura, TRUNCATE, REFERENCES y TRIGGER de `authenticated` en `infoplus_ventas`.

## Prueba en la base real (transacción deshecha con RAISE, no quedó nada)
- Políticas resultantes: `infoplus_ventas_contabilidad_read`. Permisos de `anon`: 0. `authenticated`: solo SELECT.
- Las dos tareas quedan con `x-sync-token`.
- Token de 64 caracteres. Token válido: true. Token falso: false.
- `estado_mensual_cat` sin sesión responde «Sin permiso de Contabilidad».
- Navarrete octubre neto: 1,351,427.
- `deno check` de la función: sin errores.

## Orden al publicar
1. Migraciones (`apply_migration`).
2. Desplegar `infoplus-ventas-sync` v20.
3. Fusionar la rama en `main` (GitHub Pages).
4. Verificar la corrida siguiente de la tarea de cada hora (log ok) y que el Punto de equilibrio carga.

Si una tarea falla: el log lo dice y la siguiente hora reintenta. Para volver atrás, desplegar la v19 y `cron.alter_job` sin la cabecera.
