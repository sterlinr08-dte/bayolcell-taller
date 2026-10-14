# 2026-10-13 11:30 — Claude: los artículos van DENTRO del carrito al enviar

Corrige la entrada `2026-10-13-1100-claude-animaciones-pedido.md`.

## Pedido del dueño
> «La animación del carrito de compra: los artículos se ven del lado afuera»

## Diagnóstico
En la animación de enviar, las fotos del pedido (38 px) quedaban por encima del borde de la canasta del carrito. Se veían flotando encima, no dentro.

## Arreglo (`catalogo.html`, rama `claude/catalogo-web`, sin publicar)
- Las fotos van en una capa `.carga` recortada con la forma de la canasta (`clip-path`). Solo se ven dentro de la canasta y al caer desde arriba.
- Las fotos son más pequeñas (30 px) y se apoyan en el fondo de la canasta.
- El dibujo del carrito queda por delante, así que el borde y las rejillas pasan por encima de las fotos, como un carrito de verdad.
- Caen desde un poco menos alto (−80 px) para que entren justo por la boca.

## Pruebas
- Datos simulados: 34/34.
- Datos reales: 34/34.
- Fotos de cerca del carrito en iPhone 390 px: los 3 artículos se ven dentro de la canasta.
