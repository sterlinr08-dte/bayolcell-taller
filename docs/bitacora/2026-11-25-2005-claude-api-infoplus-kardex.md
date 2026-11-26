# API de Info Plus: qué más se puede hacer (auditoría de solo lectura) — 26-nov-2026

Dueño: «Con el JSON que nos dio Dagoberto, ¿qué más podemos hacer? Intenta hacer otros JSON con lo que tenemos».

## Fuente: la ayuda pública de la API
`https://apicliente.infoplusplatinum.com/Help` lista **66 rutas**.

- **Escritura (POST), solo 5:** `Ajuste`, `Articulo`, `Despacho`, `Prefactura`, `Compra`. **Las 5 ya se usan.** No existe otra ruta para escribir (no hay nota de crédito, transferencia ni factura por API).
- **Lectura:** `TransaccionInventario`, `Factura`, `NotaCredito`, `Prefactura`, `RecepcionCompra`, `DocumentosCliente`, `CxC`, `CxP`, `Inventario`, `InventarioActual`, `Almacen`, `Cotizacion`, `OrdenCompra`, `PagoProveedor`, `Nomina`, contabilidad, bancos y otras.

## Prueba en vivo (solo GET, del 24 al 25-nov)
Se usó una Edge temporal `infoplus-explorar-20261126`: lista cerrada de rutas, solo GET, sin clave ni nombres. **Ya quedó retirada (410).**

| Ruta | Resultado |
|---|---|
| **TransaccionInventario** | 303 movimientos (960 entre el 20 y el 24-oct), en ~0,5 s. Campos: `TipoTransaccionesInventario` (Factura, Almacen Salida/Entrada, Ajuste, Compra, O.S., DSV), `Origen` (Entrada/Salida), `Almacen`/`CodigoAlmacen`, `Documento` (CO… factura, DA… despacho, AI… ajuste, C… compra, OT… orden de servicio, NC… nota de crédito), `CodProducto`, `Cantidad`, `Costo`, `FechaTransaccion`. **Sin IMEI.** |
| Factura | 228 líneas. Sin IMEI (se confirma). |
| NotaCredito | 3 notas. Sin IMEI. |
| DocumentosCliente | 130 documentos (fecha, tipo, monto). |
| Prefactura (GET) | Error de Info Plus: «Input string was not in a correct format». |
| RecepcionCompra | Error interno de Info Plus («Column 'ProveedorOrden' does not belong to table»). |

## Hallazgo: deducir la venta de un IMEI
Caso real: IMEI 357676150562102, código 1133.
- El taller tenía el despacho **DA00003680** Taller → Oficina del 22-oct.
- En el kárdex del 1133 aparecen ese mismo despacho y, el **23-oct, la venta CO00098453** en Oficina Santiago, la única venta del 1133 en esos días.
- Cruzando el último lugar y la fecha en que el taller vio el IMEI con las ventas del mismo código en ese almacén, se puede proponer «posible venta» con su factura. Si hay varias ventas del mismo código, se muestran como candidatas.

## Ideas para el dueño (sin hacer)
1. Kárdex del artículo dentro del taller.
2. «Posible venta» en el Historial del IMEI.
3. Ninguna ruta nueva de escritura para probar.
