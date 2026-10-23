# 2026-10-23 01:15 (RD) — Prefactura: buscador de artículos «smart» (rama, sin publicar)

## Pedido del dueño
«Qué propuesta me haces para ponerlo smart ese módulo». De las 9 ideas propuestas eligió: 2 (solo con existencia aquí),
3 (búsqueda tolerante), 4 (atajos del vendedor), 6 (precio que avisa) y 9 (fila más compacta).

## Cambios (capa `bc-rx`, reversible; no toca Info Plus, Supabase ni el carrito)
- `taller-recepcion.js` (g5):
  - **Búsqueda tolerante:** sinónimos del mostrador (pantalla/display/lcd, auricular/audífono/airpods, batería/pila,
    protector/mica/vidrio, forro/cover/funda, bocina/altavoz, iphone/aifon/ifon, samsung/sansum, plus/mas…), abreviaturas
    (pant, bat, aur, carg, prot, cam, mic, boc, ip, sam, xia, mot, orig, serv) y una letra de diferencia o dos letras
    cambiadas de orden en palabras de 4+ letras («baterai» → batería). Los números no se corrigen.
  - Orden: código exacto → con existencia aquí → coincidencia más exacta → nombre.
  - Línea «Entendido como «…»» cuando la lectura cambió lo escrito.
  - **Solo disponibles:** botón dentro del campo; esconde lo que no tiene existencia en el almacén elegido (los servicios
    se quedan). Se recuerda por equipo (`localStorage.bc_ppk_solodisp`).
  - **Aviso de precio** (una línea ámbar, sin ventana): cliente de contado con Por mayor/Extremo, o cliente con código de
    Info Plus en Cliente final.
- `taller-recepcion.css` (g3): sin existencia → fila en gris (precio, código, +). Celular: nombre a todo el ancho en
  una línea; debajo código · existencia · precio; sin marca repetida ni precio tachado (está en el detalle). PC: columna
  de precio 120 px para que RD$ 38,000.00 no se corte.
- `taller.html`: versiones g5 / g3.

## Pruebas (banco local, Playwright, 390 y 1280 px) — 38/38
- «aifon 13 pant» → pantallas iPhone 13 primero; «display sansum» → DISPLAY SAMSUNG; «baterai 13» → BATERIA IPHONE 13;
  «airpods» → AURICULAR AIRPODS; «bat 6g» → BATERIA IPHONE 6G; «ip 13» → artículos iPhone 13.
- Sin stock al final y en gris; «Solo disponibles» lo esconde, conserva el servicio y recuerda la preferencia.
- Aviso de precio en los dos casos y ausente con contado + Cliente final.
- Filas en celular 52–58 px (≥44), botón + 44 px, letra ≥13 px. Capturas: `smart-vista-390.png`, `smart-vista-1280.png`.

## Rama
`claude/buscador-smart` (desde `main`). No publicado: espera el «publícalo» del dueño.

## Pendiente / notas
- El diccionario de sinónimos y atajos se amplía con lo que digan los vendedores.
- Ideas 1, 5, 7 y 8 quedaron fuera por decisión del dueño.
