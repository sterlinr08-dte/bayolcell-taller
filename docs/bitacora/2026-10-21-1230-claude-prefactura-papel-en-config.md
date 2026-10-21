# 21-oct-2026 12:30 · Claude · Prefactura impresa: el papel se escoge en «Config. Impresora»

Corrige la bitácora 1200, a pedido del dueño: «No, preguntar si ticket o hoja; que se seleccione en la configuración de la impresora».

## Cambio
- Se quitó la ventanita que preguntaba el papel cada vez. La prefactura **se imprime directo** en el papel guardado.
- En **Config. Impresora** (`#v-configImpresora`) hay una tarjeta nueva arriba, **«Papel de la prefactura»**:
  - dos botones, **Ticket 80 mm** y **Hoja carta**;
  - el escogido queda marcado;
  - la elección vale para esa computadora (`localStorage.bc_pref_formato`);
  - por defecto, ticket.
- El PDF sigue en hoja carta. La reimpresión sigue diciendo «COPIA».
- `bc-prefactura-imprimir.js` pasa a `?v=20261021-i2`.

## Pruebas (banco local, 1280 y 390 px)
- 8 PASS / 0 FAIL:
  - aparece la tarjeta con botones de 46 px y el ticket marcado;
  - imprime directo en ticket, sin preguntar;
  - al cambiar a carta imprime en carta con «COPIA»;
  - sin errores.

## Estado
Rama `claude/prefactura-limpia`, sin publicar.
