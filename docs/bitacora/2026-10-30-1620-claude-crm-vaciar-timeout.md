# CRM: «No se pudo vaciar el chat: statement timeout» — corregido (30-oct-2026, 16:20 RD)

**Reporte del dueño:** al vaciar el chat de ESTERLIN ESPINAL salió «canceling statement due to statement timeout» (500 en `crm_vaciar_hilo`).

**Causa:** ese chat tiene 4 192 mensajes. `whatsapp_mensajes.responde_a_id` (llave hacia la misma tabla, ~150 mil filas) no tenía índice; por cada mensaje borrado Postgres recorría la tabla completa para revisar la llave.

**Arreglo (base, sin tocar datos):** índices parciales en `whatsapp_mensajes.responde_a_id`, `whatsapp_ia_episodios.mensaje_cliente_id` y `.respuesta_humana_mensaje_id`, `leads.hilo_id`, `whatsapp_referidos.hilo_origen`. Migración `20261030220000_crm_borrar_conversacion_indices.sql`, ya aplicada en `vkhwdvjtowrhkhqavnvk`.

**Prueba:** los mismos pasos de vaciado sobre ese chat dentro de una transacción con ROLLBACK: 1,7 s (antes pasaba del límite). No se borró nada en la prueba.

**Frontend:** sin cambios.

**Pendiente:** Raspa y gana — la migración `20261029200000_raspa_y_gana` volvió a esperar el «Permitir» del dueño y venció.
