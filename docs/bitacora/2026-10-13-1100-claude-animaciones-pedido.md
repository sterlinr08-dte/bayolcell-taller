# 2026-10-13 11:00 — Claude: el catálogo web nuevo recupera las animaciones del pedido

## Pedido del dueño
> «Las animaciones que hicimos cuando le damos» [a Agregar / Enviar]

El rediseño del catálogo (`catalogo.html`, entrada 0500) no había pasado las animaciones del catálogo anterior. Se rescatan tal cual, adaptadas al diseño nuevo.

## Qué se hizo (rama `claude/catalogo-web`, sin publicar)
`catalogo.html`:
- **La foto vuela al pedido:** al tocar «Agregar», la foto del celular vuela en curva hasta «Tu pedido». En computadora va al botón flotante y en el celular al botón de la barra de abajo, que rebota al recibirla (`volar`, `recibir`).
  - La posición de la foto se toma **antes** de repintar la cuadrícula.
- **Asoma el resumen** (`asomar`): muestra los 3 últimos artículos, el total y «Ver pedido», que abre la hoja.
  - Se esconde a los 2,6 s o al desplazarse más de 60 px. Un roce no lo esconde.
  - Aparece al instante (`visibility` con retraso solo al salir).
- **Enviar por WhatsApp:**
  - el botón se hunde y lo cruza un brillo y una onda;
  - un carrito rojo entra, recoge las fotos del pedido y se va;
  - el texto pasa a «Preparando tu pedido…» y luego a «Abriendo WhatsApp…»;
  - WhatsApp se abre a los 2,15 s y el botón se restaura después, también al volver con «atrás» (`pageshow`).
- Se conservan «✓ Agregado» y el contador que rueda. El mensaje de WhatsApp y la llave del carrito (`bayol_cat_cart`) no cambian.
- **Movimiento reducido:** sin vuelo, sin resumen ni carrito. WhatsApp se abre directo.

`tests/catalogo-web/catalogo.test.cjs`: 6 pruebas nuevas por tamaño. Comprueban:
- que la foto vuela y desaparece;
- que «Tu pedido» rebota;
- que el resumen se ve con el número correcto;
- que se ve «Preparando…» con el carrito y WhatsApp aún no se abre;
- que después se abre `wa.me/18495644791` con el pedido.

## Pruebas
- Datos simulados: **34/34**.
- Datos reales (88 celulares, fotos guardadas): **34/34**.
- Video de muestra en iPhone 390 px: agregar 3, ver el resumen, abrir el pedido y enviar.

## Pendiente
- Publicar solo con «publícalo». Sigue pendiente decidir si reemplaza `catalogo.html` o va como página nueva, y desplegar la función `pantallas-publico`.
