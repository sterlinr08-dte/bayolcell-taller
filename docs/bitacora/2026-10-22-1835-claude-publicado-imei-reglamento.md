# 22-oct-2026 18:35 · Claude · Publicado: IMEI → artículo, serie por Info Plus, IMEI comprobado, descuentos, REGLAMENTOS

**Dueño:** «Publicar».

- `claude/imei-busca-articulo` → `main`, commit de merge `21c425f` (bitácoras 1830 y 1825).
- Verificado en vivo (bayolcell.com): `taller.html` sirve `taller-app.js?v=20261022-p8`, `taller-recepcion.js?v=20261022-g3`,
  `taller-prefactura.js?v=20261022-i2`; los archivos publicados contienen `buscarImei`, `_rpComprobarImei` y `_rpDescMonto`.
- Edge `infoplus-imei-almacen` v10 ya estaba desplegada; columnas `prefactura_desc_max_pct` y `descuento_monto` ya aplicadas.

## Qué debe probar el dueño en vivo
1. Buscar o escanear un IMEI completo del almacén 1 → debe salir su artículo; Enter lo agrega con el IMEI.
2. Escribir a mano un IMEI inventado en la ventana IMEI → debe rechazarlo («Info Plus no tiene el IMEI…»).
3. Agregar un accesorio cuyo nombre diga «celular» → no debe pedir IMEI.
4. Descuento: poner 50 % en una línea → se recorta al tope (10 % si no se configuró); poner RD$ en «Descuento RD$».
5. Prefactura con comentario → mirar en Info Plus si sale en `contrato` o en `comentario` y avisar.
