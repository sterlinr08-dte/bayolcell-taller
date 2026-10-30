# Regla del dueño: textos cortos (30-oct-2026, 20:00 RD) — rama, SIN publicar

**Dueño:** «simplificar las cosas… usa mucho texto que se podría cortar… un botón que se le dé agregar el delivery… no ser tan descriptivo, pero que tenga su contexto».

**Regla (vale para los 3 proyectos):** botones y avisos con la menor cantidad de palabras que se entienda: verbo + qué + dato clave (p. ej. «+ Delivery RD$ 50»). Nada de preguntas «¿Desea…? Sí / No» cuando un solo botón basta; nada de frases de ayuda debajo de los controles (si hace falta, va detrás de la ⓘ).

**Aplicado:**
- Prefactura, cliente por mayor: la caja «Cliente por mayor: ¿incluir delivery de RD$ 50.00? Sí, agregar / No» pasa a **un solo botón «+ Delivery RD$ 50.00»** (44 px, píldora punteada). Desaparece al agregarlo y vuelve si se quita.
- Aviso al tocar Delivery dos veces: «Ya tiene delivery».
- Buscar artículo: se quitó la frase «Toque un precio para agregar con ese nivel.»
- Versiones: `taller-prefactura.js` i28 / `.css` n15, `taller-recepcion.js` g12.

**Pruebas:** `prefactura-delivery.cjs` y `prefactura-boton-precio.cjs` «Todo bien».

**Siguiente paso sugerido:** pasada de textos largos por pantalla (Prefactura, CRM, Reacondicionados) con antes/después para que el dueño apruebe.
