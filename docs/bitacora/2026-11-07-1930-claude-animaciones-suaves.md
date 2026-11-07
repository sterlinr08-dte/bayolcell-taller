# Punto de equilibrio: animaciones suaves (07-nov-2026)

**Pedido del dueño:** «Ponle animaciones suaves».

## Cambio (rama `claude/vendedores-nombres`)
- **`conta-equilibrio.js`, versión pe16:**
  - nueva función `animarEntrada(cont)`, que corre **solo** al cambiar de pestaña, al terminar de cargar un mes o al cambiar de quincena (bandera `st.animar`). No se repite al escribir metas ni montos;
  - las tarjetas (KPI, meta, periodos, filas del ranking) entran en cascada con opacidad y 8 px hacia arriba, 420 ms, curva `cubic-bezier(.22,1,.36,1)`, 28 ms entre una y otra (máximo 14 escalones);
  - los anillos se dibujan desde 0 en 700 ms;
  - las barras (avance, ritmo, quincenas, ventas) crecen desde 0 en 600 a 650 ms;
  - las pestañas y el selector de quincena cambian de color con transición de 220 ms;
  - solo se animan `transform`, `opacity`, el arco del anillo y el ancho de las barras;
  - con «reducir movimiento» del teléfono no se anima nada.
- **`conta-ventas.js`, versión rv3:** la pestaña Ventas usa la misma animación (`BayolEquilibrio._anim`) cuando llegan los datos o se cambia de tienda.

## Prueba
- Fotos a los 60, 250 y 900 ms: a los 60 ms las tarjetas van entrando y los anillos dibujándose; a los 250 ms todo está en su sitio.
- Al editar un %, la animación no se repite (0 piezas animándose).
- La pestaña Ventas anima 5 piezas.
- Video de muestra grabado con Playwright a 390 px.
