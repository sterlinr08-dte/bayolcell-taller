# Claude · Agente de IA: foto de pieza → Info Plus (sin publicar) y auditoría de copiloto

## Pedido del dueño
Mandó el reel de Spekgen `DfiFsHPBPCd` (bot de WhatsApp para vender, en 6 piezas) y eligió «Los 3»: guardar la referencia, llevar una pieza a Bayol y revisar si el agente puede pasar a copiloto (10-nov-2026). La referencia va en `docs/REFERENCIAS-DISENO.md` (rama `claude/ref-spekgen-bot`, los 3 proyectos).

## Corrección a lo que se le dijo
En el chat se le dijo que el agente estaba «en modo observación». **No es así.** `whatsapp_ia_config`:

| Sucursal | Modo | Qué hace solo |
|---|---|---|
| Santiago | automático | Solo el saludo y el aviso de «fuera de horario». Lo demás, sugerencia. |
| Moca | automático | Igual que Santiago. |
| Navarrete | copiloto | Nada solo: todo es sugerencia. |

- Mensajes automáticos de salida: unos 550 por semana desde el 19-oct. En los últimos 7 días, 400 son el aviso de fuera de horario y el resto saludos.
- Los seguimientos (lo que pregunta el cliente después) **siempre** son sugerencia en los tres modos (`index.ts`, comentario de modos). Ninguno se envía solo.
- Precio de pantalla automático (`auto_precio_pantalla`): apagado en las tres.

## Auditoría: ¿listo para más automático? (criterios del documento `AGENTE_ATENCION_APRENDIZAJE_SUPERVISADO_2026-09-14.md` §7)
| Dato (base, 10-nov) | Valor |
|---|---|
| Sugerencias enviadas tal cual | 67 |
| Editadas y enviadas | 6 |
| Descartadas | 288 |
| Reemplazadas por un mensaje nuevo sin usarse | 798 |
| Pendientes sin tocar | 855 |
| Episodios evaluados por una persona | 28 (9 «parecido», 19 «no parecido»), todos del 14-sep |
| Episodios esperando revisión | 1,939 (14-sep → 14-oct; desde entonces no se generan: `borradores_observacion=false`) |
| Tope diario de IA | 150 llamadas; se llenó casi todos los días (hasta 188 rechazadas el 5-nov) |

- De las sugerencias que alguien miró (361), se usaron 73: **20 %**.
- El criterio para automatizar seguimientos pide 100 episodios evaluados por tema con ≥ 98 % correctos. Hoy hay 28 evaluados con 32 % aprobados. **No está listo.**
- Recomendación (sin aplicar): seguir como está; medir uso de sugerencias por sucursal; retomar la revisión de episodios por tema (precios de pantalla, horario, ubicación) antes de pensar en más automático. El tope de 150 deja sin sugerencia a muchos chats: subirlo cuesta dinero y lo decide el dueño.

## Pieza 3 «Visión»: foto de una pieza → candidatos de Info Plus
- Nuevo `supabase/functions/whatsapp-ia-responder/_shared/pieza-foto.ts`.
- El modelo solo dice qué pieza y de qué equipo (campo nuevo `pieza_foto` en su JSON). El **código** busca en `infoplus_articulos` (modelo exacto: «14» no acepta «14 Pro»; nivel 1; nunca costo; con existencia primero; máx. 3).
- Los candidatos van **solo a la nota interna** de la sugerencia (`razon`), que ve el empleado: «Foto: MARCO de IPHONE 14 PLUS · Info Plus: 2861 MARCO DE IPHONE 14 PLUS AZUL RD$ … · confírmela antes de cotizar». El texto para el cliente no lleva ese precio (regla nueva en el prompt).
- No cambia ningún modo ni ningún envío. No toca la pantalla del CRM (la nota ya se muestra junto a «IA sugiere»).
- Si la búsqueda falla o no hay coincidencias, queda la nota de siempre («Detectó una foto de equipo»).

## Pruebas
- `scripts/qa-pieza-foto.ts` (deno, datos inventados): 16/16.
- `deno check index.ts`: sin errores.
- Catálogo real (solo lectura): «marco + 14» devuelve los marcos de 14 Plus por color y deja fuera 14 Pro/Pro Max.
- Antes de cambiar se comprobó que la versión desplegada (v32, 21-oct) es igual a `origin/main`.
- No probado: una foto real de cliente (requiere desplegar).

## Estado
Rama `claude/ia-vision-piezas`, **sin desplegar**. Desplegar la Edge Function `whatsapp-ia-responder` necesita el OK del dueño.
