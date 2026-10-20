# 2026-10-20 09:30 — Claude — Precio mínimo por nivel: no lo entrega la API de Info Plus

## Pedido del dueño
«Y visualizar el precio mínimo» en la prefactura. Decisión: **el mínimo según el nivel del cliente**; si la empleada pone un
precio por debajo → avisar y pedir autorización de un administrador (opción recomendada que eligió).

## Investigación (solo lectura; nada escrito en Info Plus)
- `infoplus_articulos` (2,124 artículos): `precio`, `costo` (2,046), `precio_especial` (108), `niveles` {1,2,3} (nivel 3 en 1,275).
  `precio_especial` (`precioespecial` de la API) **no** es un mínimo: a veces es mayor que el precio (p. ej. 1850: 1,600 / especial 3,500;
  2608 iPhone 13 PM: 23,000 / especial 2,500).
- Página pública de ayuda `https://apicliente.infoplusplatinum.com/help`: 66 rutas. Probadas con función de un solo uso
  `infoplus-prueba-minimo-20261020` (verify_jwt, nunca devuelve la clave; **retirada**, v3 → 410):
  - `GET api/Articulo` → solo `codarticulo, descripcion, referencia`.
  - `GET api/ListaArticulos?detallado=true&todos=false` → `precios[{codnivelprecio, precio}]` (un precio por nivel, sin mínimo).
  - `GET api/ListaArticulos?CodArticulo&CodNivelprecio` → «Error. Precio no encontrado» con cualquier artículo/nivel (1, 01, 0, 4; 1078, 2220, 2608).
  - `GET api/ListaArticulos?tipo=1` → «Error al buscar lista de series».
- Conclusión: **el mínimo por nivel no sale por la API**. No se implementó nada en pantalla todavía.

## Opciones para el dueño
1. Que Dagoberto agregue el mínimo (por nivel) a `ListaArticulos detallado` o arregle la ruta por nivel.
2. Exportar desde Info Plus un reporte de lista de precios con mínimos (Excel) → importarlo al taller (`niveles_min` por artículo) y actualizarlo cuando cambien.

## Siguiente paso
Con el dato disponible: mostrar «Mín. RD$ …» bajo el precio de cada línea según el nivel del cliente; si el precio queda por debajo,
línea en rojo y Guardar pide autorización de un administrador.
