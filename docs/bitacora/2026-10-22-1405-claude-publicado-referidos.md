# 22-oct-2026 14:05 · Publicado: plantilla a referidos, etiqueta «Transferido» y conversación anterior

## Autorización
Dueño: «PUBLICALO Y DIME SI SE CORRIGIO EL ERROR PARA ENVIAR».

## Publicado en `main` (merge 05a677e)
- `whatsapp-enviar` v22 (código; la función ya estaba desplegada): bit. 1300.
- Etiqueta «Transferido» automática (migración y disparador ya aplicados): bit. 1310.
- Botón «Ver conversación anterior» del chat referido (`crm-wa-identico.js` w17, loader u7): bit. 1335.
- Verificado en vivo en bayolcell.com: `taller.html` carga u7 y `crm-wa-identico.js` w17 trae la RPC nueva.

## ¿Se corrigió el error de envío?
- La función v22 está activa. Desde el arreglo nadie volvió a enviar la plantilla: no hay mensajes de plantilla nuevos y el chat de ToNnY todavía no tiene `zernio_conversation_id`.
- No se mandó una prueba al cliente (regla: nada a clientes sin OK). Falta que el dueño o la empleada reintente «Enviar plantilla».
