# Fotos realistas por color, botón «Abrir» y despacho con buscador — 16-oct-2026

**Pedidos del dueño:**
1. «Las imágenes de los iPhone que se vean realistas y el botón Abrir no tiene ninguna acción.»
2. «Vamos a mejorar y poder seleccionar y buscar los que le vamos a hacer el despacho.»

## 1. Fotos realistas por modelo y color
- El dueño eligió en la pregunta «Buzzy genera fotos».
- **Cuántas:** 93 fotos con Buzzy (Nano Banana Pro, 1K, 4:3). Son todos los colores oficiales de `_IPHONE_COLORES`, del iPhone 8, X, XS, XR, SE y del 11 al 17, incluido el Air. Las versiones Plus, Pro Max y mini comparten la foto de su modelo.
- 6 fotos se rehicieron porque salieron inclinadas o con fondo gris.
- **Formato:** recortadas a 4:3, de 480 px de ancho, en JPG de unos 12 KB cada una. Están en `img/iphone-colores/<familia>-<color>.jpg`.
- **Código:** `_bcfFotoColor(modelo, color)` busca la foto. Si no existe, la tarjeta usa el dibujo `_bcfTelefonoColor`, y si no hay color asignado, la foto del catálogo como antes.
- **Estilo:** `mix-blend-mode:multiply` para que el blanco de la foto se funda con el fondo de la tarjeta.
- Son imágenes hechas con IA, con el aspecto de las fotos oficiales; no son fotos de los equipos reales.

## 2. Botón «Abrir» de la tarjeta
- Era un `<span>` dentro de `.bcf-acc`, que detiene el clic, así que no hacía nada.
- Ahora es un `<button>` que ejecuta la misma acción principal de la tarjeta: ficha, panel o evaluación, según el estado del equipo.

## 3. Despachar teléfonos con buscador
- La ventana abre aunque no haya nada marcado.
- **Lista:** muestra los teléfonos listos para venta (más los que ya estaban marcados), con casilla, modelo, IMEI, color, lote y código de Info Plus.
- **Búsqueda:**
  - por modelo, IMEI, color, lote o código;
  - al escanear o escribir el IMEI y dar **Enter**, se marca solo;
  - «Marcar los visibles» y «Quitar todos».
- **Sin código de Info Plus:** esos teléfonos se ven apagados y no se pueden marcar.
- **Documento:** abajo se arma «Documento a despachar» por modelo, con costo promedio y los IMEI, igual que antes. `_despTelConfirmar` no cambió; solo se agregó la protección de que haya al menos uno marcado.

**Archivos:** `taller-app.js`, `taller-flota.js` (estilos de la foto y del botón), `img/iphone-colores/` (93 JPG), `crm-marketing-consent.js` (versión de flota) y `taller.html` (versiones).

**Pruebas:**
- Chromium con datos de ejemplo:
  - buscar «14 plus» y marcar los visibles;
  - escanear un IMEI con Enter;
  - el resumen sale con 4 teléfonos y su total.
- Las tarjetas muestran la foto por color.
- `node --check` sin errores.

**Rama:** `claude/tarjeta-fotos-abrir`. **No publicado.**
