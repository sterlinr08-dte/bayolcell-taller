# 2026-10-23 15:55 (RD) — Ticket por QZ Tray: corte entre copias

## Pedido del dueño
Foto de la prefactura Nº 118981 con 2 copias: «Sale bien pero no hace el corte para dividir». Las dos copias salieron pegadas
en una sola tira.

## Causa
Las copias se mandaban a QZ Tray en **un solo trabajo** con `copies: N`. La impresora 2C-POS80 corta al terminar cada
trabajo, no entre las copias de un mismo trabajo.

## Qué cambió
- `bc-prefactura-imprimir.js` (`i7 → i8`), función `imprimir()`: con QZ, cada copia va como **un trabajo aparte** y en
  orden (promesas encadenadas), igual que cuando sale una sola copia, que sí corta. Si una falla, se pasa a la ventana
  del navegador como antes.
- `taller.html`: versión del archivo.
- La ventana del navegador (sin QZ) no cambia: sigue repitiendo el ticket con salto de página.

## Pruebas
- Banco local con QZ simulado: con 3 copias, `qzImprimirHtml` se llamó 3 veces seguidas con 1 copia cada una y el mismo HTML. 0 errores JS.
- Falta la prueba real del dueño en su PC: imprimir con 2 copias y ver el corte entre las dos.

## Publicación
Commit en `main` (GitHub Pages). El dueño pidió el arreglo sobre lo recién publicado («PUBLICALO»).
