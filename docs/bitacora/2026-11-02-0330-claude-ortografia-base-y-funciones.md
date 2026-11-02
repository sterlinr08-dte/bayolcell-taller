# Corrección ortográfica — migración aplicada y funciones desplegadas (interruptor APAGADO)

> Sigue a `2026-11-01-2356-claude-ortografia-fases-1-4.md`. Dueño: «Si» (pasos 1 y 2: base + funciones).

## Qué se hizo
| Paso | Resultado |
|---|---|
| Migración `crm_ortografia` (archivo `20261102120000_crm_ortografia.sql`) | Aplicada. `crm_ortografia_config` con `activo = false`, 2 políticas solo-admin, 3 triggers `*_conservar_ortografia`, `ia_reservar_cupo` |
| `social-enviar` | v4 → **v5** |
| `instagram-enviar` | v9 → **v10** |
| `whatsapp-enviar` | v22 → **v23** |
| Frontend (`crm-ortografia.js`, marca) | **No publicado** (PR #199 sigue en borrador) |

## Cambio respecto al archivo de la fase 2
- Se quitó el `revoke` de `ia_reservar_cupo` (la herramienta de Supabase retiene los `revoke`, MEMORIA §8). En su lugar la función devuelve `false` si `auth.role()` no es `service_role`.
- Probado con rollback: como `service_role` reserva; como `anon` no. Llamada directa (postgres) → `false`. `ia_uso_diario_servicio` quedó vacía.
- Opcional, para el SQL Editor: `revoke all on function public.ia_reservar_cupo(text, integer, integer) from public, anon, authenticated;`
- Los caracteres invisibles de los emojis en `ortografia.ts` se pasaron a escapes `️`, `⃣`, `‍` (mismo comportamiento; 46/46 pruebas).

## Verificación
- La v22 de producción de `whatsapp-enviar` coincidía con el repo (490 líneas, mismo contenido); la v23 es esa más los cambios de la fase 3.
- Prueba de humo con la llave anónima pública (no es sesión de empleado):
  - `social-enviar` → **403 sin_permiso** (antes, con la v4, esa llamada pasaba la verificación: hallazgo 1 cerrado).
  - `instagram-enviar` y `whatsapp-enviar` → 404 «Hilo no encontrado» con un id inexistente (arrancan bien; no se envió nada).
- Registros: solo aparecen esas pruebas; sin errores.

## Efecto para los empleados
- Ninguno visible: el interruptor está apagado, así que cada envío sale tal cual (motivo `apagado` en el registro).
- Facebook ahora exige sesión de empleado activo o admin, igual que Instagram.

## Siguiente paso (con autorización)
3. Banco de 50 frases reales + 20 trampa con la IA real.
4. Piloto: `piloto_hilos` = un hilo del dueño y `activo = true`.
5. Publicar el frontend (PR #199) y encender para todos si el piloto sale bien.
