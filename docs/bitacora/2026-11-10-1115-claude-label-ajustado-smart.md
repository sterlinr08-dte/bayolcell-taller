# Claude · «Imprimir label» (Reacondicionados): ajustada a la pantalla y «Texto de estado» smart (sin publicar)

## Pedido del dueño
Captura de la ventana «Imprimir label» desde la Ficha del Equipo (10-nov-2026, 11:05 a. m.): «VAMOS A MEJORAR Y QUE SE VEA AJUSTADO A LA PANTALLA Y EN TEXTO DE ESTADO VAMOS A PONER SMART». En su pantalla había que bajar para ver la vista previa y el botón «Imprimir».

## Además, publicación anterior
PR #287 «Artículos Info Plus smart» quedó en `main` (commit `67abee052e4a80719dbca5264921bf007017421f`), autorizado con «Publícalo». Verificado en vivo: `taller-app.min.js?v=20261110-ab3`.

## Qué se hizo (`imprimirLabelEquipo`, `taller-app.js`)
| Antes | Ahora |
|---|---|
| Un campo por renglón; la vista previa y «Imprimir» quedaban abajo, fuera de la pantalla | Marca · Modelo y Capacidad · IMEI en dos columnas. Encabezado y botones fijos; todo cabe sin desplazarse a 390×844, 1280×720 y 1920×950 |
| En laptop (pantalla baja) no cabía | Datos a la izquierda y vista previa a la derecha |
| Copias: cajita para escribir. Letra: botones de 26 px | Copias y Letra con − / + de 44 px |
| «Imprimir» chico | «Imprimir» de 54 px; campos de 48 px con letra de 16 px |
| Texto de ayuda largo debajo | Se quitó (la rueda del mouse sobre la vista previa sigue ajustando la letra) |

## «Texto de estado» smart — qué hace solo
| Acción | Detalle |
|---|---|
| Botones de un toque | CLASE A · CLASE B · CLASE C. Un toque lo pone; otro lo quita. |
| Recuerda por equipo | Si ya se imprimió un texto para ese equipo, abre con ese mismo. |
| Lee la clasificación | Si el equipo tiene clasificación A, B, C o D, abre en «CLASE X». |
| Aprende los suyos | Los textos propios que se imprimen («AVISO BAT») quedan como botón (hasta 3, en ese equipo/navegador). |
| Mayúsculas solas | Lo que se escribe sube a mayúsculas. |
| Cursor y Enter | En PC el cursor cae en «Texto de estado»; Enter imprime. En el celular no abre el teclado solo. |

- No cambia lo que se imprime ni la calibración: se siguen usando `imprimirLabelAdhesivo`, `lbl_*` y `cfg_*`.
- La memoria vive en el navegador (`bc_lr_eq`, `bc_lr_estados`); no toca la base.
- Apagar lo smart en un equipo: `localStorage.bc_lr_smart_off='1'`.

## Archivos
`taller-app.js`, `taller-app.min.js` (regenerado), `taller.html` (`?v=20261110-ab4`), prueba nueva `scripts/pruebas/label-rapido-smart.cjs`.

## Pruebas (banco local, datos inventados)
- `label-rapido-smart.cjs` a 390×844, 1280×720 y 1920×950: **Todo bien** (cabe sin desplazarse, «Imprimir» y vista previa a la vista, todo ≥ 44 px, botones de estado, mayúsculas, copias, recuerda por equipo, clasificación, sin errores).
- `label-sin-color.cjs`: todo bien.
- No probado: impresora real ni iPhone real.

## Estado
Rama `claude/label-ajustado-smart`, sin publicar. Falta el OK del dueño.
