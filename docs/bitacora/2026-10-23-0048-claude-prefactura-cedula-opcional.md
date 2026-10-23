# 2026-10-23 00:48 (RD) — Prefactura: la cédula debajo del nombre, marcada como opcional

## Pedido del dueño
Captura del campo «Cédula» de la Prefactura: «Debajo del nombre es opcional».

## Cambio
- `taller-prefactura.js` (i14): el campo Cédula (con su RNC oculto) pasa a ir justo debajo de «Nombre del cliente»,
  con la etiqueta «Cédula (opcional)». El WhatsApp queda después, con su interruptor de promociones.
  Mismos `id` y mismas funciones; no cambia qué se guarda ni qué viaja a Info Plus.
- `taller-prefactura.css` (n6): en PC la franja queda Nombre (2) · Cédula (1.3) · WhatsApp (1).
- `taller.html`: versiones i14 y n6.

## Pruebas
- Sintaxis del JS comprobada. Banco local a 390 px: orden Nombre → Cédula (opcional) → WhatsApp → promociones.

## Publicación
- Directo en `main` (ajuste pedido sobre la pantalla publicada hoy); verificado en vivo.
