# Claude · Black Friday: 20 % en glass delantero de iPhone → Info Plus nivel 1

Sigue a `…-claude-minimo-pantallas-black-friday.md` y a las bitácoras del glass del 10/11-nov.

## Pedido del dueño (11-nov-2026)
Volante «Reparación de glass delantero iPhone · Black Friday». Se le propuso 20 % redondeado a precios terminados en 90 y una salida para los 3 artículos compartidos; respondió «Sí».

## Qué se hizo (22 artículos, nivel 1, por `POST /api/articulo`, contado = crédito = precio + mínimo, juntos)
- **19 artículos de un solo modelo:** precio sin cambio; mínimo = precio de oferta (≈80 %, terminado en 90). Ej.: 15 Pro Max 8,990 → mín. 7,190; 16 Pro Max 12,000 → 9,600; 8 Plus blanco/negro (2811, 2812) 1,000 → 800.
- **3 artículos compartidos (sin crear artículos nuevos):** precio = el del modelo caro; mínimo = oferta del modelo barato.
  - 2775 «XR / 11»: precio 2,000 → **1,990**; mín. 1,190.
  - 2776 «12 / 12 Pro»: 2,500 → **3,490**; mín. 2,390.
  - 2778 «13 / 13 Pro»: 3,700 → **4,490**; mín. 2,790.
- Función de un solo uso `infoplus-precios-glass-unavez` v9 (prueba con 2811 y luego el resto), **desactivada** (v10: 410, `verify_jwt=true`), token borrado.
- Comprobado: 22 de 22 en `infoplus_articulos.niveles` / `niveles_min`. Niveles 2 y 3 sin tocar.

## 1 de diciembre (recordatorio `trig_01AWT6WUr8RB5aSsinVTX1w1`)
- 19 artículos de un modelo: mínimo = precio.
- **Los 3 compartidos NO van a mínimo = precio**, sino al precio normal del modelo barato, para poder seguir cobrándolo: 2775 → 1,500 (XR), 2776 → 2,990 (12), 2778 → 3,490 (13).

## Para deshacer
2775 / 2776 / 2778: volver a 2,000 / 2,500 / 3,700. Resto: mínimo = precio.
