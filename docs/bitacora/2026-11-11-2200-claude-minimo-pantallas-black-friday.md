# Claude · Black Friday: 20 % en cambio de pantalla de iPhone → precio mínimo de nivel 1 en Info Plus

Sigue a `2026-11-10-2056-claude-minimo-baterias-black-friday.md` (mismo método).

## Pedido del dueño (11-nov-2026)
Volante «Cambio de pantalla iPhone · Modo Black Friday». Pidió el «antes y después con el 20 %» y «Sí, baja el precio mínimo del nivel 1».

## Revisión previa
Los 20 precios del volante coinciden con el nivel 1 de Info Plus (calidad Incell). Se le entregó por chat la tabla Antes / Ahora (80 %).

## Qué se hizo
- **46 artículos** «PANTALLA IPHONE …»: LCD de 7 / 8 / 7 Plus / 8 Plus y todas las Incell (JK, ZY) de X a 15 Pro Max, incluidas 12 Mini, 13 Mini y 15 normal → **mínimo de nivel 1 = 80 % del precio**. El precio no cambió.
- No se tocaron: OLED, original, «Clase A» (sin precio de nivel 1), XR ZY (sin precio de nivel 1), toda la serie 16 / 16e / 17, 5G / 6 / 6S, biseles, micas y touch. Niveles 2 y 3 sin tocar.
- Por `POST /api/articulo`, con contado = crédito = precio y el mínimo, juntos. Función de un solo uso `infoplus-precios-glass-unavez` (v7), primero un artículo de prueba (1078) y luego el resto; **desactivada** al terminar (v8: 410, `verify_jwt=true`); token borrado.
- Comprobado: 46 de 46 con `niveles_min["1"]` = 80 % en la copia local. Ningún mínimo queda por debajo del costo.

## Pendiente
- **1 de diciembre:** devolver el mínimo = precio, en estos 46 y en las 66 baterías.
- Ver en Info Plus los precios raros de la serie 16 (16 Plus JK 3,200; 16 Pro Max JK 4,000) y la XR ZY sin precio.

## Para deshacer
Mandar por cada artículo contado = crédito = mínimo = precio de nivel 1.
