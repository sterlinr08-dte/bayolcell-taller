# 1-nov-2026 · Claude · Sin internet: una sola señal (corrige la entrada de la animación «Sin conexión» de hoy)

- **Dueño:** «Pero veo que hay otra señal de cuando no hay internet». El aviso rojo pequeño de `taller-rapidez.js` y la ventana nueva salían a la vez.
- **Arreglo:**
  - Mientras la ventana está abierta, `html.bc-sin-abierto` esconde `#bcrzRed.mal`.
  - Al tocar «Seguir trabajando», vuelve el aviso rojo pequeño.
  - El texto de la ventana ahora lleva lo importante: «Lo que guarde ahora no se guarda. Se quita sola al volver.»
- **Versión:** `?v=20261101-sin2`.
- **Pruebas:** `sin-internet.cjs` **21/21 OK**, con 2 pruebas nuevas: la ventana no muestra el aviso rojo, y al cerrarla el aviso vuelve.
- **Estado:** rama `claude/sin-internet`, sin publicar.
