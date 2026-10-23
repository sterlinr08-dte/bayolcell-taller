# Buscador de la Prefactura: se limpia al cerrar

**Dueño (video, 10 s):** busca «batería», cierra la ventana, la vuelve a abrir y la búsqueda sigue ahí. «Que se limpie la barra
cuando la cierro y la abro de nuevo.»

## Cambio (taller-recepcion.js, g7)
`cerrarPanel()` ahora borra el estado de la búsqueda (texto, resultados, resaltado, detalle abierto, IMEI buscado y «Entendido
como»). Al reabrir, la ventana sale vacía y con el cursor en el campo.

## Prueba (banco local, 1280 px)
Abrir → escribir «bateria» → Cerrar → abrir: el campo vuelve vacío. Sin errores de JS.

## Pendiente del mismo video
«En la parte superior de la ventana de búsqueda, acceso rápido como filtro»: se le mandaron dos maquetas (A: una fila de tipos;
B: tipos + marcas) para que elija antes de construirlo.

## Publicación
Es corrección de lo publicado hoy → directo a `main`.
