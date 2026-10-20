# 19-oct-2026 — Precio del cliente: ya no se repite y sale «Por mayor» con el cliente de Info Plus

**Rama:** `claude/bayol-prefactura` (sigue a `2026-10-19-2000-claude-prefactura-estilo-studio.md`). Sin publicar.

## Pedido del dueño
> «En infoplus el cliente con código viene asignado el código de al por mayor, veo que se repite.»

## Diagnóstico
- **Dos campos para lo mismo.** En la prefactura había dos campos que cambiaban el mismo dato, el nivel de precio:
  - «Tipo de cliente» (`c_tipo`: final / tienda), que llama a `_rpTipoNivel`;
  - «Precio» (`rxNivel`: 1 Cliente final / 2 Por mayor / 3 Extremo), que llama a `_rpNivelCambio`.
- **El cliente de Info Plus no cambiaba el precio.** Al elegirlo, el precio se quedaba en «Cliente final».
- **¿Info Plus manda el nivel de cada cliente?** No.
  - Se desplegó `infoplus-clientes` v15 para devolver solo los **nombres** de los campos que manda Info Plus, sin valores.
  - Info Plus manda únicamente `codcliente, nombre, cedula, rnc, telefono, fechacreacion, direccion` (1,133 clientes).
  - Se volvió a dejar la función como estaba (v16, misma salida que v14). Su fuente queda en `supabase/functions/infoplus-clientes/index.ts`, sin claves.

## Cambio (`taller-prefactura.js` p2)
- **Un solo campo.** Queda «Precio del cliente»; «Tipo de cliente» se esconde.
  - El tipo se sigue guardando como antes, pero ahora sale del precio: Por mayor o Extremo → `tienda`; Cliente final → `final`.
  - Así también aparece el RNC cuando es tienda.
- **Al elegir un cliente:**
  - **con código propio** (≠ 1), el precio pasa solo a **Por mayor** (nivel 2) y los precios de los artículos se recalculan;
  - **de contado** (1), pasa a **Cliente final**.
- **Se puede cambiar a mano** después de elegir el cliente.
- **No se tocan** Info Plus, la base ni el cálculo de los precios: se usan las mismas `_rpNivelCambio` / `_rpNivelPrecio`.

## Pruebas
| Prueba | Resultado |
|---|---|
| `pftest.mjs` (390 y 1280 px) | **47 PASS** |
| `nav7` | 9 PASS |
| `vend` | 9 PASS |
| `rxfun` (capa apagada) | 12 PASS |
| `info2` | 80 PASS |

Casos nuevos de `pftest.mjs`:
- un cliente con código pone Por mayor, tipo tienda y precio de nivel 2 (2,100);
- «Tipo de cliente» ya no se ve;
- el cliente de contado vuelve a Cliente final (2,500);
- cambiar el precio a mano cambia el tipo guardado;
- Info Plus recibe `codnivelprecio = 2`.
