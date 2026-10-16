# Despachar teléfonos: «Guardar e imprimir» en un solo botón — 16-oct-2026

**Pedido del dueño:** «GUARDAR+IMPRIMIR JUNTOS».

**Qué cambió** (sigue `2026-10-16-1350-claude-despacho-guardar-imprimir.md`):
- En la ventana Despachar teléfonos, los botones «Guardar» e «Imprimir» pasan a ser uno solo: **«Guardar e imprimir»** (`_despTelGuardarImprimir`).
- El botón guarda el borrador en la computadora y abre la hoja sin precios, con IMEI y color, para imprimir.
- «Despachar» sigue aparte, igual que antes.

**Versión:** `taller-app.js?v=20261016-dc2`. Va en la misma rama que el color en el conduce.

**Prueba en Chromium:**
- Marcar 3 teléfonos → «Guardar e imprimir»: se abre la hoja.
- Cerrar y volver a abrir la ventana: los 3 siguen marcados.
- Sin errores.

**Rama:** `claude/despacho-color`. **No publicado.**
