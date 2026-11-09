# Web bayolcell.com: imágenes y video más livianos

**Pedido del dueño.** Preguntó si Cloudflare haría la página más rápida. Se le explicó que lo que más pesa son las imágenes. Pidió revisarlas y aprobó las 4 mejoras («Sí, las 4»).

**Medición.** Copia local de `index.html` en Playwright, a 390 y 1280 px, bajando hasta el final de la página. No se probó contra la web en vivo, para no sumar visitas.

| Pieza | Antes | Ahora |
|---|---|---|
| `assets/canje.webp` (se ve a 300–400 px) | 900×1200, 103 KB | `assets/canje-600.webp`, 600×800, 58 KB |
| `assets/moto-roja.jpg` (se ve a 222–373 px) | 900×1015, 82 KB | `assets/moto-roja-600.webp`, 600×677, 24 KB |
| iPhone 16 Pro, bajado 2 veces (`ip16pro.webp` y `ip16pro.webp?v=2`) | 84 KB | una sola vez, `?v=2`, 42 KB |
| `assets/video/bayolcell-motion.mp4` (10 s, 1280×720) | 907 KB | 513 KB (libx264 crf 28, faststart, mismo tamaño; se ve igual) |

- La página entera en PC baja de unos **1.9 MB a 1.4 MB**.
- El video se cambió en el mismo archivo y se le agregó `?v=20261109` para que los navegadores no usen la copia vieja.
- Se conservan los originales `canje.webp` y `moto-roja.jpg`: el carrito y el detalle de producto todavía usan `moto-roja.jpg`.

**Pendiente opcional.** `reparacion-cristal-frontal.webp` y `reparacion-cristal-trasero.webp` (900×1200, unos 85 KB cada una) se ven a 288 px. Se podrían hacer en versión de 480 px, como ya se hizo con batería y pantalla.

**Rama:** `claude/web-imagenes-ligeras`. Sin publicar.
