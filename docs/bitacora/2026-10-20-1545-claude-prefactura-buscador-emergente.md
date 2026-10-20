# 2026-10-20 15:45 — Claude — Prefactura: el buscador de artículos como ventana emergente (rama, sin publicar)

Sigue a `2026-10-20-1530-claude-crm-precios-ventana-emergente.md`.

## Dueño
«¿Quiere que el buscador de la Prefactura también se abra como ventana emergente?» → «Sí».

## Cambio (`taller-prefactura.css/.js` v 20261020-j4/j1)
- El panel «Buscar artículo» (`.bcrx-ppk` de `taller-recepcion.js`, sin cambiar su lógica) se muestra como ventana emergente:
  fija y centrada (860×640 máx.), barra de título oscura con «Catálogo completo» y ✕ (roja al pasar), fondo apenas oscurecido;
  tocar el fondo la cierra; en la PC se mueve arrastrando la barra. En el celular ocupa la pantalla debajo de la barra de la app (54 px).
- Mientras está abierta, `#v-recepcion` sube su z-index (la vista tiene z-index 1).
- Igual que la ventana «Precios» del CRM. «+», «Elegir», flechas, Enter y F2 funcionan igual.

## Pruebas
`pfvent.mjs` 8/0 (centrada en PC, pantalla completa en celular, arrastrar, tocar fondo cierra, «+» agrega y cierra);
`pftest.mjs` 49/0, `pfopc.mjs` 52/0, `almfijo.mjs` 24/0, `crmprecio.mjs` 21/0.
