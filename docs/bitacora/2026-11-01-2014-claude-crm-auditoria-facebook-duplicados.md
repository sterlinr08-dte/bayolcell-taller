# CRM: auditoría de Facebook, duplicados y nombres (2-nov-2026, solo lectura)

**Pedido del dueño:** «todavía tenemos problemas con el tiempo de la sincronización de Facebook… conversaciones duplicadas… en vez del nombre del cliente sale el de Bayol Cell».

## Facebook (tablas `social_*`, cuenta BayolCell, Zernio `6aa582f0…`)
- 481 hilos. Último mensaje entrante: **29-oct 20:22**. Eventos del webhook por semana: 12–48 en total, de ellos **2–14 recibidos**; Instagram recibe 120–230 por semana.
- `social-webhook` v5 (23-oct) responde 200 en 307 ms; la cuenta figura `conectada` (sincronizada hoy 14:47).
- **No hay resincronización automática de Facebook.** `social-importar-historial` solo corre a mano (1 vez hoy) y el CRM no tiene botón «Importar» para Facebook (sí para WhatsApp e Instagram). Si Zernio no manda un evento, ese mensaje no llega nunca.
- Desde aquí no se puede saber si Zernio está dejando mensajes sin mandar: hay que comparar con la bandeja de Zernio (importar es idempotente, `onConflict zernio_message_id`).
- Duplicados reales por participante: **0** (los 38 pares se unieron el 23-oct y el webhook ya reutiliza el hilo). Lo que se ve repetido: **42 hilos «Usuario de Facebook»** (Facebook oculta el nombre) y **11 hilos sin nombre** (solo mensajes salientes; Zernio nunca mandó el nombre). Hilos con nombre «Bayol»: **0**.

## Instagram: 545 hilos, 0 duplicados, 0 con nombre Bayol, 17 sin nombre.

## WhatsApp (13.807 hilos)
- **35 hilos con nombre «Bayol…»**: son los teléfonos propios del negocio (Moca 18098227874, Almacén 18098775508, Navarrete 18096793793, Caja/bayolcellsrl 18292650656, Bayol Fanc. 18494064885…) escribiendo a las líneas del CRM. El nombre es correcto (es quien escribe), pero cada número aparece hasta 5 veces (uno por línea) y compite con los clientes. 10 de ellos no son líneas del CRM.
- 0 duplicados por (teléfono, línea). **1.105 teléfonos con hilo en más de una línea**: por diseño (el cliente escribió a varias líneas); en la vista «todas las líneas» se ve dos veces.
- Quedan hilos `duplicado:+…` y `bsid:…` de la fusión del 3-oct (ocultos de la operación normal).

## Opciones propuestas al dueño (sin ejecutar)
1. Facebook: importar ahora + resincronizar cada 10 min (cron, como los demás) + botón «Importar» en el CRM.
2. Nombres: los 11 sin nombre se llenan al importar si Zernio lo tiene; los «Usuario de Facebook» se muestran como «Cliente de Facebook · …1234» para distinguirlos.
3. Números internos de Bayol: etiqueta «Interno» y al final de la lista / filtro.
4. Mismo cliente en varias líneas: una sola fila con insignias de línea (cambio mayor).

Sin cambios de código ni de datos.
