# 2026-10-20 18:45 · Claude · La lista de IMEI tiene que ir acorde con el artículo

## Pedido del dueño
«El IMEI tiene que ir acorde». Al preguntarle, aclaró: **con el artículo**.

## Diagnóstico
En `infoplus_seriales` hay códigos de Info Plus que se **reutilizaron** para otros modelos. Ejemplos:

| Código | Modelos que tienen IMEI con ese código |
|---|---|
| 1000 | «M-HORSE M16 PRO MAX» (66) y «IDPRO 17 PRO MAX» (6) |
| 1520 | «ITEL A200» y «OUKITEL C61» |
| 1917 | «LG STYLO 5» y «OUKITEL WP53S» |
| 1920 | «IPHONE 13 MINI» y «IPHONE 6S PLUS» |
| 2485 | «IPHONE 15 PRO MAX» y «IPHONE 11 PRO MAX AVISO» |
| 2336 | dos motos distintas |

Filtrar solo por `codproducto` mostraba IMEI de otros modelos.

## Cambio
`taller-prefactura.js` (`cargarElegibles`, versión n2): ahora también se lee `producto` y solo quedan los IMEI cuyo nombre coincide con el artículo de la prefactura.
- Antes de comparar se pasa a mayúsculas y se quitan los espacios dobles.
- Cuenta como coincidencia si el nombre es igual o si uno empieza por el otro. Así entran los cambios de capacidad, por ejemplo «IPHONE XR» con «IPHONE XR 64GB» y «OUKITEL C62» con «OUKITEL C62 GT».

## Pruebas
- `imeieleg` 12/12: se agregó un IMEI de otro modelo con el mismo código y no aparece en la lista.
- Comparaciones revisadas a mano:
  - M16 con IDPRO no coincide;
  - XR con XR 64GB coincide;
  - OUKITEL C61 con ITEL A200 no coincide.

## Estado
Rama `claude/prefactura-limpia`, sin publicar.
