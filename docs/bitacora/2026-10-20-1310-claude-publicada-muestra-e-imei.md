# 2026-10-20 13:10 — Claude — Publicado: muestra de la Prefactura + IMEI con botón

## Dueño
«PUBLÍCALO» (autorización para esta entrega).

## Qué sale en vivo (`claude/prefactura-limpia` → `main`)
Lo de las bitácoras 1230 (franja de 4, artículos en una fila con IMEI, precios por nivel al tocar el nombre, buscador igual
que STUDIO) y 1300 (IMEI con botón e ícono y ventanita). Versiones: `taller-prefactura.js/.css` 20261020-g1,
`taller-recepcion.js/.css` 20261020-f1.

## Pruebas antes de publicar
`pftest.mjs` 49/0 y `pfopc.mjs` 52/0 (390 y 1280).

## Volver atrás
`localStorage.bc_pf_off='1'` (o `BC_PF=false`) apaga la capa de la Prefactura en un equipo; o revertir el merge.
