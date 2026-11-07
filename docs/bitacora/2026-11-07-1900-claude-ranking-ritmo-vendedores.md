# Meta por vendedor: ranking con ritmo (opción A + C) (07-nov-2026)

**Pedido del dueño:** «¿Tienes alguna otra alternativa más moderna?». Se le mostró una maqueta con 3 opciones: A, ranking tipo competencia; B, anillos tipo Apple Watch; C, ritmo con la raya de «hoy». Eligió **«A más C»**.

## Cambio (`conta-equilibrio.js`, versión pe15, rama `claude/vendedores-nombres`)
- **Selector de quincena** segmentado (1ª · 1 al 15 / 2ª · 16 al fin). Por defecto muestra la quincena en curso.
- **Ranking:** los vendedores se ordenan por % logrado. Cada fila lleva:
  - el número de posición;
  - la inicial con un anillo de avance (verde si va adelantado o cumplió, naranja si va atrasado);
  - el nombre y el % grande;
  - una barra de ritmo con una **raya negra en el punto donde debería ir hoy**: días hábiles hasta ayer ÷ días hábiles de la quincena (Navarrete cuenta los domingos);
  - «Lleva X · necesita Y/día»;
  - una etiqueta: «✓ Cumplida», «Adelantada X», «Atrasada X», «Faltó X» si la quincena cerró, o «Empieza el 16».
- **Editar metas:** se abre en una hoja aparte (`#peVendSheet`). En el celular sale desde abajo; en la PC, centrada con vidrio.
  - Dentro están el % y la meta en pesos por mes, «Repartir según el mes anterior» y «Listo».
  - Se cierra con ×, al tocar afuera o con Escape.
- Si las metas no suman 100 %, aparece un aviso en rojo.
- El monto en pesos guarda el % con 4 decimales: RD$300,000 sobre 900,000 queda en 33.33 % y vuelve a dar 300,000 exactos.

## Pruebas (Playwright a 2x con los estilos reales, 390 y 1280 px)
- Ranking adelantado/cumplido y atrasado (con una meta de prueba de 3 millones).
- El cambio de quincena funciona.
- Hoja: el monto se convierte en % y la suma se actualiza; Escape la cierra.
- No hay controles de menos de 44 px ni desplazamiento hacia los lados.
