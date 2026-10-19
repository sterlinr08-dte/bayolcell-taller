# 19-oct-2026 — Buscador de artículos con el formato de STUDIO (detalle al tocar el artículo)

**Rama:** `claude/bayol-precios-buscador`. **Sin publicar.** Sigue a `2026-10-19-2250-claude-precios-buscador-horizontal.md`.

## Pedido del dueño
«Dale más prioridad a la vista web de PC, que la móvil se utilizaría poco. Qué formato tenemos en STUDIO, podemos usar lo mismo.»

## Cambio (`taller-recepcion.js` y `.css`, `?v=20261019-d3`)
- **La lista vuelve a ser compacta,** igual que en STUDIO: Código · Artículo · Existencia · Precio · ＋, una línea por artículo. Se quita la franja fija de precios.
- **Tocar el artículo abre el detalle debajo de la fila** (`.bcrx-ppk-det`). Lo arma la función `detalleHTML()`; es la copia de `ppkDetailHTML` de STUDIO:
  - **Precios:** recuadros lado a lado (Cliente final · Por mayor · Extremo), con el nivel del cliente resaltado.
  - **Existencia** del almacén elegido, por ejemplo «Oficina Santiago · 3 und».
  - **Botón «Elegir — RD$ …»** con el precio del nivel del cliente, de 44 px.
  - Al volver a tocar el artículo, el detalle se cierra.
- **Agregar:** «＋» y «Elegir» agregan el artículo, Enter agrega el resaltado y el panel se cierra después.
- **Cambio de precio con el detalle abierto:** el resaltado y el precio de «Elegir» se actualizan.
- **El mínimo** sigue sin mostrarse, porque Info Plus no lo entrega (ver `2026-10-19-2240`).

## Pruebas
| Prueba | Resultado |
|---|---|
| `pfdesc.mjs` (390 y 1280 px) | 14 PASS |
| `pftest` | 47 PASS |
| `rxppk` con la capa vieja | 23 PASS |

Casos nuevos de `pfdesc.mjs`:
- la lista sale compacta;
- al tocar se abre el detalle con 1,500 / 600 / 450 y Cliente final resaltado;
- la existencia sale como «3 und»;
- con «Por mayor» se resalta Por mayor y «Elegir» usa 600;
- «Elegir» agrega el artículo a 600.
