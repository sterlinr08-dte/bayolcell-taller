# 2026-10-13 05:00 — Claude · Catálogo web nuevo estilo STUDIO (celulares + cambio de pantalla) — SIN PUBLICAR

Hecho desde el chat de NEXUS PRO, a pedido del dueño:
- > «Me refiero a un catálogo web no en pdf muy parecido al de studio»
- Decisiones del dueño: secciones **Celulares** y **Pantallas**; pantallas **solo al buscar**; **reemplaza `catalogo.html`** (mismo enlace).

## Qué se hizo (rama `claude/catalogo-web`)
- **`catalogo.html`, rehecho** con el estilo de la tienda de STUDIO (oscuro y premium), en el rojo de Bayol:
  - barra fija con el logo, Celulares / Pantallas / Tiendas y el botón de WhatsApp;
  - **portada** con «Tu próximo celular, hoy mismo.», el aviso **abierto/cerrado en vivo** de las 3 tiendas (mismos horarios que `index.html`) y un **carrusel de destacados**: los 5 disponibles más caros con foto, sin repetir modelo, con su foto grande, el nombre de la marca de fondo, el precio y el botón «Lo quiero» a WhatsApp;
  - franja con **Financiamiento · Taller propio · 3 tiendas · Precios al día**;
  - **pestañas**:
    - **Celulares:** buscador, marcas, «Solo disponibles», tarjetas con foto, nombre limpio (sin «CELULAR …»), capacidad, precio, botón Agregar y botón para preguntar por WhatsApp;
    - **Cambio de pantalla:** solo por búsqueda (ver abajo);
  - **tiendas:** Santiago, Moca y Navarrete, con estado en vivo, Llamar, WhatsApp y Cómo llegar;
  - **pedido:** el mismo carrito de antes, con la misma llave `bayol_cat_cart` para que no se pierdan pedidos guardados, y el mismo mensaje de pedido por WhatsApp. En el celular, el pedido aparece en la barra de abajo en lugar de «Tiendas».
- **Datos de celulares:** la misma Edge `catalogo-publico` de siempre: precio de nivel 1 en vivo, disponibilidad e interruptor publicar/ocultar. No se cambió.
- **Pantallas, Edge nueva `supabase/functions/pantallas-publico`:**
  - recibe `{q}` y exige al menos 2 caracteres;
  - devuelve **como máximo 6** resultados, **solo** `{nombre, calidad, precio}`;
  - precio de **nivel 1**; nunca costo, `precio_especial` ni niveles 2 y 3;
  - **«Calidad certificada»** en vez de Incell, y la **«Calidad Soft OLED»** solo si el cliente la busca (escribe «oled» o «soft»);
  - respeta `config_taller.catalogo_publicado`;
  - deja fuera micas, flex y biseles;
  - usa la misma limpieza de nombres que `crm-cotizar-pantalla.js`.
  - La página también se defiende: si viniera «Incell», lo cambia por «Calidad certificada».
- **`assets/cotizar/`:** las mismas letras de la tarjeta de cotizar (Barlow Condensed e Inter), los mismos archivos que en la rama `claude/cotizar-pantalla`.

## Pruebas
`NODE_PATH=/opt/node22/lib/node_modules node tests/catalogo-web/catalogo.test.cjs` → **20 de 20 OK**, en computadora (1280) y celular (390), con una copia del catálogo público real (88 celulares) y las pantallas simuladas:
- sin desplazamiento de lado;
- nombres limpios, y solo disponibles con el filtro;
- carrusel destacado;
- carrito: 2 unidades y llave guardada;
- pantallas solo al buscar, sin «Incell» y sin OLED si no se pide; la Soft OLED solo al buscar «oled»;
- el botón de agendar lleva modelo y precio al WhatsApp de ventas;
- modelo no encontrado → WhatsApp;
- 3 tiendas;
- servicio caído → mensaje amable con WhatsApp;
- sin errores de JavaScript.

## Para publicar (falta el OK del dueño)
1. Pasar la rama a `main` (GitHub Pages sirve `catalogo.html`).
2. **Instalar la Edge `pantallas-publico`** en Supabase con `verify_jwt: false`. Hasta que esté instalada, la pestaña de pantallas muestra «Pregúntanos por WhatsApp», sin errores.

## Riesgos y pendientes
- Alguien con paciencia podría consultar modelo por modelo. Es el mismo precio que se da por WhatsApp; nunca se entrega la lista completa.
- Los ejemplos de búsqueda (iPhone 11, iPhone 13 Pro, Samsung A10s, Redmi Note 8) son fijos; se pueden cambiar.
