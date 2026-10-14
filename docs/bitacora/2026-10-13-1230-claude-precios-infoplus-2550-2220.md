# 2026-10-13 12:30 — Claude: precios nivel 1 corregidos en Info Plus (2550 y 2220) y decisiones de las imágenes

Sigue a `2026-10-13-1215-claude-verificacion-nivel1-flyers.md`.

## Decisiones del dueño (por escrito)
Respuesta del dueño: «1- 1400 / 2- si / 3- si / 4- 1.1 1500, 1.2 2500 / Arregla en Infoplus».
1. Batería del iPhone 11 = **RD$1,400**.
2. Cristal trasero 12 Pro / 12 Pro Max = RD$2,500 (sin artículo en Info Plus; va solo en la imagen).
3. Cristal trasero 15 Plus = RD$3,500 en la imagen.
4. Ajustes en Info Plus:
   - «TAPA IPHONE XS BLANCA» → **RD$1,500**.
   - «TAPA IPHONE 14 NORMAL BLANCA» (2602) → **RD$2,500**. Ya estaba en 2,500, así que no se tocó.

## Cambio aplicado en Info Plus (solo nivel 1; contado = crédito = mínimo; niveles 2 y 3 sin tocar)
| Código | Artículo | Antes (leído en vivo) | Ahora (releído en vivo) |
|---|---|---:|---:|
| 2550 | BATERIA IPHONE 11 NORMAL 22222 | 800 | **1,400** |
| 2220 | TAPA IPHONE XS BLANCA | 3,000 | **1,500** |

- **Cómo:** función de un solo uso `infoplus-precios-ajuste-20261013`.
  - La lista de cambios está fija en el código y el token es de un solo uso (en el código solo va su hash). La clave se redacta.
  - Antes de escribir comprueba la descripción en vivo.
  - Pasos: leer → aplicar (`POST /articulo`, 2/2 `status 200 OK`) → releer (2/2 coinciden).
  - Después se **retiró** (stub 410, sin lógica) y se **borró el token**.
- Se refrescó `infoplus_articulos.niveles` con `infoplus-precios-sync`. Ya muestra 2550 = 1400 y 2220 = 1500.

## Imágenes (rama `claude/flyers-reparacion`, sin publicar)
- Batería: el 11 queda en **RD$1,400**. Se rehizo `assets/reparacion-bateria.webp`.
- Cristal trasero: sin cambios (ya tenía 12 Pro / 12 Pro Max en 2,500 y 15 Plus en 3,500).

## Pendiente
- «Publícalo» del dueño para subir las imágenes (y, aparte, el catálogo `tienda.html` y el botón de la portada en `claude/catalogo-web`).
