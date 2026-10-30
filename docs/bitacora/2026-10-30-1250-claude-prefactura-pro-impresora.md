# 2026-10-30 12:50 (RD) — Claude — Prefactura «nivel pro» (opción B) y ventana de impresora

## Solicitud del dueño
Captura de la Prefactura en PC: «Vamos a mejorar para ponerlo nivel pro, y el botón de configuración de impresora que solo
entre al módulo de impresora porque los demás empleados van a tener acceso a configurar la impresora en caso de que presente
alguna falla». Opciones dadas y elegidas: impresora = **ventana encima**; Prefactura = **B · dos columnas en PC**.

## Diagnóstico
- El engranaje (`taller-prefactura.js`, `.ibtn-imp`) llevaba a la página completa «Config. Impresora» (sale de la prefactura,
  pide confirmar si hay cambios y muestra también la calibración de etiquetas).
- Permiso: `tienePermiso('config_impresora')` ya es verdadero para cualquier sesión desde el 23-oct (no se tocó).

## Cambio (rama `claude/prefactura-pro`, SIN publicar)
Capa nueva `bc-prefactura-pro.css` + `bc-prefactura-pro.js` (`?v=20261030-p1`), clase `html.bc-pfpro`.
Apagar: `BC_PFPRO=false` en `taller.html` o `localStorage.bc_pfpro_off='1'`. No toca `taller-app.js`, base, Info Plus ni precios.
1. **PC ≥ 1440 px: dos columnas.** Izquierda: cliente, buscador y artículos (tarjeta blanca). Derecha: «Resumen» fijo
   (artículos, subtotal, descuento, TOTAL grande) con **Guardar e imprimir** (negro, 54 px) y **Guardar** (naranja, 54 px).
   Se mueve la barra de abajo entera dentro del resumen (sus botones y escuchas son los mismos; `R.bar` sigue sirviendo) y
   se esconde su total repetido. Por debajo de 1440 px todo vuelve a la barra fija de siempre.
2. **Pulido:** Nombre/WhatsApp/Cédula alineados; «Sin artículos» → «Aún no hay artículos · Toque «Buscar artículo» o pulse
   F2»; «Descuento RD$» → «Descuento»; si ninguna línea lleva IMEI, la columna «IMEI / serie» desaparece y el nombre del
   artículo cabe en una línea.
3. **Engranaje → ventana «Impresora de esta computadora»** encima de la prefactura (no se pierde lo escrito): mueve a la ventana
   los mismos paneles de «Config. Impresora» (`#qzPanelCard`: conexión QZ Tray, impresora de etiquetas y de tickets, prueba de
   etiqueta, certificado; `#bcPfFmtCard`: papel ticket/carta y copias) y los devuelve al cerrar (✕, Esc o tocar fuera).
   Botones nuevos: «Reconectar» y «Prueba de ticket». La calibración de etiquetas sigue solo en el menú.

## Pruebas (banco local)
- 1920 px: dos columnas; botones del resumen 54 px; Guardar/Guardar e imprimir/F9 llaman `_rpGuardar` igual que antes.
- Cambiar 1920 → 1280 → 1920: la barra vuelve abajo y regresa al resumen sin errores.
- Ventana de impresora a 1920 y 390: abre sin cambiar de pantalla, todo ≥ 44 px, al cerrar los paneles vuelven a «Config. Impresora».
- `prefactura-confiable` 8/8, `ui-global`, `app-movil`, `codigo-vendedor`, `label-sin-color` en verde. Sin errores de JavaScript.
- Capturas: `docs/bitacora/img/2026-10-30-prefactura-pro/`.
- No probado con QZ Tray real (el banco no lo tiene) ni en el iPhone.

## Pendiente
- «Publícalo» del dueño.
