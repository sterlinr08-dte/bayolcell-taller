# 2026-10-15 14:00 — Claude — Medición del uso de funciones de Supabase (24 h después del arreglo)

Ventana: 14-oct 14:00 UTC → 15-oct 14:00 UTC (proyecto vkhwdvjtowrhkhqavnvk, `function_edge_logs`).

| | Antes del arreglo (13-oct) | Ahora (24 h) |
|---|---|---|
| Llamadas totales | ~96,000/día | **15,524/día** (−84 %) |
| social-webhook | ~87,500/día | **5,599/día** (−94 %) |

Otras del día: whatsapp-webhook 5,599 · whatsapp-ia-responder 1,578 · alarma-agente 1,264 · social-automatizaciones 625 · whatsapp-campanas 610 · el resto < 60 cada una.

Proyección al mes: Bayol ≈ 466,000 llamadas, 23 % del tope de 2 millones del plan Pro. Con NEXUS (~4,600/día ≈ 138,000/mes) la organización queda en ≈ 600,000/mes (30 %).

Pendiente: el aviso de restricción del 27-oct es por el ciclo pasado; revisar en Supabase → Usage/Billing si hay que pagar el exceso o quitar el tope de gasto.
