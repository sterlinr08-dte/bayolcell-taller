# CRM Instagram: la lista ya no se pide 3–4 veces al entrar (2-nov-2026)

**Pedido del dueño:** «Arregla lo de Instagram que se recarga 3 veces» (visto en los logs a la hora de su video: `instagram_cuentas`/`instagram_hilos` 3–4 veces en 2 s).

## Causa (`crm-social-hub.js`)
Al entrar a Instagram, `loadInstagram` arrancaba desde tres lugares casi a la vez:
1. el botón del canal (`switchChannel('instagram')` → `loadInstagram(true)`);
2. la capa de filtros `crm-social-scope-fix.js`, que vuelve a llamar `BayolSocialHub.switchChannel('instagram')` cada vez que se pinta;
3. el vigilante de clases de `#v-crmLinea` (`bindActivation`), que dispara `scheduleRefresh → refreshAll → loadInstagram` cuando `switchChannel` quita `bc-ig-chat-open`.
La guarda de generación evitaba que se pisaran, pero las consultas igual salían. Los contadores (`refreshKpis`) también se pedían 2–3 veces.

## Cambio
- `loadInstagram(force, options)`: si se llama **sin opciones** (entrar o refrescar) y hubo una carga hace menos de 1.2 s, devuelve esa misma carga. Con opciones explícitas (Realtime de mensajes nuevos, después de enviar, `__bcIgReload`, botón Reintentar) siempre recarga. La función original quedó como `loadInstagramReal`.
- `refreshKpis()`: mismo freno de 1.2 s; la original quedó como `refreshKpisReal`.
- Versiones: `crm-social-hub.js` `VERSION='20261102-f4'`; `crm-marketing-consent.js` `SOCIAL_HUB='20261102-ig2'`; `taller.html` → `crm-marketing-consent.js?v=20261102-u32`.

## Pruebas (página aislada con Supabase simulado a 300 ms; entrar = 3 llamadas a `switchChannel` en 200 ms)
| Consulta al entrar | Antes | Ahora |
|---|---:|---:|
| `instagram_cuentas` (lista) | 4 | 1 |
| contadores `whatsapp_hilos` / `instagram_hilos` / `leads` | 2 | 1 |
| `whatsapp_lineas` / `instagram_cuentas` (conteo) | 3 | 2 |
- `__bcIgReload()` justo después: sigue recargando (1 consulta de cuentas + 1 de chats). Sin errores JS.

**Rama:** `claude/ig-sin-recargas`. **No publicado.**
