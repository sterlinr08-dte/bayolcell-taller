# Asientos automáticos de nómina y pagos a proveedores (preparado, sin conectar)

**Pedido del dueño.** «Vamos a preparar los asientos automáticos». Sigue su decisión anterior: preparar Contabilidad para la contadora, pero no conectarlo todavía.

## Lo que ya existía
- Asientos automáticos de **ventas** (`AUTO-IP`) y de **compras** (`AUTO-IPC`) de Info Plus, y el de **apertura**.
- Faltaban la **nómina** y los **pagos a proveedores**: ninguno de los dos creaba asientos.

## Cambio
Archivo nuevo `conta-asientos-auto.js`, cargado en `taller.html` (`?v=20261109-aa1`). **Está escondido:** solo aparece con `localStorage.bc_asientos_auto = '1'`. Sin eso, el archivo no hace nada.

Con el interruptor encendido, en Contabilidad → Asientos sale el botón «Nómina y pagos». Abre una ventana con el rango de meses, 4 casillas y una vista previa de cada asiento antes de guardar.

| Asiento | Debe | Haber |
|---|---|---|
| **Nómina**, uno por periodo guardado y por tienda | 6101 Sueldos (quincena − días descontados) · 6103 Incentivos | 2103 Retenciones (ARS + AFP del empleado) · cuenta de adelantos (lo cobrado al empleado) · 110103 Bancos (neto pagado) |
| **Aporte patronal** (opcional) | 6104 TSS 15.29 % · 6105 Infotep 1 % | 2103 |
| **Regalía** (opcional) | 6106, 8.33 % | 2104 Sueldos por pagar |
| **Pago a proveedor**, uno por abono | 2101 Cuentas por pagar | 110101 Caja si fue en efectivo; si no, 110103 Bancos |

- **Tienda del empleado.** Sale del campo «Departamento» de su ficha en RRHH (Santiago, Moca o Navarrete). Si está vacío, va a «General» y la ventana avisa cuántos son. Hoy los 16 empleados activos lo tienen vacío.
- **Porcentajes.** Son los mismos del Punto de equilibrio: TSS 16.29 % (15.29 + 1 de Infotep) y regalía 8.33 %. El aporte patronal solo se calcula para los empleados con descuentos de ley.
- **No duplica.** Usa el ayudante de la casa `_aipInsertarAsientos` con las referencias `AUTO-NOM` y `AUTO-CXP`: volver a generar el mismo rango reemplaza los asientos de ese rango.
- **Cuadre.** Cada asiento se comprueba (debe = haber) antes de mostrarse. El que no cuadra no se genera y sale en los avisos.
- **Facturas manuales de proveedores.** No generan asiento, porque el sistema no sabe a qué cuenta van. La ventana avisa cuántas hay.

Con esto, la nómina por tienda queda en las cuentas 6101–6106. Esas cuentas son las que lee «Usar contabilidad» en el Punto de equilibrio (rama `claude/equilibrio-libro`, también sin publicar).

## Pruebas
- **Reglas** (`tests/conta-asientos-auto/reglas.test.js`, con `node`): 3 empleados en 3 tiendas y 2 abonos. Los 10 asientos cuadran y los montos coinciden con el cálculo a mano. Santiago: sueldos 14,500, incentivos 2,000, retenciones 886.50, adelantos 1,000 y banco 14,613.50.
- **Ventana**, en el arnés a 390 y 1280 px:
  - sin errores de JS y sin scroll horizontal;
  - campos de 48 px y botón principal de 54 px; nada mide menos de 44 px;
  - «Generar» llama al libro diario una vez por referencia y cierra la ventana.
- **Apagado.** Sin el interruptor no aparece el botón ni existe `BayolAsientosAuto`.

## Decisiones que le tocan a la contadora antes de encenderlo
1. A qué cuenta van los **adelantos a empleados**. Hoy se propone 110201 Clientes porque no existe una cuenta propia; conviene crear una.
2. Si la nómina se paga toda por **banco** (110103) o parte en efectivo.
3. Si quiere el aporte patronal y la regalía como **provisión** en cada quincena, o los registra ella al pagar.
4. Poner el **Departamento** (tienda) a cada empleado en RRHH.

## Pendiente (no se tocó)
- `_contaCargarLibro` no pide `referencia`, así que el asiento de apertura se cuenta como compra en dos reportes.
- El número de asiento se calcula en el navegador. La base tiene un índice único (`conta_asientos_numero_uidx`): si dos personas guardan a la vez, una recibe un error, no un número repetido.
- Ventas por tienda: `AUTO-IP` genera un solo asiento «General» por mes.

**Rama:** `claude/asientos-auto`. Sin publicar. No se tocó la base de datos.
