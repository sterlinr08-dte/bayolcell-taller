# Prefactura: cantidad de copias del ticket (por computadora)

**Dueño:** «Quedó excelente; ahora falta la opción de poner la cantidad de copias.»

## Cambio (bc-prefactura-imprimir.js i6)
- En Configuración → Impresora → «Papel de la prefactura», fila nueva **Copias del ticket: 1 · 2 · 3** (botones de 44 px, se guarda
  por computadora en `bc_pref_copias`; por defecto 1).
- Ticket directo por QZ Tray: se manda `copies = N`.
- Ticket por ventana del navegador (sin QZ): el cuerpo del ticket se repite N veces con salto de página, porque la ventana no
  sabe de copias.
- La hoja carta no usa copias.

## Pruebas (banco local)
Botones 44 px; al tocar «2» queda guardado; con QZ simulado llega `copies: 2`; sin QZ la ventana trae 2 cuerpos y 1 salto de página;
un solo `window.print`. Sin errores de JS.

## Publicación
Directo a `main`.
