# 2026-10-19 23:20 — Claude — Asistente de WhatsApp reactivado (límite de la API de Anthropic)

Sigue a `2026-10-14-1430-claude.md` y `2026-10-18-1045-claude-revision-whatsapp-fase1.md`.

## Solicitud del dueño
«Vamos arreglar con el api de antropic con los 200us de crédito … y volver usar el asistente».

## Diagnóstico (captura de console de Anthropic, 3:03 p. m. RD)
- Créditos de la organización: **USD 215.00** (recarga automática activada).
- Límite de gasto mensual: **USD 2** → gasto del mes USD 5 (250 %). Por eso la API respondía «You have reached your specified API usage limits» desde el 14-oct.

## Arreglo
- El dueño subió el límite mensual en la consola («listo»). Se le recomendó USD 30 y se le avisó de la recarga automática a la tarjeta.
- No se cambió código ni la clave. Ningún secreto en el chat ni en el repo.

## Verificación
- Función de un solo uso `probar-clave-ia-20261019` (verify_jwt; solo devuelve código/tipo de error): **200 OK** con `claude-haiku-4-5`. Retirada enseguida (v2 devuelve 410).
- `whatsapp_ia_sugerencias`: desde las 19:00 UTC vuelven a aparecer sugerencias redactadas por la IA (saludo, ubicación, respuestas libres); antes de esa hora solo salían las de precio exacto (sin IA).
- Modos actuales: Moca y Santiago **automático**, Navarrete **copiloto**. `borradores_observacion` sigue en **false** (no se reactivó el gasto por cada mensaje).

## Pendiente / siguiente paso
- Vigilar el gasto de la semana en la consola. Si se queda corto, subir el límite.
- `whatsapp_ia_episodios` sigue con último registro del 14-oct; revisar si debería volver a llenarse con el modo actual.
