# Navidad en bayolcell.com — Santa con renos y efectos (07-nov-2026, 22:15 RD)

## Pedido del dueño
«Vamos a darle un toque navideño a nuestra página web y una semana antes de finalizar el mes vamos a poner el Black Friday.»
Después de ver varias muestras pidió: Santa con los renos, más grande y cruzando la portada, y «más efectos navideños». Eligió **A: todo**.

## Qué se hizo
Capa nueva, aislada y reversible. No toca precios, pedidos, botones ni datos.

| Archivo | Qué hace |
|---|---|
| `index.html` | Script corto en el `<head>`: pone `html.bc-navidad` según la fecha, más `web-navidad.css` y `web-navidad.js` (defer) |
| `web-navidad.css` | Franja «FELIZ NAVIDAD · BAYOL CELL» dentro del encabezado (`header::before`, sin salto al cargar), luces, nieve, luna, regalos y animaciones |
| `web-navidad.js` | Santa con su trineo y 3 renos (el de adelante con la nariz roja) cruzando la portada, estrellas que titilan, luna detrás de los celulares, regalos al pie, nieve que cae (canvas ligero), nieve sobre el borde del menú, luces de colores, gorro de Santa en el logo y destellos al tocar |

- **Fechas:** se enciende sola del 8 al 22 de noviembre y del 1 de diciembre al 6 de enero. Del 23 al 30 de noviembre queda libre para el Black Friday (pendiente: el dueño debe dar las ofertas).
- **Apagar:** `BC_NAVIDAD=false` en `index.html`, `?navidad=0` en la dirección o `localStorage bc_navidad='0'`. **Probar fuera de fecha:** `?navidad=1`.
- Con «reducir movimiento» activado: sin nieve ni destellos; Santa queda quieto en el centro.
- La franja suma 30 px al encabezado; se ajustaron `scroll-padding-top` (102 px) y el menú del celular (`top:94px`).

## Pruebas (Playwright, servidor local)
- 390 y 1280 px: sin errores de JavaScript, sin desplazamiento lateral, encabezado 96 px con Navidad y 65 px sin ella.
- `?navidad=0`: la página queda exactamente como antes. Sin parámetro (hoy 8-nov): encendida.
- Menú del celular abre debajo de las luces.

## Estado
- Rama `claude/navidad-web`, PR abierto. **No publicado**: falta el «publícalo» del dueño.

## Pendiente
- Black Friday (23–30 nov): el dueño debe decir qué equipos y qué descuentos.
