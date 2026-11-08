# Contador de visitas web: sin robots y con hora de RD (08-nov-2026, 10:10 RD)

Sigue a la auditoría `2026-11-08-1000`. El dueño dijo «Sí, publícalo».

## Cambios
- **Base de datos** (migración `web_visitas_sin_robots_hora_rd`, copia en `supabase/migrations/20261108140000_web_visitas_sin_robots.sql`):
  - nueva `web_visita_es_robot(ua)`;
  - `web_visitas_resumen()` y `web_visitas_por_dia()` dejan fuera los robots y cortan los días con hora de `America/Santo_Domingo`;
  - el resumen trae además `robots`, para saber cuántos se apartaron.
  - No se borró ninguna fila.
- **`index.html`:** la página ya no registra visitas de navegadores automáticos (`navigator.webdriver`, HeadlessChrome, bots).

## Verificación
Resultado de `web_visitas_resumen()` después del cambio:
- hoy: **0**;
- últimos 7 días: 68;
- últimos 30 días: 292;
- robots apartados en todo el historial: 515.

Por día (hora RD), del 2 al 8 de noviembre: 8, 11, 6, 21, 12, 10 y 0 visitas de personas.

## Pendiente (aparte)
`web_visitas_resumen` y `web_visitas_por_dia` siguen abiertas para `anon` (ya era así antes). Solo devuelven conteos, no datos de personas. Conviene cerrarlas para que solo las vea el admin; queda para cuando el dueño lo decida.
