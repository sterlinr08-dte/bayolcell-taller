# Despachar teléfonos: botones Guardar e Imprimir — 16-oct-2026

**Pedido del dueño:** «Y los botones de guardar, imprimir». El dueño eligió en la pregunta: «En Despachar teléfonos».

## Cambios en `taller-app.js` (ventana Despachar teléfonos)

### Guardar
- Guarda la lista marcada y la ruta (desde y hacia) como **borrador en esta computadora** (`localStorage`, clave `bayolDespTelBorrador`). **No manda nada a Info Plus.**
- Al volver a abrir la ventana sin nada marcado, el borrador se carga solo y sale el aviso «Borrador guardado el … por … · N teléfono(s)», con la opción **Descartar**.
- Si ya había teléfonos marcados, el aviso ofrece **Cargar** el borrador.
- Los que ya se despacharon (vendidos) no se cargan.
- El borrador se borra solo cuando el despacho sale bien en Info Plus.

### Imprimir
- Abre la hoja «Lista de despacho de teléfonos — Antes de despachar».
- Lleva la fecha, el usuario, desde y hacia, y el total de teléfonos.
- Tabla por modelo con cada IMEI y su color, código IP, cantidad, promedio y subtotal, más el total.
- Al final, firmas de «Entregado por» y «Recibido por».

### Botones
- Guardar, Imprimir y Despachar se desactivan si no hay nada marcado.
- El despacho real y el conduce de Info Plus (que sale después de despachar) no cambiaron.

## Versión y pruebas
- **Versión:** `taller-app.js?v=20261016-dg1`.
- **Pruebas en Chromium:**
  - marcar 3 → Guardar → cerrar → abrir: cargó los 3, con la ruta;
  - Imprimir abrió la hoja correcta;
  - sin errores.
- `node --check` sin errores.

**Rama:** `claude/despacho-guardar-imprimir`. **No publicado.**

**Límite:** el borrador vive en esa computadora; en otra no se ve. Si hace falta compartirlo entre computadoras, se puede pasar a una tabla de Supabase.
