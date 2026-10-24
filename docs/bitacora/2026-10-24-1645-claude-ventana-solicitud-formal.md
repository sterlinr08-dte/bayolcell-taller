# 24-oct-2026 16:45 RD · Ventana «Solicitud de financiamiento» del CRM: textos formales y casillas alineadas

**Pedido del dueño** (captura del iPhone): «Vamos a ir corrigiendo y poner los textos de los cuadros más formales, centralizado».

## Qué se veía mal
Las etiquetas salían en MAYÚSCULAS y las casillas quedaban sueltas, centradas arriba de un texto largo; lo heredaba de la
hoja de estilos de las ventanas del taller (`label` en bloque y mayúsculas), que le ganaba a la capa.

## Qué cambia (capa **f7**, `crm-marketing-consent.js?v=20261024-f7`, `taller.html` u20)
- Estilos con más peso (`#bcffForm …`) para que la capa gane a la cascada: etiquetas en minúscula normal, 13 px, gris; campos
  48 px con letra 16 px y foco azul NEXUS; casillas en fila con el texto, dentro de una tarjeta clara de 48 px, casilla a la
  izquierda y texto a la derecha.
- Textos formales y cortos: «Forma de envío» (Enlace a la página de Bayol Cell / Formulario dentro de WhatsApp), «Equipo o
  artículo», «Precio (RD$)», «Confirmo que informé al cliente el equipo y el precio.», «Modo de prueba (solo para mi
  número).», botón «Enviar al cliente». Ayuda: «El cliente recibe un enlace con el equipo y el precio ya indicados. Al
  completarlo, la solicitud aparece en este chat con la referencia para el banco.»
- Aviso al faltar la casilla: «Antes de enviar, informe al cliente el equipo y el precio y marque la casilla de confirmación.»

## Pruebas
`scripts/pruebas/flow-financiamiento.cjs` 390/1280 OK (f7; casilla obligatoria, 44/48/54 px); captura a 390 px del banco.
Sin publicar; rama `claude/ventana-solicitud-formal`.

## Actualización 16:50 RD · se quita el «Modo de prueba»
Dueño: «¿El modo de prueba que sale ya se puede quitar?». Sí: solo lo veía el administrador y ya cumplió (página y Flow
publicados). Capa **f8** (`taller.html` u21): la ventana queda con Forma de envío, Equipo, Precio, la casilla de confirmación
y el botón. El servidor conserva `prueba:true` solo para pruebas internas con llave de un solo uso. Prueba del banco
actualizada (envía `prueba:false`): 390/1280 OK.

## Actualización 17:00 RD · regla para todo el sistema y formulario en el clip del chat móvil
Dueño: «Sobre la corrección, vamos a aplicarlo en todo el sistema como reglamento del orden, y en la ventana de chat en la web
móvil el formulario vamos a ponerlo en el ícono del adjunto».
- **Regla escrita** en `DESIGN.md §4b` (misma sección en `nexus-pro`, `bayolcell-taller` y `studio-rd`, con bitácora en cada
  uno) y resumida en `REGLAMENTOS.md §4`: etiquetas sin mayúsculas, textos formales en usted, casillas en fila dentro de
  tarjeta de 48 px, campos 48/16, botón 54, probar a 390 px. Las ventanas existentes se corrigen al tocarlas (sin rediseño
  masivo).
- **Capa f9** (`taller.html` u22): «Solicitud de financiamiento» aparece como opción del menú del clip (adjuntar) del chat de
  WhatsApp, con ícono de formulario, en celular y PC; en celular (≤ 768 px) se esconde el botón propio del formulario y queda
  solo en el clip. Como el menú original calcula su altura para 7 filas, la capa lo recoloca con la altura real al abrirse.
- Prueba del banco: a 390 px el botón propio está oculto y el clip trae la opción; a 1280 px están los dos. OK.
