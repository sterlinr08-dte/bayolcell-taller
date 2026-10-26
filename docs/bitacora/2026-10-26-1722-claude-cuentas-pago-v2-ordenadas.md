# Cuentas de pago por WhatsApp: plantilla nueva ordenada (v2)

**Dueño:**
- «Vamos a ordenar mejor», con la captura de la plantilla `bayolcell_cuentas_pago`, que llega con todas las cuentas en una sola línea.
- «Si» a someter la versión propuesta.

## Plantilla sometida: `bayolcell_cuentas_pago_v2` (UTILITY, es)
- Las cuentas van en el **texto fijo**, una por bloque: el banco en negrita y el número solo en su renglón.
- La empresa y el RNC aparecen una sola vez.
- Variables: 1 nombre (o «cliente») y 2 monto (o «su compra»).
- Resultado: **6/6 líneas en PENDING**, consultado con `accion: estado` el 26-oct.
  - En la Principal, el `POST` dio timeout del lado de la función, pero la consulta muestra que la plantilla sí se creó.
- **Vía:** Edge `whatsapp-plantilla-crear` **v15**.
  - Se añadió `cual: 'cuentas_v2'`.
  - Llave de un solo uso en `_plantilla_llaves`, que vence a los 15 min; la copia local se borró.
  - Después se repuso el tapón 410 (**v16**).

## Botón «Enviar cuentas de pago» (`taller-app.js`, `?v=20261026-c1`)
- **Chat abierto (menos de 24 h):** texto libre **idéntico** a la plantilla v2, generado por `_rpTextoCuentas`. Se comprobó que es igual carácter por carácter.
- **Chat cerrado:** primero intenta la v2. Si Meta aún no la aprobó, usa la v1 de una sola línea, y si tampoco se puede, muestra la ventana «Pídale al cliente que nos escriba».
- **Cuentas fijas en el código** (`_RP_CUENTAS_TEXTO`) y en la plantilla. Si cambia una cuenta, hay que cambiar las dos y someter una v3.
  - El campo de Configuración «Cuentas para pagos» solo se usa para la v1.

## Pruebas
- `scripts/pruebas/prefactura-confiable.cjs`: T1–T8 OK, sin errores de JavaScript.
- `node --check` OK.

## Pendiente
- Que Meta apruebe la v2: consultar el estado más tarde.
- Publicar en `main` cuando el dueño diga «publícalo».
