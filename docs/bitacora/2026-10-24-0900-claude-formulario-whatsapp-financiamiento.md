# 24-oct-2026 09:00 (RD) · Formulario nativo de WhatsApp para la solicitud de financiamiento — Claude

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

## Actualización 09:10 RD · el formulario del banco
El dueño mandó el enlace: **https://embajadores.banfondesa.com.do/login** («Banfondesa - Ingreso de Prospectos»). Es un portal
de **Banfondesa** (no Ademi, como dice la base de conocimiento de la IA: hay que confirmar con el dueño si Ademi sigue o cambió).
Página de entrada pública: aplicación moderna (Next.js/React) con usuario y clave; el formulario de prospectos está detrás del
inicio de sesión, así que sus campos solo se verán con capturas del dueño o desde la PC de la tienda. **No se pidieron ni se
recibieron claves.** Para la fase 2 (puente al banco) hacen falta: capturas de cada pantalla del formulario, qué campos son
obligatorios y cómo se llama exactamente el campo «Referencia».

## Actualización 09:15 RD · Meta aceptó el formulario (borrador)
- `whatsapp-flow-financiamiento` **v2** (cédula como texto). Segunda subida del Flow JSON en la línea Reparación +18097072493:
  **sin errores de validación**. Flow `1745286376543075`, versión 1, estado DRAFT (no publicado).
- Meta devolvió una vista previa web del formulario (enlace público sin inicio de sesión, válido unos 30 días; está en
  `whatsapp_flows` no, se obtiene con `publicar` cada vez). Se le pasó al dueño para que lo vea antes de probarlo en su celular.
- Llaves de un solo uso: ambas copias locales borradas; las filas de `_plantilla_llaves` vencen solas.

## Actualización 09:20 RD · webhook desplegado
- `whatsapp-webhook` **v40** desplegada (idéntica al repo, SHA-256 comprobado; `verify_jwt false`; conserva el import map
  `deno.json` que ya tenía la v39, ahora también en el repo). En los 20 minutos siguientes todos los eventos de Zernio
  respondieron 200 (mensajes normales siguen entrando igual).
- Estado: todo listo para la prueba real en el celular del dueño (línea Reparación +18097072493, modo de prueba).

## Actualización 09:35 RD · regla del dueño: informar antes de enviar
«Ese formulario no se envía a clientes sin antes haberle dado las informaciones sobre qué equipo va a financiar.» Ya era así
(solo lo manda un empleado con equipo y precio; la IA no lo envía). Para dejarlo amarrado: casilla obligatoria en la ventana
de envío «Ya le informé al cliente el equipo y el precio»; sin marcarla no se envía y sale el aviso. Capa `f2`,
`crm-marketing-consent.js?v=20261024-u15`. Prueba del banco actualizada: sin la casilla no hay llamada al servidor y aparece
el aviso; con la casilla, se envía. 390 y 1280 px OK.

## Actualización 10:30 RD · prueba real enviada y formulario del banco visto
- **Prueba real:** el dueño escribió a la línea Reparación +18097072493 (hilo `dc4d807f…`, nombre ESTERLIN ESPINAL). Para
  poder enviarlo sin sesión de usuario, la llave de un solo uso se aceptó también para `enviar` **solo en modo de prueba**
  (`prueba:true` → borrador); función **v3**. Envío OK: `solicitud_id efe412c1…`, referencia
  «Santiago · Prueba Claude · iPhone 13 128GB (PRUEBA) RD$ 38,500.00». Pendiente que el dueño lo complete.
- **Formulario del banco (12 capturas del dueño, portal Embajadores de Banfondesa, 4 pasos):**
  1. Tipo de identificación (CÉDULA), número con guiones `000-0000000-0` → el banco **valida la persona y llena solo
     nombres y apellidos**; teléfono móvil `000-000-0000`.
  2. Datos domiciliado: provincia → ciudad → distrito municipal → sector (listas encadenadas del banco), calle, casa y
     **«Referencia (Opcional)»** (texto libre: ahí va `Sucursal · Empleado · Equipo precio`).
  3. Producto PRÉSTAMOS (sub producto MICROCRÉDITO), monto solicitado y plazo en meses.
  4. Resumen + documentación adjunta: identificación oficial y comprobante de domicilio; «Enviar» acepta términos.
- Ajuste a la tarjeta del CRM (capa **f3**, `crm-marketing-consent.js?v=20261024-u16`): «Copiar» entrega la cédula con
  guiones, el teléfono con guiones (quita el 1 inicial) y una fila **Monto** con el precio sin RD$ ni comas. Prueba del banco
  actualizada: OK a 390 y 1280.
- **Decisiones que faltan del dueño:** si el Flow pregunta el plazo deseado (6/12/18/24 meses) o lo pone el empleado;
  si tras el formulario se le pide al cliente foto de cédula y comprobante de domicilio por el chat; y si Ademi sigue.

## Actualización 10:55 RD · las tres decisiones del dueño, aplicadas
Dueño: «Sí a las tres, cambia a Banfondesa. Esa información la podemos usar tanto para Banfondesa como para el banco de
Ademi… lo más importante: cédula, dirección, equipo y monto… en la referencia ponle un botón para copiar… que copie todas las
informaciones para mandársela a la gente de Ademi.»

1. **Plazo en el formulario.** Pantalla DATOS: lista «Plazo que le gustaría» con 6, 12, 18 y 24 meses y la nota «El plazo final
   lo define el banco». Se guarda en `datos.plazo` (solo dígitos) y la pantalla CONFIRMAR lo repite. **Meta volvió a aceptar
   el Flow JSON sin errores de validación** (flow `1745286376543075`, versión 1, sigue en DRAFT; no se publicó).
2. **Fotos pedidas solas.** Al llegar la respuesta del formulario (por el webhook o por `sincronizar`), el sistema manda un
   mensaje al cliente pidiendo la foto de la cédula (frente) y el comprobante de domicilio, y lo deja en `whatsapp_mensajes`
   como salida automática. Se pide **una sola vez** (columna nueva `fin_solicitudes_whatsapp.fotos_pedidas_en`). La tarjeta
   del empleado cuenta las imágenes/documentos que entran después y dice «Faltan las fotos…», «1 foto recibida · falta 1» o
   «✓ 2 fotos recibidas».
3. **Banfondesa.** `whatsapp_ia_conocimiento` (servicios y políticas) y 3 filas de `whatsapp_ia_ejemplos` ya dicen Banfondesa
   en vez de Banco Ademi (0 menciones de Ademi quedan). La información que se pide al cliente sirve para los dos bancos.
4. **Botón «Copiar solicitud completa»** en la tarjeta: arma el bloque «SOLICITUD DE FINANCIAMIENTO – BAYOL CELL» con
   referencia, cédula, nombre, teléfono, dirección completa, equipo, monto y plazo deseado, listo para pegarlo a la gente de
   Ademi o del banco. «Copiar referencia» queda para el campo del portal de Banfondesa.

**Archivos:** `supabase/functions/whatsapp-flow-financiamiento/index.ts` (**v4** desplegada), `supabase/functions/whatsapp-webhook/index.ts`
(**v41** desplegada, `verify_jwt false`, import map `deno.json`), `crm-flow-financiamiento.js` (capa **f4**),
`crm-marketing-consent.js?v=20261024-u17`, `taller.html`, migración
`supabase/migrations/20261024184500_flow_fin_plazo_fotos_banfondesa.sql` (ya aplicada en producción con `execute_sql`; el
archivo deja el historial), `scripts/pruebas/flow-financiamiento.cjs`.

**Pruebas:** banco local a 390 y 1280 px OK (capa f4 cargada, 14 botones ≥ 44 px, campos 48 px/16 px, botón principal 54 px,
sin casilla no hay llamada y sale el aviso, fila Plazo «12 meses», bloque completo con «Plazo deseado», aviso de fotos
pendientes, llamada `enviar` con equipo/precio/prueba). Llave de un solo uso k4 usada solo para `publicar` en borrador;
copia local borrada, la fila vence sola.

**Pendiente:** que el dueño complete el formulario de prueba en su celular (solicitud `efe412c1…`, enviada antes del cambio
de plazo: su formulario no trae plazo, es normal); comprobar que llegan la tarjeta y el mensaje automático de las fotos; con
su «publícalo», publicar el Flow en las 6 líneas y pasar la rama a `main`.

## Actualización 15:10 RD · el dueño eligió la página de Bayol («Hazlo»)
Tras ver las maquetas (página «Formulario confiable» y demo que se toca), el dueño pidió: textos naturales sin «inicial»
(con el banco no hay inicial), pantallas más intuitivas y animadas, una pregunta por pantalla, dirección completa en una sola
pantalla, pasos numerados arriba en vez de barra, botones por encima del teclado, colores claros que den confianza (azul,
blanco, verde solo en lo logrado), nada de cajas de fotos en la pantalla final, y «Hazlo». Decisión: **la página web de Bayol
es el camino principal; el Flow nativo de WhatsApp queda de respaldo.**

**Qué se construyó**
- `solicitud.html` (raíz del repo, GitHub Pages → `https://bayolcell.com/solicitud.html?t=<llave>`): 5 pasos (cédula, nombre,
  celular, plazo, dirección), resumen con «Cambiar», permiso «Doy permiso a Bayol Cell para enviar estos datos al banco»,
  pantalla «Listo, Nombre. Ya nos llegó» con número de solicitud, y pantalla «Este enlace no sirve». Cédula con guiones solos y
  avance automático al completar; celular con guiones; chips de plazo; pasos numerados que se marcan; deslizar hacia la
  derecha para volver; pie que sube con el teclado (`visualViewport`); `enterkeyhint`; solo tema claro (`color-scheme: light
  only`); fondo con manchas difuminadas suaves; respeta «reducir movimiento/transparencia». `noindex`. Llave de 48 hex en
  `?t=`; la página habla con la Edge por `web_leer` / `web_enviar` con la clave anon.
- Edge `whatsapp-flow-financiamiento` **v5**: `enviar` acepta `modo: 'web' | 'flow'` (web por defecto). En web crea la fila
  (`canal='web'`, `token`, `vence_en` +7 días, `numero` de serie), manda por Zernio un texto con la voz del empleado («Hola
  Juan, le habla Loribel de Bayol Cell Santiago. Le dejo el formulario… son cinco pasos cortos…») + enlace, y lo guarda como
  mensaje `text` saliente. Acciones públicas sin sesión: `web_leer` (datos del enlace si está vigente y en estado `enviado`)
  y `web_enviar` (valida todo en el servidor, consume la llave de forma atómica, guarda `datos`, inserta el mensaje
  `flow_respuesta` para que la tarjeta del CRM salga igual que con el Flow, y manda el texto de recibido con número y las
  fotos que faltan, una sola vez). Las reglas siguen: lo manda un empleado con permiso y casilla; la IA no.
- Migración `20261024210000_fin_solicitud_web.sql` (aplicada): columnas `canal`, `token` (única), `vence_en`, `numero`
  (identidad).
- CRM capa **f5** (`crm-marketing-consent.js?v=20261024-f5`, `taller.html` u18): selector «Cómo lo recibe el cliente»:
  Página de Bayol (enlace, recomendado) / Formulario dentro de WhatsApp (respaldo). La tarjeta de respuesta no cambia.
- Pruebas: `scripts/pruebas/solicitud-web.cjs` nuevo (390 y 1280: OK) y `flow-financiamiento.cjs` (390 y 1280: OK con f5).

**Pendiente:** la página solo existe en producción cuando la rama pase a `main` (GitHub Pages). La prueba real en el celular
del dueño (enlace de prueba a su número) se hace justo después del «publícalo»; hasta entonces el enlace daría 404.
