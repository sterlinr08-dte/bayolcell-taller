# 21-oct-2026 12:00 · Claude · Prefactura impresa: mismo Nº de Info Plus, ticket 80 mm u hoja carta

## Pedido del dueño
«Planificar la factura que vamos a usar, que tenga el mismo número de prefactura de Info Plus».

Lo que decidió:
- es una **PREFACTURA**;
- se imprime **al guardar**;
- en **los dos papeles**.

Aprobó el plan con «si».

## Qué hace
- Archivo nuevo `bc-prefactura-imprimir.js`. Reemplaza `imprimirPrefactura(modo)` y usa `_prefUltima`, que llena `_rpImprimir`.
- Para apagarlo en un equipo: `localStorage.bc_pfimp_off = '1'`.
- Al imprimir («Guardar e imprimir» o el botón de imprimir) sale una ventanita con dos botones grandes: **Ticket 80 mm** y **Hoja carta**.
  - La última elección de cada PC queda marcada y con el foco: Enter imprime y Esc cierra.
  - Se guarda en `localStorage.bc_pref_formato`.
- **Ticket 80 mm** (`@page 80mm auto`, 72 mm útiles):
  - logo, sucursal, **PREFACTURA Nº X** grande, fecha, cliente, vendedor y almacén;
  - equipo y falla si los hay;
  - líneas con el IMEI y el descuento por línea;
  - subtotal, descuento y TOTAL;
  - pie: «Documento preliminar, no válido como factura fiscal. Pase a caja con este número para recibir su factura».
- **Hoja carta**: lo mismo, en tabla con código, cantidad, precio, descuento e importe. El PDF usa esta versión.
- **COPIA**: si ese Nº ya se imprimió en esa PC, la reimpresión lleva «COPIA». Se guardan los últimos 300 números en `localStorage.bc_pref_impresas`.
- No cambia nada en Info Plus ni en el dinero. El NCF lo sigue poniendo la cajera al convertir.

## Archivos
- `bc-prefactura-imprimir.js` (nuevo).
- `taller.html`: carga `bc-prefactura-imprimir.js?v=20261021-i1` después de `taller-prefactura.js`.

## Pruebas (banco local)
- 8 PASS / 0 FAIL:
  - ventanita con 2 botones de 80 px y ticket marcado;
  - el ticket lleva Nº, IMEI y total, sin COPIA;
  - recuerda el formato;
  - la reimpresión en carta dice COPIA y muestra el descuento;
  - la próxima vez queda marcada «carta»;
  - Esc cierra;
  - sin errores.
- La prueba de «Limpiar sola» sigue dando 12 PASS.
- Capturas: `pfimp-ticket.png`, `pfimp-carta.png` y `pfimp-elegir.png` en el scratchpad.

## Pendiente
- Ajustar al estilo de la factura de caja cuando el dueño mande la foto.
- Agregar la garantía en el pie si la quiere.
- Probarlo en la impresora térmica real de la sucursal.

## Estado
Rama `claude/prefactura-limpia`, **sin publicar**.

## También
- La IA v32 está desplegada en Supabase (bitácora 1130). Su código quedó en la rama: la copia a `main` la bloqueó el control de permisos de la sesión y se hará con la próxima publicación.
