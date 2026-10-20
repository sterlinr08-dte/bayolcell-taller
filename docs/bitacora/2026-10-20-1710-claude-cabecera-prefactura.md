# 2026-10-20 17:10 · Claude · Cabecera de la Prefactura: botón repetido y detalles

## Pedido del dueño
El dueño mandó una captura de la cabecera de la Prefactura en el iPhone con el mensaje «Indaga más para corregir y el botón».

## Diagnóstico
- **El botón suelto de arriba** (ícono de copiar, `.ibtn`, al lado de «Nº») abría `_rpHistorial()`. Ese mismo historial ya se abre desde:
  - la píldora «Prefacturas» de abajo;
  - el botón «Historial de prefacturas» de la sección «Prefacturas realizadas».

  Eran 3 entradas para la misma función, y la de arriba no decía qué hacía.
- **«Nueva»** salía dentro de una caja beige y parecía un campo para escribir, aunque no se puede editar.
- **Los números** (fecha, totales, importes) usaban letra de máquina de escribir y no combinaban con el resto.
- **En el celular:**
  - el buscador se cortaba («Buscar o escanear por nombre, c…»);
  - la llave de «Servicio» era un ícono suelto, sin texto.
- La pestaña gris con «›» que se ve al borde izquierdo en la captura **no es del sistema**: no existe en el código del taller. Es del navegador o del iPhone.

## Cambios
- `taller-prefactura.js` (l4):
  - se quitó el botón suelto de arriba;
  - se oculta el «Historial de prefacturas» repetido de la sección;
  - la píldora «Prefacturas» queda como única entrada y ahora lleva el ícono de historial;
  - el buscador dice «Buscar artículo»;
  - el botón de la llave dice «Servicio».
- `taller-prefactura.css` (bloque l, versión l4):
  - «Nº Nueva · fecha» queda como texto simple;
  - números con la letra del sistema y cifras alineadas (`tabular-nums`);
  - «Servicio» con su palabra también en el celular.
- `taller.html`: versiones `taller-prefactura` css/js 20261020-l4.

## Pruebas
- `pftest` 49/49, `pfopc` 52/52 (se actualizó la prueba vieja que esperaba el botón quitado), `almfijo` 24/24, `pfvent` 8/8, `crmprecio` 21/21.
- Capturas a 375, 440 y 1280 px.

## Estado
En la rama `claude/prefactura-limpia`, junto con «sin Elegir» y «covers sin IMEI» (b73e799). **Sin publicar**: falta el «publícalo» del dueño.
