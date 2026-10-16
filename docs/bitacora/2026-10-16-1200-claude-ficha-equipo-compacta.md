# Ficha del Equipo compacta (Reacondicionados) — 16-oct-2026

**Pedido del dueño:** «Vamos a hacerle mejoras y ajustarla en la pantalla» (captura de la Ficha del Equipo de un iPhone 12 Pro Max en 1920×1080; había que bajar para ver todo).

**Archivo:** `taller-app.js`, función `verFichaDespacho` y estilos `_feStyles` (capa nueva al final, «Ficha compacta»). `taller.html`: `?v=20261016-fe1`.
No se tocó lógica, datos, Supabase ni Info Plus. Los mismos botones y acciones: Imprimir Label, Info Plus (Excel), Formato Info Plus, Más acciones, Agregar piezas, Pieza externa, Marcar Listo, Descontar, editar el envío.

**Cambios:**
- Cabecera: se quitó la etiqueta «LISTO» repetida (ya sale junto al nombre del equipo y en el costo).
- Arriba, en una sola tarjeta: foto pequeña, nombre, número, estado, IMEI (con copiar), serial, fecha y técnico. A la derecha está el **Proceso del equipo**, que antes quedaba abajo y fuera de la pantalla. Las fechas del proceso ahora son cortas (día/mes y hora).
- Los 6 cuadros grandes del lote son ahora una franja de píldoras («Lote C00002032 · 0 Recibidos · 10 Diagnóstico…»). Los que están en cero se ven apagados.
- Envío del lote: es una píldora a la derecha de esa franja, y para el admin se puede tocar para editarlo, igual que antes.
- La tarjeta «Técnico asignado» pasó a ser una fila de «Información del equipo», con su teléfono si existe.
- Filas vacías (Color, Estado físico) en gris suave. Notas vacías con borde punteado.
- Panel más ancho (1440 px) y espacios más ajustados. La tarjeta de costo es un poco más compacta.
- Celular: todo en una columna y las píldoras del lote se deslizan de lado.

**Pruebas:**
- Chromium con datos de ejemplo iguales a la captura.
- En 1920 px la ficha mide unos 730 px de alto y entra completa, sin bajar. Antes pasaba de la pantalla.
- En 1366 px y en 390 px (celular) no hay desbordes de lado.
- `node --check taller-app.js` y los bloques de `taller.html` sin errores.

**Rama:** `claude/ficha-equipo-mejoras`. **No publicado.** Para pasarlo a `main` hace falta el «publícalo» del dueño.
