# CRM de WhatsApp · paquetes A (errores) y B (rápido y seguro) — sin publicar

## Pedido
Aplicar lo que salió de la auditoría `2026-11-10-0142-claude-auditoria-crm-velocidad.md`: los 8 errores confirmados (el dueño
aprobó todos) y las mejoras de velocidad V2, V3, V4, V5, V7, V8 y V10. V1 (reglas `:has()`), V6 y V9 son de otro paquete, en otra
rama: aquí no se tocó ninguna hoja `.css`.

## Estado
Rama `claude/crm-rapido-ab` (desde `origin/main` en `a29f231`). **Sin publicar y sin PR.** No se tocó la base ni la web en vivo.

## Cómo apagarlo
En el equipo: `localStorage.bc_crm_rapido_off = '1'` y recargar. Vuelve el comportamiento anterior en todo, menos en dos cosas
que no tienen forma útil de «apagarse»: el arreglo de la auto-carga del historial (A2) y el nuevo `PUERTO` del servidor de pruebas.
La prueba automática comprueba el modo apagado.

## Paquete A · errores
1. **Mensaje al cliente equivocado en la PC.** Al tocar otro chat se pinta enseguida su cabecera con «Cargando…» y la caja y el
   botón de enviar quedan bloqueados hasta que el chat está pintado. Es un solo pintado «cargando» (solo el panel del chat, la
   lista no se toca) y luego el del chat: no vuelve el doble pintado de todo que se quitó el 23-oct. Además `enviarMensajeWhatsapp`
   ya no envía si el chat pintado no es el destino. El borrador se queda en su chat: antes el texto a medio escribir pasaba a la
   caja del chat nuevo. `crm-message-loading.js:17-36`, `taller-app.js` `_pintarWhatsappDetalle` y `enviarMensajeWhatsapp`.
2. **Auto-carga del historial al volver a un chat.** `crm-whatsapp-pagination.js` (`wireMessageScroll`): se ignora el aviso de
   desplazamiento de un contenedor que ya no está en la página (`chat.isConnected`). Subir a mano sigue cargando (probado).
3. **Un envío lento bloqueaba todos.** Candado por chat (`_waEnviosEnVuelo`) con tiempo límite de 25 s (`AbortController`). Si
   vence o falla, la burbuja queda «No enviado · Reintentar» con su texto. Un segundo mensaje en el mismo chat no se pierde
   (se queda en la caja y avisa «Enviando el mensaje anterior…»); en otros chats se puede enviar. Antes de decir «no enviado»
   por tiempo vencido se mira en la base si el mensaje llegó a guardarse; y si la fila llega después por tiempo real, la burbuja
   «no enviado» se retira sola. El doble toque sigue dando un solo envío.
4. **Aviso falso «Su sesión se renovó…».** Se revisa el tipo de contenido antes de `res.json()`; con un 502 sale «El servidor no
   respondió» y no se renueva la sesión. `getFriendlyError` ya no confunde «Unexpected token» con la sesión.
5. **Burbuja duplicada y burbuja «enviando» que desaparecía.** La provisional lleva su identificador propio (`data-tempid`) y se
   empareja con la definitiva por el número del mensaje o, mientras no vuelve la respuesta, por ser el único envío en curso de ese
   chat hecho por ese empleado; ya no por el texto. La actualización parcial del chat ya no borra las provisionales.
6. **Enlaces rotos.** `_waEnlazarTexto`: primero las direcciones, y los teléfonos solo en el resto del texto. `linkifyText` acepta
   «&» (llega como `&amp;`) y deja fuera la puntuación final. Los textos maliciosos de la auditoría siguen sin ejecutarse.
7. **«Sin mensajes todavía.» mientras cargaba o si falló.** Ahora «Cargando…», «No se pudo cargar · Reintentar» (botón de 44 px)
   y «Sin mensajes todavía.» solo cuando no hay. Un refresco que falla ya no borra los mensajes que estaban en pantalla.
8. **Canal de Facebook vivo fuera del CRM.** Se cierra al salir del CRM (`nav`) y se reabre al volver (`renderCrmLinea`), con un
   refresco de la lista si Facebook está a la vista.

## Paquete B · velocidad
- **V2** `crm-social-hub.js` `refreshKpisReal`: sale si sus 4 contadores no están en pantalla (eran 5 consultas por acción).
- **V3** Al llegar el enlace de un adjunto se cambia solo su burbuja (`_waRepintarBurbujas`); al enviar se añade o actualiza solo
  esa burbuja (`_waPintarBurbujaEnvio`). Si no se puede, se repinta entero como antes.
- **V4** El chat se pinta al llegar los mensajes; la sugerencia de IA se pide a la vez y se pinta cuando llega. En la bandeja el
  conteo de leads va en paralelo y la lista se pinta al llegar los hilos. **A medias:** las sucursales siguen yendo primero, solo
  en la primera entrada de la sesión, porque de ahí sale la línea que hay que cargar.
- **V5** La búsqueda espera 120 ms sin teclas antes de pintar la lista.
- **V7** Enlaces firmados en lote (`createSignedUrls`, hasta 100 por petición); si el lote falla, uno por uno como antes.
- **V8** Fotos con `loading="lazy" decoding="async"` y audios con `preload="none"`. El chat sigue abriendo al fondo.
- **V10** Conteo exacto de mensajes solo al abrir el chat; el de conversaciones al entrar a la línea y, después, como mucho cada
  5 minutos (para que el total no se quede viejo).
- Además, `crm-wa-identico.js` (`cargarExtras`): si la lista ya está pintada, las fijadas y archivadas se añaden sin recrearla.

## Archivos
`taller-app.js` (+ `taller-app.min.js` y `.map`, regenerados con `scripts/minificar.sh`, como pide `CLAUDE.md`),
`crm-message-loading.js`, `crm-whatsapp-pagination.js`, `crm-social-hub.js`, `crm-facebook-realtime-direct.js`,
`crm-wa-identico.js`, `crm-marketing-consent.js`, `taller-performance-phase1.js`, `taller.html`,
`scripts/pruebas/servidor.cjs` (acepta `PUERTO`), `scripts/pruebas/crm-rapido.cjs`, `scripts/pruebas/crm-rapido-stub.js`,
`scripts/pruebas/README.md`. Sin migraciones, RPC ni funciones del servidor.

Versiones `?v=`: `taller-app.min.js` y `crm-marketing-consent.js` → `20261110-ab1` en `taller.html`; en el cargador,
`crm-social-hub.js`, `taller-performance-phase1.js`, `crm-facebook-realtime-direct.js` y `crm-message-loading.js` (ahora con
variable propia `MSG_LOAD`) → `20261110-ab1`; `crm-wa-identico.js` → `20261110-w22`; `crm-whatsapp-pagination.js` →
`20261110-ab1`. La variable `V` del cargador y la `VERSION` interna de `crm-wa-identico.js` no se subieron, para no volver a pedir
las hojas de estilo del CRM (no cambiaron).

## Pruebas (banco local, datos inventados; Chromium, no Safari ni iPhone real)
- **Nueva** `scripts/pruebas/crm-rapido.cjs`, a 390 y 1280 px: **139 aprobadas, 0 fallidas**, 0 errores de JavaScript. Incluye
  empleado no administrador, Instagram y Facebook abriendo, y el modo apagado.
- **Existentes**, antes y después, mismas cifras: `crm-editar-mensaje` 26, `crm-ortografia` 26, `wa-quien-envio` 9,
  `flow-financiamiento` (390 y 1280 OK), `solicitudes-crm` (390 y 1280 OK), `sin-internet` 23, `app-movil` 36,
  `ortografia.test.mjs` 25, `ortografia-envio.test.mjs` 25. Ninguna fallaba antes.
- **Reproducciones de la auditoría** (`bugs.cjs`), antes → después: destino del mensaje escrito mientras carga, PC: `h11` con
  «Cliente 10» en pantalla → nada sale; 502 → «Su sesión se renovó…» → «El servidor no respondió»; envío colgado: otro chat
  bloqueado → otro chat envía; enlace `wa.me` → `https://wa.me/` → `https://wa.me/18095551234`; chat sin conexión: «Sin mensajes
  todavía.» → «No se pudo cargar · Reintentar»; volver a un chat de 500 mensajes: 6 páginas bajadas solas → 0.

### Consultas a la base por acción (`medir2.cjs`, igual a 390 y 1280 salvo donde se indica)
| Acción | Antes | Después |
|---|---|---|
| Entrar al CRM (primera vez) | 21 | 16 |
| Volver a entrar | 7 | 2 |
| Abrir un chat con 11 adjuntos | 24 | 9 |
| Volver a un chat largo | 59 | 5 |
| Mensaje entrante en el chat abierto | 8 | 1 |
| Enviar | 7 | 1 (390) · 3 (1280) |

### Tiempos (`medir3.cjs`, 80 ms por consulta, CPU frenada ×4), antes → después
| Acción | 390 px | 1280 px |
|---|---|---|
| Abrir un chat | 1,201 → 1,034 ms | 2,128 → 2,182 ms |
| Pintar un mensaje entrante | 621 → 443 ms | 1,220 → 1,264 ms |
| Enviar: pantalla ocupada después | 2.3 → 1.3 s | 4.7 → 2.0 s |
| Buscar (6 teclas): bloqueo | 2,792 → 98 ms | 4,760 → 122 ms |
| Ver la bandeja (primera entrada) | 610 → 1,015 ms | 767 → 974 ms |

Dos cifras que **no mejoran**, medidas aparte por cuadro pintado (mediana de 5 a 8 corridas, paquete encendido contra apagado):
- **Primera entrada a la bandeja:** primer cuadro con la lista 1,011 → 1,204 ms (390) y 978 → 1,042 ms (1280). La lista se pinta
  al llegar los hilos y enseguida otra capa añade las fijadas; cada cambio en pantalla recalcula el estilo de todo el CRM (V1).
- **PC, al cambiar de chat:** la cabecera del chat nuevo se ve antes (1,926 → 1,057 ms; al abrir el primero 2,398 → 679 ms),
  pero los mensajes tardan más (1,926 → 2,381 ms; al abrir 2,398 → 2,640 ms). Es el precio del arreglo A1 (el pintado
  «Cargando…») mientras V1 siga sin resolverse. En el celular mejora (753 → 548 ms al cambiar).
Con la CPU sin frenar esas diferencias son de unos 50 a 110 ms.

## Lo que no se hizo o no se pudo probar
- V1, V6 y V9: otro paquete. Sucursales en paralelo (V4): ver arriba.
- Identificador del envío **en el servidor**: `whatsapp-enviar` no devuelve ni guarda uno propio, así que el emparejado se hace
  en el navegador. Si la fila llega por el eco de WhatsApp (sin autor) y el servidor corrigió la ortografía, puede verse una
  burbuja de más hasta que vuelve la respuesta (menos de un segundo en el banco). Lo sólido sería que la función guarde un
  identificador que mande el navegador; requiere desplegarla y no se tocó.
- Un envío que vence a los 25 s y que el servidor termina mandando después: se detecta por la base o por tiempo real, pero si
  ninguna de las dos avisa a tiempo y el empleado toca «Reintentar», el cliente lo recibiría dos veces. Antes no había tiempo
  límite (el chat quedaba bloqueado sin aviso).
- Al reintentar no se conserva la cita («responder a») del mensaje original.
- No probado: Safari e iPhone reales; envío real por Zernio; adjuntos, notas de voz, plantillas y ubicación con el candado nuevo
  (no usan ese camino, no se tocaron); `createSignedUrls` contra el almacenamiento real (se probó con el simulador y tiene
  respaldo uno por uno); chats de Instagram y Facebook por dentro (solo que abren y no dan error); varios empleados a la vez en
  el mismo chat.

## Riesgos al unir
La otra rama (hojas de estilo del CRM) probablemente toque las mismas líneas de versión en `crm-marketing-consent.js`
(`crm-wa-identico.js?v=`) y `taller.html`: resolver dejando la versión más nueva de cada archivo. `taller-app.min.js` hay que
regenerarlo después de unir (lo hace el robot al llegar a `main`).

## Siguiente paso
Que el dueño lo pruebe en la rama y diga «publícalo». Para probarlo: abrir el CRM en la PC, tocar un chat y luego otro; enviar
un mensaje con un enlace `wa.me`; cortar el Wi-Fi y enviar (debe quedar «No enviado · Reintentar»).
