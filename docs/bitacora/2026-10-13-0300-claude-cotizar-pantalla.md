# 2026-10-13 03:00 — Claude · «Cotizar pantalla» en el chat de WhatsApp — SIN PUBLICAR

Se hizo desde el chat de NEXUS PRO, a pedido del dueño:
- > «Cómo podemos hacer el catálogo sin tener que enviarle el catálogo completo a los clientes sino el precio del modelo que busca»
- > «Síguelo tú más moderno»

## Qué hace
- **Dónde está:** en el chat de WhatsApp del CRM.
  - En la computadora, un botón nuevo en la barra, al lado del de ubicación.
  - En el celular y en la computadora, la opción «Cotizar pantalla» al principio del menú del clip.
- **Buscador:**
  - muestra solo pantallas: excluye micas, glass, flex, bisel, marcos sueltos y similares, y lo que no tiene precio;
  - filtros iPhone, Samsung, Motorola, Xiaomi y Otras;
  - nombres limpios para el cliente: «PANTALLA IPHONE 11 PRO MAX ZY INCELL» → «iPhone 11 Pro Max» con la etiqueta «Incell».
- **Precio:** **nivel 1** (cliente final), con el mismo criterio que `_catPrecioN1`: nivel 1 y, si no existe, el precio base.
- **Tarjeta:** imagen de 1080×1350 en el estilo del flyer de pantallas (negro y rojo Bayol, logo real, «Cambio de pantalla», modelo, tipo, «RD$ precio con instalación», «Sujeto a disponibilidad · Válido al [fecha]» y el botón «Responde este mensaje para agendar»).
  - El empleado puede corregir el nombre del modelo, pero **no el precio**.
- **Envío:**
  - **«Enviar tarjeta»** pone el texto en la caja del chat y abre la **vista previa de foto de siempre** (`_waAdjuntoSeleccionado`), que lo usa como pie de foto. El empleado revisa y toca Enviar: el sistema **no manda nada solo**.
  - Texto: «Hola 👋 El cambio de pantalla de tu {modelo} ({tipo}) te sale en RD${precio} con instalación. ¿Quieres que te la reservemos?».
  - **«Solo texto»** pone el mismo texto en la caja, sin enviarlo.

## Candados
- La cotización se arma con una **lista blanca**: `codigo`, `nombre`, `tipo` y `precio`. Si aparece cualquier otro campo, como `costo`, se detiene con un error.
- Nunca se usan `costo`, `precio_especial` ni los niveles 2 y 3.
- Si el empleado cambia de chat antes de enviar, no se manda.
- Con la ventana de 24 h cerrada, avisa que hace falta una plantilla.

## Archivos
- `crm-cotizar-pantalla.js`: **capa aislada**. Se quita borrando el archivo y su línea en `crm-marketing-consent.js`.
- `crm-marketing-consent.js`: una línea que la carga junto con las demás capas del CRM (`?v=20261013-c1`).
- `assets/cotizar/`: las letras de la tarjeta (Barlow Condensed 800 e Inter), copiadas del kit del flyer.
- `tests/cotizar-pantalla/cotizar.test.cjs`: prueba en el navegador con datos simulados.
- **No se tocaron** `taller-app.js`, `taller.html`, la base, las Edge Functions ni Info Plus.

## Pruebas
`NODE_PATH=/opt/node22/lib/node_modules node tests/cotizar-pantalla/cotizar.test.cjs` → **13 de 13 OK**:
- nombres limpios;
- micas, flex y precios en cero fuera de la lista;
- botón en la barra de la PC y no en el celular;
- búsqueda y filtros;
- **el costo «trampa» (12,345) y el por mayor no aparecen nunca**;
- envía una foto JPG por el envío de siempre, con el texto;
- el candado rechaza el campo `costo`;
- no envía si se cambió de chat;
- en el celular, la opción está en el menú del clip y la hoja cabe en la pantalla;
- sin errores de JavaScript.

## Pendiente / riesgos
- **Sin publicar.** Rama `claude/cotizar-pantalla`. Necesita el OK del dueño.
- Los precios vienen de `infoplus_articulos`. Los niveles se sincronizan con Info Plus cada día a las 6 a. m. Si se cambia un precio en Info Plus durante el día, hay que sincronizar desde el buscador de artículos para que salga al momento.
- La limpieza de nombres es automática y puede fallar con algún modelo raro; por eso el nombre se puede corregir antes de enviar.
- **Siguiente idea:** el buscador web «bayolcell.com/pantallas» con el mismo diseño.
