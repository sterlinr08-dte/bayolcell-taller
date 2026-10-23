# 23-oct-2026 00:10 · Claude · Prefactura: enviar por WhatsApp por sucursal, cliente por número con historial, sin «Prefacturas realizadas»

**Dueño:** «Ok, va así» (envío por WhatsApp según la sucursal); «con el número de WhatsApp del cliente se guardan las
informaciones y el historial de compras, no importa la sucursal»; «quitar Prefacturas realizadas».

## Rama `claude/prefactura-whatsapp` (sin publicar)
### Base (aplicado en producción; `supabase/migrations/20261022233000_prefactura_whatsapp_cliente.sql`)
- `recepcion_prefacturas.cliente_id` (→ `clientes`) y `whatsapp_enviado_en`.
- RPC `whatsapp_hilo_para_telefono(p_linea, p_telefono, p_cliente)`: devuelve o crea el hilo del número en esa línea
  (`+1…`), liga el cliente, y dice si la conversación está abierta (entrante en 24 h). Admin o técnico de la sucursal.
### `taller-app.js` (p20)
- `_rpArmarModelo()`: el PreFacturaModel se arma en un solo lugar (crear/actualizar y WhatsApp).
- `_rpGuardarClientePorWhatsApp()`: al crear la prefactura, busca el cliente por WhatsApp (últimos 10 dígitos) o cédula;
  completa datos vacíos o lo crea; la prefactura guarda `cliente_id`.
- `_rpEnviarWhatsApp()`: línea por almacén/nivel (`_rpElegirLinea`), hilo por RPC, texto `_rpTextoWhatsApp`. Conversación
  abierta → texto + PDF (`imprimirPrefactura('blob')`, `_htmlAPdf({blob})`, subido a `whatsapp-media`). Cerrada → plantilla
  `bayolcell_prefactura` (variables: nombre, Nº, sucursal, total). Marca `whatsapp_enviado_en`.
- Ficha del cliente (Financiamiento → Clientes): pestaña **Compras** con las prefacturas del cliente (por `cliente_id` o
  mismo WhatsApp), total y botón «Ver».
### `taller-prefactura.js` (i13)
- Píldora «Enviar por WhatsApp» junto a «Nueva». La tarjeta «Prefacturas realizadas» queda oculta.
### Edge `whatsapp-plantilla-crear`
- Acepta `{ cual: 'prefactura' }` para someter a Meta la plantilla `bayolcell_prefactura` (UTILITY, es) en las 6 líneas.

## Pruebas (Node, funciones reales con Supabase simulado)
Línea: alm 1→Reparación Santiago, alm 1 nivel 2→Al por Mayor, alm 6→Santiago, alm 7→Principal, alm 7 nivel 2→Al por Mayor
Navarrete, alm 4→Reparación Moca, alm 4 nivel 2→Reparación (no hay mayorista). Texto con y sin nombre. Flujo cerrado →
plantilla con 4 variables; hilo pedido con la línea y el cliente correctos; sin número y sin guardar → avisos.
Sin probar de punta a punta: PDF real + Zernio (lo prueba el dueño tras publicar).

## Pendiente
- Desplegar la Edge y someter la plantilla a Meta (llave de un solo uso); esperar APPROVED.
- Publicar cuando el dueño lo diga.
