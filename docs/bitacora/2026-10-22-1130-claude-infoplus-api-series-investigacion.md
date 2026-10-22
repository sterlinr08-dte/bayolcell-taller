# 2026-10-22 11:30 · Claude · Investigación a fondo: ¿la API de Info Plus da los IMEI por almacén?

**Pedido del dueño:** «ese filtro lo puedes preparar tú, indaga lo más profundo».

## Fuente
Página de ayuda pública de la API: `https://apicliente.infoplusplatinum.com/Help` (ASP.NET Web API Help, sin clave). Tiene 66 rutas, y para cada una se revisó el modelo de respuesta en `/Help/ResourceModel?modelName=…`.

## Modelos que tocan series o almacén
| Ruta | Modelo | ¿Serie? | ¿Almacén actual? |
|---|---|---|---|
| `ListaArticulos?tipo=` | ListaSerieModel: `descripcion, serie, localidad` | Sí | Solo el nombre de la localidad; no sigue las transferencias (probado) |
| `ListaArticulos?CodArticulo&Codalmacen` | BicicentroListaArticuloModel: `codigo, …, cantidad, precio, …, localidad` | No | Sí: existencia por almacén |
| `ListaArticulos?listacorta&CodArticulo&Codalmacen` | BicicentroListaArticuloCortaModel: `codigo, referencia, referenciafabrica, cantidad, precio` | No | Cantidad |
| `TransaccionInventario?fechas` | `Almacen, CodigoAlmacen, TipoTransaccionesInventario, CodProducto, Cantidad, Documento…` | **No** | Movimientos por almacén |
| `InventarioActual`, `Inventario` | Almacén, producto, cantidad | No | Sí (la clave no tiene permiso para `InventarioActual`) |
| `Compra?fechas` | CompraEasynetModel con `seriales[]` | Sí | No: solo la compra |
| `Factura`, `Prefactura` (GET) | Sin serie | No | Localidad de la venta |
| `Almacen` | LocalidadModel `codalmacen, descripcion` | — | Mapa código ↔ nombre |

## Conclusión
**Ninguna ruta pública da «serie + almacén donde está hoy».** `listaserie` es la única con series, y su localidad es la de entrada. Los movimientos (`TransaccionInventario`) no traen la serie. Separar los IMEI bien por almacén requiere el filtro que Dagoberto dijo que hay que agregar.

## Alternativa propuesta al dueño («lista prudente»), sin activar
Mostrar la lista de un almacén **solo si los números cuadran**: cuántas series de ese artículo pone `listaserie` en cada almacén tiene que ser igual a la existencia por almacén (`ListaArticulos?CodArticulo&Codalmacen`, en vivo). Si no cuadra, no se muestra nada y se escanea el IMEI.
- 1169: lista 2 en Santiago contra existencia 1 + 1 → **no se muestra**.
- 1906: lista 4 contra existencia 2 → **no se muestra**.
- Un artículo sin transferencias → cuadra y **se muestra**.
- **Riesgo residual:** un intercambio cruzado (una serie sale de A y otra entra de B al mismo almacén) cuadra en números con series equivocadas. Es raro, pero posible.
