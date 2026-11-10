# Auditoría del CRM de WhatsApp del taller · velocidad y errores (solo lectura)

## Pedido del dueño
«Audita el CRM del taller para que aplique mejoras, para que sea más rápido e instantáneo, sin bug.»

## Cómo se hizo
- Sobre `main` en `a29f231`. No se cambió código ni base, ni se tocó la web en vivo.
- Medido en el banco local con datos inventados: 300 conversaciones, un chat de 500 mensajes, 80 ms por consulta, Chromium a 390 y 1280 px con la CPU frenada ×4. **No es Safari ni un iPhone real.**
- Scripts y resultados (no están en el repo): carpeta `crm-aud` del área de trabajo de la sesión.

## Mediciones (CPU ×4)
| Acción | 390 px | 1280 px |
|---|---|---|
| Ver la bandeja | 675 ms | 719 ms |
| Abrir un chat | 1,079 ms | 2,063 ms |
| Pintar un mensaje entrante | 537 ms | 1,484 ms |
| Enviar: aparece la burbuja | 1 ms | 1 ms |
| Enviar: pantalla ocupada después | 2.6 s | 5.2 s |
| Buscar (6 teclas): bloqueo | 2.6 s | 5.8 s |

Consultas a la base por acción: entrar 21 (10 sin uso), abrir un chat 24 (5 sin uso, 11 enlaces firmados uno por uno), mensaje entrante en el chat abierto 8 (5 sin uso), enviar 7 (5 sin uso).

## Hallazgos de velocidad
1. **Cada cambio pequeño recalcula el estilo de todo el CRM.** Añadir una burbuja recalcula 2,359 elementos en PC y 1,215 en celular. Entre el 60 y el 85 % del tiempo de cada acción es eso. Causa: las reglas CSS con `:has()` (128 en total; 14 son del CRM: `crm-wa-identico.css:158,159,421`, `crm-canales-iguales.css:119,243,244`, `crm-wa-compacto.css:15,29`, `crm-facebook-chat.css:70`, `taller-app-movil.css:30,33,34`, `taller.html:775`, `taller-ambient-orb-safe.js:77`). Quitando solo las del CRM: 67 → 40 ms en PC y 30 → 17 ms en celular. Sin ninguna: ~1 ms.
2. **Cinco consultas por acción para contadores que ya no existen.** `crm-social-hub.js:275-308` (`refreshKpisReal`) pide hasta 5,000 filas de `whatsapp_hilos` y de `instagram_hilos`, pero los elementos que llenaría (`#bcKpiWa`…) ya no están: otra capa reescribe esa cabecera.
3. **El hilo se reconstruye entero 2–3 veces al abrir y 2 al enviar** (`taller-app.js:31780`, `crm-whatsapp-pagination.js:310-326`, `taller-app.js:33345` y `33379`).
4. **Esperas en serie antes de pintar** (`crm-whatsapp-pagination.js:365` y `397`; `taller-app.js:30627-30641`).
5. **La búsqueda recrea la lista en cada tecla** (`taller-app.js:30961-30964`).
6. Enlaces firmados uno por uno (`taller-app.js:31037-31046`); imágenes y audios sin carga diferida (`:31588-31590`).
7. Tiempo real de mensajes sin filtro por chat (`taller-app.js:34285`).

## Errores confirmados (reproducidos en el banco)
1. **Mensaje al cliente equivocado en PC** (`crm-message-loading.js:15-35`): con un chat abierto, se toca otro con la red lenta y se escribe antes de que cargue. La pantalla sigue mostrando el chat anterior, pero el envío va al nuevo.
2. **Al volver a un chat se baja solo todo el historial** (`crm-whatsapp-pagination.js:458-462`): el aviso de desplazamiento llega a un contenedor ya quitado de la página. Arreglo probado en el banco: comprobar `chat.isConnected`.
3. **Un envío lento bloquea todos los envíos, sin aviso** (`taller-app.js:33304`, `33361`): no hay tiempo límite.
4. **Mensaje de error falso** (`taller-app.js:283-287`): si el servidor responde 502, sale «Su sesión se renovó…».
5. **Burbuja duplicada** unos 3 s cuando el servidor corrige la ortografía (`taller-app.js:34173-34180`).
6. **Enlaces rotos dentro de los mensajes** (`taller-app.js:377`, `32998`, `31694`): `https://wa.me/18095551234` abre `https://wa.me/`.
7. **«Sin mensajes todavía.»** mientras carga o cuando falló la carga (`taller-app.js:31828`).
8. El canal de Facebook queda vivo fuera del CRM (`crm-facebook-realtime-direct.js:249`). Impacto bajo.

## Comprobado sin fallo
Doble toque en enviar (1 sola llamada); respuestas viejas no pisan a las nuevas; canales sin duplicar tras entrar y salir 5 veces; textos maliciosos en 13 lugares no se ejecutan; 0 excepciones de JavaScript.

## No revisado
Safari e iPhone reales; chats de Instagram y Facebook por dentro; Leads, Solicitudes, Campañas y Automatizaciones; notas de voz, adjuntos y plantillas; el camino de un empleado no administrador; el SQL real de las RPC y los índices.

## Verificación propia
Revisé en el código tres de los hallazgos (auto-carga sin `isConnected`, `refreshKpisReal`, y el camino de PC que no vacía el panel al cambiar de chat): coinciden con lo descrito.

## Estado
Nada cambiado. Falta que el dueño elija qué se aplica.
