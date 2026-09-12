# CRM Redes — Instagram + Facebook (2026-09-12)

Rama: `chatgpt/crm-social-hub-20260912`

## Alcance corregido
La interfaz nueva solicitada es **solo para Instagram y Facebook**.

WhatsApp NO forma parte del nuevo Social Hub:
- conserva su vista actual de Mensajes/Leads;
- conserva sus selectores, KPIs, búsqueda, filtros, chat y lógica existentes;
- no se mezcla visualmente con las métricas de redes sociales.

## Integración dentro del CRM
La extensión agrega de forma aditiva una tercera pestaña **Redes** junto a Mensajes y Leads.
Al abrir Redes:
- se ocultan controles específicos de WhatsApp;
- aparece una interfaz independiente con Instagram y Facebook;
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

## KPIs de Redes
Solo incluyen:
- Instagram sin leer;
- Facebook sin leer (— hasta conectar backend);
- leads cuyo `canal` sea `instagram` o `facebook`;
- redes conectadas sobre un total de 2.

## Seguridad
Las lecturas usan `supabaseClient` y siguen sujetas a RLS.
Los envíos de Instagram continúan pasando por `instagram-enviar`, que valida JWT y acceso a sucursal.

## Publicación
No llevar a `main` sin validación visual y funcional. `main` es producción.
