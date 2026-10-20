# WhatsApp del CRM igual que el original — fase 2 (rama `claude/wa-fase2`, sin publicar) — Claude

Continúa `*-claude-whatsapp-fase1-publicada.md`. Pedido: «continúa con la siguiente fase».

## Qué manda Zernio y qué no (revisado en `social_webhook_eventos`, 30 días)
- **Eventos:**
  - message.sent 40,959; message.received 39,752; delivered 25,324; read 24,678; **failed 111**;
  - **account.connected 19 y account.disconnected 19**.
- **No llegan:** «escribiendo…», borrados, ediciones, foto de perfil ni el emoji de las reacciones. Eso no se puede copiar del WhatsApp original con Zernio.
- **Fallos reales y sus códigos:** 130429 (demasiados seguidos) 65, 131049 (Meta frena el marketing) 22, 130472 (número en experimento) 11, 131026 (no entregable) 10 y 131031 (cuenta bloqueada) 3.
- **Desconexiones de líneas Bayol:** 670-9694 (el 2-oct) y 679-3793 (el 22-sep). Las demás fueron de cuentas de prueba o de STUDIO.

## Cambios
- **Migración** `supabase/migrations/20261018160000_wa_estado_conexion_linea.sql` (**sin aplicar**; no tiene drop ni delete fuera de la reversa comentada):
  - columnas `whatsapp_lineas.conectada`, `conexion_cambio_en` y `motivo_desconexion`;
  - trigger AFTER INSERT en `social_webhook_eventos` (`trg_wa_estado_conexion_linea`) que copia el último aviso de conexión a la línea, buscándola por cuenta de Zernio o por número.
  - El trigger ignora avisos más viejos que el ya guardado y nunca hace fallar el guardado del evento.
- **`taller-app.js`:**
  - **Aviso rojo arriba de la bandeja** cuando una línea está desconectada: nombre, número, desde cuándo, y que no entran ni salen mensajes hasta reconectarla. Se consulta cada 60 s como máximo y desaparece al reconectarse.
  - **Motivo del fallo en español** debajo de un mensaje fallido, para los códigos reales (incluido el de 24 horas). Si el código es desconocido, sale el texto de Meta escapado. También aparece cuando el fallo llega en vivo.
  - Cache-bust: `taller-app.js?v=20261018-wa2`.

## Pruebas
- **Migración en producción dentro de un DO que termina en RAISE** (todo se deshizo; se verificó que no quedaron la columna, el trigger ni las filas de prueba):
  - desconectar → `false` / «Token expired»;
  - un «conectado» con hora más vieja se ignora;
  - un «conectado» nuevo → `true` y el motivo vacío;
  - un evento con datos basura no rompe;
  - ninguna otra línea cambió.
- **Pantalla (Node, funciones reales):**
  - 131049 sale en español;
  - un código desconocido muestra el texto escapado;
  - un texto plano con 131047 da el aviso de 24 h;
  - un mensaje que no falló no muestra motivo;
  - el aviso aparece con nombre y número y se quita al reconectar.
- `node --check taller-app.js`: OK.

## Para publicar
- Con el «publícalo» del dueño: aplicar la migración por la API y llevar la rama a `main`. No hay que desplegar funciones.

## Sigue pendiente
- La reparación de 4,417 palomitas viejas espera el OK del dueño.
- Revisión programada de la fase 1: hoy a las 10:30 a. m. (RD).
