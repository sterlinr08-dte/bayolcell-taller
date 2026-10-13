# 2026-10-13 16:25 — Claude: `codlocalidad` 7 = Navarrete en el puente del asistente

Sigue a `2026-10-13-1610-claude-asistente-infoplus.md`.

- El dueño confirmó: **«la localidad 7 es Navarrete»**.
- `asistente-infoplus` v2 (desplegada): `LOCALIDADES` = 1 Santiago, 4 Moca, **7 Navarrete**. Ahora `ventas` acepta `sucursal: "Navarrete"`.
- Prueba en vivo: `ventas` con `sucursal: Navarrete` devuelve las ventas de hoy de esa sucursal.
- Dato para el resto del sistema: en `infoplus_ventas`, `codlocalidad` 7 corresponde a **Navarrete**. El estado mensual del taller solo mapea Santiago (1) y Moca (4).
