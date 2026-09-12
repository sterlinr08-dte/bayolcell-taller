# CRM Social Hub — implementación ChatGPT (2026-09-12)

Rama: `chatgpt/crm-social-hub-20260912`

## Objetivo
Unificar visualmente el CRM de BAYOL CELL sin reescribir ni arriesgar la lógica estable de WhatsApp.

## Arquitectura
- `crm-marketing-consent.js` pasa a ser un loader pequeño.
- La versión anterior queda intacta como `crm-marketing-consent-legacy.js`.
- `crm-social-hub.js` agrega la capa de canales y la interfaz funcional de Instagram.
- `crm-social-hub.css` contiene toda la nueva apariencia.
- `taller.html` no se modifica.

## Canales
### WhatsApp
No se cambia su lógica. El Social Hub solo lo envuelve visualmente y usa los datos ya cargados para KPIs.

### Instagram
Funcional:
- Lee `instagram_cuentas`.
- Lee `instagram_hilos`.
- Lee `instagram_mensajes`.
- Busca conversaciones.
- Abre chat.
- Intenta limpiar `no_leidos_count` al abrir.
- Responde usando la Edge Function `instagram-enviar`.
- Realtime para hilos y mensajes.
- Media guardada en `instagram-media` se abre con URL firmada.

Comentarios y menciones se muestran como pendientes porque no existe backend real para esos flujos.

### Facebook
Solo se reserva visualmente el canal. No hay botones falsos.
Falta implementar cuenta/página, hilos, mensajes, webhook y función de envío.

## Seguridad
Todas las consultas se hacen mediante `supabaseClient`, por lo que siguen sujetas a RLS.
El envío de Instagram pasa por `instagram-enviar`, que valida JWT y acceso a sucursal.

## Publicación
No se debe llevar a `main` sin validación visual/funcional del usuario. `main` es producción.
