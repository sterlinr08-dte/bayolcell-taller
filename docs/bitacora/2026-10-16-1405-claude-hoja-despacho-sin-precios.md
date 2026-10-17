# Hoja de despacho sin precios — 16-oct-2026

**Pedido del dueño:** «En la hoja de despacho no ponga precios».

**Qué cambió:** la hoja impresa del botón «Imprimir» de Despachar teléfonos (`_despTelImprimir`) se presentó en `2026-10-16-1350-claude-despacho-guardar-imprimir.md`. Ahora solo lleva:
- modelo, IMEI y color;
- código de Info Plus;
- cantidad;
- «Total: N teléfono(s)».

Ya no muestra promedio, subtotal ni total en RD$.

**Lo que sigue igual:** la tabla de la ventana en pantalla, que solo ve el administrador, y el conduce de Info Plus.

**Versión:** `taller-app.js?v=20261016-dg2`.

**Prueba:** hoja revisada en Chromium, sin precios y sin errores.

**Estado:** rama `claude/despacho-guardar-imprimir`. No publicado.
