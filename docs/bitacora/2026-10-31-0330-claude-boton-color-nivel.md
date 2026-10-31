# Buscar artículo: color del botón según el nivel de precio (31-oct-2026, 03:30 RD) — rama, SIN publicar

**Dueño (captura de la lista):** «naranja es cliente final, al por mayor color azul, cliente extremo amarillo; y si no hay, rojo con gris».

**Qué hace (`taller-recepcion.js` g14 / `.css` g9):** el botón de precio lleva la clase `pk-n1/2/3` según el nivel con que se agrega (el del cliente o el que eligió el administrador en la fila):
- **Cliente final** → naranja · **Por mayor** → azul · **Extremo** → amarillo (letra oscura para que se lea).
- **Sin existencia** → fondo gris con letra y borde rojos («Sin stock», apagado).

**Pruebas:** `prefactura-boton-precio.cjs` con 4 comprobaciones nuevas (n1 naranja, n2 azul, n3 amarillo, sin stock rojo) «Todo bien» a 390/1280 y con empleado.
