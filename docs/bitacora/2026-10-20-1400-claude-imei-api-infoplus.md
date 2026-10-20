# 2026-10-20 14:00 — Claude — ¿Dónde da Info Plus los IMEI? (prueba de solo lectura)

## Dueño
«La API de los IMEI está disponible cuando llamas a un equipo móvil o celular.»

## Pruebas (función `infoplus-prueba-series-20261020` v1–v3, solo GET, nunca devuelve la clave; retirada v4 → 410)
| Ruta | Resultado |
|---|---|
| `ListaArticulos?tipo={tipo}` (la ayuda dice que devuelve `ListaSerieModel`, la lista de series) | Existe, pero con todo lo probado (código 2639, 1, 0, 2, celular, serie, serial, imei, S, true, con y sin CodArticulo/Codalmacen) responde «Error al buscar lista de series». Falta saber qué va en `tipo`. |
| `ListaArticulos?CodArticulo=2639&Codalmacen=6` (iPhone 13) | Trae precio, cantidad (1), costo… **sin IMEI**. Igual con `listacorta`. |
| `Compra?fechainicial&fechafinal` | **Sí trae `seriales`** por línea (los IMEI que ENTRARON). |
| `Factura?fechainicial&fechafinal` | Sin IMEI en las líneas (no se puede restar lo vendido). |
| `TransaccionInventario`, `RecepcionCompra` | «Error en las credenciales». |

`infoplus_seriales` (Supabase) es una copia vieja de compras (1,637 IMEI, última carga 30-jun-2026), no de lo disponible.

## Conclusión
La lista de IMEI **disponibles por almacén** sale de `ListaArticulos?tipo=…`, pero hay que saber el valor de `tipo`.
Preguntar a Dagoberto. Con eso, la ventanita de IMEI de la Prefactura puede mostrar la lista para marcar (como STUDIO).
No se escribió nada en Info Plus.
