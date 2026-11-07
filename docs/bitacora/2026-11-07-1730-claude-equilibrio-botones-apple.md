# Punto de equilibrio: botones y diseño estilo Apple (07-nov-2026)

**Pedido del dueño:** «/apple-design para que ajuste los botones y diseño». Se revisó con los estilos reales de la app cargados en el simulador (los `<style>` y hojas de `taller.html` y los íconos Tabler).

## Hallazgos y cambios (`conta-equilibrio.js`, versión pe12, rama `claude/metas-periodo`)

| Hallazgo | Cambio |
|---|---|
| Las etiquetas de los gastos variables salían en MAYÚSCULAS y partidas en 4 o 5 renglones. Era el CSS global de la app sobre `label span`, contra la regla DESIGN §4b. | Se fuerza `text-transform:none`. Cada variable queda en una fila (nombre y casilla), con separador, de 56 px de alto y 2 columnas en la PC. |
| La cabecera (mes y 3 botones) ocupaba 2 renglones en el celular. | Hay un control segmentado (`.pe-seg`): Actualizar, Reporte y Excel en una sola barra, con iconos naranja. En el celular, los 3 botones son iguales y van debajo del mes. |
| Las pestañas de tiendas ocupaban 2 renglones en el celular. | Una sola fila que se desliza de lado (scroll-snap, sin barra visible). |
| En el celular el monto del gasto quedaba en 130 px. La regla de 480 px estaba antes que la de la PC y perdía. | Se repite la regla al final; el monto ocupa todo el ancho junto a la ×. |
| La meta en pesos del vendedor se cortaba en la PC. | El campo mide 150 px y su padding queda fijo. |
| El botón Guardar medía 44 px porque lo pisaba el CSS de la app. | Mide 54 px (botón principal); en el celular, Copiar y Guardar ocupan todo el ancho. |
| — | Todo botón se hunde al tocarlo (`scale(.97)`, 100 ms); con «reducir movimiento» no se anima. |

## Pruebas (Playwright a 2x con los estilos reales, 390 y 1280 px)
- No hay controles de menos de 44 px ni desplazamiento hacia los lados.
- Guardar mide 54 px.
- Se revisaron capturas antes y después.
