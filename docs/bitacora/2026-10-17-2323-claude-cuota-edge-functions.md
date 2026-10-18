# Aviso de cuota de Supabase: «Edge Functions Invocations Exceeded» — Claude (solo lectura)

Continúa `2026-10-14-0900-claude.md` (arreglo de los webhooks duplicados de Zernio).

- **Aviso del panel (captura del dueño, 18-oct):** la organización se pasó de la cuota en el ciclo anterior (15-sep → 15-oct) por **Edge Functions Invocations Exceeded**.
  - Plan Pro, con 2 millones de llamadas incluidas por ciclo.
  - Hay período de gracia hasta el **27-oct-2026**. Si el ciclo actual sigue por encima, aplica la Fair Use Policy y los proyectos responderían 402.
- **Causa:** Bayol `social-webhook`, por la duplicación de webhooks de Zernio documentada el 14-oct. Conteo por día en `function_edge_logs`:

  | Día (UTC) | Llamadas a `social-webhook` |
  |---|---:|
  | 9 al 10 de octubre | 73,315 |
  | 11 al 12 de octubre | 37,087 (picos de 16,277 por hora) |
  | 14 al 15 de octubre | 5,440 |
  | últimas 24 h | 4,533 |

- **Ahora (últimas 24 h):**
  - Bayol ≈ 13,500 llamadas por día: `whatsapp-webhook` 4,534, `social-webhook` 4,533, `alarma-agente` 1,440 (cada minuto), `whatsapp-ia-responder` 1,331, `whatsapp-campanas` 720 y `social-automatizaciones` 718.
  - NEXUS ≈ 50 y STUDIO ≈ 63. Los demás proyectos no tienen llamadas.
  - **Proyección del ciclo 15-oct → 15-nov: unas 420,000 llamadas**, muy por debajo de los 2 millones, así que la restricción no debería aplicarse.
- **Recomendación al dueño:**
  - **no** quitar el límite de gasto (spend cap);
  - confirmar en Usage que el contador del ciclo actual va bajo;
  - después, revisar por qué `whatsapp-webhook` y `social-webhook` reciben casi la misma cantidad (posible evento doble).
- No se cambió nada.
