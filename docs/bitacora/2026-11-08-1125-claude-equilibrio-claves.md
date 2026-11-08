# Punto de equilibrio: claves fijas para Nómina, TSS, regalía e intereses (C4 de untangle) (08-nov-2026, 11:25 RD)

## Antes
«Llenar TSS y regalía» (`sugerirNomina`) e «Intereses de préstamos» (`filaIntereses`) reconocían los gastos por el texto: «Nómina…», «TSS…», «Provisión…» y «…préstamo…». Si alguien renombraba «Nómina de la tienda» como «Sueldos», el botón decía «Escriba primero el monto de la nómina» aunque estuviera escrito.

## Cambio (`conta-equilibrio.js` pe22)
- `CLAVES`, `claveDe(g, cod)` y `ponerClaves(cod, gastos)`: cada gasto especial lleva `clave` (`nomina`, `tss`, `regalia` o `intereses`), y la clave se guarda con el gasto.
- A lo guardado antes, que no tiene clave, se le pone una al cargar, con las mismas reglas de texto de siempre. Desde el próximo «Guardar», la clave queda fija aunque se cambie el nombre.
- La fila nueva de intereses nace con `clave: 'intereses'`.

## Datos reales revisados
En `conta_equilibrio` solo hay octubre 2026. Los conceptos guardados son «Nómina de la tienda (sueldos)» (tiendas 1, 4 y 7), «Provisión regalía y vacaciones» (tienda 1), «TSS» y «Préstamos (cuota del mes)» (comunes). Las reglas de siempre los reconocen igual que antes.

## Pruebas
- Comparación completa pe21 → pe22: **273 comparaciones, 0 diferencias.**
- Prueba del caso que fallaba: se renombra «Nómina» como «Sueldos de la tienda», se agregan «TSS patronal» y «Provisión de regalía» y se toca «Llenar».
  - Antes: aviso de error y nada se llena.
  - Ahora: TSS = 29,322 (16.29 % de 180,000) y regalía = 14,994 (8.33 %).

## Estado
- Rama `claude/equilibrio-claves`. No publicado: espera el «publícalo».
- Siguientes: C6 (periodos como datos) y C9 (códigos de vendedores como datos).
