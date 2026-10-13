# 2026-10-13 12:30 — Claude: botón en la portada hacia el precio de pantallas

## Pedido del dueño
A la pregunta «¿Quieres también un botón «Cambio de pantalla» en la página principal?» el dueño respondió «Si».

## Cambios (rama `claude/catalogo-web`, sin publicar)
- `index.html`, sección **Taller** («Lo reparamos. Con garantía.»): debajo de las ofertas del mes hay un botón rojo, «Busca el precio de tu pantalla», que lleva a `tienda.html#pantallas`.
  - Clase `.taller-pantalla`: centrado y con texto que puede partirse en dos líneas, para que no se salga en el celular.
  - No se cambió nada más de la portada.
- `tienda.html`: al entrar con `#pantallas`, la página abre la pestaña «Cambio de pantalla» y deja el buscador en el centro de la pantalla (antes subía solo hasta el título del catálogo).

## Pruebas
- iPhone 390 px y escritorio 1280 px. El botón se ve completo, lleva a `tienda.html#pantallas`, abre la pestaña de pantallas con el buscador a la vista y no hay errores de JavaScript.
- `tests/catalogo-web`: 34/34.

## Pendiente
- Publicar con «publícalo»: `index.html` (botón), `tienda.html` y el despliegue de la función `pantallas-publico`. Si la función no está desplegada, el botón llevaría a un buscador que solo invita a escribir por WhatsApp.
