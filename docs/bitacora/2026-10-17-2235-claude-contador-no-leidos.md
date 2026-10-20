# 2026-10-17 22:35 — Claude · Contador de «sin leer» en una sola consulta (sin publicar)

Sigue a `2026-10-18-*-claude-auditoria-carga-dashboard.md` (punto 1 de la propuesta). El dueño dijo «Continúa».

## Antes
- `taller-pestana-avisos.js` bajaba hasta 2000 filas de `whatsapp_hilos`, `instagram_hilos` y `social_hilos` **cada 20 s** (y al volver a la pestaña), solo para poner «(N)» en el título.
- Hoy son 1,004 conversaciones sin leer: 829 de WhatsApp, 160 de Instagram y 15 de Facebook.

## Ahora
- **Migración `supabase/migrations/20261018120000_crm_no_leidos_count.sql`** (NO aplicada):
  - función `crm_no_leidos_count(p_admin, p_usuario, p_tipo, p_sucursal)` que devuelve **solo el número**;
  - mismas reglas: sin archivados; en WhatsApp, sin silenciados; el admin cuenta todo; el empleado cuenta su sucursal (o los que no tienen sucursal), lo suyo y lo que no tiene dueño;
  - SECURITY INVOKER (RLS como antes), solo lectura y sin `drop`/`delete`.
- **`taller-pestana-avisos.js`** usa la función. Si no existe (sin la migración) o falla, cuenta como antes. La primera vez que la función no existe, deja de intentarla.
- **Cache-busting:** `taller-pestana-avisos.js?v=20261018-nl1` (en `crm-marketing-consent.js`) y `crm-marketing-consent.js?v=20261018-nl1` (en `taller.html`).

## Pruebas
- **Base real, solo lectura** (cuerpo de la función como consulta suelta):
  - admin = **1,004**;
  - 3 técnicos de ejemplo = 750, 750 y 68 (según su sucursal; hoy todos los hilos sin leer están sin dueño).
- **Página de prueba con Playwright**, con Supabase simulado:
  - con la función, el título sale de la base y **ninguna** consulta a tablas;
  - sin la función, cuenta como antes: admin 5 y empleado 3 con los mismos datos de prueba, que coinciden con las reglas del SQL;
  - no se reintenta la función: **TODO OK**.

## Estado
- Rama `claude/no-leidos-rpc`. **Sin publicar y migración sin aplicar.** Espera el «publícalo» del dueño.
- La migración no tiene `drop` ni `delete`, así que se puede aplicar por la API.

## Siguiente
- NEXUS: resumen del Inicio (abonos/«Cobrado» y conteos) en una función, con la misma fuente de verdad.
- Pendiente del dueño: confirmar «Max rows» de la API en los proyectos.
