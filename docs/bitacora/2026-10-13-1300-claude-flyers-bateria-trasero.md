# 2026-10-13 13:00 — Claude: nuevas imágenes de batería y cristal trasero (web, sección Taller)

## Pedido del dueño
> «Tenemos que arreglar la imagen que tiene los precios de la pantalla, batería y esos… ya tienen los precios viejos»

Revisión de las 4 imágenes de «Ofertas del mes» contra Info Plus (nivel 1, `infoplus_articulos`):
- **Pantalla iPhone:** ya estaba al día (flyer del 9 de octubre). Coincide modelo por modelo. Lo publicado es igual a `main`.
- **Cristal de pantalla:** es la vieja, y sus precios salen más altos que la pantalla completa. El dueño respondió **«déjalo igual»**. No se tocó.
- **Batería y cristal trasero:** el dueño respondió **«rediseña»**.

## Qué se hizo (rama `claude/flyers-reparacion`, desde `main`, sin publicar)
- Nueva plantilla `herramientas/kit-catalogo/flyer-reparaciones/` con `flyer.html` y `render.js`. Hace la imagen con `?tipo=bateria|trasero`.
  - Mismo diseño que el flyer de pantallas.
  - El logo se recorta igual que en la tarjeta de «Cotizar pantalla».
  - Para el cristal trasero, el teléfono se dibuja de espaldas, con cámaras.
  - Uso: `node render.js bateria feed`.
- `assets/reparacion-bateria.webp` y `assets/reparacion-cristal-trasero.webp` reemplazadas.
  - Tamaño 900×1200, igual que la de pantallas (1080×1350 reducida, con franjas #0C0C0C).
  - `index.html` lleva `?v=20261013` para que no se vea la copia guardada. También se actualizaron los textos `alt`.
  - Los `.png`/`.jpg` viejos del mismo nombre no se tocaron.

### Precios usados (nivel 1 de Info Plus)
**Batería** (se usa la «ORIGINAL» cuando hay varias calidades; desde RD$1,000):
- 6s / 7 / 8: 1,000 · 7 Plus: 1,000 · 8 Plus: 1,100
- X: 1,200 · XS: 1,350 · XR: 1,300 · XS Max: 1,500
- 11: 800 (⚠ artículo 2550 «BATERIA IPHONE 11 NORMAL 22222»; el flyer viejo decía 1,400, confirmar con el dueño) · 11 Pro: 1,500 · 11 Pro Max: 2,000
- 12 / 12 Pro: 1,900 · 12 Pro Max: 2,500
- 13: 2,300 · 13 Pro: 2,800 · 13 Pro Max: 3,000
- 14: 3,000 · 14 Plus: 3,000 · 14 Pro: 3,500 · 14 Pro Max: 4,000
- 15: 3,500 · 15 Plus: 4,000 · 15 Pro: 4,000 · 15 Pro Max: 5,000

**Cristal trasero** (artículos «TAPA», desde RD$1,200):
- 8 / 8 Plus: 1,200
- X / XS: 1,500 · XR: 1,500 · XS Max: 1,500
- 11 / 11 Pro / 11 Pro Max: 1,850
- 12: 2,100 · 12 Pro / 12 Pro Max: 2,500 (⚠ no hay artículo en Info Plus; se dejó el precio del flyer viejo)
- 13: 2,000 · 13 Pro: 2,500 · 13 Pro Max: 2,850
- 14 / 14 Plus / 14 Pro / 14 Pro Max: 3,000
- 15 Plus: 3,500 (⚠ en Info Plus va de 3,000 a 3,500 según el color) · 15 Pro Max: 4,000
- 16 / 16 Plus: 3,000 · 16 Pro Max: 5,000 · 17 Pro Max: 5,000

## Pruebas
- Las imágenes salieron con las letras del proyecto cargadas.
- Portada vista en escritorio y en celular: las 4 ofertas se ven bien y no hay errores.

## Pendiente
- El dueño debe confirmar los 3 ⚠ y decir «publícalo».
