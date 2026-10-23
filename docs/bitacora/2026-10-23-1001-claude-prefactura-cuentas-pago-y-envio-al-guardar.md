# Prefactura: envío automático al guardar + botón «Enviar cuentas de pago» — 23-Oct-2026 10:01 RD

## Pedido del dueño
«Ese botón del WhatsApp sería bueno ponerlo para enviar las cuentas bancarias; y sobre enviar la prefactura al WhatsApp, que sea después que se le dé a Guardar.»

## Fuente de verdad revisada
- `_rpEnviarWhatsApp()` (taller-app.js): manda la prefactura por la línea de la sucursal del almacén; con chat abierto (<24 h) va texto + PDF, si no, plantilla `bayolcell_prefactura`.
- `_rpGuardar()`: crea/actualiza la prefactura en Info Plus y guarda `recepcion_prefacturas`.
- El sistema **no tenía** las cuentas bancarias del negocio (solo las cuentas BHD de los empleados para la nómina).

## Cambios
1. **Base de datos:** `config_taller.cuentas_pago text` (migración `20261023150000_config_cuentas_pago.sql`, ya aplicada en el proyecto `vkhwdvjtowrhkhqavnvk` con el conector; verificado en `information_schema`).
2. **Configuración → Datos del taller:** nuevo cuadro «Cuentas para pagos (se envían al cliente por WhatsApp)», una cuenta por línea (hasta 1500 caracteres). Se guarda con el mismo botón «Guardar datos del taller».
3. **Prefactura, botón de WhatsApp:** ahora dice **«Enviar cuentas de pago»** y llama a `_rpEnviarCuentasWhatsApp()`:
   - usa la línea de la sucursal del almacén y el chat del cliente (igual que la prefactura);
   - mensaje: «Hola <nombre>. Estas son las cuentas de BAYOL CELL para su pago de RD$ X: … Cuando transfiera, envíenos el comprobante por aquí.»;
   - es texto libre, así que **solo sale si el cliente nos escribió en las últimas 24 h**; si no, avisa en pantalla y no manda nada;
   - sin cuentas configuradas o sin WhatsApp, avisa qué falta.
4. **Envío automático:** al terminar bien `_rpGuardar()` (nueva o actualizada), si el campo WhatsApp tiene 10 dígitos o más, se llama a `_rpEnviarWhatsApp()` solo. Sin número no envía ni molesta. Si el envío falla, la prefactura ya quedó guardada y el error se ve como aviso.

## Archivos
`taller.html` (textarea + versiones p26 / i16), `taller-app.js` (+ `taller-app.min.js` regenerado), `taller-prefactura.js`, `supabase/migrations/20261023150000_config_cuentas_pago.sql`.

## Pruebas (banco local, 1280 px)
- Píldora «Enviar cuentas de pago» de 44 px de alto, sin errores de JS.
- Sin cuentas → «Escriba las cuentas en Configuración → Datos del taller → “Cuentas para pagos”».
- Con cuentas y sin WhatsApp → «Escriba el WhatsApp del cliente».
- El cuadro de Configuración carga y muestra el valor guardado.
- El envío real por WhatsApp no se probó aquí (no se manda nada a clientes sin OK del dueño).

## Pendiente del dueño
- Escribir las cuentas reales en Configuración → Datos del taller.
- Decidir si publica (rama `claude/prefactura-pc`, junto con la Opción B de la Prefactura en PC).
