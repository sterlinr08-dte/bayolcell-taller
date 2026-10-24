# 24-oct-2026 (RD) · Claude · Botón «Consulta» del chat con signo de pesos — rama sin publicar

- Dueño preguntó dónde estaba el botón de consultar precio en la web móvil. En el celular solo se veía una lupa,
  igual a la de «Buscar en el chat» que está al lado, y se confundían.
- Dueño: «Pon el botón de consulta con el signo de pesos».
- `crm-consulta-precio.js` (h3): el ícono del botón de la cabecera del chat y el del título de la ventana pasan de
  `ti-search` a `ti-currency-dollar`. Nada más cambia (sigue siendo solo consulta). `taller.html` carga `?v=20261024-h3`.
- Probado a 390 px con los íconos reales: la barra queda ⋮ · $ (Consulta) · etiqueta · lupa (buscar en el chat) · asignar.
- Rama `claude/consulta-pesos`, sin publicar hasta «publícalo».
