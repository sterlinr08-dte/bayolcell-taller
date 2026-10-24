# 24-oct-2026 09:05 (RD) · Formulario nativo de WhatsApp para la solicitud de financiamiento — Claude

## Pedido del dueño
Partió del reel de agentes de IA (opción 1: automatizar una tarea repetida). La tarea: cuando el cliente manda sus datos por
WhatsApp, alguien copia todo a mano al formulario del **Banco Ademi**. El dueño decidió el orden:
1. **Primero** un formulario propio que el cliente llene **dentro del mismo WhatsApp**, enviado por el empleado **ya con el
   equipo y el precio** (el cliente debe saber qué precio tiene lo que va a financiar).
2. **Después** ver cómo pasar los datos al formulario del banco, supervisado por el empleado. El banco no tiene campo de
   equipo: se usa el campo **«Referencia»** con sucursal, empleado y artículo.
Acceso del banco: el dueño ofreció mandarlo; se le pidió **no** hacerlo (regla de secretos). No se necesita para esta etapa.

## Fuente de verdad (mapa, agente de solo lectura)
- Envío saliente: Edge `whatsapp-enviar` → `POST zernio.com/api/v1/inbox/conversations/{id}/messages`; permisos por
  `identidadVerificada` + `tieneAccesoALinea`; ventana de 24 h (409 `ventana_cerrada`).
- Entrantes: Edge `whatsapp-webhook` (`verify_jwt false`, firma HMAC). No reconocía `interactive`/`nfm_reply`: una respuesta
  de formulario habría caído como «[Unsupported message]».
- Zernio soporta **WhatsApp Flows** (`POST /v1/whatsapp/flows`, `PUT /flows/{id}/json`, `POST /flows/{id}/publish`,
  `POST /flows/send`, `GET /flow-responses`). Publicar es irreversible; se versiona clonando.
- Regla ya existente en la IA: «lo aprueba el Banco Ademi; nunca prometer aprobación, cuotas ni inicial» → el formulario
  muestra solo equipo y precio.
- Tablas de financiamiento: `fin_solicitudes`, `fin_clientes`, `fin_planes` (sin cambios).

## Qué se hizo (rama `claude/whatsapp-flow-financiamiento`, sin publicar)
### Base (aplicado con el conector; archivo `supabase/migrations/20261024150000_whatsapp_flow_financiamiento.sql`)
- `whatsapp_flows`: el formulario de Meta por línea (flow_id, versión, estado, JSON, errores de validación).
- `fin_solicitudes_whatsapp`: cada envío (hilo, línea, sucursal, empleado, equipo, precio, **referencia**, `flow_token`) y la
  respuesta del cliente (`datos` ordenados, estado `enviado → respondido → procesado | descartado`).
### Servidor
- **Nueva Edge `whatsapp-flow-financiamiento`** (v1, `verify_jwt false`; la identidad se verifica adentro como en
  `whatsapp-enviar`; llave de un solo uso en `_plantilla_llaves` solo para `publicar`/`sincronizar`/`estado`):
  - `publicar`: crea el flow en cada línea (o una), sube el **Flow JSON v6.0** (3 pantallas: datos con equipo/precio de solo
    lectura, dirección con lista de 32 provincias, confirmación), guarda errores de validación de Meta; con `publicar:true`
    lo publica. Admin.
  - `enviar`: permiso `financiamientos_crear` (o admin) + acceso a la línea; ventana de 24 h; arma la **Referencia**
    `Sucursal · Empleado · Equipo RD$ precio`; manda el flow con los datos prellenados y un `flow_token` propio
    (`<flow_id>:<uuid>`); guarda el mensaje saliente (`tipo_contenido: flow`) y la fila en `fin_solicitudes_whatsapp`.
    Con `prueba:true` usa el borrador (`draft:true`) para probar antes de publicar.
  - `sincronizar`: lee `GET /flow-responses` y registra lo que el webhook no haya reconocido (red de seguridad).
- **`whatsapp-webhook`**: busca `nfm_reply` en el evento, guarda la respuesta como `tipo_contenido: flow_respuesta` con
  `meta.flow.datos` y texto legible, y enlaza `fin_solicitudes_whatsapp` por `flow_token`. Si no viene formulario, no cambia nada.
### Pantalla (`crm-flow-financiamiento.js?v=20261024-f1`, cargado desde `crm-marketing-consent.js?v=20261024-u14`)
- Botón junto a la caja de escribir (quien tenga «Crear financiamientos» o sea admin): ventana con **Equipo** (con lupa
  para buscar en Info Plus y traer el precio de cliente final), **Precio** y, para admin, «Modo de prueba».
- La respuesta se pinta como tarjeta: cada dato con botón **Copiar**, la **Referencia para el banco**, «Copiar referencia» y
  «Copiar todo». Vista previa en la lista: «📋 Solicitud de financiamiento recibida».
- Capa aislada y reversible: `localStorage.bc_flow_fin_off='1'`.

## Pruebas
- Banco local (`scripts/pruebas/flow-financiamiento.cjs`) a **390 y 1280 px: OK**, 0 errores JS: capa cargada, render
  envuelto, tarjeta con 12 botones ≥44 px y la referencia, botón del chat 44 px, campos 48 px / 16 px, botón 54 px, llamada
  al servidor con equipo, precio, hilo y prueba.
- **Meta validó el Flow JSON** al subirlo en borrador en la línea Reparación +18097072493: primer intento rechazado
  (`INVALID_NAVIGATE_ACTION_PAYLOAD`: la cédula como «number» no casaba con el esquema «string»); corregido a texto de 11
  caracteres. Resultado del segundo intento: ver actualización abajo.
- `esbuild` compila las dos Edge Functions.

## Pendiente
- Prueba real: el dueño escribe a la línea de prueba desde su celular y un administrador le manda el formulario en
  **modo de prueba**; comprobar que la respuesta llega al chat como tarjeta.
- Si la respuesta de Zernio no trae `nfm_reply` donde se busca, usar `sincronizar` y ajustar el webhook con el payload real.
- Fase 2: puente al formulario del banco (robot supervisado o pegado asistido). Necesita el enlace y una captura del formulario.
- Fuera de la ventana de 24 h haría falta una plantilla con botón de flow (no hecha).
