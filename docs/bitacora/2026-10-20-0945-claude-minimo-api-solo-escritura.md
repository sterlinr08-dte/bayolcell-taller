# 2026-10-20 09:45 — Claude — Mínimo por nivel: Info Plus lo recibe pero no lo devuelve

Sigue a `2026-10-20-0930-claude-precio-minimo-infoplus.md`.

## Dueño
«Nivel 1 tiene precio de contado, precio a crédito y precio mínimo. Consulta la API.»

## Más pruebas de solo lectura (función `infoplus-prueba-minimo-20261020` v4; retirada v5 → 410; nunca devuelve la clave)
| Ruta GET | Campos |
|---|---|
| `ListaArticulos?CodArticulo=2220&Codalmacen=1` | codigo, referencia, referenciafabrica, descripcion, cantidad, **precio** (1500), **precioespecial** (4000), fechainiciooferta, fechafinoferta, fechacreacion, costo, categoria, subcategoria, marca, localidad |
| `ListaArticulos?listacorta=true/false&…` | codigo, referencia, referenciafabrica, cantidad, precio |
| `ListaArticulos?detallado=true&todos=true` | codarticulo, referencia, descripcion, precios[{codnivelprecio, precio}] |
| `ListaArticulos?CodArticulo&CodNivelprecio` | «Error. Precio no encontrado» (cualquier artículo/nivel) |
| `InventarioActual` | «Error en las credenciales» |
| `Inventario` | costos/cantidades por almacén, sin precios |

**Ayuda pública de `POST api/Articulo`** (`ArticuloActualizaModel`): `{ codarticulo, precios: [{ codnivelprecio, contado, credito, minimo }] }`.
Es la ruta que se usó el 13-oct para cambiar precios (contado = crédito = mínimo).

## Conclusión
Info Plus **acepta** contado, crédito y mínimo por nivel (POST), pero **ninguna ruta GET los devuelve**: el detallado trae un solo
`precio` por nivel (el de contado) y la ruta por nivel está dañada. No se escribió nada en Info Plus.

## Siguiente paso
Pedir a Dagoberto (mensaje preparado en el chat) que `ListaArticulos detallado` devuelva `contado, credito, minimo` por nivel
(como el POST), o que arregle `ListaArticulos?CodArticulo&CodNivelprecio`. Con eso: «Mín. RD$ …» por nivel del cliente + autorización de administrador.
