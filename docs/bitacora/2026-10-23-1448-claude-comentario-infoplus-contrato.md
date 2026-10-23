# Comentario de la prefactura: vuelve a ir en `contrato` y `comentario` (la factura de Info Plus lo cargaba vacío)

**Dueño (captura de Info Plus, Factura cargando la 118977):** «Comentarios» vacío. «Pero ayer sí funcionó, es algo que se me está escapando.»

## Causa (historial de git)
- La prueba buena del 22-oct (118932) se hizo con el commit b390e1e, que mandaba el texto en **`contrato` y `comentario`**.
- El commit 53323a5 (22-oct 21:05) lo dejó **solo en `comentario`** suponiendo que ese era el campo que funcionó, y la prueba
  siguiente («Prueba 3») se hizo sobre la misma 118932, que Info Plus no actualiza de cabecera → nunca se validó con una nueva.
- Hoy, con prefacturas nuevas (118975, 118977), la factura cargó «Comentarios» vacío. Conclusión: el campo que Info Plus pasa a
  la factura es `contrato` (o lo lee de ahí); `comentario` sirve para la ficha de la prefactura pero no viaja.

## Cambio (taller-app.js p33)
`_rpArmarModelo`: `contrato` y `comentario` llevan los dos «bayolcell.com: <texto>» (200 letras máx.). Publicado en `main`.

## Prueba pendiente (dueño)
Hacer una prefactura nueva con comentario y cargarla en Factura de Info Plus: «Comentarios» debe traer «bayolcell.com: …».
Si sale, actualizar REGLAMENTOS §3 (hoy dice «solo comentario»).
