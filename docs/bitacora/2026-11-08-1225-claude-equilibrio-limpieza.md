# Punto de equilibrio: limpieza de lo que sobra (C10 de untangle) (08-nov-2026, 12:25 RD)

Corrección siguiente según la regla del dueño («continúa siempre que falte un paso»). No toca cálculos de dinero.

## Cambio
- **`conta-equilibrio.js` (pe20)**
  - Se quitó el CSS muerto de la versión vieja de vendedores (`.pe-v-q`, `.pe-vq*`) y de la casilla de ITBIS que ya no existe (`.pe-itbis`).
  - Se quitó el campo oculto `pe_mes`: solo se escribía y nadie lo leía. El mes vive en `st.mes`.
  - Al agregar un gasto o un préstamo, el cursor va al campo nuevo enseguida. Antes había una espera de 30 ms que no hacía falta, porque `pintar()` es síncrono.
- **`conta-base.js` (cb2)**: la animación ya no busca `.pe-vq-b`.
- Se dejaron como están, a propósito, las esperas que acompañan una transición CSS (cerrar la hoja y el selector de mes) y las reglas CSS que se pisan entre sí. Cambiar esas reglas puede mover el diseño y no vale el riesgo.

## Pruebas
- Capturas de pantalla completas, antes (pe19) y después (pe20), a 390 y 1280 px: General, Santiago, Navarrete y Gastos comunes. **Las 8 son idénticas, píxel por píxel.**
- El foco cae en el campo nuevo al agregar un gasto y al agregar un préstamo.
- El cambio de mes con las flechas y con el selector funciona.
- Sin errores de JavaScript.

## Estado
- Rama `claude/equilibrio-limpieza`. No publicado: espera el «publícalo».
- Siguiente corrección: C7, números negativos e ITBIS. Toca la lectura de montos, así que va con prueba de cifras.
