# 22-oct-2026 15:30 · Resultado de la llamada de prueba (sigue la bit. «llamada-entrante»)

## Prueba
- El dueño llamó por WhatsApp a Reparación Santiago (+1 809-707-2493) cerca de las 15:25 RD.

## Resultado
- No llegó ningún evento ni mensaje por esa llamada. En esa línea solo entraron mensajes normales y dos 131060 de una clienta.
- Confirma lo que dice Zernio: en coexistencia las llamadas suenan solo en la app del teléfono y la API no las ve.
- **No se puede mostrar «Llamada entrante» en el chat** mientras las líneas sigan en coexistencia. No se hace nada más.

## Hallazgo aparte (gracias al diagnóstico de la v37)
- Meta manda `unsupported.type`. Un 131051 de hoy era `album` (varias fotos juntas), y el CRM lo muestra como
  «contacto compartido», lo cual es incorrecto. Se ofreció al dueño cambiar ese texto según el tipo.
