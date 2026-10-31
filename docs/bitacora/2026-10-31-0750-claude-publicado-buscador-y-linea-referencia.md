# 2026-10-31 07:50 — Claude — PUBLICADO: buscador «5 en otras» y línea con referencia

## Dueño
«Publica las dos.»

## Publicado en `main`
| PR | Qué | Commit |
|---|---|---|
| #167 | Buscador de la Prefactura: «Navarrete: 0 · 5 en otras» cuando el almacén elegido está en 0 (`taller-recepcion.js` g15, `.css` g10) | `e2a2d88` |
| #168 | La línea de la prefactura lleva la referencia de Info Plus («· 128GB», «· Con aviso», «· VACIO»); `taller-app.min.js` `?v=20261031-o5` | `7b8aed7` |

La rama del #168 se actualizó con `main` antes de mezclar (los dos tocaban `taller.html`; auto-merge limpio).

## Verificación en vivo (bayolcell.com)
- `taller.html` sirve `taller-recepcion.css?v=20261031-g10`, `taller-app.min.js?v=20261031-o5`, `taller-recepcion.js?v=20261031-g15`.
- `taller-app.min.js` contiene `_ipDescCompleta`; `taller-recepcion.js` contiene «en otras».

## Siguiente paso
Que el dueño pruebe con un artículo real: buscar el iPhone 14 128GB (2874) con el almacén Navarrete y agregarlo desde Santiago;
revisar que la línea diga «· 128GB» en pantalla, en el ticket y en la prefactura de Info Plus.
Bitácoras de detalle: 2026-10-31-0620 y 2026-10-31-0710.
