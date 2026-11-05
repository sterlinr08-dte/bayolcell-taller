# Publicado: rendimiento de la página de inicio

## Pedido del dueño
«Publícalo» (05-nov-2026).

## Qué se hizo
- PR #232 unido a `main` (squash `fa0b066`). GitHub Pages lo publicó en unos 80 s.
- En vivo responden con 200: `assets/iconos/tabler-bc.woff2`, los logos nuevos y las copias de 480 px.

## Medición en vivo (Lighthouse 12, celular simulado, 2 mediciones)
| | Antes (vivo, 05-nov) | Después (vivo) |
|---|---|---|
| Rendimiento | 57 | **79–81** |
| Primer dibujo (FCP) | 3,5 s | **1,4–2,0 s** |
| Foto principal (LCP) | 11,2 s | **4,0 s** |
| Peso total | 1,9 MB | **0,49 MB** |

Accesibilidad 93, buenas prácticas 100 y SEO 100: sin cambios.

## Detalle
Ver la bitácora anterior de rendimiento del inicio (mismo día).
