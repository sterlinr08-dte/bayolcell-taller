# 2026-10-24 04:25 (RD) — Prefactura: auditoría visual de ChatGPT, puntos 1–3 (rama, SIN publicar)

## Pedido del dueño
«Haz del 1 al 3 con la opción A» sobre el resumen de la auditoría visual (el PDF con los 8 hallazgos no llegó al chat; se
contrastaron los 5 del resumen). Opción A = la compensación de escala de Windows se queda como está (los botones miden lo
mismo en la pantalla física que al 100 %; en PC se usa ratón).

## Hallazgos contrastados
| Hallazgo | Veredicto | Arreglo |
|---|---|---|
| Buscador «transparente» | Parcial: la ventana era blanca al 94 % y **sin fondo oscurecido** detrás | Fondo `rgba(15,23,42,.35)` + blur 6 (DESIGN.md) detrás de la ventana flotante; la ventana pasa a blanco sólido. Tocar el fondo la cierra. |
| Tab se escapa | Cierto | Foco encerrado dentro de la ventana (Tab y Shift+Tab ciclan); **Escape cierra desde cualquier control**, no solo desde el campo (antes, tras tabular, Escape no cerraba). |
| Contraste bajo | Cierto: «Guardar» 3.3:1; grises `#94a3b8` 2.9:1 | «Guardar» con `#cf4a22→#b8401f` (4.5:1 / 5.5:1); los grises chicos del buscador y el botón de limpiar pasan a `#64748b` (4.8:1). |
| Icono de impresora confuso | Cierto | Engranaje (`ti-settings`) con título «Impresora: configurar». |
| Escala de Windows | Cierto por diseño | Se mantiene (opción A del dueño). |

## Archivos
`taller-recepcion.js` g8→g9 (fondo, foco encerrado, Escape global), `taller-recepcion.css` g6→g7 (grises, fondo oculto fuera
de bc-pf), `taller-prefactura.css` n10→n11 (fondo oscurecido, Guardar, ventana sólida), `taller-prefactura.js` i23→i24 (icono),
`taller.html` (versiones). Sin cambios de lógica.

## Pruebas (banco local, `pf-pc/visual3.cjs`, 390 y 1280 px)
| Medida | 390 | 1280 (pantalla 2×, zoom .75 por opción A) |
|---|---|---|
| Fondo detrás del buscador | sí, rgba(15,23,42,.35) | igual |
| Ventana del buscador | blanco sólido | igual |
| 15 Tab + 4 Shift+Tab fuera de la ventana | 0 | 0 |
| Escape cierra / clic en el fondo cierra | sí / sí | sí / sí |
| Contraste «Guardar» (blanco sobre el degradado) | 4.51–5.54 | igual |
| Contraste encabezados del buscador | 4.76 | igual |
| Icono | `ti-settings`, 44×44 | `ti-settings`, 33×33 (zoom .75) |
| Botón Guardar | 99×54 | 78×41 (zoom .75) |
0 errores JS. Captura: `visual3-buscador-1280.png`.

## Pendiente
- El dueño adjunta el PDF para contrastar los otros 3 hallazgos.
- Medir en iPhone real (la auditoría solo revisó el móvil por código).

## Publicado 24-oct 00:25 (RD) — dueño: «Publícalo»
PR #112 (CI en verde: unit, chromium, webkit) pasado a `main` por fast-forward y publicado en bayolcell.com.
