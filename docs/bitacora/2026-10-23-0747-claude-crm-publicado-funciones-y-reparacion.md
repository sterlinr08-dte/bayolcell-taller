# 2026-10-23 07:47 (RD) — CRM: publicado el menú de números, desplegadas 3 funciones y reparados los datos

## Autorización del dueño
«Publícalo y haz las tres cosas» (ver bitácora 2026-10-23-0740).

## 1. Frontend publicado
- `main` 277cedc (merge de `claude/crm-tres-arreglos`). bayolcell.com sirve `taller-app.js?v=20261023-p22`; verificado en vivo
  (parsea y contiene `_waMenuTelefono`).

## 2. Edge Functions desplegadas (proyecto vkhwdvjtowrhkhqavnvk)
| Función | Versión | verify_jwt | Cambio |
|---|---:|---|---|
| social-webhook | 4 → 5 | false | un hilo por participante; nombre solo de mensajes entrantes |
| social-importar-historial | 4 → 5 | true | un hilo por participante al importar |
| instagram-webhook | 7 → 8 | false | mensaje saliente → contador en 0 (bundle con `_shared/inbox-common.ts`, mismo md5 que el repo) |
Antes de desplegar se comprobó que el código en producción era el mismo del repo (sin cambios sueltos).

## 3. Reparación de datos (ejecutada con `execute_sql`, paso a paso)
- Instagram: contadores de chats ya respondidos puestos en 0 → de **197 chats / 537** a **32 chats / 146**.
- Facebook: los 38 pares de hilos repetidos se unieron en el hilo más antiguo de cada cliente: mensajes movidos
  (0 quedaron en los repetidos), nombre/fecha/vista previa/contador consolidados, 38 hilos repetidos borrados.
  Comprobaciones: 0 pares restantes; ningún FK ni lead apuntaba a los borrados; `social_hilos` 511 → 473.
  Ejemplo: Arianny Aquino queda en un solo hilo con sus 4 mensajes.
- Quedan 11 hilos de Facebook con nombre «BayolCell» o «Facebook User»: son clientes de los que Zernio nunca mandó el
  nombre (solo mensajes salientes). Se corregirán solos cuando escriban, gracias al webhook nuevo.

## Pendiente de vigilar
- Primer mensaje real de Facebook e Instagram tras el despliegue: revisar logs de las 3 funciones.
