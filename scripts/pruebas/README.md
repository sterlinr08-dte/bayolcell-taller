# Pruebas automáticas del taller (banco local)

Sin Internet ni Supabase real: `supabase-stub.js` simula la base y `servidor.cjs` sirve el repo en `http://127.0.0.1:8788`.

```bash
node scripts/pruebas/servidor.cjs &            # servidor estático (gzip) del repo
node scripts/pruebas/prefactura-confiable.cjs  # 8 escenarios de la Prefactura (24-oct-2026)
```
Necesita Playwright y Chromium (en el equipo de pruebas está en `/opt/node22/lib/node_modules/playwright`; ajuste la ruta del `require` si hace falta).

## prefactura-confiable.cjs — qué comprueba
| Prueba | Escenario | Resultado esperado |
|---|---|---|
| T1 | Doble clic en Guardar | 1 sola llamada a Info Plus, 1 fila, aviso «Guardando…» |
| T2a | Info Plus crea, el historial falla | sin «✅ creada», estado `error_historial`, Nº recordado en `bc_pf_pendientes`, botones activos |
| T2b | Reintento | misma Nº (actualiza, no crea), historial guardado, pendiente borrado |
| T3 | Cambiar teléfono y agregar artículo mientras Info Plus responde | el historial guarda la foto original; el WhatsApp sale al número original |
| T4 | `imprimirPrefactura('blob')` | no imprime ni abre ventana; `_rpPdfBlob` devuelve un Blob que empieza por `%PDF-` |
| T5 | Cargar otra prefactura sin teléfono | el teléfono y la cédula del cliente anterior se vacían |
| T6 | Reimprimir con otra prefactura cargada | imprime la cargada, no la última creada |
| T7 | Quitar un artículo después del descuento en pesos | aparece «El descuento total … supera el tope» |
| T8 | Guardar recepción con técnico | la orden lleva `tecnico_asignado_id` y la función devuelve la orden |

## flow-financiamiento.cjs (24-oct-2026)
Formulario nativo de WhatsApp para la solicitud de financiamiento (`crm-flow-financiamiento.js`): la capa carga, envuelve el
render de burbujas, la tarjeta de respuesta trae 10 datos con «Copiar» (44 px) y la «Referencia para el banco», el botón
junto a la caja mide 44 px, la ventana de envío tiene campos de 48 px / 16 px y botón de 54 px, y la llamada al servidor va
con equipo, precio, hilo y modo de prueba. Correr con `node scripts/pruebas/servidor.cjs &` y `node scripts/pruebas/flow-financiamiento.cjs`.

## solicitud-web.cjs (24-oct-2026)
Página pública `solicitud.html` (formulario de financiamiento por enlace): con el servidor simulado, carga los datos del enlace
(saludo con nombre y empleado, equipo, precio, sucursal, celular y nombre ya puestos, provincias), recorre los 5 pasos, arma el
resumen con 7 filas, el botón queda apagado hasta marcar el permiso, envía `web_enviar` con la llave de 48 caracteres y los
datos con guiones, muestra «Listo, Nombre» con el número, y con un enlace malo muestra la pantalla «Este enlace no sirve».
Mide a 390 y 1280 px: botón principal ≥ 54 px, letra de los campos ≥ 16 px, sin desplazamiento horizontal.
Correr con `node scripts/pruebas/solicitud-web.cjs` (no necesita el servidor del banco).

## solicitudes-crm.cjs (24-oct-2026)
Pestaña «Solicitudes» del CRM (`crm-solicitudes.js`), con datos inventados. Comprueba a 390 y 1280 px: la pestaña aparece
sin recortar las demás, mide 44 px y muestra el número de solicitudes en proceso; la lista trae 5 solicitudes (la vencida
sin llenar no sale); filtros por sucursal, estado y búsqueda por cédula; botones y fichas ≥44 px, campo 48/16, nada en
MAYÚSCULAS; la ficha muestra todas las filas sin recortes; cambiar a «Enviada al banco» y «Aprobada» llama a la RPC
`fin_solicitud_seguimiento` y guarda el historial; «Escribir el aviso en el chat» abre el chat y deja el texto en la caja
sin enviarlo; la tarjeta del chat trae «Ver seguimiento» y abre la ficha. Uso: `node scripts/pruebas/solicitudes-crm.cjs [carpeta-capturas]`.

## ui-global.cjs (26-oct-2026)
Capa global de interfaz (`taller-ui-global.css/.js`). A 390 y 1280 px: barra de arriba con botones ≥ 44 px, ☰ solo en el
celular, título sin mayúsculas ni «ADMIN», secciones del menú en letra normal, etiquetas de Configuración sin MAYÚSCULAS y con
el paréntesis en la ⓘ, campos 48/16, Guardar 54 px, ⓘ que abren y cierran, KPI de Reportes en rejilla, dinero «RD$ 0.00», sin
desplazamiento horizontal ni errores; y Reportes sin Chart.js no congela la página. Uso: `node scripts/pruebas/ui-global.cjs`
(`PUERTO=xxxx` para otro puerto).
## reacond-flujo-completo.cjs (26-oct-2026)
Reacondicionados de punta a punta con las RPC del servidor simuladas igual que la base: crear lote (y lote repetido),
empezar y guardar evaluación, asignar técnico, pedir/entregar/recibir pieza (stock baja una sola vez), candados de pieza y
de tareas, tareas hechas → calidad → Listo, salida con doble toque (una sola salida y una sola baja en Info Plus), salida
repetida bloqueada, devolución con ciclo 2 y tarea abierta, equipo directo a Listo con fecha, editar evaluación de un equipo
en Listo (no lo regresa), salida en bloque y bloque que no salta etapas. Al final revisa historial (cada cambio de estado con
su renglón y su estado anterior real), costo de repuestos y flete del lote. 25 pasos a 390 y 1280 px.
Uso: `node scripts/pruebas/servidor.cjs &` y `node scripts/pruebas/reacond-flujo-completo.cjs [carpeta-capturas]`
(`PUERTO=…` si el servidor corre en otro puerto).
## reacond-proceso.cjs (26-oct-2026)
Capa `taller-reacond-proceso.js` (candados del proceso de Reacondicionados en el navegador), con datos inventados, a 390 y
1280 px: «Reabrir salida» pide confirmación; «Cerrar salida» no cierra un equipo en Listo; «Registrar salida» no repite un
Despachado; «Pasar a → Listo para venta» en bloque no mueve equipos con tareas abiertas; «Quitar equipo» y «Eliminar lote»
advierten si hay Despachados o piezas ya descontadas en Info Plus; un error largo sigue visible a los 4.6 s con `role=alert`;
«Despachar teléfonos» no llama a Info Plus si un equipo ya está Despachado y pregunta si alguno no está en Listo; botones del
lote ≥ 44 px y sin desplazamiento horizontal; 0 errores de JavaScript. Uso: `node scripts/pruebas/reacond-proceso.cjs [carpeta-capturas]`.

## app-movil.cjs (27-oct-2026)
App del celular de los empleados: con el permiso `solo_movil` el menú queda solo en CRM y Prefactura y entra al CRM; el
permiso aparece en la ventana de roles; se registra `sw.js`; la píldora «Avisos de mensajes nuevos» sale en el CRM con botones
de 44 px; al tocar «Activar avisos» pide permiso una vez, se suscribe con la clave pública (65 bytes) y guarda con
`push_suscribir`, y la píldora se va; abrir un chat inexistente desde un aviso no rompe nada; un rol normal no cambia.
390 y 1280 px, sin desplazamiento horizontal ni errores. Correr con `node scripts/pruebas/servidor.cjs &` y `node scripts/pruebas/app-movil.cjs`.
## raspa-y-gana.cjs (29-oct-2026)
«Raspa y gana», con las RPC `raspa_*` simuladas (no toca la base). Página pública `raspa.html` a 390 (claro y oscuro) y 1280 px:
pendiente, usado, vencido, no existe, sin enlace, jugado (regalo), activo → WhatsApp (corto rechazado, formato 809-555-1234) →
el premio se pide al servidor ANTES de raspar → raspar un poco no revela, raspar casi todo sí → premio, código, vence, dónde vale y
dónde no, «Dejar reseña en Google»; «Descubrir premio» con teclado; movimiento reducido. Hoja impresa: `raspa_emitir` al imprimir,
QR como imagen, sin cupón si es menor de RD$500, si está apagado (`bc_raspa_off`), sin red o con el servidor lento (3.5 s), la ventana se
abre antes de esperar; captura de la hoja carta (PNG y PDF) y del ticket, cupón en blanco y negro. Canje en la Prefactura: 10 % por
línea (pantalla 5, lámina 10, celular «No aplica», servicio 10), el premio pasa aunque el tope general sea 3 %, el tope sigue para el
resto, guardar → `raspa_canjear`; ya usado (Nº, fecha, cajera), vencido, accesorio gratis (cable 1021 con 100 %), quitar premio, misma
compra, búsqueda por teléfono (lista) y por QR, compra con celular (botón apagado), activar con factura, Escape, canje rechazado con
aviso fijo. Mide espaciado y tamaños; 0 errores de consola.
Uso: `node scripts/pruebas/servidor.cjs &` y `QRJS=/ruta/qrcode.min.js node scripts/pruebas/raspa-y-gana.cjs [carpeta-capturas]`.
