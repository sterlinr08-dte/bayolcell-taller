# Cuentas de pago: ventana «Pídale al cliente que nos escriba» (número + QR)

**Dueño:** «También le decimos al cliente que nos escriba al WhatsApp para enviarle la cuenta.»

## Qué hace (taller-app.js, p28)
Cuando se toca «Enviar cuentas de pago» y el cliente **no** nos ha escrito en 24 h, y la plantilla `bayolcell_cuentas_pago`
todavía no está aprobada por Meta, ya no sale solo un aviso de error: se abre la ventana `_rpAvisoEscribanos(linea, suc, wa)`:
- explica en una línea por qué (WhatsApp solo deja mandar las cuentas si el cliente escribe primero);
- muestra en grande el número de la línea de la sucursal del almacén (p. ej. +1 809-707-2493, Reparación Santiago);
- botón «Copiar número»; botón «Ya escribió, enviar» (vuelve a intentar el envío);
- **QR** de `wa.me/<número>?text=Hola BAYOL CELL, quiero las cuentas para pagar.` para que el cliente lo escanee en el
  mostrador (usa `qrcodejs`, el mismo del QR de Android);
- «Cerrar». Nada se envía desde la ventana.
Cuando Meta apruebe la plantilla, la ventana deja de aparecer porque las cuentas salen por plantilla.

## Pruebas (banco local, 390 y 1280 px)
Número formateado correcto; QR de 200 px dibujado; botones de 44–48 px en el diseño (`min-height` 46/48, `border-box`;
el `.btn` del sistema se ve un 3 % más chico por su `scale(.97)`); sin errores de JS.

## Publicación
`claude/prefactura-pc` → `main` (autorizado por el dueño en el mismo pedido: «publica la nueva ventana»).
