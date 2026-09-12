# CRM Redes — Instagram + Facebook + TikTok (2026-09-12)

Rama: `chatgpt/crm-social-hub-20260912`

## Alcance
La interfaz nueva de **Redes** es para **Instagram, Facebook y TikTok**.

WhatsApp NO forma parte del nuevo Social Hub:
- conserva su vista actual de Mensajes/Leads;
- conserva sus selectores, KPIs, búsqueda, filtros, chat y lógica existentes;
- no se mezcla visualmente con las métricas de redes sociales.

## Integración dentro del CRM
La extensión agrega de forma aditiva una tercera pestaña **Redes** junto a Mensajes y Leads.
Al abrir Redes:
- se ocultan controles específicos de WhatsApp;
- aparece una interfaz independiente con Instagram, Facebook y TikTok;
- volver a Mensajes o Leads restaura la vista normal de WhatsApp.

`taller.html` no se modifica.

## Instagram
Funcional con la infraestructura existente:
- `instagram_cuentas`
- `instagram_hilos`
- `instagram_mensajes`
- Edge Function `instagram-enviar`
- bucket privado `instagram-media`
- Realtime para hilos y mensajes
- búsqueda, chat y envío desde el CRM

Comentarios y menciones permanecen marcados como pendientes mientras no exista backend real para esos eventos.

## Facebook
La interfaz está definida y separada, pero no se simulan funciones.
Pendiente para hacerlo funcional:
1. cuenta/página conectada;
2. tablas de hilos y mensajes;
3. webhook;
4. función de envío;
5. Realtime y conteos reales.

## TikTok
La interfaz está definida como tercer canal de Redes, pero el repositorio no contiene todavía backend TikTok.
Pendiente para hacerlo funcional:
1. conexión/autorización de cuenta TikTok;
2. modelo de cuentas, hilos y mensajes;
3. recepción de eventos/webhook según la integración oficial disponible;
4. envío/respuesta cuando la integración autorizada lo permita;
5. permisos por sucursal, Realtime y métricas reales;
6. ampliar el campo `leads.canal` para aceptar `tiktok` cuando se implemente el flujo de leads.

No se muestran acciones falsas mientras estos componentes no existan.

## KPIs de Redes
Incluyen:
- Instagram sin leer;
- Facebook sin leer (— hasta conectar backend);
- TikTok sin leer (— hasta conectar backend);
- leads reales de los canales actualmente soportados en `leads.canal`;
- redes conectadas sobre un total de 3.

## Seguridad
Las lecturas usan `supabaseClient` y siguen sujetas a RLS.
Los envíos de Instagram continúan pasando por `instagram-enviar`, que valida JWT y acceso a sucursal.

## Publicación
No llevar a `main` sin validación visual y funcional. `main` es producción.
