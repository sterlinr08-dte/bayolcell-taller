# 2026-10-20 17:40 · Claude · Prefactura: lupa arriba, estado «Crear», «CONTADO: 1», «CLIENTE FINAL»

## Pedido del dueño
- «El ícono de copiar no es copiar, es una lupa.» El botón de arriba debía ser la lupa para buscar prefacturas. Corrige la entrada anterior (17:10), donde se había quitado ese botón.
- «Quitar "pendiente de crear", solo "crear", y ponlo smart.»
- «Precio del cliente: CLIENTE FINAL; facturar a: CONTADO: 1.»

## Cambios
- **`taller-prefactura.js` (m2):**
  - vuelve el botón de arriba, ahora con una **lupa** (`ti-search`, redondo de 44 px), que abre `_rpHistorial()`;
  - es la única entrada a las prefacturas guardadas: se quitó la píldora «Prefacturas» y sigue oculto el «Historial de prefacturas» de la sección.
- **Estado de la prefactura:** una etiqueta corta con un punto de color, en vez del texto largo:
  - Crear (ámbar);
  - Cambios sin enviar;
  - En Info Plus (verde);
  - Actualizando… (azul, con el punto que late);
  - Error (rojo);
  - Facturada (índigo).

  `_rpEstadoBadge` de `taller-app.js` no se tocó; solo cambia lo que muestra la Prefactura.
- **Tarjeta del cliente de contado:** dice «CONTADO: 1», sin la segunda línea. Los clientes de Info Plus siguen con su nombre, código, cédula y teléfono.
- **`taller.html`:** las opciones de «Precio del cliente» ahora son «CLIENTE FINAL», «POR MAYOR» y «EXTREMO». Antes eran «Cliente final (Contado)», «Por mayor» y «Extremo». El código usa el valor (1/2/3), no el texto.
- **`taller-prefactura.css`:** bloque m (lupa y etiqueta de estado), versión m1.

## Pruebas
- `pftest`, `pfopc` y `almfijo` pasan.
- Capturas a 440 y 1280 px.

## Estado
En la rama `claude/prefactura-limpia`. **Sin publicar**: falta el «publícalo» del dueño.
