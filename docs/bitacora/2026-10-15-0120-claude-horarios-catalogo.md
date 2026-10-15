# 2026-10-15 01:20 — Claude — Horarios de sucursales unificados con los del catálogo (publicado)

## Decisión del dueño
Ante la diferencia de horarios entre `index.html` y `catalogo.html` (bitácora 2026-10-15-0100), el dueño respondió «Catálogo»: los correctos son los del catálogo.
Coinciden también con el horario del asistente de WhatsApp (`supabase/migrations/20260904030000_whatsapp_ia_horario_estructurado.sql`).

## Horario oficial
- Santiago: Lun–Vie 8:30–18:00 · Sáb 9:00–16:00 · Dom cerrado (sin cambios).
- Moca: Lun–Vie 8:00–18:00 · Sáb 8:00–17:00 · Dom cerrado (antes en index: Lun–Sáb 8:30–18:00).
- Navarrete: Lun–Sáb 9:00–19:00 · Dom 9:00–13:00 (antes en index: Dom 9:00–12:00).

## Cambios (`index.html`)
- Texto visible de horarios de Moca y Navarrete en el pie.
- Tabla `HOR` del aviso «Abierto/Cerrado» en vivo (minutos: Moca 480–1080, sáb 480–1020; Navarrete dom 540–780).
- JSON-LD `openingHoursSpecification` de Moca y Navarrete.
- `tienda.html` no muestra horarios. El texto de ejemplo en `crm-automatizaciones.js` (placeholder) no se tocó.

## Pendiente del dueño
Revisar que el Perfil de Empresa de Google de cada sucursal tenga este mismo horario.
