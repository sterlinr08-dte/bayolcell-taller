# 2026-10-19 23:50 — Claude — Aprovechar el crédito de US$200 antes de que venza (24-oct)

Sigue a `2026-10-19-2340-claude-ia-candados-gasto.md`.

## Hallazgo (captura de Facturación, 3:45 p. m. RD)
- Límite de gasto mensual de la **organización**: US$30, gastado US$5.04 (17 %).
- Historial: «API credit (Max 20x)» **US$200, 18-oct-2026, vence el 24-oct-2026**. Concesiones de US$20 y US$5 vencen en 2027.
- Créditos totales: US$214.97.

## Decisión del dueño
«si» → prender otra vez los borradores de seguimiento hasta el 24-oct para no perder el crédito.

## Cambios (aplicados en producción con execute_sql; `apply_migration` se colgaba por tiempo)
- `ia_consumir_cupo`: hasta el **24-oct-2026 (día RD)** el tope sube a **400** llamadas/día; desde el 25 vuelve a lo que mande el código (150).
- `whatsapp_ia_config.borradores_seguimiento = true` en Moca, Santiago y Navarrete.
- pg_cron `ia-borradores-fin-credito-24oct` (job 9), `5 4 25 10 *` = 25-oct 00:05 RD: pone `borradores_seguimiento = false` y se borra solo.
- Archivo: `supabase/migrations/20261019234500_ia_aprovechar_credito_hasta_24oct.sql`.
- La espera de 30 s sigue activa.

## Nota técnica
- En el MCP de Supabase, un `UPDATE` sin `WHERE` se queda esperando confirmación y vence a los 60 s. Usar siempre `WHERE`.

## OpenClaw (agente del dueño en WhatsApp)
- Falla desde el 14-oct («background check did not complete»). Usa la clave `asistente-whatsapp` del espacio de trabajo
  **ASISTENTE DE WHATSAPP**, cuyo propio límite de gasto es US$2. El dueño debe subirlo en Espacios de trabajo → ASISTENTE DE WHATSAPP → Límites.

## Pendiente
- Si el gasto diario es bajo, se puede subir más el tope antes del 24 para aprovechar el crédito.
