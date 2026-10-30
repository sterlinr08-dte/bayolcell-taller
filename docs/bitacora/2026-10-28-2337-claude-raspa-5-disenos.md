# Raspa y gana: 5 diseños de la prefactura con premio

## Pedido del dueño (29-oct-2026)
- Preguntó cómo se ve la hoja impresa de la prefactura y si el premio se canjea ahí mismo.
  - Respuesta: sí, en la misma prefactura.
  - Primera maqueta: https://claude.ai/artifact/Cz8K4NGZdSjcihc3hJCJDe
- Después pidió «Métele 5 agentes diseñadores gráficos y con /apple-design».

## Qué se hizo
Cinco diseñadores (agentes), todos con la skill `apple-design`. Cada uno trabajó un estilo distinto:
1. Vidrio estilo iPhone: el premio como un pase de Wallet.
2. La hoja impresa primero: hoja carta y recibo de 80 mm, con cupón para recortar.
3. Caja rápida en la PC: dos columnas, cifras que ruedan y atajos de teclado.
4. Cupón que se arrastra: con física de resorte y un sello de «Aplicado» o «Usado».
5. Simple para la cajera: 3 pasos y botón Deshacer.

Las 5 en un solo enlace: https://claude.ai/artifact/5jUEC6V3o1Erne5fDufmi4

## Pruebas
- Playwright a 390 y 1280 px en las 5: sin scroll horizontal y sin errores de JS.
- Cada diseñador midió además lo siguiente:
  - todo lo que se toca, 44 px o más;
  - los campos, 48 px con letra de 16 px;
  - el botón principal, 54 px;
  - ningún texto por debajo de 13 px.

## Estado
- Solo son maquetas. No se tocó código del taller ni la base.
- Falta que el dueño:
  - elija un diseño;
  - confirme el reparto (80 / 15 / 5);
  - confirme el tope de 3 accesorios gratis por día.
