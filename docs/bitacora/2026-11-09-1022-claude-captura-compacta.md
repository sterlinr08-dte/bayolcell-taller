# Captura guiada compacta (Punto de equilibrio)

**Pedido del dueño.** Después de la verificación (`2026-11-09-1430-claude-verifica-captura-chatgpt.md`) dijo: «Súbelo, y compacta». Esa bitácora se subió en el PR #265.

**Cambio.** Solo `conta-captura.js` (función `render` y un clic nuevo) y `conta-captura.css`. Se cargan como `pc2` en `taller.html`. No cambia ningún cálculo, ni la RPC, ni los datos.

| Antes | Ahora |
|---|---|
| Cada gasto ocupaba unos 330 px en el celular. | Unos 130 px. |
| Concepto en una línea y monto en otra. | Concepto, monto y × en una sola fila (también a 390 px). |
| Etiquetas «Estado» y «Comprobante», más un recuadro grande «Adjuntar foto o PDF». | Una fila: estado con su color (verde Confirmado, azul Estimado, ámbar Por revisar), 📎 que muestra cuántos archivos hay y botón de nota. |
| «+ Nota y ayuda» siempre visible. | Se abre con su botón y queda abierta si el gasto ya tiene nota. |
| «Registró X · fecha» | «X · fecha» |
| Recuadro de avance con relleno de 24 px. | Relleno de 14–16 px. |

**Pruebas.** Arnés `h8` con datos de octubre, a 390 y 1280 px:
- sin errores de JS y sin scroll horizontal;
- los controles miden 46 px;
- la nota abre, pone el cursor en el texto y marca `aria-expanded`;
- cambiar a «Confirmado» actualiza el avance a 1 / 10.

**Rama:** `claude/captura-compacta`. Sin publicar.
