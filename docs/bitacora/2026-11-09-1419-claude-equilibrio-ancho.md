# Arreglo: Punto de equilibrio más ancho que la pantalla del celular (lo causó el #270)

**Hallazgo.** Lo encontré yo al probar otra cosa. Desde el PR #270, en el celular (≤900 px) la columna de `.pe-grid` medía 515 px en una pantalla de 390. Las píldoras y «Su semana» empujan el ancho mínimo, y la regla era `grid-template-columns:1fr`, que no deja encoger la columna. El resultado: las tarjetas (gastos, meta, vendedores) se cortaban por la derecha.

**Arreglo.** `grid-template-columns:minmax(0,1fr)` en la regla del celular. `taller.html` carga `conta-equilibrio.js?v=20261109-pe28`.

**Prueba.** Arnés a 390 px: la tarjeta de gastos y `.pe-grid` miden 366 px, igual que antes del #270, y no hay scroll horizontal. No cambia ningún cálculo.

**Rama:** `claude/equilibrio-ancho`. Sin publicar.
