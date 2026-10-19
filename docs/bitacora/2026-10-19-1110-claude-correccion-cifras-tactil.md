# Corrección de cifras — tamaño táctil del taller (19-oct-2026)

Corrige la tabla «Medido» de `2026-10-19-1100-claude-taller-tamano-tactil.md`. Ahí se pusieron cifras aproximadas; estas son las contadas en `medidas.json` del barrido, 30 vistas, sin contar «estadisticas», que abre la misma vista que «reportes».

| | Antes, 390 px | Antes, 1280 px | Ahora |
|---|---|---|---|
| Controles de menos de 44 px | **208** | **259** | 0 |
| Campos con alto < 48 o letra < 16 | **128** | **129** | 0 |

En las dos columnas de «Antes», los campos incluyen los deslizadores de tamaño de Etiquetas y Configurar impresora (4 + 10 por vista, a 390 y a 1280). No son campos de escribir.
