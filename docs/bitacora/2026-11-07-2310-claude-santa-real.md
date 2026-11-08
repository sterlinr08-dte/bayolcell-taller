# Santa «como el real» (07-nov-2026, 23:10 RD)

## Pedido
El dueño pidió auditar el Santa publicado (`/canvas-design`) y luego: «Hazlo como el real».

## Auditoría (lámina «El vuelo de medianoche»)
- Santa y saco eran dos círculos; renos de palitos y cuello recto; trineo hueco; riendas sueltas.

## Cambio
- `web-navidad.js`: nuevo dibujo a color, todo en SVG propio (sin imágenes externas ni IA de pago):
  - Santa con traje rojo, piel blanca, cinturón negro con hebilla dorada, cara, barba y gorro, sujetando las riendas.
  - Saco café con un regalo verde.
  - Trineo rojo con borde y adornos dorados y patín dorado con voluta.
  - Tres renos cafés con vientre claro, cola blanca, astas color hueso, arnés rojo con campana dorada y pezuñas.
  - El reno de adelante lleva la nariz roja con brillo.
  - Riendas que unen a Santa con cada reno.
- `web-navidad.css`: la sombra dorada pasa a ser una sombra oscura suave, para que se vean los colores reales.
- Tamaño: 520 px de ancho en el celular y 760 px en la PC. Altura calculada para pasar por encima de los celulares.
- Versión de caché `20261108n2`.

## Pruebas
- Playwright a 390 y 1280 px con `?navidad=1`: sin errores y sin desplazamiento lateral. Capturas y video enviados al dueño.

## Estado
- Rama `claude/santa-real`. No publicado: espera el «publícalo».
