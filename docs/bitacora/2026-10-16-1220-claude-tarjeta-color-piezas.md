# Tarjeta de Reacondicionados: el equipo en su color y las piezas puestas — 16-oct-2026

**Pedido del dueño** (captura del iPhone 14 Plus Rojo, que mostraba la foto con todos los colores):
«Cuando se le asigne el color, que solo se refleje uno, la parte de atrás y la de adelante, y ajustar el cuadro para que se visualicen las piezas que se le pusieron.»

**Diagnóstico:**
- La foto de la tarjeta sale del catálogo web (`catalogo_items.foto_url`), una por modelo, y casi siempre trae todos los colores juntos.
- No hay fotos por color en la base.

**Qué se hizo** (`taller-app.js`, junto a `renderEquipoReacondCard`; estilos en `taller-flota.js`):
- `_bcfTelefonoColor(modelo, hex)`: dibuja **un solo teléfono, de atrás y de frente**, pintado con el color oficial asignado. Usa el mismo `_eqColorHex` que el puntito de color.
  - **Cámaras de atrás:** se dibujan según el modelo. Pro con 3 lentes; 11 y 12 con 2 lentes en vertical; 13, 14 y 15 con 2 en diagonal; 16 y 17 en una píldora; SE, 6, 7 y 8 con una sola lente; otras marcas con lentes en columna.
  - **Frente:** isla dinámica (14 Pro y del 15 en adelante), muesca (X a 14) o botón de inicio (SE, 6, 7 y 8).
  - **Sin color asignado:** sigue la foto del catálogo, como antes.
- `_bcfPiezasHTML`: la etiqueta «Piezas Info Plus» se cambió por un cuadro **«Piezas puestas N»**.
  - Lista los nombres de las piezas del equipo, hasta 3, y luego «+N más». Con el mouse encima se ven todas.
  - Las piezas pendientes salen marcadas «Pedida».
  - No cuentan las rechazadas ni las devueltas. Sin costos, porque la tarjeta la ven los técnicos.
- Versiones: `taller-flota.js?v=20261016c1` y `crm-marketing-consent.js?v=20261016-c1`.

**No se tocó:** datos, Supabase, Info Plus ni la lógica de estados.

**Pruebas:**
- 8 tarjetas de ejemplo en Chromium: 14 Plus Rojo, 15 Pro Max Titanio, 13 Pro Azul alpino, 12 Blanco, 16 Verde azulado, 11 Morado, SE Negro y Galaxy S23 Verde.
- Sin errores en la consola.
- `node --check` de los dos archivos, sin errores.

**Rama:** `claude/ficha-equipo-mejoras`, junto con la ficha compacta. **No publicado.**

**Siguiente paso posible:** si el dueño quiere fotos reales por color, se pueden subir al catálogo por color y la tarjeta las usaría primero.
