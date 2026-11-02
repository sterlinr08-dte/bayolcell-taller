# 2-nov-2026 08:15 RD — Corrección ortográfica: solo Alejandro y Omir (Claude)

Sigue a: 2026-11-02-0735-claude-ortografia-publicada.md

## Qué se vio (07:20–08:07 RD, primeros envíos reales)
- Solo respondió Michelle Felipe Báez: 16 mensajes por WhatsApp (Instagram y Facebook: 0).
- Corrector: 0 corregidos, 6 `sin_cambios`, 4 `solo_tildes_o_signos`, 6 `tiempo_ia` (37 %; en el banco fue 13 %).
- Tiempo total del envío ≈ 2.4–4.1 s; el corrector agrega ≈ 0.8–1.5 s por mensaje.
- Ningún mensaje se dañó ni dejó de salir (ante tiempo agotado salió el original).

## Decisión del dueño
Opción «A»: dejarlo solo para quienes escriben mal (Alejandro y Omil), para que los demás no esperen.

## Cambio
`crm_ortografia_config.empleados = {cf35a9cf-b09a-433c-b772-94f86a754cf4 (alejandro espaillat), 87228a15-632c-4b02-a16b-04fd16d1aa12 (omir)}`
(12:16 UTC). Los dos tienen vínculo activo en `auth_actor_bindings` como `tecnico`, así que el `refId` del envío coincide.
Los demás salen con motivo `empleado_no_incluido`, sin llamar a la IA (sin espera ni costo). Efecto en ≤30 s (caché).

## Pendiente
- Revisar los primeros mensajes de Alejandro y Omir (revisión programada ~10:20 RD).
- Si los tiempos agotados siguen altos, evaluar con el dueño (el tope de 1.5 s es un candado del plan v2).
