# 2026-10-20 23:20 · Claude · Consulta: botón copiar en el cuadrito azul del precio

## Pedido del dueño
«Ya probé la consulta y quedó bien. Vamos a ponerle en el cuadrito azul un ícono de copiar, para más rápido.»

## Cambio (`crm-consulta-precio.js` y `.css`, versión 20261020-h1)
- **El botón.** Hay un ícono de copiar dentro del cuadrito azul «Cliente final», a la derecha, de 44 px.
- **Qué copia.** Una línea lista para pegarle al cliente: «NOMBRE DEL ARTÍCULO REFERENCIA: RD$ precio».
  - Ejemplo: «CELULAR IPHONE 13 MINI 128GB: RD$ 15,000.00».
  - Si la referencia es AVISO, agrega «(con aviso)».
- **Al tocarlo.** El ícono cambia a ✓ verde por un momento y sale el aviso «Copiado: …».
- **Navegadores viejos.** Si el navegador no tiene `navigator.clipboard`, se copia con el método anterior.
- **Sigue siendo solo consulta.** No escribe ni envía nada por su cuenta; la persona pega el texto donde quiera.

## Pruebas
`crmprecio` 25/25. Se agregaron dos pruebas: el texto que se copia y la marca ✓.

## Estado
Rama `claude/prefactura-limpia`, sin publicar.
