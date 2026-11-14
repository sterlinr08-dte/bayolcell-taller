# CRM WhatsApp: el aviso «línea desconectada» sale solo en esa línea (sin publicar)

Sigue a `…-claude-aviso-linea-navarrete.md`.

## Pedido del dueño
«El detalle es que el rojo estaba saliendo para todos»: el aviso de la línea de Navarrete (+18096793793) se veía en todas las sucursales y áreas, y parecía que la línea en uso era la dañada.

## Causa
`_waPintarAvisoLineas()` (`taller-app.js`) pintaba todas las líneas con `activo = true` y `conectada = false`, sin mirar cuál línea tiene abierta el usuario.

## Cambio
- `taller-app.js`: el aviso se pinta solo para la línea caída cuyo `id` es `_crmLineaActualId` (la línea abierta). En otra línea, o sin línea elegida, no sale. Como la función se llama en cada pintado de la bandeja, aparece y se quita al cambiar de línea.
- `taller-app.min.js` (+ mapa) regenerados con `scripts/minificar.sh`; `taller.html` → `taller-app.min.js?v=20261114-av1`.
- Prueba nueva: `scripts/pruebas/wa-aviso-linea.cjs`.

## Causa del corte (averiguada con el dueño y la documentación de Zernio)
El teléfono de esa línea pasó más de 14 días sin abrir WhatsApp Business. Meta saca el número del enlace por inactividad; Zernio lo reportó como «number deleted on Meta». Se arregla abriendo la aplicación en el teléfono y reconectando en Zernio. Para evitarlo: abrir WhatsApp Business en cada teléfono de línea al menos una vez por semana.

## Pruebas
- `wa-aviso-linea.cjs`: Todo OK (390 y 1280 px; 16 comprobaciones).
- `wa-quien-envio.cjs`: Todo OK.
- `crm-rapido.cjs`: ver el resultado en el informe al dueño (tarda varios minutos).

## Estado y pendientes
- Rama `claude/aviso-linea-solo-suya`, sin publicar.
- La línea +18096793793 sigue con `conectada = true` puesto a mano (aviso quitado a pedido del dueño) y sin puente con Zernio. Al publicar esto conviene devolverla a `conectada = false` para que el equipo de esa línea vea el aviso, si el dueño lo aprueba.
