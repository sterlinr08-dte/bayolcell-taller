# 2026-10-28 17:00 — Claude — Pendiente: que el listado del despacho salga del 829-589-3292

## Pedido del dueño
Mandó una captura de «Despacho #DA00003719 · reportes» y pidió: «que el número de asistente sea quien remite ese listado».

## Lo que hay hoy
- «Enviar» abre `wa.me` con el mensaje escrito, y una persona lo envía.
- Sale del WhatsApp Web que esté abierto en esa computadora (en la oficina, el 829-589-3292).
- El 829-589-3292 **no** es una de las 6 líneas del CRM (`whatsapp_lineas`).

## Decisiones del dueño (28-oct)
1. Que salga desde una línea del sistema y no desde WhatsApp Web.
2. El número es el **829-589-3292**.
3. **Conectarlo como línea del CRM**, igual que las otras 6, por Meta y Zernio. Se le avisó que el número deja de funcionar en la app normal de WhatsApp.
4. Crear la plantilla **«despacho»**: Meta no deja que la empresa escriba primero si no hay ventana de 24 h.

## Pasos
- **Dueño:** conectar el 829-589-3292 en Zernio como cuenta de WhatsApp, igual que las otras líneas. El código de verificación llega a ese teléfono. No se guardan claves en el repo ni en el chat.
- **Claude, después:**
  - agregar la fila en `whatsapp_lineas`, con su sucursal;
  - preparar la plantilla `despacho_equipos` (despacho, origen → destino, cantidad y listado) y mandarla a aprobación;
  - cambiar «Enviar» para que mande por esa línea, con la plantilla cuando no haya ventana;
  - si la línea no está conectada o la plantilla no está aprobada, seguir abriendo WhatsApp Web como hoy.
  - Siempre lo envía una persona tocando el botón, nunca solo.

## Estado
No se cambió código ni base de datos.
