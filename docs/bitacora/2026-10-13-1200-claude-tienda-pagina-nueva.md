# 2026-10-13 12:00 — Claude: el catálogo nuevo va como página propia (`tienda.html`)

Corrige lo dicho en `2026-10-13-0500-claude-catalogo-web.md`: ahí el nuevo reemplazaba a `catalogo.html`.

## Decisión del dueño
> «Reemplazarlo no porque ese es de celulares»

- `catalogo.html` **queda exactamente como está en `main`**: es el catálogo de celulares.
  - El enlace del admin del taller (`CAT_URL_PUBLICA`) y los de la portada no cambian.
- El catálogo nuevo (estilo STUDIO, con celulares y cambio de pantalla por búsqueda) pasa a **`tienda.html`**.
  - Enlace directo a la pestaña de pantallas: `tienda.html#pantallas`.

## Cambios (rama `claude/catalogo-web`, sin publicar)
- `git mv catalogo.html tienda.html`, y `catalogo.html` restaurado desde `origin/main` sin ninguna diferencia.
- Comentario de cabecera de `tienda.html` actualizado.
  - Las dos páginas comparten el pedido guardado (`bayol_cat_cart`). Lo que el cliente agrega en una aparece en la otra.
- `tests/catalogo-web/catalogo.test.cjs` ahora abre `tienda.html`.

## Pendiente
- Publicar con «publícalo»: la página `tienda.html` y el despliegue de la función `pantallas-publico`.
- Decidir con el dueño si se pone un botón hacia `tienda.html` en la portada o en el catálogo actual.
