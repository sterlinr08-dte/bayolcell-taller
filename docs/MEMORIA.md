# MEMORIA.md — Bayol Cell (para que la IA se ponga al día tras compactar)

Borrador del 21-oct-2026. Solo hechos verificados. Si algo de aquí choca con el código, la base o una bitácora más nueva,
manda lo más nuevo. Ante la duda, volver a leer (nunca suponer).

> Parte técnica y detalle: `docs/MEMORIA-TECNICA.md` (leerla cuando el trabajo toque esas piezas).

## 1. Propósito
- Se recarga sola al iniciar y al compactar el chat. Es un resumen: la fuente completa es `CLAUDE.md`, `.claude/rules/` y la bitácora. Actualizar en cada entrega; nunca borrar una regla del dueño sin su OK.

## 2. Dueño y reglas de trabajo
- Dueño: **Sterling** (Esterlin). No es programador: español sencillo, sin jerga; terminar con «Para probarlo:».
- **Trato de «usted»** en todo texto al empleado y al cliente (desde 19-oct). Rótulos con nombres, no preguntas. Sin exclamaciones.
- **Publicar solo con «publícalo»** (o equivalente explícito) para esa entrega concreta. Lo demás queda en la rama.
- **Bitácora nueva** por cada cambio/decisión/publicación: `docs/bitacora/AAAA-MM-DD-HHMM-claude-tema.md`.
  Nunca editar ni borrar una entrada anterior; corregir con otra que la cite.
- **Secretos nunca** en repo, chat ni logs: `INFOPLUS_CLAVE`, service_role, Zernio, Anthropic, Hexnode. Solo `Deno.env` en Edge.
  En el cliente solo la clave publicable + RLS.
- **No poner IDs de modelo** (ni de IA de la sesión) en los mensajes de commit.
- **Tamaño táctil:** todo lo que se toca ≥ **44 × 44 px**; campos **48 px de alto con letra de 16 px**; letra mínima de controles 13 px.
  Medir con Playwright a **390 y 1280 px** y anotarlo. Capa `taller-tactil.css` (`html.bc-tactil`, excluye `#waWrap`).
- Diseño: leer **`DESIGN.md`** (estilo NEXUS común a los 3 proyectos; Bayol con acento naranja `#e4572e`, ventanas de consulta en
  azul NEXUS) y `docs/REFERENCIAS-DISENO.md` antes de cualquier pantalla. Una sola entrada por función. Ayudas detrás de una ⓘ.
  Nada de letra monoespaciada en números (usar `tabular-nums`). Nada de FOUC.
- Usar las **skills instaladas** sin esperar a que las nombren (ver `HERRAMIENTAS.md`). Nuevas en este repo: `design-taste-frontend`
  (solo páginas públicas nuevas, pesada) y `the-architect` (plano antes de algo grande; publicada en `main`, e53c003).
- **Datos de Bayol salen solo de su Info Plus** (copia `infoplus_articulos` y funciones `infoplus-*`). STUDIO sirve solo como modelo
  de diseño, nunca como fuente de datos.
- **Escribir en Info Plus** (precios, prefacturas de prueba, ajustes) exige autorización expresa del dueño. Leer antes en vivo.
- Agente de IA de WhatsApp: seguir `.claude/rules/agente-atencion-supervisado.md` y
  `AGENTE_ATENCION_APRENDIZAJE_SUPERVISADO_2026-09-14.md`.

- **Avisos en pantalla:** cortos, profesionales, que informen, sin redundancia (`REGLAMENTOS.md` §4, 22-oct).
- **Todo «smart» (dueño, 30-oct-2026):** cada pantalla que se toque debe (1) pensar por el usuario (valores puestos, autocompletar, formatos solos, avisos antes de fallar), (2) verse elegante y moderna y (3) funcionar igual en iPhone y PC. Detalle en `DESIGN.md`.

## 3. Qué tenemos funcionando (por módulo)
- **Reacondicionados (27-oct):** candados en el servidor aplicados (`20261027000000`, pegado por el dueño), traza del precio de venta (fuente/por/en) y Atención sin órdenes repetidas (PR #127). Pendiente con OK: cerrar 209 tareas abiertas en 96 equipos terminados; descontar 3 piezas «recibida» en Info Plus (otras 16 confirmar en físico). Botón «Diagnósticos (Excel)» por lote: una fila por equipo con nota, fallas pendientes y hechas, y piezas, sin costos (28-oct, PR sin publicar).
- **Cuentas de pago por WhatsApp (26-oct):** plantilla `bayolcell_cuentas_pago_v2` (cuentas fijas en el texto, una por bloque; APPROVED en 5/6 líneas, +18094899145 pendiente). El texto libre (<24 h) es idéntico (`_rpTextoCuentas`). Si cambia una cuenta: cambiar `_RP_CUENTAS_TEXTO` y someter v3.
**Prefactura** (antes «Recepción»; id interno `recepcion`, tabla `recepcion_prefacturas`; capa `taller-prefactura.js/.css`,
apagar con `localStorage.bc_pf_off='1'` o `BC_PF=false`):
- Documento estilo STUDIO: franja Facturar a · Precio del cliente · Almacén; Vendedor al pie junto a «Pedir reseña».
- **Lupa arriba a la izquierda = única entrada al historial** de prefacturas.
- Estado en **píldora con punto** («Crear», «En Info Plus», «Error», «Facturada»…).
- Cliente de contado: **«CONTADO: 1»**. Precio del cliente: **CLIENTE FINAL / POR MAYOR / EXTREMO** (cliente con código ≠ 1 → Por mayor).
- Equipo, falla y más datos en plegable opcional; con equipo crea también la orden. Descuento % por línea (sin probar contra Info Plus real).
- Almacén fijo para empleadas con sucursal; el admin elige y se recuerda en su equipo (`bc_alm_admin`).
- Códigos de vendedor Info Plus en `tecnicos.infoplus_codempleado`: Michelle 748, Kenifer 1020, Yosmeiry 1192, Loribel 249; Yves sin código. Al guardar un empleado avisa si el código ya lo tiene otro o si Info Plus nunca lo usó en una venta (28-oct). La API no da la lista de vendedores («Error en las credenciales»).
- Celulares: botón IMEI abre ventana; lista «IMEI en <almacén>» (Edge v10, §6); se escanea o escribe.
  Covers, forros, cases, cristales y accesorios **no piden IMEI** (`_abCat`).
- Buscador de artículos como ventana emergente (vidrio NEXUS): Código · Artículo · Existencia · Precio; al tocar, niveles y existencia
  por almacén; muestra la **referencia** de Info Plus (capacidad / «Con aviso»). La línea de servicio lleva equipo · IMEI · falla
  a Info Plus (máx. 100 letras), porque la API no tiene campo Comentarios visible.

**CRM WhatsApp** (vista `v-crmLinea`):
- Botón **«Consulta»** (antes «Precios») en la cabecera del chat (`crm-consulta-precio.js/.css`): solo consulta, precio cliente final
  (nivel 1), columna Existencia con **Total** o **«Sin stock»**, detalle con línea **«Existencia»** (almacén + cantidad … Total),
  etiqueta de referencia (capacidad / «Con aviso»), **botón copiar que copia solo el precio** («RD$ 15,000.00»).
- **Etiquetas** con cantidad de chats y círculo verde de sin leer; botón «Etiquetas ▾» con total sin leer.
- **Acuses** («ok», «gracias», «perfecto», 👍…) tras la respuesta ya no dejan el chat en «Atender» (`_crmEsAcuse`).
- Fases WhatsApp 1–3 publicadas: palomitas corregidas (4,416 históricas, respaldo `respaldo_wa_palomitas_20261018`), contactos y
  ubicaciones, aviso de línea desconectada, motivo de fallo en español, reacciones (falta que el dueño marque `reaction.received`
  en el webhook de Zernio «BayolCell Navarrete WhatsApp»).
- Botón de formulario de financiamiento en usted (`crm-financiamiento-quick-reply.js`, publicado).
- **Solicitud de financiamiento desde el chat, PUBLICADA (24-oct, PR #116):** solo lo manda un empleado, con equipo y precio y la casilla «ya le informé al cliente»; la IA nunca lo envía; nunca prometer aprobación/inicial/cuotas. Pide cédula, nombre, teléfono, dirección y plazo deseado (6/12/18/24; el banco decide). Al llegar, el sistema pide solo las fotos de cédula y comprobante (una vez). Tarjeta en el chat con «Copiar referencia» (`Sucursal · Empleado · Equipo precio`, para el portal Embajadores de Banfondesa) y «Copiar solicitud completa» (para Ademi/banco). Edge `whatsapp-flow-financiamiento` v4 (llave de un solo uso solo para publicar/pruebas), webhook v41, tablas `whatsapp_flows` y `fin_solicitudes_whatsapp`. Flow en DRAFT en la línea Reparación. **Decisión del dueño (24-oct, «Hazlo»): el camino principal es la PÁGINA WEB `solicitud.html` (bayolcell.com, enlace con llave de un solo uso, 5 pasos, solo tema claro, azul/blanco/verde); el Flow nativo queda de respaldo.** Edge v5 (`modo` web/flow, acciones públicas `web_leer`/`web_enviar`). Página en vivo en bayolcell.com/solicitud.html; Flow de respaldo publicado en 5 líneas (la 2.ª «Al por Mayor» bloqueada por Meta, en DRAFT). La IA ya dice Banfondesa (no Ademi). Pruebas reales No. 2 y 3 completadas. PR #117 publicado: enlace corto `bayolcell.com/solicitud?t=<10 letras>`, mensaje en la voz del empleado, **recibido sin pedir documentos (primero evalúa el banco; los documentos se piden después)**, tarjeta f6 «Pendiente de enviar al banco». La IA ya no pide foto de cédula para someter (SQL pegado por el dueño el 24-oct, verificado). **Pendiente:** decisión A/B/C del dueño para la lista «Solicitudes» en Financiamientos.

**Modo ligero (21-oct):** en PCs sencillas (≤4 núcleos o ≤4 GB) o con Chrome sin aceleración de gráficos se quitan las esferas animadas del fondo y el vidrio difuminado (`html.bc-ligero`, se decide en el `<head>`). Forzar en un equipo: `taller.html?ligero=1`; quitar: `?ligero=0`; automático: `?ligero=auto`. El aviso «Sin conexión en tiempo real» ya no se anima.

**Taller general:** ⓘ de ayuda en todas las pantallas (`taller-info.js`), capa táctil, texto en usted, Navarrete (almacén 7) en
listas y sincronización.

## IA de WhatsApp (resumen; detalle en MEMORIA-TECNICA)
- `whatsapp-ia-responder` v32 (Haiku 5.5): usted, «Buenas, a la orden», estimado/a solo si el nombre lo deja claro, sin «mi amor», casi sin emojis. Saludo lee al cliente; formulario solo si el último mensaje lo pide. Aprende de `whatsapp_ia_ejemplos` (42 + correcciones). Seguimientos prendidos hasta el 24-oct (tope 400/día); el 25-oct se apagan (tope 150).

## 6. Pendientes y esperas
- **App del celular de los empleados (PUBLICADA 27-oct, PR #129; base y Edge `push-enviar` v1 aplicadas):** permiso `solo_movil` = solo Prefactura y CRM; chats de su sucursal con `whatsapp_solo_sucursal`; avisos push (sw.js solo avisos, sin caché; `push_suscripciones`, trigger `trg_push_mensaje_entrante`, Edge `push-enviar`, claves VAPID creadas por la Edge en `_push_vapid`). Falta: el dueño marca el rol y prueba el aviso en su iPhone (bit. 27-oct 1115). En iPhone los avisos solo funcionan con la app agregada a inicio.
- Plantilla `bayolcell_cuentas_pago_v2` sigue PENDING en Al por Mayor +18094899145 (27-oct); la v1 ya está APPROVED ahí y en Navarrete.
- **Prefactura por WhatsApp** (rama `claude/prefactura-whatsapp`, sin publicar): botón, línea por sucursal, cliente por número con pestaña Compras, sin «Prefacturas realizadas». Plantilla `bayolcell_prefactura` sometida a Meta (PENDING, 22-oct). Ver REGLAMENTOS §1.7–1.9.
- **IMEI por almacén:** `listaserie` filtra por `codalmacen`; Edge v9 lo usa (lista prudente por almacén) y con `{imei}` devuelve el artículo (compras → listaserie). Falta prueba real; rama `claude/imei-busca-articulo` sin publicar: IMEI → artículo, serie la decide Info Plus, IMEI a mano comprobado, tope % y descuento RD$, `REGLAMENTOS.md` (bit. 1740, 1830, 1825).
- **Esperando a Dagoberto:** Comentarios/Atención/Cédula/Teléfono/Fecha de entrega en `PreFacturaModel`; crédito/mínimo por nivel y `porcentaje`.
- **WA 22-oct:** publicado «Transferido», historial en el chat, «A un empleado», respuestas rápidas, álbum y «Eliminar para todos» (falta prueba real, bit. 1700). Llamadas: sin rastro (coexistencia).
- Prefactura impresa con el Nº de Info Plus (ticket/carta, «COPIA»): rama sin publicar (bit. 21-oct 1200). IA v32 desplegada (código no en `main`).
- Info Plus (22-oct, probado en vivo): descuento de cabecera es %, se manda todo el descuento ahí (líneas con 0); al **modificar** no actualiza el descuento → anular y crear nueva (pedir a Dagoberto). Comentario va en `comentario`.
- Meta: conector WhatsApp MCP no ve BayolCell (reconectar marcando BayolCell); app de desarrollador bloqueada para el dueño (ESTERLIN ESPINAL con 2FA puede crearla). **Zernio se queda** hasta probar cada paso.
- Cuenta publicitaria 988971888850978 fuera de portafolio (para después).
- `reaction.received` en Zernio (dueño). «te sale» en `social-automatizaciones`.
- Revisar sugerencias reales de la IA (tono/largo) y el gasto diario tras el 25-oct.

- **Regla de orden de formularios (dueño, 24-oct):** etiquetas sin MAYÚSCULAS, textos formales en usted, casillas en fila dentro de tarjeta de 48 px, campos 48/16, botón 54; la capa gana a la cascada y se prueba a 390 px. `DESIGN.md §4b`, igual en los 3 proyectos. En el chat móvil, «Solicitud de financiamiento» va en el menú del clip (capa f9, PR #118 sin publicar).

- **Pestaña «Solicitudes» del CRM (24-oct, rama `claude/solicitudes-crm`, SIN publicar):** seguimiento de solicitudes de financiamiento del banco (Recibida → Enviada al banco → Aprobada/No aprobada → Entregada), filtro por sucursal, «Avisar al cliente» deja el texto escrito en el chat (no envía solo). Nombre «Solicitudes» sin logo (dueño). Base ya aplicada: columnas `seguimiento*` y RPC `fin_solicitud_seguimiento`. Bit. 2026-10-24-1726.

- **Solicitudes (CRM) tras la auditoría (24-oct, PR #122, PUBLICADO):** cada técnico ve solo su sucursal (y lo que envió); cuentas «usuario» ven todo; pasos en orden y corrección con motivo; nadie escribe la tabla directo. Pendiente: responsable/próxima gestión, constancia de permiso del cliente, enlaces duplicados.

- **Solicitudes: responsable y próxima gestión (25-oct, PR #123, PUBLICADO):** bandeja «Atender hoy» por defecto; responsable = quien envió; el paso propone la próxima gestión (banco → mañana 10:00; aprobada → hoy). Horas: hoy 4:00 p. m., mañana 10:00 a. m.

- **10 agentes (26-oct-2026, PUBLICADO, PR #124, merge 68fd120):** interfaz de Inicio, Órdenes, Inventario, Despachos, Finanzas, global, y Reacondicionados (pantalla, prueba de punta a punta 25/25, rentabilidad por teléfono, mapa del proceso `docs/REACONDICIONADOS-PROCESO.md`). Cada capa se apaga con su `localStorage`. 4 SQL propuestos sin aplicar. Bit. 2026-10-26-0240.

- **Espaciado de formularios, piloto (30-oct-2026, **PUBLICADO**, PR #145):** capa `bc-form-espaciado.css` (`html.bc-fesp`, apagar `bc_fesp_off='1'`) en 5 formularios: Prefactura (+Buscar cliente +plegable Equipo/falla/orden), Nuevo empleado, Login, Nuevo cliente (Financiamientos). Los 6 medidos pasan a «cumple» a 390 y 1280. Pendiente: que el dueño vea las comparativas y decida barra de título/pie y si sigue con los otros 68. Bit. 2026-10-30-0802.
- **Espaciado de formularios, todos (30-oct-2026, **PUBLICADO**, PR #148, dueño «Publícalo»):** la misma capa `bc-form-espaciado.css` (`?v=20261030-e2`) ampliada a los 74 formularios de la auditoría y cargada también en inicio/catálogo/tienda/solicitud/autoeval/campañas (clase `bc-pag-*` por página). Antes 6 cumple / 68 no → después **55 cumple, 1 casi, 18 no** (3 del chat de WhatsApp del CRM y 2 herramientas excluidas; el resto con motivo en la bitácora). 15 campos del taller con `inputmode` (tel/decimal). Banco 13/13 en verde. Bit. 2026-10-30-0946.

- **Reacondicionados, lista de lotes compacta (30-oct-2026, PUBLICADO, dueño «Publícalo», opción B):** capa `bc-reacond-lotes.css/js` (`html.bc-rlc`, apagar `bc_rlc_off='1'`): una fila por lote, número de la etapa elegida en grande, solo etapas con equipos, «Abrir ›» y toda la tarjeta abre el lote. Lote 179→101 px en PC. Además el buscador de la Prefactura ya no pinta la franja naranja del reflector (PR #150). Bit. 2026-10-30-1145 y 1050.

- **Prefactura «nivel pro» + ventana de impresora (30-oct-2026, PUBLICADO, dueño «Publícalo», opción B):** capa `bc-prefactura-pro.css/js` (`html.bc-pfpro`, apagar `bc_pfpro_off='1'`): en PC ≥ 1440 px dos columnas con «Resumen» fijo a la derecha (se mueve la barra `.bcpf-bar` entera dentro, R.bar sigue sirviendo); el engranaje abre la ventana «Impresora de esta computadora» encima (mueve `#qzPanelCard` y `#bcPfFmtCard` y los devuelve). Bit. 2026-10-30-1250.

- **Etiquetas «estudio de etiqueta» (30-oct-2026, PUBLICADO, dueño «Publícalo», opción B):** capa `bc-etiquetas-pro.css/js` (`html.bc-etq`, apagar `bc_etq_off='1'`): formulario en 2 columnas, marca sola según el modelo, botones de capacidad y estado, aviso de IMEI, vista previa grande fija con copias e Imprimir; mismos id y funciones de impresión. Bit. 2026-10-30-1520.

- **CRM: vaciar / eliminar chat solo administrador (30-oct-2026, PUBLICADO):** RPC `crm_vaciar_hilo` y `crm_eliminar_hilo` (app_is_admin, auditoría `CRM_*_CONVERSACION`, eliminar conserva leads con hilo_id null); opciones rojas en el menú del chat (`crm-wa-identico.js` w19). Pendiente: cerrar políticas `app_authenticated_all` de hilos/mensajes. Bit. 2026-10-30-1530 y 1545.
- **Raspa y gana (29-oct, rama `claude/raspa-y-gana`, PUBLICADO 30-oct, migración aplicada):** base probada sin aplicar (`20261029200000`) y pantallas: `raspa.html` (QR → WhatsApp → raspar; premio del servidor antes de raspar; reseña Google), cupón B/N con QR al pie de la prefactura de RD$500+ (`raspa_emitir`), píldora «Premio Raspa y gana» con canje por línea (`bc-raspa.js/.css`, `raspa_canjear` al guardar). Apagar `bc_raspa_off=1`. Falta: aplicar migración con «publícalo», prueba real, y prueba autorizada en Info Plus del descuento de cabecera con accesorio gratis. Bit. 2026-10-29-2332.

## 7. Errores a no repetir
- **22-oct:** un `//` al final de una línea con varias sentencias rompió `taller-prefactura.js` y se publicó porque el `push` no iba encadenado con `&&` tras el chequeo de sintaxis. Siempre encadenar y parsear el archivo publicado.
- **Clasificador de seguridad bloqueó** (no reintentar): una Edge **pública** que usa la clave de Info Plus; que Claude **la llame por su
  cuenta**; una **llamada automática silenciosa** con la sesión del admin. Lo correcto: función autenticada usada por la pantalla real.
- **MCP de Supabase:** `apply_migration` y `execute_sql` largos/complejos se cuelgan ~60 s → aplicar en sentencias pequeñas;
  **`UPDATE` sin `WHERE` se cuelga** (siempre con `WHERE`). Guardar igual el archivo de migración en el repo.
- `infoplus_articulos` puede tener descripciones viejas: leer en vivo antes de escribir precios. Códigos de Info Plus reutilizados
  para otros modelos (filtrar IMEI también por nombre).
- `\n` en `basedatos`/clave rompió despacho y sync: siempre `.trim()`.
- `POST /compra` con `codpedido` **reemplaza**, no agrega.
- No duplicar botones (pasó con el historial de la Prefactura). No ocultar con `[hidden]` si otra regla pone `display:flex`.
- Al medir animaciones, esperar a que termine la entrada (a medio abrir da 43/47 px).
- No sobrescribir un archivo sin leerlo (pasó con `DESIGN.md` de nexus-pro; se restauró).

- **Candado de secretos** (hook `secretos.sh`) y skill `redaccion-clara` instalados el 23-oct (HERRAMIENTAS.md).

## 8. Dónde buscar más
- `CLAUDE.md` (mapa completo, Info Plus, permisos, historial por fechas), `DESIGN.md`, `HERRAMIENTAS.md`, `PENDIENTES.md`
  (MDM/financiamiento), `docs/RUTAS-CONSULTA-IMEI.md`, `docs/REFERENCIAS-DISENO.md`, `AUDITORIA_SISTEMA_PARA_CLAUDE.md`.
- `docs/bitacora/` (leer las más recientes en orden), `git log --oneline origin/main -50`.
- Pruebas locales (Playwright, banco con Supabase simulado): `pftest`, `pfopc`, `pfvent`, `almfijo`, `imeialm`, `crmprecio`,
  `etqcount`, `acuse`; `scripts/qa-precio-pantalla.mjs`.

- **Textos (dueño, 23-oct-2026):** nada de texto explicativo en las pantallas. Etiquetas de una o dos palabras («Comentario», «Sin artículos»). Si hace falta explicar, va detrás de la ⓘ (`taller-info.js`). Los avisos y errores sí se muestran.

- **Prefactura (dueño, 23-oct-2026):** los **técnicos no prefacturan** (no hace falta código de vendedor para Francis, Josiel ni Luis Miguel). El almacén del empleado queda fijo por su sucursal; los administradores (Loribel, Yves, admin) quedan libres. **No** se hace aviso de «Pedir traslado» cuando el artículo solo existe en otra tienda: basta el bloqueo actual.

- **Prefactura (23-oct-2026, publicado):** textos de garantía automáticos según lo que lleve (celular 30 días, pieza 30 días, moto eléctrica 3 meses, aire y TV 1 año); editables en Configuración → Datos del taller. Encabezado con dirección/teléfono de la sucursal (tabla `sucursales`; WhatsApp = teléfono). Al reimprimir una prefactura ya impresa sale la franja «COPIA» (regla anterior, el dueño la dejó). Copias del ticket por QZ: un trabajo por copia para que corte.
- **Prefactura, guardado confiable (24-oct-2026, publicado, PR #111):** candado de doble clic, sin «✅» si falla el historial (estado `error_historial`, Nº en `bc_pf_pendientes`, reintento actualiza), un solo documento para historial/impresión/WhatsApp, PDF real validado (`%PDF-`) por WhatsApp (modo `blob` en `bc-prefactura-imprimir.js`), campos vaciados al cargar otra prefactura, tope de descuento al guardar, técnico en la orden, reimprimir la de pantalla, scrollbar fina del menú. Pruebas: `scripts/pruebas/prefactura-confiable.cjs` (8/8). Pendiente: IMEI/sucursal en el servidor (Edge fuera del repo), «facturada» por caja (Dagoberto), aviso de comentario (decisión del dueño).
- **Prefactura, auditoría visual 1–3 (24-oct-2026, publicado, PR #112):** fondo oscurecido y ventana sólida del buscador, foco encerrado (Tab) y Escape global, «Guardar» con naranja oscuro (4.5:1), grises chicos `#64748b`, engranaje para configurar la impresora. La compensación de escala de Windows se queda (opción A del dueño). Pendiente: PDF de la auditoría con los otros 3 hallazgos; medir en iPhone real.
- **Prefactura por rol (24-oct-2026, publicado, PR #113 + precio libre):** el empleado solo usa el precio del nivel elegido en la cabecera, no edita la descripción y solo escribe precio libre en líneas de Servicio (catálogo: solo lectura). El administrador, libre en todo.
- **Reacondicionados fase 1 (24-oct-2026, publicado, PR #114):** despacho con error visible y sin falso éxito, reserva de piezas al completar, RPC `ajustar_stock_pieza`, historial `refurb_transiciones` con trigger, ventanas con foco y role, casilla y pestañas de 44 px. **Fase 2 lista en rama `claude/reacond-fase2` (24-oct, opción A del dueño):** guardia de permisos y transiciones en el servidor, RPC todo-o-nada para evaluar/devolver/crear lotes, reserva de Info Plus con referencia, V05. **Base completa y probada** (24-oct 08:10, el dueño pegó el último bloque; 20 pruebas con identidades reales y rollback). **Publicado** en `main` el 24-oct 08:20 (PR #115). Conciliación de datos solo con autorización.

- **Inventario/Artículos/Etiquetas/Inventario físico (26-oct, rama `claude/taller10-a3`, SIN publicar):** capa `taller-ui-inventario.css/.js` (`html.bc-inv`, apagar `bc_inv_off='1'`): tablas como tarjetas a 390 px con rótulos, sin MAYÚSCULAS, `tabular-nums`, existencia por almacén en píldoras. No cambia la lectura de Info Plus. Bit. 2026-10-26-0047.
