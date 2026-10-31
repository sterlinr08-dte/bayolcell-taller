# 2026-10-31 10:20 — Claude — El panel del artículo se desliza hacia abajo como un cajón

## Dueño
«Omite lo del panel, mejor una animación al panel que desliza hacia abajo.»

## Cambio (`bc-buscador-motion` **bmo2**, misma capa, mismo interruptor `bc_bmo_off`)
- **Abrir:** el panel se descubre de arriba hacia abajo (`clip-path: inset(0 0 100% 0)` → `inset(0)`) mientras baja 14 px, en 280 ms
  con la curva de DESIGN; las filas de abajo se corren a la par (FLIP, 280 ms). Se ve como un cajón que sale de la fila.
- **Cerrar:** como `taller-recepcion.js` borra el panel de golpe, la capa guarda una copia al tocar (`pointerdown`), la pone en el
  mismo sitio (`.bmo-cierra`, absoluta dentro de la lista) y la recoge hacia arriba en 200 ms mientras las filas suben; la copia se
  borra sola. Si se abre otra fila, el panel viejo se recoge y el nuevo baja.
- **Hallazgo:** la regla `html.bc-pf body #v-recepcion#v-recepcion .bcrx-ppk-det { animation: bcpfDet }` de `taller-prefactura.css`
  (l. 688) ganaba la cascada: la animación de bmo1 del panel nunca llegó a verse. Ahora `.bmo-abre` y `.bmo-cierra` usan esa misma
  especificidad. La prueba ahora comprueba el nombre de la animación calculada (`bmoDet`), no solo la clase.
- `clip-path` no es transform/opacity, pero no provoca reflow (se recorta en composición) y es lo que permite el cajón sin estirar el
  texto. Apagado con «reducir movimiento».

## Pruebas
- `scripts/pruebas/buscador-motion.cjs`: 32/32 a 390 y 1280 + pase con reduced-motion (abrir = `bmoDet`; cerrar deja la copia
  `.bmo-cierra`, 0 paneles abiertos y la copia desaparece). Video `panel-desliza-390.mp4` enviado al dueño.
- Regresión: `prefactura-boton-precio`, `prefactura-stock-otras`: todo bien.

## Estado
Rama `claude/panel-desliza`, sin publicar. Falta el «Publícalo» del dueño.
