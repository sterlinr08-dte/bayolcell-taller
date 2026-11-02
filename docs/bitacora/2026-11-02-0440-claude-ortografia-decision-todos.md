# Corrección ortográfica — decisión del dueño: encender para todos

> Sigue a `2026-11-02-0430-claude-ortografia-solo-alejandro-omil.md`.
> Dueño (2-nov-2026): «Lo puedes poner para todos pero en ellos dos es lo más importante».

## Decisión
- **Autorización expresa para activar la corrección para todos los empleados** (WhatsApp, Instagram y Facebook).
- `crm_ortografia_config.empleados` queda **vacía** (= todos). Alejandro y Omil quedan cubiertos dentro de todos.
- Se corrige solo la mala escritura; tildes, signos y mayúsculas no (bit. 0430).
- **No incluye** publicar el frontend (marca «✓ corregido», PR #199): eso pide su propio «publícalo».

## Pasos pendientes (bloqueados: el conector de Supabase está desconectado en esta sesión)
1. Aplicar `20261102130000_crm_ortografia_empleados.sql`. Es obligatorio antes de subir las funciones nuevas: estas leen la columna `empleados` y, si falta, envían el original.
2. Subir `whatsapp-enviar`, `instagram-enviar` y `social-enviar` con la versión 908e32a de `_shared/ortografia.ts`.
3. `update crm_ortografia_config set activo = true where id = 1;` (`empleados = '{}'`, `piloto_* = '{}'`).
4. Vigilar los registros (`evento: ortografia`): motivos, `ms_corrector` y tiempos vencidos. Revisar con el dueño los primeros mensajes corregidos de Alejandro y Omil.

**Apagar si hace falta:** `update crm_ortografia_config set activo = false where id = 1;` (hace efecto en ≤ 30 s).
