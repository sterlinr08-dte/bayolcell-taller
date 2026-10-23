# 2026-10-23 08:01 (RD) — Carga del taller: estilos desde el primer pintado, Diagnóstico bajo demanda, scripts en diferido (rama)

## Pedido del dueño
«Sigue con la carga del sistema» (segundo paso de «que fluya rápido y sin parpadeos»).

## Medición antes (banco local con gzip, red tipo 4G floja: 1.6 Mb/s, 120 ms, CPU ×4)
- 50 peticiones, 826 KB. Primer pintado 0.9 s. DOMContentLoaded 4.6 s, load 5.4 s.
- **9 hojas de estilo llegaban después de DOMContentLoaded** (surface-cleanup, midnight-motion, afinado, reflector,
  búsqueda, menú mini) y 3 de ellas se volvían a pedir a los 7.3 s porque el cargador las recolocaba al final del
  `<head>` para ganar la cascada. Ese es el cambio de aspecto que se veía al abrir el sistema.
- Diagnóstico IA (7 scripts + 2 hojas, ~110 KB) se descargaba y ejecutaba en cada arranque aunque no se abriera.
- `supabase-js` en el `<head>` sin `defer` detenía el análisis de la página hasta descargarlo.

## Cambios (`claude/carga-rapida`)
- `taller.html`:
  - `preconnect` a Supabase, jsdelivr y cdnjs.
  - Las 6 hojas de las capas ahora son `<link>` en el `<head>` con los mismos ids que usan los scripts
    (`bcReflectorCss`, `bcBusquedaCss`, `bcMenuMiniCss`, `bcSurfaceCss`, `bcMidnightCss`, `bcAfinadoCss`) y en el
    mismo orden de cascada que tenían al final de la carga.
  - Fuera los 7 scripts y 2 hojas de Diagnóstico IA.
  - `defer` en `supabase-js` y en los 15 scripts del final (el orden entre ellos se conserva).
  - Versiones: `taller-app.js` p23, `crm-marketing-consent.js` u10.
- `crm-marketing-consent.js`: usa los `<link>` del head (si faltaran, los crea como antes); el CSS del CRM se inserta
  **antes** de las 3 capas (`colocarCss`) para que sigan ganando sin recolocarlas; `reafirmarCapasVisuales` solo actúa
  si de verdad quedó algo detrás.
- `taller-app.js`: `_bcCargarDiagnostico()` carga hojas y módulos de Diagnóstico IA al entrar a esa pantalla (nav y
  restauración de la última pestaña); los módulos se montan solos al cargar.

## Medición después (mismo banco)
| | Antes | Después |
|---|---:|---:|
| Peticiones al arrancar | 50 | 38 |
| KB descargados | 826 | 781 |
| Última hoja de estilo lista | 7.4 s | 0.86 s |
| DOMContentLoaded | 4.6 s | 4.3 s |
| load | 5.4 s | 5.0 s |
| Hojas que llegan después de DOMContentLoaded | 9 | 0 |

- **Pantallas idénticas:** Dashboard, Prefactura y CRM a 390 y 1280 px comparadas píxel a píxel antes/después → 0 % de
  diferencia en las 6 capturas (`comparar.cjs`).
- Diagnóstico IA: al entrar pide sus 9 archivos, define `BayolAIBoard`/`BayolCortos`/`BayolPhotoTiles`, se monta y no
  da errores. Al arrancar no pide ninguno.
- Regresiones: buscador smart 38/38; banco del CRM igual que ayer (abrir chat 20 nodos, eventos 22–24).

## Lo que sigue pesando
- `taller-app.js`: 2.3 MB (575 KB con gzip) y tarda ~4.4 s en red floja. Es el 70 % del tiempo de carga. Partirlo por
  pantallas es el siguiente paso grande; pide una sesión aparte.

## Publicación
- No publicado: espera el «publícalo» del dueño.
