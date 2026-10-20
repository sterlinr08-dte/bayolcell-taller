# 2026-10-19 23:40 — Claude — Candados de gasto de la IA de WhatsApp

Sigue a `2026-10-19-2320-claude-ia-reactivada.md`.

## Solicitud del dueño
«Audita para que verifique y no se agote rápido como la otra vez» → «sí, aplica los 3 candados».

## Auditoría (fuente: Supabase producción `vkhwdvjtowrhkhqavnvk`, código de `whatsapp-ia-responder` v28 = repo)
- Al reactivar el límite (19:11–19:19 UTC) la IA redactó 16 sugerencias en 8 min en 8 chats ≈ 100 llamadas/hora en hora pico.
  A ~US$0.01 por llamada (Haiku 4.5 + 15 mensajes de memoria) agotaría US$30 en 3–5 días.
- Últimos 60 días, ~560 sugerencias: **~6 usadas** (enviadas/editadas), ~260 «reemplazadas» (el cliente escribió otra vez
  antes de que alguien la viera), ~70 descartadas, el resto pendiente sin mirar.
- Lo que sí rinde: precio exacto de pantalla (sin IA), saludo (1 llamada por conversación nueva), clasificador de
  financiamiento (solo si el texto trae pistas de financiamiento).
- Otros usuarios de la clave: `bde-diagnostico` (Opus 5.5, max 8000) y `ai-board-chat`. No se tocaron.

## Cambios
- Migración `20261019230000_ia_candados_gasto` (aplicada):
  - `whatsapp_ia_config.borradores_seguimiento boolean not null default false`.
  - Tabla `whatsapp_ia_uso_diario(dia, llamadas, rechazadas)` con RLS sin políticas (solo service role).
  - RPC `ia_consumir_cupo(p_tope)` atómica, día de RD; solo `service_role` puede ejecutarla.
- `supabase/functions/whatsapp-ia-responder/index.ts`:
  1. **Borradores de seguimiento apagados** en copiloto/automático salvo `borradores_seguimiento = true`.
  2. **Tope diario** `TOPE_DIARIO_IA` = 150 (secreto opcional `IA_TOPE_DIARIO`) antes de cada llamada a Anthropic
     (borrador, clasificador de financiamiento y saludo). Si el contador falla, no apaga la IA (respaldo: límite mensual de la consola).
  3. **Espera de 30 s** de silencio antes de redactar un borrador (seguimiento u observación); si el cliente escribió otra vez, lo redacta la llamada del mensaje nuevo.
- No cambia: saludo automático, precio de pantalla, formulario de financiamiento, mensaje fuera de horario, chats tomados por un empleado.

## Cómo vigilar
```sql
select * from whatsapp_ia_uso_diario order by dia desc limit 7;
```
Reactivar borradores en una sucursal: `update whatsapp_ia_config set borradores_seguimiento = true where sucursal_id = '…';`

## Pendiente
- Revisar el uso real mañana y ajustar el tope si hace falta.

## Despliegue y verificación
- `whatsapp-ia-responder` **v29** desplegada (verify_jwt false como antes); contenido idéntico al repo, byte por byte.
- 19:29 UTC: `whatsapp_ia_uso_diario` → 2026-10-19: 1 llamada (un saludo de conversación nueva), 0 rechazadas.
  Después del despliegue no se creó ningún borrador de seguimiento con IA; 27 mensajes entrantes en 5 min.
