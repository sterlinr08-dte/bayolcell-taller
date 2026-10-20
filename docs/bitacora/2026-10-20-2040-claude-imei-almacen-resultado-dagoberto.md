# 2026-10-20 20:40 · Claude · IMEI por almacén: resultado de la prueba real y pregunta a Dagoberto

## Resultado (tabla `infoplus_diagnostico`)
El dueño probó dos veces, a las 14:35 y a las 16:56 UTC, con el artículo 2517 en el almacén 1. No se guardó ninguna `FUENTE_OK`.

| Ruta | Respuesta |
|---|---|
| `ListaArticulos?tipo=…`, solo o con `CodArticulo` y `Codalmacen` (2517, 1, SERIE, IMEI, A) | `400 «Error al buscar lista de series»` |
| `InventarioActual` | `400 «Error en las credenciales»`: la clave no tiene permiso para esa ruta |

**Conclusión:** con la clave actual, ninguna ruta da los IMEI por almacén. La ventana IMEI sigue funcionando de forma segura: la lista sale vacía y el IMEI se escanea o se escribe.

## Pregunta preparada para Dagoberto (el dueño la envía)
- ¿Qué valor va en `tipo` de `ListaArticulos?basedatos&clave&tipo`? Esa ruta devuelve `ListaSerieModel`.
- ¿Se le puede indicar el artículo y el almacén?
- ¿Puede darle a la clave permiso para `InventarioActual` y `TransaccionInventario`?
- ¿Alguna ruta da los seriales disponibles por almacén?

## Al tener la respuesta
- Se agrega la ruta correcta a `infoplus-imei-almacen`, o se guarda como `FUENTE_OK`.
- La lista se llena sola, sin cambios en la pantalla.
