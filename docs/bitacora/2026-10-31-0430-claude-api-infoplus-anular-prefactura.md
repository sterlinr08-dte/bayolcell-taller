# 2026-10-31 04:30 — Claude — ¿Se puede anular una prefactura por la API de Info Plus?

Sigue a `2026-10-31-0415-claude-api-infoplus-facturar.md`.

## Dueño
«¿Y anular prefactura?»

## Fuente revisada (en vivo, `https://apicliente.infoplusplatinum.com/Help`)
- La API no tiene ninguna ruta PUT ni DELETE. Las únicas que escriben (POST) son `Ajuste`, `Articulo`, `Compra`, `Despacho` y `Prefactura`.
- `POST api/Prefactura` (`PreFacturaModel`) solo **crea**. Sus campos: codprefactura, codempleado, codlocalidad, total, impuesto, descuento, descuentototal, codnivelprecio, codcliente, nombre, credito, fecha, hora, contrato, ordencompra, centro, **comentario**, detallesPreFactura, seriales. No tiene ningún campo de estado ni de anulación.
- **Conclusión:** por la API no se puede anular ni modificar una prefactura; eso se hace en InfoplusWEB.
- Dato nuevo: el modelo ya trae `comentario`. La MEMORIA lo daba como pendiente de Dagoberto. Falta probar si llega, con autorización del dueño.
- En el taller, `taller-prefactura.js` y `taller-recepcion.js` no tienen función de anular.
- No se escribió nada en Info Plus.

## Siguiente paso
Si el dueño lo quiere, pedirle a Dagoberto un «anular prefactura» (por número y con motivo). Mientras, el taller puede marcar la suya como «Anulada» y avisar que hay que anularla también en Info Plus.
