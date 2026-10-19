# Prefactura: que Info Plus sepa qué empleado la hizo — Claude (19-oct-2026)

## Pedido del dueño
«Publícalo y continúa.» Se publicó en `main` la Recepción con la ⓘ y la pestaña «Buscar o escanear» (`16bcce6`). Se verificó que bayolcell.com sirve `taller-recepcion.js?v=20261019-r2`.

Pedido nuevo: «hay que enlazar el empleado quien está prefacturando … verifica si se puede poner que cuando se prefacture y se consulta esa prefactura en InfoPlus, sepa de qué empleado fue».

## Verificado (solo lectura)
- **El taller ya manda el empleado.** La prefactura (`PreFacturaModel`) lleva **`codempleado`**, que es el vendedor o empleado de Info Plus.
  - En Recepción sale de la lista «Vendedor (Info Plus)» (`rxVendedor`).
  - En la prefactura que se abre desde Órdenes sale de `_pref.codempleado`.
- **La función del servidor no lo cambia.** `infoplus-prefactura-crear` (v15) reenvía el modelo tal cual a `POST /api/prefactura`, después de revisar el permiso con `app_puede_prefactura`.
- **El enlace por empleado ya existe:** `tecnicos.infoplus_codempleado`, que se llena en Configuración → Técnicos, en el campo «Código vendedor Info Plus».
  - Solo aparece para los tipos `servicio` y `admin`.
  - `_rpInit` ya ponía por defecto el código de quien usa el sistema.
- **El hueco: nadie tiene ese código lleno.**
  - Son 0 de 8 empleados activos: 2 admin, 3 de servicio y 3 técnicos.
  - Hoy, toda prefactura del taller llega a Info Plus como **código 6 (Esterlin)**, salvo que se cambie la lista a mano.
  - `CLAUDE.md` decía «Michelle = 748 (seteado)», pero hoy su ficha no lo tiene.
- **Prefacturas hechas desde el taller (`recepcion_prefacturas`):** solo 3, todas con código 6, del 21 al 24 de julio de 2026 (pruebas).
- **Empleados de servicio y administradores activos:**
  - Michelle Felipe Báez — servicio, Santiago;
  - Kenifer Pérez — servicio, Moca;
  - Yosmeiry — servicio, Navarrete;
  - Loribel Ventura — admin;
  - Yves Bayol — admin.
- **Códigos conocidos en `PREF_VENDEDORES`:** 6 Esterlin, 697 Mayorista (Santiago), 748 Michelle (Santiago), 1020 Vendedora (Moca).
- **Pendiente con Dagoberto (ya anotado en julio):** el endpoint `vendedor` de Info Plus existe pero da «Error en las credenciales». Con permiso, se podría traer la lista real de empleados.

## Cambio (rama `claude/bayol-vendedor`, sin publicar; `taller-app.js?v=20261019-vd1`)
- **`_miCodInfoplus()`:** devuelve el código de Info Plus de quien usa el sistema, o '' si no está enlazado.
- **`_codVendedorPrefactura(elegido)`:**
  - si quien prefactura **no es administrador y tiene código**, Info Plus recibe **su** código aunque se cambie la lista;
  - el administrador manda el que eligió;
  - si no hay código, manda el elegido (por defecto 6).
- **Recepción:**
  - para quien no es administrador y tiene código, la lista «Vendedor» queda **fija**;
  - si no es administrador y no tiene código, sale un aviso: «Tu usuario no está enlazado con Info Plus… pide al administrador…»;
  - `_rpCrearPrefactura` usa `_codVendedorPrefactura`.
- **Prefactura desde Órdenes y la de la recepción vieja:**
  - el vendedor por defecto pasa a ser el código del usuario (antes era siempre '6');
  - el envío usa `_codVendedorPrefactura`.
- **No cambia:** la función del servidor, la tabla ni los permisos.

## Pruebas (banco local, con el envío a Info Plus interceptado)
`vend.mjs`: **9 PASS · 0 FAIL**.

| Caso | Lista | Aviso | Info Plus recibe |
|---|---|---|---|
| Michelle (servicio, 748) | fija | no | `748`, aunque se cambie la lista a 6 |
| Yosmeiry (servicio, sin código) | editable | sí | `6` |
| Administrador | editable | no | el elegido (`6`) |

Además, sin cambios en lo anterior: `rxfun.mjs` 12/12 y `rxppk.mjs` 23/23.

## Falta (del dueño)
1. Confirmar el **código de empleado en Info Plus** de cada persona que va a prefacturar:
   - Michelle (¿748?);
   - Kenifer, Moca (¿1020, «Vendedora Moca»?);
   - Yosmeiry, Navarrete (¿?);
   - Loribel y Yves, si van a prefacturar.
2. Autorizar que se guarden en `tecnicos.infoplus_codempleado`, o ponerlos él mismo en Configuración → Técnicos.
3. Revisar en Info Plus una prefactura de prueba hecha por una empleada, para confirmar que sale con su código.
