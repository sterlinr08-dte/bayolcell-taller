# Buscador de la Prefactura: fichas de acceso rápido (opción A) · Catálogo completo con «Elegir»

**Dueño:** eligió la **opción A** (una fila de fichas por tipo). Y sobre el «Catálogo completo»: «veo la opción de editar precios,
esa opción solo es por rol; y cuando los empleados la usen, que salga la opción de elegir como en la primera».

## 1) Fichas de acceso rápido (taller-recepcion.js g8, taller-recepcion.css g5)
- Debajo del campo de búsqueda: **Pantallas · Baterías · Cargadores · Auriculares · Protectores · Celulares**.
- Tocar una filtra (se pone naranja); tocarla otra vez la quita. Se **suma a lo escrito**: «Baterías» + «iphone» → solo baterías
  de iPhone. Pasa por el mismo buscador tolerante (sinónimos y abreviaturas).
- Al cerrar la ventana se limpia también la ficha. 44 px de alto; en celular la fila se desliza de lado.
- No se puso «Servicio»: los servicios ya tienen su botón propio al lado del buscador.

## 2) Catálogo completo (taller-app.js p30)
- **Editar precios** (lápiz) y **Costo** ya estaban solo para administrador (`isAdminUser()`); las empleadas no lo ven. No hubo
  que cambiar nada: el dueño lo veía porque entra como administrador.
- El botón «+» redondo de cada artículo pasa a ser **«Elegir»** con texto (píldora de 44 px), como en la ventana de búsqueda.

## Pruebas (banco local con 7 artículos simulados, 390 y 1280 px)
| Acción | Resultado |
|---|---|
| Tocar «Baterías» | 2 resultados (iPhone 6G, Samsung A20) |
| + escribir «iphone» | 1 resultado |
| Tocar «Baterías» otra vez | se quita, vuelven los 4 que tienen «iphone» |
| Cerrar y abrir | campo vacío, ninguna ficha activa |
| Fichas | 6, todas de 44 px; en 390 px se deslizan |
| Catálogo | botón «Elegir» de 44 px; el lápiz solo con sesión de administrador |
Sin errores de JS.

## Publicación
`claude/prefactura-pc` → `main` (misma entrega de hoy).
