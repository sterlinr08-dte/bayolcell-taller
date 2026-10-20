# 2026-10-20 01:30 — Claude — Prefactura: descuento, tarjeta del cliente, buscador en línea y revisión de diseño

Sigue a `2026-10-20-0030-claude-prefactura-limpia.md`. Rama `claude/prefactura-limpia`, **sin publicar**.

## Solicitud del dueño
«Antes publicar vamos a desarrollar para que quede perfecto.» Eligió las 4 mejoras propuestas: tarjeta del cliente
completa, precios con formato y descuento, «Servicio / falla» dentro del buscador (+ atajos), revisión de diseño completa.

## Cambios
- **Descuento por línea (%)** — `taller-app.js`: `_rpDescPct`, `_rpBruto`, `_rpImporte`, `_rpTotales`.
  - Importe = precio × cantidad × (100 − %)/100, redondeado a 2 decimales. Tope 0–100 %.
  - Modelo a Info Plus: `porcentaje` por línea, `descuento` y `descuentototal` = suma de descuentos, `total` neto.
  - `recepcion_prefacturas.subtotal` = bruto, `total` = neto; `items[].descPct` se guarda y se recupera al editar.
  - Impresión: columna «Desc.» y línea «Subtotal · Descuento» solo si hay descuento (la comparte la prefactura de Inventario sin cambios).
  - ⚠️ **Sin probar contra Info Plus real**: falta confirmar cómo Info Plus interpreta `porcentaje` / `descuento`. Hacer una prefactura de prueba con el dueño antes de publicar.
- **Precio con formato** «2,500.00» (campo de texto; acepta «3,000»).
- **Impresión:** comentario y falla por separado (antes los dos salían como «Falla»).
- **Tarjeta del cliente** (como STUDIO): código + cédula/RNC y teléfono + dirección de Info Plus; en celular solo la flecha.
- **Píldoras:** Prefacturas · Nueva · Pedir reseña (se quitó «Buscar», repetía la barra F2). «Nueva»/F10 limpia con confirmación.
- **Buscador:** «Servicio / falla» en la misma línea (en celular solo el ícono, 48 × 48). **Atajos (PC):** F2 buscar, F9 guardar, F10 nueva.
- **Revisión de diseño (skill impeccable, critique con 2 evaluaciones aisladas):**
  - Lupa de la cabecera → ícono de prefacturas; quitar línea → papelera.
  - `--pf-mute` #85817a → #6b675f (contraste ≥ 4.5:1); etiquetas, chips, atajos y estado a 13 px; placeholder #6b7280.
  - Foco visible (teclado) en tarjeta, píldoras, plegables, barra, buscador.
  - Al empezar a llenar el equipo, «Más datos» marca * en nombre, WhatsApp y modelo y dice «Para la orden falta: …».
  - Celular: cabecera en 1 línea (sin «PREFACTURA»), precio + desc. en una fila y cantidad debajo, resumen de «Más datos» en 2.ª línea.
  - Rifa: botón con la paleta del documento; sin franja de color en la reseña. Detector final: 0 hallazgos en los archivos de la prefactura.
  - `crm-marketing-consent-legacy.js`: «Escriba…», «Seleccione…» (usted). Versión `V='20261020-u1'` y `?v=20261020-u1` en `taller.html` y `taller-crm2.html`.
- Versiones: `taller-app.js` / `taller-prefactura.js` / `taller-prefactura.css` `?v=20261020-e2`.

## Pruebas
- `pfopc.mjs` **52/52** (390 y 1280): todo lo anterior + formato de precio, «3,000» → 3000, 10 % → total 2,700 / descuento 300 /
  barra igual, modelo a Info Plus (precio 3000, porcentaje 10, descuento 300, total 2700), tope 100 %, aviso «falta», «Nueva», lupa.
- `pftest` 47/47, `pfdesc` 14/14, `info2` 80/80; capa apagada: `rxfun` 12/12, `rxppk` 23/23, `admalm` 18/18.
- Medidas (evaluación B): 0 controles < 44 px en el documento cerrado; campos 48 px / 16 px; barra 54 px.

## Pendiente
- Prueba real de descuento en Info Plus (con autorización del dueño) y luego «publícalo».
