# Prefactura PC: el código del artículo en vez de «#», y raya más marcada entre artículos

**Dueño (foto en PC):** «Quitar #, mejor que salgan los códigos de los artículos, ahorra más espacio; y la línea divisoria
un poco más pronunciada para diferenciar uno del otro.»

## Cambios
- `taller-prefactura.js` (i18): la cabecera dice **«Código»**; cada fila lleva `<em class="ni">01</em><em class="nc">1990</em>`.
- `taller-prefactura.css` (n8):
  - **PC (≥761 px):** se ve el código (`.nc`, monoespaciado 13 px, hasta 120 px con puntos suspensivos) y se oculta el 01/02 y
    la etiqueta de código que iba debajo del nombre. Cada artículo queda en **una sola línea** (73 px en vez de dos renglones).
    Primera columna `minmax(52px, auto)`.
  - **Celular:** igual que antes (01, 02 y el código debajo del nombre).
  - Raya entre artículos: `rgba(90,72,20,.28)` (antes `.09`), en PC y celular.

## Pruebas (banco local)
| Ancho | Cabecera | Columna 1 | Código bajo el nombre | Alto de fila |
|---|---|---|---|---|
| 1280 | «Código» | 1990 / 1821 / PAN-IP13-INC (52 px) | oculto | 73 px |
| 390 | oculta | 01, 02, 03 (24 px) | visible | como antes |
Sin errores de JS.

## Nota
La foto del dueño todavía mostraba «Agregar comentario a la prefactura» y «Buscar o escanear por nombre, código o IMEI»:
era la versión vieja en caché del navegador; en vivo ya estaba «Comentario» (i17). Al recargar se ve la nueva.

## Publicación
`claude/prefactura-pc` → `main`.
