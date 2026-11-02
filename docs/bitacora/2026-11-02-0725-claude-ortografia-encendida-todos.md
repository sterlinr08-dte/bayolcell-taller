# 2-nov-2026 07:25 RD — Corrección ortográfica ENCENDIDA para todos (Claude)

Sigue a: 2026-11-02-0440-claude-ortografia-decision-todos.md

## Solicitud del dueño
«Lo puedes poner para todos pero en ellos dos es lo más importante» (Alejandro y Omil).
Autoriza encender la corrección para TODOS los empleados. **No** autoriza publicar el frontend
(marca «✓ corregido», PR #199): eso sigue esperando su «publícalo».

## Qué se hizo (Supabase `vkhwdvjtowrhkhqavnvk`)
1. Migración `20261102130000_crm_ortografia_empleados.sql` aplicada (columna `empleados text[] default '{}'`).
2. Funciones desplegadas con el código del commit 908e32a (`_shared/ortografia.ts` actual + `empleadoId: refId`):
   | Función | Antes | Ahora |
   |---|---|---|
   | social-enviar | v6 | **v7** |
   | instagram-enviar | v11 | **v12** |
   | whatsapp-enviar | v24 | **v25** |
3. Prueba de humo con la clave pública: social 403 `sin_permiso`, instagram 404 y whatsapp 404 «Hilo no encontrado» (las tres arrancan bien).
4. Interruptor: `crm_ortografia_config` → `activo = true`, `empleados = '{}'` (todos), sin piloto, 3 canales,
   tope diario 300, techo global 600, 1.5 s. Hora: 11:20 UTC.

## Empleados de interés (para revisar sus mensajes en los logs/mensajes)
- Alejandro Espaillat — `tecnicos.id` cf35a9cf-b09a-433c-b772-94f86a754cf4
- «Omir» (el dueño dijo OMIL) — `tecnicos.id` 87228a15-632c-4b02-a16b-04fd16d1aa12

## Cómo apagarlo (efecto en ≤30 s)
`update public.crm_ortografia_config set activo = false where id = 1;`

## Pendiente
- Revisar los primeros mensajes reales (logs `evento: ortografia`: motivos, ms, tiempos agotados) y mostrar ejemplos al dueño.
- Publicar la marca «✓ corregido» (PR #199) solo con «publícalo».
- Opcional del dueño: borrar la función `ortografia-banco` (stub 410) desde el panel.
