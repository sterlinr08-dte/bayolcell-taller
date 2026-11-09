# Punto de equilibrio: gastos desde la contabilidad (preparado, sin conectar)

**Pedido del dueño.** Quiere preparar Contabilidad para que la contadora lo llene todo y los estados salgan solos, pero sin conectarlo todavía. Lo que más le importa es el Punto de equilibrio para tomar decisiones. Eligió la opción **B**: que el equilibrio tome los gastos que registre la contadora.

## Lo que ya existía (mapa del 9-nov)
El módulo ya trae catálogo de 83 cuentas, libro diario, mayor, balanza, estados (resultados, balance y flujo), un 606 escondido y los asientos automáticos de ventas y compras de Info Plus (`AUTO-IP` y `AUTO-IPC`). Hoy casi no se usa: hay solo 4 asientos manuales, entre abril y junio.

**Hay dos caminos para anotar gastos, y eso puede contarlos dos veces:**
- **«Registrar gasto» completo** (`guardarRegGasto`): crea un asiento en el libro diario, con cuenta y sucursal.
- **«Registrar gasto» simple** de Estado Mensual (`guardarGastoSimple`): escribe en `conta_movimientos`. Lo usan Estado Mensual y el 606.

Hay que decidir con la contadora cuál de los dos se usa.

## Cambio (`conta-equilibrio.js`, pe29)
Todo queda escondido: solo se ve con `localStorage.bc_pe_libro = '1'`. Sin eso, la pantalla queda igual.

- **Lectura.** `cargarLibro` lee del libro diario del mes las líneas de las cuentas `6xxx` (gastos), con debe − haber. Las agrupa por sucursal y por cuenta: Santiago 1, Moca 4, Navarrete 7; «General» o vacío van a comunes (0).
- **Aviso del otro camino.** También suma los gastos de `conta_movimientos` del mes. Solo los muestra como aviso en Comunes («Otros RD$ X en Registrar gasto simple: no se usan»); no los suma.
- **Franja en la tarjeta de gastos.** Dice «Contabilidad RD$ X · N cuentas · diferencia RD$ Y» o «cuadra», con el botón «Usar contabilidad» (`_lib`).
- **Qué hace el botón.** Cambia los gastos de esa tienda por los del libro: cada uno queda «Confirmado» y con la nota «Libro diario · cuenta 6201 · N asientos». Después hay que guardar el mes.
- **Préstamos.** En Comunes, si hay préstamos en la lista, la cuenta 6301 (intereses) no se toma, para no contar dos veces lo que ya sale de esa lista.
- **Navarrete.** Con el interruptor encendido, se agrega Navarrete a las sucursales de Contabilidad: `rgto_sucursal`, `mef_sucursal`, `em_sucursal` y `ef_sucursal`. Antes solo existían General, Santiago y Moca.

## Pruebas
Arnés con un libro diario simulado (octubre), a 390 px:
- **Santiago.** Se leen 3 cuentas por RD$ 243,200 contra RD$ 240,000 en la pantalla. Al tocar «Usar», queda en «cuadra».
- **Comunes.** La cuenta 6301 se excluye y salen los intereses de los préstamos. Aparece el aviso de los RD$ 2,500 del otro camino.
- **Interruptor apagado.** No sale nada.
- Sin errores de JS.

## Hallazgos del mapa (sin tocar)
- **El asiento de apertura se cuenta como compra.** `_contaCargarLibro` (taller-app.js) no pide `referencia`, así que el saldo de apertura se suma como compra en «Verificación de costo» y en el estado de resultados periódico.
- **Números de asiento repetidos.** El número se calcula en el navegador (el mayor + 1), sin candado.
- **Faltan asientos de nómina y de cuentas por pagar.** Ninguna de las dos genera asientos todavía.

## Estado
Rama `claude/equilibrio-libro`, sin publicar. No se tocó la base de datos.
