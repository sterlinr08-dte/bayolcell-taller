# 2026-10-13 05:45 — Claude · Catálogo web: micro-animaciones a partir de la referencia «Claude Motion»

Sigue a `2026-10-13-0500-claude-catalogo-web.md`.

## Pedido del dueño
Mandó un enlace de Instagram (`instagram.com/p/DeZYQm2iPvw`, foto 10) con una idea: «por si sirve para aplicar mejoras».

## Qué es la referencia
- Carrusel de Charlie Hills sobre **Claude Motion**. Según el post, es una herramienta nueva de Anthropic para animaciones, por ahora solo en los planes Team y Enterprise.
- Trae 16 animaciones al estilo Apple: una sola pieza grande y **un solo cambio satisfactorio** cada una.
- La foto 10 es un **contador que rueda de 0 a 12,480**.
- Su «receta» (brief), en la foto 2: calidad de keynote de Apple, 6 segundos, el último cuadro igual al primero, el objeto ocupa el 60–70 % del cuadro, vidrio esmerilado, sombras suaves, letras pesadas, el número clave a 120 px o más, física de resorte, mantener el resultado 1.2 s, y nunca emojis ni íconos de banco de imágenes.
- Se bajó con yt-dlp: 19 videos de 6 s. Quedaron en el espacio temporal de la sesión, **no en el repo**.

## Qué se aplicó (rama `claude/catalogo-web`, sin publicar)
- **El precio rueda hasta su valor**, dígito por dígito, con un pequeño rebote (curva de resorte y 55 ms entre dígitos):
  - en los resultados de **Cambio de pantalla** («RD$ 2,500»);
  - en el precio del **celular destacado** de la portada, al cambiar de modelo.
  - Los lectores de pantalla leen el valor real (`aria-label="RD$ 2,500"`).
  - Con «reducir movimiento» activado, el número sale fijo.
- **El botón «Agregar» confirma:** se pone verde con «✓ Agregado» y un pequeño salto durante 0.9 s, y vuelve.
  - Viene del ejemplo «Click → done» de la referencia.
  - El pedido sigue sumando igual.

## Pruebas
`tests/catalogo-web/catalogo.test.cjs` → **24 de 24 OK**. Pruebas nuevas:
- el precio rueda hasta el valor correcto y se lee bien;
- el botón confirma «✓ Agregado».

Se grabó un video corto de 10.7 s en el celular para el dueño.

## Ideas que quedan para después
- Usar la misma «receta» para **reels cortos de Bayol** con HyperFrames: «Pantalla rota → pantalla nueva», «RD$ 0 → 1,000», «Pedido → listo».
