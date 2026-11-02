# Línea de carga mamey: solo cuando el usuario espera algo (2-nov-2026)

**Pedido del dueño:** video del CRM de Instagram: «¿Por qué queda cargando?» → «la animación de cargando en la parte superior color mamey».

## Diagnóstico
- Es `#bcrzLinea` de `taller-rapidez.js` (14-oct): se encendía con **cualquier** consulta a Supabase que tardara > 300 ms, incluidas las de fondo.
- Logs de Supabase a la hora del video (01:01 UTC): el CRM pidió `instagram_cuentas` e `instagram_hilos` unas 3 veces seguidas en 5 s y además hay refrescos de contadores cada pocos segundos. Con eso la línea casi nunca se apagaba aunque nadie estuviera esperando nada.
- El chat de Gabriel Díaz estaba completo (2 mensajes; la respuesta fue entregada y leída el 31-oct). No era una falla de datos.

## Cambio
- `taller-rapidez.js` (v `20261102q2`): la línea solo cuenta las consultas que empiezan hasta 1.5 s después de un `pointerdown`, `keydown` o `submit`. El aviso de «servidor no contesta» sigue mirando todas las consultas, igual que antes.
- `crm-marketing-consent.js`: carga `taller-rapidez.js?v=20261102q2`.
- `taller.html`: `crm-marketing-consent.js?v=20261102-u31` (el PR #191 cambió ese archivo sin subir este número; ahora queda al día).

## Pruebas
- Prueba nueva (Supabase simulado a 1.2 s): consulta de fondo → la línea no se enciende; consulta tras un clic → se enciende y se apaga sola; consulta de fondo larga + clic con consulta rápida → no queda pegada. 4/4 OK, sin errores JS.
- `sin-internet`, `ui-global`, `prefactura-instantanea`: OK.

## Pendiente
- Las 3 recargas seguidas de la lista de Instagram (`loadInstagram`) siguen; no se tocaron en este cambio.

**Rama:** `claude/linea-carga-solo-usuario`. **No publicado.**
