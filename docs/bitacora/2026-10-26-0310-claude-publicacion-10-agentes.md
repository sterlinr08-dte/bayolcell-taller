# 2026-10-26 03:10 (RD) — Claude — Publicado: interfaz gráfica y Reacondicionados (10 agentes, PR #124)

## Pedido del dueño
«Publícalo» (después de ver el resumen y las capturas de los 10 agentes).

## Qué se publicó
- PR #124 (`claude/taller10-integrado` → `main`), merge `68fd120`. Detalle de cada agente: bitácora 2026-10-26-0240 y las de cada agente (0042 y siguientes).
- **NO se aplicó ningún SQL.** Los 4 archivos `PROPUESTA` de `supabase/migrations/` siguen esperando autorización (candados de Reacondicionados en el servidor, traza del precio de venta y conciliación de datos viejos).

## Verificación en vivo (bayolcell.com)
- `taller.html` sirve `taller-app.min.js?v=20261026-t10` y las 10 capas nuevas (respuesta 200, ~60 s después del merge).
- Los 10 archivos JS publicados son idénticos byte a byte a los probados y pasan `node --check`.
- No se pudo abrir la página en un navegador desde el entorno de trabajo (certificado del proxy); falta verlo en un iPhone real con sesión.

## Cómo apagar si algo se ve mal (en ese equipo)
`localStorage`: `bc_ui_off`, `bc_ui_inicio_off`, `bc_uiord_off`, `bc_inv_off`, `bc_uid_off`, `bc_finanzas_off`, `bc_reacond_proceso_off` (= '1'); las de Reacondicionados y Rentabilidad en sus bitácoras.

## Pendiente
- Ver en iPhone real (sobre todo la regla global sin mayúsculas en Prefactura y CRM).
- Decisiones del dueño: SQL propuestos, duplicado de Atención, nombres de botones de Proveedores, precio al despachar, 14 piezas sin descontar en Info Plus.
