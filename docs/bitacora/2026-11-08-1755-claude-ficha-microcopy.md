# Ficha del artículo: microcopy compacto (08-nov-2026, 17:55 RD)

Pedido del dueño, con una captura de «CELULAR ZTE BLADE L9»: «Vamos a compactar microcopy».

## Cambios (`taller-recepcion.js` g19 y `taller-recepcion.css` g14)

| Antes | Ahora |
|---|---|
| «Del cliente» dentro del precio | Se quita: el anillo ya lo dice |
| «Gana RD$ 650 · 17 %» | «+650 · 17%» |
| «−RD$ 150» | «−150» |
| Recuadros vacíos de Por mayor / Extremo cuando no tienen precio | No se muestran; el precio ocupa todo el ancho |
| «Costo RD$ 3,250.00 · solo administrador» | «Costo RD$ 3,250» con candado (la explicación pasa a la ayuda flotante) |
| «Navarrete [Aquí] [Últimas 2] … 2» | «Navarrete aquí [Últimas] 2» (el número ya dice cuántas) |
| «Sin existencia: Oficina Santiago · Garantía China · …» | «0 en Santiago, Garantía, Moca, 2do Nivel, Taller» |
| «2 en total» | «Total 10», solo si hay otras tiendas con existencia |
| «Cantidad» junto a − N + | Se quita la etiqueta; queda el control |
| «En la prefactura: N» / «Quedan N libres aquí» | «En prefactura ×N» / «N libres» |

- Recuadros de precio más bajos (56 px de alto mínimo; siguen siendo de 44 px o más).
- **Arreglo:** el detalle heredaba `align-items: center` de la regla vieja, y los bloques salían más angostos. Ahora ocupan todo el ancho (`align-items: stretch`).
- Alto del detalle en el ejemplo del ZTE (administrador): unos 185 px, antes casi el doble.

## Pruebas
Arnés a 390 px, como administrador y como vendedor: ningún botón mide menos de 44 px y no hay desplazamiento horizontal.

## Estado
Rama `claude/ficha-microcopy`. No publicado: espera el botón «Publícalo».
