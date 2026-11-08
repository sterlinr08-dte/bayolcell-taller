# Bombillos de cristal en la guirnalda (08-nov-2026, 08:20 RD)

- Pedido del dueño: «los bombillos del arbolito vamos a ponerlos más modernos». Se mostraron 3 estilos (A Cristal, B Microluces LED, C Neón) en video; el dueño eligió **A**.
- `web-navidad.css`: cada bombillo es de vidrio, con un brillo arriba, tapita plateada y halo de su color. Se prenden y se apagan en ola (2,4 s, cada uno 0,12 s después del anterior). Colores: rojo, amarillo, verde, azul y morado.
- Respaldo para navegadores viejos: si no entienden `color-mix`, usan el color liso.
- `web-navidad.js`: cada bombillo lleva su número (`--n`) para la ola. Versión de caché `20261108n4`.
- Pruebas: Playwright a 390 y 1280 px, sin errores ni desplazamiento lateral; `?navidad=0` deja la página como antes.
- Rama `claude/santa-real`, junto con el Santa a color y el galope. No publicado: espera el «publícalo».
