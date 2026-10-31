# 2026-10-31 05:00 — Claude — Mapa completo de la API de Info Plus: qué más hace y aún no usamos

Sigue a `2026-10-31-0430-claude-api-infoplus-anular-prefactura.md`. Dueño: «¿Puedes indagar algo adicional que hace la API y aún no lo sé?»

## Fuente
Ayuda pública `https://apicliente.infoplusplatinum.com/Help` (66 rutas) y el modelo de respuesta de cada una
(`/Help/ResourceModel?modelName=…`), leídos en vivo. **Sin clave; no se llamó a la API real.**
Muchas rutas pueden responder «Error en las credenciales» con nuestra clave (ya pasa con `InventarioActual`,
`TransaccionInventario`, `RecepcionCompra`, `Vendedor`). Saberlo exige una prueba de solo lectura con una función temporal.

## Escritura (POST): solo 5
`Prefactura`, `Despacho`, `Compra`, `Ajuste`, `Articulo` (precios). Ninguna factura, anulación, cliente ni cobro.
Detalles no aprovechados:
- `DetallePreFacturaModel` ya trae **`porcentaje`** (descuento por línea) y `despachado`. `PreFacturaModel` trae **`comentario`**, `contrato`, `ordencompra`, `centro`, `credito`. La MEMORIA daba comentario/porcentaje como pendientes de Dagoberto: existen en el modelo; falta probar si Info Plus los guarda.
- `DespachoModel`: `codlocalidado` / `codlocalidadd` (origen/destino → traslado entre tiendas), `codtaller`, `codfactura`, `codpedido`, `tipodespacho`, `cancelado`.
- `CompraModel`: `ncf`, `generarncf`, `credito`, `vencimiento`, `abono`, seriales.

## Lectura (GET) que todavía no usamos y puede servir a Bayol
| Ruta | Qué devuelve | Para qué serviría |
|---|---|---|
| `OrdenAltice` (por fechas o `noorden`) | nombre, cédula, teléfono, **imei, simcard, plan, modelo, marca, valorcobrar, estatus, factura, vendedor, localidad** | Activaciones Altice: ver el estado y cruzarlo con la prefactura/el CRM |
| `CxC` (por fechas o todo) | cliente, vendedor, cobrador, monto, **balance**, vencimiento, días de atraso | Clientes que deben en Info Plus (crédito / financiamientos) |
| `Ingreso` (cobros, por fechas) | cliente, cobrador, vendedor, **ModoPago**, monto, fechas | Saber qué pagó cada cliente y cómo |
| `DocumentosCliente` (por fechas) | fecha, tipo de documento, monto | Historial de un cliente |
| `Cotizacion` (por fechas) | cliente, producto, almacén, vendedor, fechas de envío/entrega | Cotizaciones hechas en Info Plus |
| `NotaCredito` (por fechas) | factura, montos, descuentos, márgenes, fechas de devolución | Devoluciones |
| `Cliente?codigocrm=` y `?fechacreacion=` | mismos 7 campos del cliente | Buscar un cliente o traer solo los nuevos (sin bajar los 1,133) |
| `MetodoPago`, `TipoDocumento`, `Zona`, `Moneda`, `Almacen` | catálogos (código, nombre) | Listas fijas |
| `Prefactura?…&entregada=` | es un **reporte de pedidos** (cantidad orden/facturada, back order, costo, precio), no la prefactura con sus líneas | Quizá marcar «Facturada/Entregada»; antes falló con 400 en todas las fechas |
| `Factura` (`DowntownModel`) | totales por transacción (bruto, impuestos, neto) | Ya se usa (`infoplus-ventas-sync`) |
| Proveedores: `Proveedor`, `CxP`, `PagoProveedor`, `OrdenCompra`, `SaldoProveedor`, `NotaProveedor`, `CotizacionProveedor`, `DocumentosProveedor`, `EvaluacionProveedor` | compras y deudas con suplidores | Módulo de proveedores, si se quisiera |
| Contabilidad/banco: `SaldosyBalances`, `TransaccionContable`, `CatalogoCuentas`, `Presupuesto`, `BalanceBanco`, `TransaccionBanco`, `CuentaBanco`, `Saldo`, `Nomina`, `ActivoFijo`, `Depreciacion` | contabilidad, bancos, nómina, activos | Reportes financieros; probablemente cerrados a nuestra clave |
| `Vendedor`, `Cobrador` | `codempleado, nombre` | Lista de vendedores (hoy «Error en las credenciales») |

## No existe en la API
Crear factura, anular/editar prefactura, crear o editar cliente, registrar cobros, leer una prefactura por número, IMEI por almacén actual.

## Siguiente paso propuesto
Con el OK del dueño: función temporal de **solo lectura** (como `infoplus-prueba-minimo-20261020`) que pruebe `OrdenAltice`, `CxC`,
`Ingreso`, `Cotizacion`, `DocumentosCliente`, `MetodoPago`, `Cliente?codigocrm` y `Prefactura?entregada` con nuestra clave,
devuelva solo nombres de campos y cuántas filas, y se retire después (410). Así se sabe cuáles están abiertas de verdad.
