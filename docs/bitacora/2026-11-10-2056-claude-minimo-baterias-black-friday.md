# Claude · Black Friday: 20 % en cambio de batería de iPhone → precio mínimo de nivel 1 en Info Plus

## Pedido del dueño (10/11-nov-2026)
Volante «Cambio de batería iPhone · Modo Black Friday». Decidió: **20 % de descuento hasta el 30 de noviembre**; 6S Plus / 7 Plus / 8 Plus con base **RD$ 1,000** (el volante decía 700); y «ponlo en el precio mínimo del primer nivel».

## Qué se hizo
- En **66 artículos** «BATERIA IPHONE …» (6S al 16 Pro Max, todas las calidades: original, reprogramable, sin flex, sin mensaje, eco) se puso **mínimo de nivel 1 = 80 % de su precio de nivel 1**. El precio no cambió.
- No se tocaron: iPhone 5G, 6G y 6 Plus (no están en la promoción) ni los niveles 2 y 3.
- Vía `POST /api/articulo` de Info Plus con la función de un solo uso `infoplus-precios-glass-unavez` (v3; lista fija, token de un solo uso, clave del servidor). Se mandaron **contado, crédito y mínimo juntos** (contado = crédito = precio actual), porque Info Plus reescribe los tres juntos por nivel. Primero un artículo de prueba (1003), luego los demás. **Desactivada** al terminar (v4: 410, `verify_jwt=true`).
- Copia local: `infoplus_articulos.niveles_min["1"]` en los 66 (comprobado: 66 de 66 = 80 %; de RD$ 720 a RD$ 4,400). Con eso la prefactura deja bajar el precio hasta ese mínimo.

## Ojo (límites y riesgos)
- Info Plus no deja **leer** el mínimo ni el crédito: no se sabe qué mínimo tenían antes, ni si algún crédito era distinto del contado (quedó igual al contado, como hace siempre el editor del sistema).
- **El mínimo no se quita solo el 30 de noviembre.** El 1 de diciembre hay que volver a subirlo (por defecto, igual al precio).
- **Glass (10-nov):** aquel cambio mandó solo contado y crédito, sin mínimo. El editor del sistema advierte que, si se manda uno sin el otro, el que falta puede quedar en 0. Hay que confirmar con el dueño y dejar un mínimo explícito en esos 15 artículos (2785, 2924, 2784, 2782, 2923, 2781, 2779, 2746, 2743, 2813, 2742, 2786, 2787, 2925, 2788).

## Material de la promoción (entregado por chat, no está en el repo)
Reel de 15 s (Buzzy, MiniMax-H3; el logo de Apple se difuminó) con «BLACK FRIDAY · 20% de descuento», «Desde RD$ 800 (antes 1,000)», «Hasta el 30 de noviembre»; texto del post y comentario para fijar.

## Para deshacer
Volver a mandar por cada artículo contado = crédito = mínimo = precio de nivel 1.
