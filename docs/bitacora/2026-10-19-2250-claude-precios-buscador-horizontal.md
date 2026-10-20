# 19-oct-2026 — Buscador: los 3 precios en una franja horizontal ordenada

**Rama:** `claude/bayol-precios-buscador`. **Sin publicar.** Sigue a `2026-10-19-2240-claude-precios-buscador.md`.

## Pedido del dueño
«Quiero que sea en lista horizontal organizada.»

## Cambio (`taller-recepcion.js` y `.css`, `?v=20261019-d2`)
- **Dónde va:** los precios salen del bloque del nombre y forman una franja propia (`.pk-nvs`) dentro de la fila del buscador.
- **Cómo es:** **3 columnas iguales**, Final · Mayor · Extremo. Arriba va el nombre del nivel (12 px, en mayúsculas) y debajo la cifra (monoespaciada, 14 px).
- **Nivel del cliente:** su columna va resaltada en naranja.
- **En la PC:** la franja ocupa todo el ancho que va del nombre a la existencia y el precio, debajo del artículo.
- **En el celular:** la franja ocupa toda la fila, debajo del nombre y el código. Las cifras van sin «RD$» para que quepan completas («1,500.00»).

## Pruebas
| Prueba | Resultado |
|---|---|
| `pfdesc.mjs` (390 y 1280 px) | 10 PASS |
| Revisión de las capturas | Nada se corta ni se sale de la fila |
