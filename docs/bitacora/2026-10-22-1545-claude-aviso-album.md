# 22-oct-2026 15:45 · Aviso correcto cuando el cliente manda un álbum de fotos

## Pedido del dueño
«Sí, arregla lo del álbum» (bit. 1530: los álbumes salían como «contacto compartido»).

## Cambio
- `whatsapp-webhook` **v38** (desplegada): si Meta manda `unsupported:131051` con `type: "album"`, el chat muestra
  «🖼️ El cliente mandó un álbum de fotos. WhatsApp no lo pasa al sistema: ábrelo en el teléfono para verlo.»
  Los demás 131051 siguen con el texto anterior.
- Antes de desplegar: el archivo del repo y el desplegado tienen la misma lógica (impresión TS sin comentarios: iguales) y transpila sin errores.
- Los mensajes viejos no se cambian (solo desde la v37 se guarda el tipo; había 1 álbum).
- Rama `claude/llamadas-diagnostico` (v37 + v38 + bitácoras), sin `main`.
