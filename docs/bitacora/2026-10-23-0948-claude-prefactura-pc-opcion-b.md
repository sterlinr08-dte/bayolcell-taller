# Prefactura en PC: Opción B (una columna compacta) — 23-Oct-2026 09:48 RD

## Pedido del dueño
Captura de la Prefactura en PC: «vamos a ordenar bien esa interface, hay mucho vacío, primero vamos a planificar» → «muéstrame primero».
Se le mandaron dos maquetas (A: dos columnas con totales pegajosos; B: una columna compacta). **Eligió la B** (devolvió la imagen de la Opción B).

## Diagnóstico (fuente de verdad: `taller-prefactura.js` `organizar()` y `taller-prefactura.css`)
- La franja tenía 4 casillas (Cliente · Nivel · Almacén · Vendedor) pero la última regla de la cascada (bloque «(h)», 20-oct) la dejaba en **3 columnas** → el Vendedor caía solo en una segunda fila.
- Los datos del cliente iban en una cuadrícula de 3 (Nombre · Cédula · WhatsApp), pero la tarjeta «Recibir promociones por WhatsApp» (capa `crm-marketing-consent-legacy.js`, se cuelga dentro de la celda del WhatsApp) tenía ~150 px de alto y abría un hueco debajo de Nombre y Cédula.

## Cambios (solo PC, ≥761 px; el celular queda igual)
- `taller-prefactura.css` (n7), bloque nuevo al final:
  - franja en **4 columnas** (1.5fr · 1fr · 1fr · 1fr);
  - datos del cliente en **una fila**: Nombre (2fr) · WhatsApp (1.7fr) · Cédula (1fr); la cédula pasa al final con `order` (en celular sigue debajo del nombre);
  - la celda del WhatsApp es una cuadrícula campo + **píldora «Promos»** (48 px de alto, interruptor en caja de 44×44);
  - sucursal y estado de la casilla se ven en una tarjetita al pasar el ratón o enfocar la píldora; el borde de la píldora cambia de color según el estado (verde guardado, ámbar aviso, rojo error);
  - 14 px de aire entre los datos del cliente y el buscador.
- `taller-prefactura.js` (i15): cuando la capa de marketing cuelga su casilla, se le inserta el texto corto «Promos» (`.bcpf-promo-t`, oculto en celular) y un `title` con el texto completo. Se usa un `MutationObserver` en la celda del WhatsApp porque la casilla llega después.
- `taller.html`: versiones n7 / i15.

## Medidas (Playwright, banco local con Supabase simulado)
| Ancho | Franja | Fila de datos | Píldora Promos | Interruptor |
|---|---|---|---|---|
| 1280 | 4 casillas en una sola fila (y=200) | Nombre, WhatsApp y Cédula en y=313 | 146×50 px | 44×44 px |
| 1920 | igual, documento 1200 px centrado | igual | 146×50 px | 44×44 px |
| 390 | sin cambios (apilado) | sin cambios (Nombre → Cédula → WhatsApp) | tarjeta completa como antes | como antes |

Sin errores de JS en los tres anchos. Capturas en el scratchpad (`pf-pc/b-vivo-*.png`).

## Riesgos / notas
- La fila usa `:has()` (Chrome 105+, Safari 15.4+). En navegadores viejos la celda del WhatsApp vuelve al apilado anterior (no se rompe nada).
- No se tocó la lógica de la casilla de promociones (guardar, sucursal, estado), ni Supabase, ni Info Plus.

## Rama y estado
- Rama `claude/prefactura-pc` (desde `main`). **Sin publicar**: espera el «publícalo» del dueño.

## Siguiente paso
Que el dueño la vea; con su OK, mezclar a `main` (GitHub Pages).
