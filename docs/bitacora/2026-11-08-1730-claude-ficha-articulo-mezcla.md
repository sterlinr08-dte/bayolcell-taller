# Prefactura: ficha del artículo nueva, mezcla de las propuestas 2, 3 y 5 (08-nov-2026, 17:30 RD)

## Pedido
El dueño pidió 5 agentes diseñadores para mejorar la ficha que se abre al tocar un artículo en «Buscar artículo». Se hicieron 5 maquetas (en el scratchpad, `agentes/opcion1..5`):
1. Apple minimal
2. Velocidad de caja
3. Asistente
4. Escalera de precios
5. Existencia por tienda

El dueño eligió **mezclar la 2, la 3 y la 5**.

## Cambio (`taller-recepcion.js` g18, `taller-recepcion.css` g13; solo `detalleHTML`, `agregar` y el clic de la lista)

| De | Qué quedó |
|---|---|
| 2 · Velocidad | Cada precio es un botón que **agrega con ese nivel**. Hay cantidad **− N +** de 44 px en la misma ficha. No para celulares, porque cada IMEI suma uno, ni para servicios. |
| 3 · Asistente | El nivel del cliente dice «Del cliente». Los otros muestran cuánto rebajan (−RD$ 150) y, para quien no es administrador, salen con candado y no agregan. El administrador ve «Gana RD$ X · %» en cada nivel y el costo. «En la prefactura: N». La cantidad no pasa de lo libre en la tienda (existencia menos lo que ya está en la prefactura). |
| 5 · Existencia | Arriba, la tienda actual con su número grande, la etiqueta «Aquí» y el aviso «Últimas N» si quedan 3 o menos, o «Sin existencia aquí». Debajo, las demás tiendas con existencia, de más a menos. Los almacenes en cero van juntos en una línea gris. Al final, el total. |

- **Candados respetados:** sin existencia no se agrega. Solo el administrador agrega con otro nivel (antes el administrador elegía el nivel y luego tocaba el botón de la fila). El precio de otro nivel pasa a la línea igual que antes (`_rpPrecio`).
- **Sin cambio en la fila:** el botón naranja de la fila funciona igual (agrega 1 con el nivel elegido).
- **Quedó fuera, por falta de datos o de un flujo real:**
  - «Agregar también la mano de obra», porque no hay una relación artículo → servicio con su precio;
  - «Pedir a Santiago», porque no hay flujo de traslado o reserva.
  - Se pueden hacer cuando el dueño lo decida.

## Pruebas
Arnés con el CSS real y artículos de ejemplo a 390 px (`ficha.html`):
- **Vendedor:** Por mayor y Extremo bloqueados. Con cantidad 3 y Cliente final queda 1 línea de 3 a RD$ 600.
- **Administrador:** con cantidad 3 y Por mayor queda 1 línea de 3 a RD$ 450.
- El «+» se apaga al llegar a la existencia libre (3).
- Todos los botones miden 44 px o más y no hay desplazamiento horizontal.
- El único error en consola viene del arnés (`MutationObserver` sin la pantalla completa), no de la ficha.

## Estado
- Rama `claude/ficha-articulo-mezcla`. No publicado: espera el botón «Publícalo».
