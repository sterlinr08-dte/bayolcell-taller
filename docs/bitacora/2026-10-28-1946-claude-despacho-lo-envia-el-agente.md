# Despacho: el listado lo envía el agente desde su número

## Lo que aclaró el dueño (28-oct-2026)
- El 829-589-3292 **es el número de un agente suyo**. No es una línea del sistema.
- Le pregunté cómo quiere que salga el listado y eligió **«Lo envía el agente»**.

## Decisión
- El listado de despacho sigue **como está hoy**:
  - el agente toca «Enviar» en cada persona;
  - WhatsApp se abre con el mensaje ya escrito (`wa.me`);
  - el mensaje sale del WhatsApp abierto en ese equipo, el del agente.
- **Se cancela el plan anterior** (bitácora 2026-10-28-1720):
  - no se conecta el 829-589-3292 en Zernio;
  - no se agrega su fila a `whatsapp_lineas`;
  - no se crea la plantilla `despacho_equipos`.
- La columna `whatsapp_lineas.oculta_crm`, que ya está aplicada, se queda. Vale `false` en todas las líneas, así que no cambia nada; servirá si algún día hay una línea solo para enviar.

## Archivos
- Solo esta bitácora y `docs/MEMORIA.md`. No se tocó código ni la base.

## Siguiente paso
- Ninguno. Si el dueño quiere más adelante que salga automático, se retoma la opción de Zernio con su OK.
