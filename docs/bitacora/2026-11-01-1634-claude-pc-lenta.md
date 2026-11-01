# 1-nov-2026 · Claude · PC de bajos recursos: menos trabajo por tecla

## Pedido del dueño
- «La lentitud se nota en PC de bajos recursos» (después del Modo PC rápido, PR #176).

## Medición (banco, PC 1366×768 con la CPU simulada 6 veces más lenta)
- Escribir en «Nombre visible» de Recepción: unos **110–130 ms por tecla**. Desde unos 100 ms ya se siente el lag.
- Qué corre en cada tecla, según el perfil:
  1. `taller-info.js` (las ⓘ de ayuda): un `MutationObserver` sobre todo el `body` volvía a correr `aplicar()`, que recorre toda la pantalla, en **cada** cambio.
  2. `taller-prefactura.js`: `_rpRenderResumen` repintaba la hoja de la prefactura (`pintarDoc`) en **cada** tecla.
  3. Animaciones y transiciones.
  4. **Lo que queda:** el propio navegador al recalcular estilos y pintar, por el tamaño del taller (unos 4,700 nodos y 680 KB de CSS). Eso es la etapa «dividir».

## Cambios (rama `claude/pc-lenta`, sin publicar)
- **`taller-info.js` (`?v=20261101-t12`):** al primer cambio corre en el próximo cuadro, como antes. Si siguen llegando cambios, corre como mucho una vez cada 300 ms y la última siempre corre.
- **`taller-prefactura.js` (`?v=20261101-i33`):** en PC (`html.bc-pcr`), mientras se escribe en un campo, la hoja se repinta 120 ms después de la última tecla.
  - Cualquier toque (`pointerdown`), tecla especial (Enter, Tab…), `beforeprint` o `bcPfPintar()` la pinta al instante (`pintarDocYa`). Así Guardar o imprimir nunca usan una hoja vieja.
- **`taller.html` (modo ligero, `html.bc-ligero`, automático en PCs de ≤4 núcleos o ≤4 GB, o sin aceleración gráfica):**
  - Animaciones y transiciones a 0.01 ms con una sola vuelta. No se usa `none`, para que los avisos de fin de animación sigan llegando y nada se quede trabado.
  - Especificidad de 3 ids, para ganarle a las capas viejas.

## Resultado (3 corridas cada uno, mediana por tecla)
- PC normal con CPU lenta: 130/107/103 → **89/105/92 ms** (unos 15 % menos).
- Modo ligero: 111/106/113 → 108/102/99 ms.
- La simulación solo frena la CPU, no la tarjeta de video. En una PC real de bajos recursos pesa mucho la pintura; la quita del vidrio (PR #176) ahí ayuda más de lo que este banco puede medir.

## Pruebas
- `prefactura-confiable`: guardar, historial, PDF e imprimir, `errores []`.
- `prefactura-delivery`: 78 OK.
- `prefactura-linea-referencia`: 20 OK.
- `prefactura-stock-otras`: 16 OK.
- `impresion-facil`: 35 OK.
- `sin-internet`: 23 OK.

## Siguiente paso
- Que el dueño lo pruebe en la PC lenta real.
- Lo que queda depende del tamaño del taller: aligerar `bc-form-espaciado` (91 `:has`) y dividir el taller por partes.
