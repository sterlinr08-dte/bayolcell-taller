# 2026-10-20 11:30 — Claude — Publicada la Prefactura limpia (rama `claude/prefactura-limpia` → `main`)

## Dueño
«Publícalo para mejorar luego» (autorización para esta entrega).

## Qué sale en vivo
Lo de las bitácoras 2026-10-20-0030 a 0945 (commits 4d88c87 … 7114ad7):
- pantalla Prefactura limpia como STUDIO; equipo, falla y más datos en un plegable opcional; comentario al pie;
- equipo opcional: con equipo crea también la orden; sin equipo, solo la prefactura;
- descuento % por línea, precio con formato, tarjeta del cliente completa, buscador con «Servicio / falla», atajos F2/F9/F10;
- artículo repetido usa la misma línea (celular → foco en su IMEI).
Capa reversible: `localStorage.bc_pf_off='1'` o `BC_PF=false` devuelve la Recepción anterior.

## Pruebas antes de publicar (banco local, 390 y 1280)
`pfopc.mjs` 52 PASS · 0 FAIL; `pftest.mjs` 47 PASS · 0 FAIL.

## NO incluido todavía (solo en el prototipo HTML, bitácora 1100)
Artículos en una sola fila con columna IMEI, panel de búsqueda exactamente como STUDIO (niveles 1-2-3 y existencia por
almacén), mínimo y clave de administrador (Info Plus aún no entrega crédito ni mínimo).

## Riesgo
El descuento por línea no se ha probado contra Info Plus real (no se creó prefactura de prueba). Revisar la primera
prefactura con descuento que se haga en vivo.
