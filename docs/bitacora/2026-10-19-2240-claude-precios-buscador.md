# 19-oct-2026 — Buscador de artículos de la Prefactura: los 3 precios de cada artículo

**Rama:** `claude/bayol-precios-buscador`. **Sin publicar.**

## Pedido del dueño
«En el módulo de consulta de artículo para agregarlo a la prefactura faltan visualizar los diferentes precios y el mínimo.»

## Lo que se hizo (`taller-recepcion.js` y `.css`, `?v=20261019-d1`)
- **Los 3 precios en cada fila del buscador:** debajo del nombre aparecen «Final RD$ … · Mayor RD$ … · Extremo RD$ …», con letra monoespaciada.
- **Resaltado:** el precio del nivel del cliente sale en naranja. Si cambia «Precio del cliente» con el panel abierto, el resaltado cambia al momento.
  - El panel escucha el `change` de `rxNivel` en el documento, porque al armarse el campo todavía está fuera del documento.
- **Nombre del artículo:** sigue cortado a 2 líneas; los precios quedan aparte y siempre se ven.

## El mínimo no se puede mostrar
- **Prueba de solo lectura** (`infoplus-prefactura-ver` v4, ya desactivada en v5): `listaarticulos?...&detallado=true` devuelve `precios:[{codnivelprecio, precio}]`, solo el contado de cada nivel.
- Ni `listaarticulos` simple ni `articulo` traen crédito ni mínimo. Ya estaba anotado en CLAUDE.md (22-jul).
- Hay que pedírselo a Dagoberto: que `listaarticulos` detallado devuelva también `minimo` (y `credito`).

## Pruebas (`pfdesc.mjs`, 390 y 1280 px)
| Prueba | Resultado |
|---|---|
| Fila con Final 1,500 / Mayor 600 / Extremo 450, resaltado Final, completa sin salirse | PASS |
| Con Por mayor se resalta Mayor | PASS |
| Total `pfdesc` | 10 PASS |
| `pftest` | 47 PASS |
| `rxppk` con la capa vieja | 23 PASS |
