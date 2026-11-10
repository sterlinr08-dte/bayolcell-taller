# 2026-11-10 08:12 · Claude · CRM: iconos ordenados (sin publicar)

## Pedido del dueño
Al preguntarle si se publicaba el paquete C del CRM contestó: «Ajusta los iconos para que queden bien organizado». No aprobó publicar todavía.

## Qué se vio (capturas con los iconos reales, 390 y 1280 px)
- Celular, chat: 5 botones arriba dejaban el nombre en «Clie…»; «Transferir» salía cortado.
- Celular, bandeja: «Leads | Campañas | Solicitudes» con separaciones disparejas y la caja de 6 accesos más angosta que lo demás.
- PC: «Leads/Campañas/Solicitudes» y los 6 accesos flotando en dos líneas a la derecha; botones del chat con estilos mezclados (círculos, píldoras, sueltos).

## Qué se hizo
Capa nueva y reversible `crm-iconos.css` (i1), marca `html.bc-crm-ico` en el `<head>` de `taller.html`. Solo acomoda con CSS: no quita funciones, no mueve nodos, no toca lógica ni base.

| Dónde | Antes | Ahora |
|---|---|---|
| Celular · cabecera del chat | ← foto «Clie…» ⋮ $ etiqueta lupa vincular (36 px) | ← foto **nombre completo** · $ · etiqueta · vincular · ⋮ (40×44 px). La lupa se quita de arriba porque ya está en ⋮ → «Buscar». |
| Celular · Asignarme / Reasignar / Transferir | 30 px de alto, «Transferir» cortado | Tres partes iguales de 44 px, nada cortado (la fila mide 57 px; antes 55) |
| Celular · bandeja | Pestañas y accesos de anchos distintos | Los dos a todo el ancho, en partes iguales |
| PC ≥ 1240 px · arriba | Canales al centro; pestañas y accesos en 2 líneas | Una sola línea: canales a la izquierda, pestañas y accesos a la derecha. El chat gana 52 px de alto. |
| PC ≥ 1025 px · cabecera del chat | Círculos, píldoras e iconos sueltos | Todos de 44×44 con el mismo estilo; grupo de asignación entre dos rayitas; orden: Consulta · etiqueta · lupa · asignación · llamar · Vincular · reducir · ⋮ |

## Apagar
`var BC_CRM_ICO=false` en `taller.html`, o en un equipo `localStorage.bc_crm_ico_off='1'`.

## Archivos
- Nuevo: `crm-iconos.css`. Cambiado: `taller.html` (marca + `<link>` al final del `<head>`).
- Sin `:has()`, sin JavaScript, sin migraciones.

## Pruebas (banco local, datos inventados)
- Medidas a 390 px: nombre 80 px (antes 48), botones 40×44, tres botones de 105×44 dentro de la pantalla.
- Medidas a 1280 px: botones 44×44; canales en x=99; cabecera del chat sube de y=236 a y=184.
- `crm-estilos.cjs` y `crm-rapido.cjs`: ver el resultado en el informe del chat de esta entrega.
- No probado: Safari/iPhone real; anchos entre 1025 y 1239 px (ahí la línea de arriba queda como estaba).

## Estado
Rama `claude/crm-rapido-c` (paquete C + iconos), sin publicar. Falta el OK del dueño.

## Siguiente paso
Mostrar el antes y después y preguntar «Publícalo» / «Todavía no».
