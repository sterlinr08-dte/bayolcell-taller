# 22-oct-2026 23:15 · Claude · Cliente de contado: nombre a Info Plus como «CONTADO <nombre>»

**Dueño:** «Funciona el cambio de nombre. Cada vez que le cambie el nombre al código 1, siempre con prefijo CONTADO + nombre.»
- `taller-app.js` (p18): `_rpNombreInfoplus()`: cód. 1 → «CONTADO» o «CONTADO Juan Pérez» (si ya escribieron «contado …»
  no se repite); cliente de Info Plus → lo escrito o su nombre. Lo usa `_rpCrearPrefactura` (modelo y guardado local).
- `taller-prefactura.js` (i12): la tarjeta Cliente muestra el mismo nombre que se manda.
- Pruebas unitarias: '', 'Juan Pérez', 'contado Juan', 'CONTADO', cliente 55 con y sin texto.
Publicado en `main`.
