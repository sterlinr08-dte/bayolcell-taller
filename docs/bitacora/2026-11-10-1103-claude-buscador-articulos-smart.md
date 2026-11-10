# Claude · Ventana «Artículos Info Plus» smart (sin publicar)

## Pedido del dueño
Después del arreglo de los filtros aplastados (PR #286, ya en vivo: `taller-app.min.js?v=20261110-ab2`) escribió: «PON LO SMART» (10-nov-2026).

## Qué hace solo
| Acción smart | Detalle |
|---|---|
| Cuenta por filtro | Cada filtro muestra cuántos artículos tiene con lo buscado: «Pantallas 2», «Baterías 1». |
| Esconde lo vacío | El filtro sin artículos no se muestra (queda «Todos» y el que esté activo). |
| Fallas que se tocan | «CAMBIAR MARCO» deja solo los marcos (y housing/chasis) del modelo buscado. Otro toque lo quita; tocar otra falla la reemplaza. |
| Cuenta por falla | Cada falla dice cuántas piezas hay para ese modelo; en 0 sale apagada. |
| Evita el callejón | Si una falla no tiene piezas: «No hay resultados… en «CAMBIAR BOCINA»» + botón «Ver todos». |
| Se recuenta solo | Al cambiar el texto, los contadores de filtros y fallas se actualizan. |

Palabras por falla: marco (marco, housing, chasis), tapa (tapa, housing, back cover), pantalla (pantalla, display, LCD, touch), batería (bateria, pila), cámara, pin/carga, bocina (bocina, altavoz, auricular, speaker), cristal (cristal, glass, vidrio, lente), micrófono, botón, flex. Otra falla usa su última palabra útil.

## Otros ajustes
- «MARCO», «HOUSING» y «CHASIS» ya no se cuentan como «Celulares» (`_abCat`).
- En pantallas táctiles, fallas y filtros miden 44 px; las fallas van en una sola fila que se desliza.
- No toca precios, existencias, «Elegir», Info Plus ni la base. Las fallas siguen saliendo de `equipo_fallas` como antes.

## Apagar
En un equipo: `localStorage.bc_ab_smart_off='1'`.

## Archivos
`taller-app.js`, `taller-app.min.js` (regenerado), `taller.html` (`?v=20261110-ab3`), prueba nueva `scripts/pruebas/buscador-smart.cjs`.

## Pruebas (banco local, datos inventados)
- `buscador-smart.cjs` a 390 y 1280 px y con la capa apagada: **Todo bien**.
- `buscador-filtros.cjs`: **Todo bien**.
- No probado: catálogo real (2,061 artículos) ni iPhone real.

## Estado
Rama `claude/buscador-smart`, sin publicar. Falta el OK del dueño.
