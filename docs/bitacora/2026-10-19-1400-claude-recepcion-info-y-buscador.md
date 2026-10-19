# Recepción: ayudas detrás de una ⓘ y pestaña «Buscar o escanear» estilo STUDIO — Claude (19-oct-2026)

## Pedido del dueño
«Vamos a hacer lo mismo que hicimos en Nexus Pro … el icono de la I para información … tener la pantalla más limpia. Y donde dice agregar artículo para prefactura, vamos a usar la misma pestaña que usamos en el sistema de prefactura desde estudio, que se vea más profesional.»

## 1 · Ayudas detrás de una ⓘ (`taller-info.js` + `taller-info.css`)
- **Origen:** es la réplica de NEXUS 59.42 (`#nxInfoIJs`), con el mismo comportamiento.
  - Las notas que explican salen de la vista y quedan detrás de una ⓘ junto a su título.
  - Al tocar la ⓘ se abre una burbuja con el texto actual de la nota.
  - Se cierra al tocar fuera, con Esc o al desplazar más de 40 px.
  - La ⓘ mide 44 × 44 px.
  - En Bayol va en naranja `#c2410c`, el color de la marca del taller.
- **Interruptor:**
  - `html.bc-info` en el `<head>`;
  - para apagarlo: `BC_INFO=false`, o `localStorage.bc_info_off='1'` en un equipo.
- **Reglas `BC_INFO_REGLAS`, por ahora solo en Recepción:**
  - «— pedir reseña / boleto de rifa (toca para abrir)» en Herramientas rápidas;
  - los párrafos de explicación de Reseña y de Rifa;
  - «(Info Plus)» en las cabeceras de Cliente y de Artículos;
  - «Actívalo solo si el cliente autoriza…», de Promociones;
  - «se aplica a todos los artículos»;
  - «Artículo = del catálogo. Servicio/falla = línea editable…»;
  - «(opcional — toca para abrir)» y «Marca los problemas…», de Fallas del equipo;
  - «(claves, patrón — toca para abrir)» y «Las claves quedan ocultas…», de Seguridad;
  - los paréntesis de las etiquetas «Nombre visible (va en la prefactura)» y «Observaciones (van como comentario…)».
- **Lo que se queda a la vista:** avisos («Escribe un WhatsApp válido…»), estados vacíos, cifras y datos.
- **Resultado:** 12 ⓘ y 15 notas fuera de la vista.

## 2 · Pestaña «Buscar o escanear» (`taller-recepcion.js` y `.css`, `?v=20261019-r2`)
- **Origen:** es la misma idea que `facSearchBoxHTML` y `nxProdPicker` en `parches-pos.js` de STUDIO (Factura y Prefactura).
- **Barra:** «Buscar o escanear por nombre, código o IMEI», con `F2` en la PC.
- **Al tocarla** se convierte en un panel en línea con:
  - un buscador;
  - una lista con Código · Artículo (con la marca y la etiqueta IMEI en los celulares) · Existencia en el almacén elegido · Precio del nivel del cliente · «+».
- **Búsqueda:**
  - sin acentos;
  - varias palabras en cualquier orden;
  - primero el código exacto;
  - primero lo que tiene existencia;
  - muestra hasta 60 resultados («escribe para afinar»).
- **Teclado:** flechas para moverse, Enter agrega y Esc cierra. Tocar fuera también cierra y se recuerda lo escrito.
- **«Catálogo completo»** abre el buscador grande de siempre, con sus filtros y el botón de sincronizar.
- **Al agregar** se usa `_rpAgregarArticulo(a)`, sacada tal cual del callback que tenía `_rpAgregar` en `taller-app.js` (`?v=20261019-rp1`).
  - Son la misma regla de precio por nivel, la misma existencia en vivo (`infoplus-existencia-art`), el mismo bloqueo sin existencia y el mismo IMEI para celulares.
  - Lo único nuevo es `return true` al agregar, para que el panel se cierre.
- **Botones:**
  - «Agregar artículo» queda oculto;
  - «Agregar servicio/falla» pasa a «Servicio / falla», como botón secundario, y llama a la misma función.

## Arreglo en la capa de Recepción (`r1`, no publicada)
En el celular, la columna se ensanchaba a 437 px por el ancho mínimo de la lista de fallas y de la seguridad, que se movieron dentro de «Falla». Ahora `minmax(0,1fr)` y `min-width:0`: la vista mide 366 px y nada se sale.

## Pruebas (banco local con 6 artículos de Info Plus de ejemplo)
- **`rxppk.mjs`: 23 PASS · 0 FAIL**, a 390 y 1280 px:
  - aparecen las ⓘ y las etiquetas quedan cortas;
  - la burbuja abre y cierra al tocar fuera;
  - la barra reemplaza al botón;
  - el panel lista todo; «iphone pro» da 2 resultados;
  - el «+» agrega a la prefactura y el panel se cierra;
  - un artículo sin existencia no se agrega, con el aviso de siempre;
  - F2 abre la búsqueda;
  - todo lo que se toca mide 44 px o más.
- **`rxfun.mjs`:** 12 PASS · 0 FAIL (barra fija, plegado, total, PC).
- **Barrido táctil de Recepción:** 0 controles y 0 campos chicos.
- **Sintaxis:** `taller.html` (4 bloques) y `taller-app.js` sin errores.

**Sin probar:** datos reales de Info Plus (son más de 2 000 artículos) ni un iPhone físico.

## Estado
Rama `claude/bayol-recepcion`, **sin publicar**. Incluye también la Recepción organizada (`2026-10-19-1300-…`).

## Siguiente
Si al dueño le gusta, llevar la ⓘ al resto del taller, pantalla por pantalla, como en NEXUS.
