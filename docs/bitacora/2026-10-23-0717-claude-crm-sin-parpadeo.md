# 2026-10-23 07:17 (RD) — CRM de WhatsApp: menos parpadeos al actualizar (rama, sin publicar)

## Pedido del dueño
«Hacer que el sistema fluya lo más rápido posible y corregir los parpadeos cuando se está actualizando» → «En el CRM».

## Auditoría (fuente de verdad: `taller-app.js` + capas `crm-*.js`)
Se armó un banco local del CRM (`taller.html` servido desde el repo, Supabase simulado con 25 chats y 14 mensajes cada
uno, eventos de tiempo real disparados a mano) y se midió, por escenario, cuántos nodos del DOM se destruyen y cuánto
salta la pantalla (layout shift). Hallazgos:
1. **Abrir un chat en la PC reconstruía todo** (`_pintarWhatsapp` hacía `innerHTML` del armazón: lista + chat). La capa
   `crm-message-loading.js` además lo hacía **dos veces** (vacío y luego con mensajes) y repintaba la lista una tercera
   vez al marcar leído. Resultado: 922 nodos destruidos, la lista pestañeaba y su scroll volvía arriba.
2. **Cada evento de tiempo real de otro chat, un chat nuevo o el respaldo de 90 s** reconstruía la lista completa
   (`_pintarWhatsappLista()` en la rama «sin chat abierto» de `_crmSuscribirRealtime`): ~410 nodos por evento.
3. El actualizador incremental de la lista, al reordenar, **volvía a colgar todas las filas** (`appendChild` a cada una).
4. En el celular, abrir un chat cambia lista→chat (reconstrucción esperada). Se midió además un salto grande del chat al
   llegar un hilo nuevo con el chat abierto en una corrida y no en otra: **pendiente de confirmar con un video del dueño**.

## Cambios (todo en memoria y DOM; no toca Supabase, Zernio ni la lógica de envío)
- `taller-app.js` (p21):
  - `_pintarWhatsapp()`: si el armazón ya existe con las mismas columnas, no se destruye; se marca la fila activa
    (incremental) y se pinta solo el chat.
  - `_waFilaHiloHTML(h, animar)`: la fila de la bandeja en una función compartida.
  - `_actualizarListaWhatsappIncremental()`: inserta solo las filas nuevas, quita las que sobran y mueve únicamente las
    filas fuera de lugar (ya no reconstruye la lista ni recuelga todas las filas).
  - Tiempo real sin chat abierto: usa el incremental en vez de `_pintarWhatsappLista()`.
- `crm-message-loading.js` (vía `V=20261023-u1` en `crm-marketing-consent.js`): en la PC, al abrir un chat solo se
  marca la fila activa y el chat se pinta una vez, cuando llegan los mensajes; al marcar leído se usa el incremental.
  En el celular se mantiene el pintado inmediato (el chat aparece al instante).
- `taller.html`: `taller-app.js?v=20261023-p21`.

## Medición (banco local, nodos del DOM destruidos por escenario)
| Escenario (PC 1280 px) | Antes | Después |
|---|---:|---:|
| Abrir un chat desde la lista | 922 | 20 |
| Mensaje nuevo en el chat abierto | 415 | 24 |
| Mensaje en otro chat | 416 | 24 |
| Cliente nuevo escribe (hilo nuevo) | 416 | 22 |
| Recarga de respaldo (90 s) | 440 | 14 |
| Cambiar de chat | 1186 | 240 (solo el chat) |

Celular (390 px): mensaje en el chat abierto 6→6, otro chat 6→6, hilo nuevo 6→6 (ya eran incrementales); abrir chat
sigue reconstruyendo porque cambia de lista a chat. El orden de la lista tras los eventos coincide con la memoria
(`_waHilos`), y la vista previa del chat que subió se actualiza en su sitio.

## Rama
`claude/crm-sin-parpadeo` (desde `main`). No publicado: espera el «publícalo» del dueño.

## Pendiente
- Video del dueño del parpadeo real en el CRM (celular o PC) para confirmar el caso 4.
- Siguiente paso de rapidez: estilos tardíos al encabezado y módulos pesados bajo demanda (Diagnóstico IA, reacondicionados).
