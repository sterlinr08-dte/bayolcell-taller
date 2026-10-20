# 2026-10-20 14:45 — Claude — Prefactura: el aviso amarillo del vendedor pasa a una ⓘ (rama, sin publicar)

## Dueño
(Captura del aviso «Su usuario no está enlazado con Info Plus…») «Organízalo bien y quítale esas letras y ponerlo con la i de
información. Yo quiero el orden, la estética, la elegancia.»

## Cambios
- `taller-info.js` (v 20261020-v1): nueva regla de BC_INFO_REGLAS: `#rxVendAviso` (cuando está visible) queda oculto y su
  explicación va en una ⓘ junto a la etiqueta «Vendedor» (texto corto, en dos párrafos). Mismo sistema de ⓘ de NEXUS (59.42).
- `taller-prefactura.js` (v 20261020-i1): etiquetas «Almacén (Info Plus)» y «Vendedor (Info Plus)» → «Almacén» y «Vendedor».
- No cambia cuándo sale el aviso (_rpInit) ni el vendedor fijo.

## Pruebas
`almfijo.mjs` 24/0 (aviso oculto, ⓘ junto a «Vendedor», al tocarla sale la explicación; 390 y 1280), `pftest.mjs` 49/0, `pfopc.mjs` 52/0.
