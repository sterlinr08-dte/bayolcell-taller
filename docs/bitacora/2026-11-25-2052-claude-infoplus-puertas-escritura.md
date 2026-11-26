# Info Plus: ¿hay puertas escondidas para escribir? — 26-nov-2026

**Dueño:** «Con los JSON que tenemos, ¿puedes crear los que hacen falta?» → eligió «1»: probar si hay rutas escondidas.

**Método seguro:** se llamó a la API sin la clave real, con `basedatos=prueba_inexistente&clave=x` y sin cuerpo. Así no se puede crear nada.
- Si la ruta existe, Info Plus responde `{"status":400,"message":"Error en las credenciales"}`.
- Si no existe, responde 404 «No HTTP resource was found».
- Si existe pero solo para leer, responde 405 «does not support http method».

## Resultado

| Respuesta | Rutas |
|---|---|
| **Existen para escribir (POST)** | Ajuste, Despacho, Prefactura, Compra, Articulo. Son las 5 de la ayuda y ya se usan todas. |
| **Solo lectura (405 en POST)** | Cliente, CxC, Proveedor, Inventario, Almacen, Vendedor |
| **No existen (404)** | Factura, NotaCredito, NotaDebito, Devolucion, Transferencia, Traslado, Recibo, Cobro, Pago, Abono, Credito, Caja, Cotizacion, OrdenServicio, OrdenCompra, Conduce, Pedido, Recepcion, RecepcionCompra, Entrada, Salida, Venta(s), Facturacion, FacturaElectronica, Ecf, Serie, Serial, Empleado |

- PUT, DELETE y PATCH: 405 en Prefactura, Compra, Ajuste, Despacho y Articulo; 404 en Factura. **No se puede modificar ni borrar por la API.**

## Conclusión
Con la API de hoy no se puede facturar, hacer notas de crédito, transferencias, recibos ni editar documentos. Para eso Dagoberto tiene que abrir rutas nuevas. Lo más cercano a facturar sigue siendo la prefactura, que la caja convierte en factura en Info Plus.
