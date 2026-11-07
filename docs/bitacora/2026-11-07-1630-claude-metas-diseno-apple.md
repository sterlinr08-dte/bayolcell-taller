# Metas por periodo y por vendedor: diseño estilo Apple (07-nov-2026)

**Pedido del dueño:** «La parte visual /apple-design /design». Se refiere a las secciones nuevas de la entrada `2026-11-07-1600-claude-metas-periodo-vendedor.md`. Se usó la skill `apple-design`.

## Cambios (`conta-equilibrio.js`, versión pe10, rama `claude/metas-periodo`)
- **Meta por periodo.** En lugar de una tabla hay 4 tarjetas: Hoy, Esta semana, la quincena en curso y el mes. En un mes pasado o futuro son: un día hábil, 1ª quincena, 2ª quincena y mes.
  - Cada tarjeta lleva un **anillo de progreso** (SVG) que se pone verde al cumplir.
  - El **% va grande**, con letra apretada y números del mismo ancho. Debajo van el vendido y la meta en forma corta («RD$ 519 mil»).
  - Abajo dice «Faltan…» o «✓ Cumplida».
  - El periodo en curso va resaltado en tono naranja suave.
  - Se ven 4 columnas en pantallas grandes y 2 en el celular o cuando la columna es angosta.
  - La quincena que no está en curso se muestra en una línea aparte.
- **Meta quincenal por vendedor.** Es una lista de tarjetas:
  - una inicial en círculo de 44 px (gris con el código si el vendedor no tiene nombre);
  - el nombre, con el código y el % del mes anterior;
  - el campo del % (48 px, letra de 16 px);
  - dos bloques por quincena: el % logrado o la meta, una barra fina y «vendido de meta».
  - En la cabecera dice «Suma 100 %» en verde, o el aviso en rojo si no suma 100.
- Las animaciones solo cambian el arco y la barra (500 ms, curva de salida). Con «reducir movimiento» del teléfono no hay animación.

## Pruebas (Playwright a 2x, 390 y 1280 px)
- No hay controles de menos de 44 px ni desplazamiento hacia los lados.
- Se revisaron capturas de las dos secciones en las dos medidas.
