# 2026-10-20 09:00 — Claude — Prefactura: celulares con IMEI (revisión) y dos arreglos

Sigue a `2026-10-20-0215-claude-prefactura-apple-design.md`. Rama `claude/prefactura-limpia`, **sin publicar**.

## Pregunta del dueño
«¿Y para facturar celulares con IMEI?»

## Cómo funciona (sin cambios de fondo)
- Un artículo de la categoría «celular» entra con cantidad 0 y un campo «Escanee o escriba el IMEI y presione Enter» debajo de la línea.
- Cada IMEI queda como chip; la cantidad = número de IMEI (no se edita a mano). No acepta un IMEI repetido ni más IMEI que la existencia.
- Sin IMEI la línea queda en rojo («Sin IMEI: no se puede facturar este equipo») y **Guardar se bloquea** («… necesita al menos un IMEI»).
- A Info Plus van en `seriales: [{numero, codarticulo}]`.

## Arreglos
1. **Mismo artículo dos veces** (`_rpAgregarArticulo`, `taller-app.js?v=20261020-e3`): antes creaba otra línea (en celulares, otra línea con cantidad 0).
   Ahora usa la misma línea: celular → aviso «Ya está en la línea N: escanee el IMEI del otro equipo ahí» y foco en su IMEI;
   otro artículo → cantidad + 1. Los servicios siguen pudiendo repetirse.
2. **Fila «Descuento» en 0** (`taller-prefactura.css?v=20261020-e5`): `[hidden]` perdía contra `display:flex` de `.tr`; ahora se oculta.

## Pruebas
- Banco: iPhone 13 Pro Max agregado 2 veces → 1 línea; 2 IMEI → cantidad 2, total RD$ 104,000; guardar con IMEI completos envía; con IMEI faltante bloquea.
- `pftest` 47/47, `pfopc` 52/52, `pfdesc` 14/14; capa apagada `rxppk` 23/23.
