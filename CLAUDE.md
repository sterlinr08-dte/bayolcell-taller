# CLAUDE.md — Guía para Claude (BAYOL CELL)

Contexto para que cualquier chat nuevo retome el trabajo sin perder tiempo.

## Qué es este proyecto
Sistema interno de **BAYOL CELL** (tienda/taller de celulares en Santiago y Moca, Rep. Dominicana).
- **`taller.html`** → la app interna (admin/taller). Es **UN SOLO archivo HTML gigante (~19,700 líneas, ~1.3 MB)** con todo el JS embebido en `<script>`. Título: "SISTEMA TALLER BAYOL CELL". **Aquí se trabaja casi siempre.**
- **`index.html`** → página pública (landing) de bayolcell.com.
- **`PENDIENTES.md`** → tareas pendientes del lado MDM/Financiamiento (Hexnode, Info Plus, etc.). Léelo si el tema es financiamiento o MDM.

## Stack y despliegue
- **Sin build, sin framework.** HTML + JavaScript puro (vanilla) en un archivo. Se edita directo.
- **Backend: Supabase.** Cliente global `supabaseClient`. Proyecto "BayolCell-taller", id `vkhwdvjtowrhkhqavnvk` (org `gmjedhkktbffnanmebkf`). Hay tools MCP de Supabase (cárgalas con ToolSearch: `list_tables`, `execute_sql`, `apply_migration`).
- **Deploy: GitHub Pages** sobre dominio `bayolcell.com` (ver `CNAME`). Repo: `sterlinr08-dte/bayolcell-taller`.
- **Push a `main` = producción en vivo.** Cada push actualiza la app real.

## Cómo trabajar con el usuario (IMPORTANTE)
- El usuario (**Sterling**, dueño) **no es programador**. Responde **en español, sencillo**, sin jerga.
- Siempre termina con un **"Para probarlo:"** con pasos concretos, e indica recargar con **Ctrl + Shift + R** (caché).
- Confirma decisiones de producto con preguntas cortas cuando haya ambigüedad real; si no, procede.
- El usuario suele responder "Si" a las propuestas de seguimiento — ten lista la siguiente acción.

## Git / flujo de cambios
1. Editar `taller.html`.
2. **Verificar sintaxis JS antes de commitear** (el archivo es enorme; un error rompe todo):
   ```bash
   node -e 'const fs=require("fs");const h=fs.readFileSync("taller.html","utf8");const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;let m,i=0,bad=0;while((m=re.exec(h))){i++;try{new Function(m[1])}catch(e){bad++;console.log("Block #"+i,e.message)}}console.log("Checked "+i+" blocks, "+bad+" errors.")'
   ```
3. Commit descriptivo + push.
   - La rama asignada para desarrollo es `claude/bayol-cell-taller-WHlam`. Históricamente el trabajo se ha integrado en `main` (producción / GitHub Pages).
   - **Pide confirmación al usuario antes de cada push a `main`** (es producción). No asumas autorización previa: cada push se confirma con él.

## Convenciones de código en taller.html
- Funciones globales sueltas (no módulos). Estado global en `cache = { refurb, lotes, tecnicos, proveedores, articulos, fallas, ... }`. Recargar datos: `await loadAll()`.
- Helpers comunes: `money(n)` (formatea RD$), `escapeHtml(s)`, `toast(msg)` / `toastError(...)`, `confirmar(msg)` (async, devuelve bool), `pedirTexto(mensaje, {valor, tipo:'number', multilinea})` (async, devuelve string o null), `logError(ctx, e)`, `getFriendlyError(e)`.
- Permisos: `isAdminUser()`, `tienePermiso('clave')`, `soloAdmin('accion')`. `sessionUser` = usuario actual (`.id`, `.nombre`, `._tipo`).
- Empleados/técnicos: `nombreEmpleado(id)`; lista en `cache.tecnicos`.
- **Modales:** patrón `div.modal-backdrop` con dentro `.modal-box` > `.modal-header`/`.modal-body`/`.modal-footer`; se muestra con `modal.classList.add('active')`. Ejemplo completo: `abrirPanelProceso` / `verHistorialEquipo`.
- **Impresión:** `window.open('','_blank')` + `document.write(...)` + `window.print()`. Ejemplo: `imprimirReporteCostosLote`, `imprimirIncentivosTecnico`.
- **Buscador de Info Plus** (inventario): `abrirBuscadorArticulos(null, (articulo) => {...})` — el callback recibe `{codigo, descripcion, costo, ...}`.

## Navegación / módulos de la app
La barra lateral cambia de vista con **`nav('nombre', this)`**. Cada vista es un `<div id="v-nombre" class="view">`. El título superior y los permisos controlan qué se ve. Algunos menús están ocultos según rol (`style="display:none"` que se activa por permisos).

**PRINCIPAL**
- `dashboard` — Dashboard (KPIs, resumen). Render: `renderAll()`.
- `miTrabajo` — Mi Trabajo (vista del técnico: sus equipos/órdenes). `mostrarPendientesTecnico()`.
- `misIncentivos` — Mis Incentivos (técnico).
- `atencion` — Atención al Cliente (servicio/recepción rápida).
- `financiamientos` — Financiamientos (ventas a crédito + MDM Hexnode). Ver `PENDIENTES.md`.
- `contabilidad` — Contabilidad (cuentas, asientos, estados, libro mayor/diario, balanza). Tablas `conta_*`.
- `diagnostico` — Diagnóstico IA.
- `recepcion` — Recepción de Equipos (crear órdenes de cliente).
- `ordenes` — Órdenes de Servicio (reparaciones de clientes). `renderOrders()` / `renderTallerOrdenes()`.
- `incentivos` — Incentivos Técnicos (ADMIN). `renderIncentivos()`.

**INVENTARIO**
- `inventario` — Inventario Taller.
- `piezasSolicitadas` — Piezas Solicitadas. `renderPiezasSolicitadas()`.
- `articulos` — Catálogo de Artículos. `renderArticulos()`.
- `proveedores` — Compras / Proveedores. `renderProveedores()`.
- `refurb` — **Reacondicionados** (lo más trabajado, ver abajo). `cargarLotesReacond()` / `renderDetalleLoteReacond()`.

**SISTEMA**
- `etiquetas` — Impresión de Labels (códigos de barra).
- `configImpresora` — Config. Impresora.
- `reportes` — Reportes.
- `estadisticas` — Estadísticas (PRIVADO/admin).
- `configuracion` — Configuración (ADMIN): técnicos, roles, fallas, datos del taller.

## Tablas Supabase (mapa general)
Hay ~70 tablas; muchas están vacías (features futuras). Las **activas** que importan:
- **Reacondicionados:** `refurb_lotes`, `equipos_refurbish`, `equipo_piezas_pedidas`, `equipo_fallas`, `equipo_historial`, `equipo_devoluciones`, `tareas_trabajo` (compartida con órdenes).
- **Órdenes de cliente:** `ordenes_reparacion`, `orden_notas`, `orden_piezas`, `tareas_trabajo` (tipo='orden').
- **Clientes/equipos:** `clientes`, `equipos`.
- **Técnicos/usuarios/roles:** `tecnicos`, `usuarios`, `roles`/`roles_taller`. `sessionUser` sale de aquí.
- **Catálogo fallas:** `fallas`, `falla_categorias`, `fallas_comunes`, `catalogo_marcas`.
- **Incentivos:** `taller_incentivos`.
- **Info Plus (ERP externo, inventario/ventas):** `infoplus_articulos` (~2,000), `infoplus_ventas` (~56,000), `infoplus_ventas_log`, `infoplus_sync_log`. Sincronización automática.
- **Financiamiento/MDM:** `financiamientos`, `fin_clientes`, `fin_planes`, `fin_pagos`/`financiamiento_pagos`, `fin_solicitudes`, `fin_config`, `fin_documentos`, `fin_referencias`.
- **Contabilidad:** `conta_cuentas`, `conta_categorias`, `conta_asientos`, `conta_asiento_lineas`, `conta_movimientos`.
- **Config/varios:** `config_taller` (datos de la tienda, `cache.configTaller`), `proveedores`, `web_visitas`.
- Para ver columnas exactas usa MCP Supabase: `list_tables` (verbose) o `execute_sql` sobre `information_schema.columns`.

## Usuarios, roles y permisos
Hay **dos tipos de cuenta** que entran a la app:
- **`usuarios`** (cuenta tradicional/admin) — usa `rol` / `nivel_acceso` (admin, administrador, superadmin).
- **`tecnicos`** (empleados) — tiene `rol_id` → `roles_taller.permisos` (JSON con las claves de permiso), `tipo_empleado` (`'admin'` | `'tecnico'` | `'servicio'`), `activo`, `debe_cambiar_clave`, `ultimo_acceso`.

`sessionUser` = la fila del usuario logueado + `._tipo` (`'usuario'`|`'tecnico'`) + `._permisos` (objeto). Se guarda en `localStorage` (`bayol_session`). Login en `aplicarSesionDesdeFila(fila, tipo)`.

**Funciones de control de acceso:**
- `isAdminUser()` — true si el rol es admin/administrador/superadmin. El admin **tiene todo**.
- `tienePermiso('clave')` — admin siempre true; si no, mira `sessionUser._permisos['clave'] === true`.
- `permBtn(permiso, html)` — devuelve el botón solo si tiene el permiso (si no, `''`). `puedeVer(permiso)` = alias.
- `soloAdmin(accion)` — true si es admin (o tiene `piezas_aprobar_extra`); si no, avisa y devuelve false. **Defensa en profundidad** (no juez y parte: el técnico no aprueba/despacha su propio trabajo).
- `esDueno()` — candado especial **solo para Sterling (el dueño)** por ID de cuenta (`OWNER_IDS`). El módulo **Estadísticas** es solo para él: ni técnicos ni otros admin (incluida la contadora) lo ven.

**Claves de permiso usadas** (las pone el admin por rol en Configuración): `ver_dashboard`, `solo_mi_trabajo`, `solo_atencion`, `solo_contabilidad`, `recepcion_ver`, `ordenes_ver`, `inventario_ver`, `refurb_ver`/`reacond_ver`, `diagnostico_ver`, `config_ver`, `financiamientos_ver`/`_crear`/`_aprobar`/`_cobrar`/`_eliminar`, `piezas_aprobar_extra`, `piezas_entregar`, `estado_despachar`, `catalogo_articulos_eliminar`, `ver_panel_smart`.

> ⚠️ **Contraseñas NUNCA van al repo.** No las pidas ni las escribas en archivos. El usuario las maneja él.

## La web pública (index.html)
`index.html` es la **landing pública** de `bayolcell.com` (título "Bayolcell — Tu solución móvil completa | Santiago & Moca"). Es independiente de `taller.html`. Lleva reseñas de Google, info de la tienda y registra visitas (`web_visitas`). Rara vez se toca; el trabajo casi siempre es en `taller.html`.

## Integraciones, APIs y servicios externos
**Conexión a Supabase (en `taller.html`, ~línea 3367):**
- `CONFIG_URL = "https://vkhwdvjtowrhkhqavnvk.supabase.co"` y `CONFIG_KEY = "sb_publishable_..."` → con eso se crea `supabaseClient` (`createClient`).
- La `CONFIG_KEY` es la **clave publicable (pública)**: es segura para el navegador y ya está en el HTML desplegado. La seguridad real la dan las **RLS policies** de cada tabla.
- 🔒 **Secretos (NUNCA en el repo):** el `service_role`, el token de Hexnode, la clave de Info Plus y la API key de IA viven como **secrets de las Edge Functions en Supabase**, no en el código. No los pidas ni los pegues en archivos.
- Hay un wrapper de `fetch` que auto-refresca la sesión (token 401) — no romperlo.

**Edge Functions (Supabase) — se llaman con `supabaseClient.functions.invoke('slug', { body })`:**
- **`mdm-accion`** (v23) — puente con **Hexnode MDM**. Acciones: bloquear, desbloquear, ubicar, **notificar (endpoint `message`, NO `broadcast_message`)**, wipe, verificar enrolamiento, liberar (disenroll). Usado en el módulo Financiamientos (~línea 19300+).
- **`infoplus-sync`** (v10) — sincroniza **artículos/inventario** de Info Plus → tabla `infoplus_articulos`.
- **`infoplus-ventas-sync`** (v2) — sincroniza **ventas** de Info Plus → `infoplus_ventas` (~56k) + logs.
- **`bde-diagnostico`** (v8) — motor de **Diagnóstico IA** (analiza panic logs/datos del iPhone con IA).
- **`bde-termico`** (v2) y **`bde-visual`** (v2) — análisis térmico y visual del diagnóstico.
- Todas con `verify_jwt: true` (requieren sesión válida).

**Info Plus** = ERP/punto de venta externo de la tienda (Info Plus **Platinum**). La app **lee** su inventario y ventas (sync automática) y **ya puede escribir** (probado 19 jun 2026, ver detalle abajo).

### Info Plus — API (detalle técnico, descubierto/probado 19 jun 2026)
- **Host:** `https://apicliente.infoplusplatinum.com/api/{endpoint}`.
- **Patrón de llamada:** siempre con query `?basedatos=...&clave=...`. Las lecturas son **GET**; las escrituras son **POST** con el modelo en el **body** (JSON) y `basedatos`+`clave` en el query.
- **Credenciales = secrets de Supabase** (Edge Functions → Secrets): `INFOPLUS_BASE` = `bayol`, `INFOPLUS_CLAVE` = (la clave; **NUNCA escribirla en código/repo**). ⚠️ Al guardarlas, **quitar espacios/saltos de línea** (pasó que se guardaron con `\n` y daba "Error en las credenciales"); en código conviene hacer `.trim()`.
  - ⚠️ Deuda técnica: la función vieja `infoplus-sync` tiene la clave **incrustada (hardcoded)**. Idealmente migrarla a leer solo de `INFOPLUS_CLAVE`.
- **Endpoints CONFIRMADOS que existen:**
  - `listaarticulos` (GET) — `?...&codarticulo=&codalmacen=N`. Ya se usa en `infoplus-sync`.
  - `factura` (GET) — `?...&fechainicial=YYYY-M-D&fechafinal=YYYY-M-D`. Trae las **ventas** (lo usa `infoplus-ventas-sync`). Devuelve ~29 campos por línea; ojo: **NO trae sucursal/localidad** (no se puede separar Moca vs Santiago desde aquí).
  - `cliente` (GET), `proveedor` (GET) e **`inventario` (GET)** — **el endpoint existe** pero la clave **NO tiene permiso** (devuelve "Error en las credenciales"; confirmado que NO es por parámetros — se probó con códigos y fechas y sigue igual; artículos/ajuste/factura/compra sí funcionan). ⏳ Pedir a Dagoberto que **habilite `cliente`, `proveedor` e `inventario` para la clave**. `inventario` es el candidato más probable para **leer los seriales/IMEI** por artículo/almacén. (Nota: los nombres de proveedores ya se pueden sacar parcialmente de `compra`.)
  - `ajuste` (POST) — **ajuste de inventario, PROBADO y funciona** ("Se ha creado correctamente"). ✅
  - `compra` (GET) — `?...&fechainicial=YYYY-M-D&fechafinal=YYYY-M-D`. **PROBADO y funciona** ✅ (necesita las fechas; sin ellas da 404). Trae las **compras a proveedores**: `ProveedorFactura`+`CodigoProveedor` (nombre y código del proveedor), `NombreProducto`+`CodigoProducto`, `Cantidad`, `Precio`, `Monto`, `Descuento`, `FechaFactura`, `FechaVencimiento`, `TerminoPago` (Contado/Crédito), `CodigoFactura` (ej. C00001913). ⚠️ **NO trae los seriales/IMEI** individuales (para eso → `inventario`).
  - ❌ NO existen con esos nombres (404): `clientes`, `listaclientes`, `proveedores`, `listaproveedores`, `suplidor`, `listasuplidores`, `serie`, `series`, `serial`, `seriales`, `lote`, `lotes`.
- **Almacenes (codalmacen):** `1` = **principal**, `6` = **TALLER**; también 3,4,5. La sync guarda existencia por almacén en `infoplus_articulos.existencias` (jsonb) y `existencia` (int) = almacén 6 (taller).
- **🔑 `codarticulo` = el `codigo`** de `infoplus_articulos` (probado: mandé codarticulo 2775 y lo aceptó). `infoplus_articulos` ya trae `costo`, `precio`, `descripcion`, existencias por almacén.
- **Modelo `AjusteModel`** (cabecera): `codajuste`(""), `fecha`("2026-6-19"), `hora`("HH:MM:SS"), `total`, `cancelado`, `codempleado`, `comentario`, `codminventario`(2), `codlocalidad`(almacén, ej. 6), `codcatalogo`("1110194"), `subsidio`, `esmaterialgastable`, `codcentrocosto`, `codactivofijo`, `codotrascompras`, `detallesajuste[]`, `detallesajuste2[]`, `seriales[]` (aquí van los **IMEI**).
  - `DetalleAjusteModel`: `codarticulo`(int), `precio`, `cantidad`, `codunidad`(1), `movimiento`(1 ó 2: **NO cambia la dirección**, ver actualización 25 jun 2026 — la dirección la da `codminventario`), `fvencimiento`, `caracteristicas`.
- **Pantalla de COMPRA (capturada)** — campos: Compra No., Fecha/Fecha Original/Vencimiento, **Proveedor** (códigos propios de Info Plus: 10 Alta Señal, 29 Importadora Fuhao, etc.), **Empleado** (6 = Esterlin), Orden/Liquidación/Factura/Pedido No., Ciudad, Comentario, Moneda(DOP), NCF/DGII, Cód. Verificación, Proveedor Informal, Centro de Costo, **Localidad** (Oficina Santiago), Subtotal/Descuentos/Impuesto/Total, Crédito, Impuesto Incluido, Material Gastable, Archivo. **Artículos**: Artículo(codigo)+Descripción+Referencia+Cantidad+Costo+Monto+Descuento. **Series**: Serial(IMEI)+Compra+Rango+**Lote**.
- **PENDIENTE para registrar compras de lotes en Info Plus:** (1) nombre exacto del endpoint de compra + su modelo/JSON (pedir a Dagoberto); (2) **mapear los proveedores del taller con el código de proveedor de Info Plus** (una vez). El lote encaja perfecto: cada equipo = una línea de artículo, su IMEI va en Series, `codigo_lote` en el campo Lote.
- **IDEA/PLAN acordado (19 jun 2026) — "jalar lote por IMEI" (NO requiere escribir compras):**
  - Flujo: Sterling registra la **compra en Info Plus** y la dirige al **almacén 6 (taller)** → el sistema del taller **LEE** ese lote (teléfonos + IMEI) → se crea el lote en Reacondicionados → se repara. El **costo por IMEI vive en el taller** (costo del artículo + piezas).
  - Falta **una sola cosa**: un endpoint para **leer los seriales/IMEI**. `listaarticulos` solo da cantidades por almacén (no IMEI individuales). El candidato es **`inventario`** (existe, falta permiso). Pedir a Dagoberto: habilitar `inventario` + confirmar si trae los seriales (o cuál endpoint los trae y si es GET/POST).
- **ANÁLISIS DE VENTAS (lo que se puede sacar HOY de `infoplus_ventas`):**
  - **Contado vs Crédito** por el prefijo de `factura_id`: **`CO` = Contado**, **`CR` = Crédito** (confirmado por el dueño). Otros prefijos = notas crédito/débito (raros).
  - ❌ **Moca vs Santiago NO se puede** con los datos sincronizados: la venta no trae sucursal/localidad. El cuadre de caja de Info Plus sí separa por **Localidad (OFICINA SANTIAGO)**; para igualarlo habría que traer ese campo (pedir a Dagoberto cómo viene la localidad por factura).
  - `direccion` = dirección del cliente (no la tienda). `categoria` = tipo de producto (PIEZAS, TALLER, ACCESORIOS, MOBILES, BOTON, TURBO SIM).
- **DECISIÓN (19 jun 2026) sobre compra de lotes / costo por IMEI:**
  - Info Plus agrupa por **modelo**: 1 modelo = 1 artículo, con N **seriales (IMEI)** colgados de ese artículo y **un solo costo de artículo**. No da costo por IMEI individual.
  - El usuario quiere saber el **costo de CADA IMEI** (cada teléfono). Eso **ya lo da el taller** (cada `equipos_refurbish` es individual: compra + flete + piezas = costo final por equipo). Es **más detallado** que Info Plus.
  - Por eso, **el costo por equipo/IMEI vive en el taller**. La **compra hacia Info Plus queda pendiente** hasta que habiliten el acceso (endpoint+modelo de compra). Cuando se conecte, se podrá enviar en **su formato** (1 artículo + N seriales) y a la vez mantener el costo por IMEI nuestro.
- **Edge Function `infoplus-compras`** (v1, verify_jwt) — lee `compra` y devuelve las facturas **agrupadas** (`{factura, proveedor, codproveedor, fecha, termino, total, lineas:[{producto, codproducto, cantidad, precio, monto}]}`). La usa el importador.
- **IMPORTADOR "jalar compra → crear lote" (HECHO, 20 jun 2026):** botón **"Importar de Info Plus"** en el módulo **Compras** (`v-proveedores`). Funciones: `abrirImportarCompraInfoPlus()`, `buscarComprasInfoPlus()`, `verLineasImportCompra(i)`, `crearLoteDesdeCompraInfoPlus(i)`. Flujo: rango de fechas → lista compras → marcar los modelos de teléfono → crea `refurb_lotes` (codigo_lote = nº factura) + **un `equipos_refurbish` por CADA unidad** (cada IMEI = equipo individual con su `costo_compra`). Guarda el código de producto de Info Plus en `equipos_refurbish.articulo_codigo` y `costo_origen='infoplus_compra'`. El **IMEI se pone a mano** (Info Plus no lo expone por API todavía).
  - **Costo editable + ITBIS (HECHO):** en el importador el costo de cada modelo es **editable**, con **⚠️ aviso de "posible ITBIS"** y botón **"+18%"** (`_impMas18`). Razón: Info Plus a **algunos artículos** (no todos) les **resta el 18%** al costo al registrar la compra con "ITBIS incluido" (el dueño compra SIN itbis, ese es el costo neto). Info Plus guarda el costo ya rebajado en TODOS sus endpoints (compra/catálogo/inventario) → no hay forma de detectarlo 100% por dato; la señal usada es: el costo tiene **>2 decimales** (división ÷1.18) y al ×1.18 da número redondo (ej. 2907: 18,946.3559 → 22,356.70; el 2707 viene limpio). Es **bug de Info Plus** (Dagoberto debe arreglarlo); esto solo corrige el costo del lado del taller.
- **PLAN despacho a Info Plus (pendiente):** cuando los equipos de un modelo estén listos, despacharlos a Info Plus como **1 solo artículo + N seriales (IMEI)**, con **precio = promedio** de los costos finales individuales y **total = suma** (vía endpoint `ajuste`, movimiento de entrada al almacén destino). El `articulo_codigo` guardado sirve para el `codarticulo`.
- **Funciones de prueba** desplegadas y **desactivadas (stub)**: `infoplus-test`, `infoplus-ajuste-test` (se pueden borrar desde el panel).
- **Cómo invocar una Edge Function para probar** (sin la app): `select net.http_post(url:='https://vkhwdvjtowrhkhqavnvk.supabase.co/functions/v1/<slug>', body:='{}'::jsonb, headers:='{"apikey":"<anon>","Authorization":"Bearer <anon>"}'::jsonb, timeout_milliseconds:=30000);` y luego `select content from net._http_response where id=<request_id>;` (usa `pg_net`).

**Hexnode** = MDM (Mobile Device Management) para los equipos financiados (bloqueo remoto si no pagan). Plan PRO anual comprado. Detalles, políticas y pendientes finos en `PENDIENTES.md`.

**Otros (ya hechos, ver `PENDIENTES.md`):** Reseñas de Google (web + WhatsApp), correo **Zoho** (MX configurado), métricas de visitas web.

## Estructura del repositorio
- **`taller.html`** — la app interna (lo principal). **`index.html`** — web pública. **`CNAME`** — `bayolcell.com`.
- **`bde/`** — **BAYOL DIAGNOSTIC ENGINE**: app de **escritorio (Electron, Windows)** que lee el iPhone por USB (modelo, iOS, batería, voltaje, ciclos, panic logs) y los manda al motor de Diagnóstico IA en Supabase. Se conecta al mismo Supabase y mismo login. Datos en `bde/data/` (iphone-specs, battery-rules, panic-codes).
- **`scripts/fetch_instagram.py`** — baja el feed de Instagram para la web pública.
- **`.github/workflows/`** — `build-bde.yml` (arma el `.exe` del BDE; publica Release con tag `bde-v*`) e `instagram.yml` (actualiza el feed de Instagram).
- **`PENDIENTES.md`** — pendientes de MDM/Financiamiento/Info Plus.

## Módulo REACONDICIONADOS (refurbish) — el más trabajado
Compra de lotes de equipos usados, reparación y despacho al almacén. **El taller es de CONTROL, no de venta** (no se piden precios de venta; "despachar" = enviar al almacén principal).

### Tablas Supabase
- **`refurb_lotes`**: `id, codigo_lote, proveedor_id, fecha_compra, costo_total_lote, cantidad_equipos, gastos_envio (NUEVA, courier), notas, estado, enviado_reacond`.
- **`equipos_refurbish`**: `id, lote_id, modelo, imei, marca, articulo_id, estado_evaluacion, costo_compra, costo_repuestos, tecnico_asignado_id, tecnico_anterior_id, veces_devuelto, fecha_terminado, fecha_despacho`. (Único NOT NULL sin default: `modelo`.)
- **`equipo_piezas_pedidas`**: `equipo_id, pieza_id, pieza_codigo, pieza_nombre, cantidad, costo_unitario, estado, agregada_por_tecnico`.
- **`equipo_fallas`**: `equipo_id, falla_id, falla_nombre, falla_corto`.
- **`equipo_historial`**: `equipo_id, estado_anterior, estado_nuevo, accion, notas, usuario, fecha`. (Se inserta en cada cambio de estado.)
- **`tareas_trabajo`**: `tipo ('equipo'|'orden'), ref_id, descripcion, tecnico_id, tecnico_anterior_id, estado ('pendiente'|'hecha'), notas, fecha_completada, creado_en`.
- **`equipo_devoluciones`**.

### Flujo de estados (`estado_evaluacion`)
`pendiente` → `en_evaluacion` → `evaluado` → `en_proceso` (asignado a técnico) → `tecnico_recibio` → (`espera_pieza`) → `listo_revision` → `listo_venta` (Listo) → `vendido` (Despachado).
Extras: `reasignado`, `reparacion_externa`.
- Etiquetas/colores: `obtenerEtiquetaEstado(estado)`.
- Transiciones clave: `empezarEvaluacion`, `guardarEvaluacion`, `abrirModalAsignarTecnico`/`asignar`, `cambiarEstadoProceso` (stepper del técnico, candado: no pasa a revisión con fallas pendientes), `aprobarTerminado` (admin → Listo), `marcarDespachado` (→ vendido).
- Acción al hacer clic en una tarjeta según estado: ver función render de tarjetas (~línea 8261, `accionPrincipal`).
- **Probado en vivo (19 jun 2026):** el flujo completo Pendiente→Despachado funciona a nivel de datos.

### Modelo de COSTOS (solo admin lo ve)
**Costo final = `costo_compra` + flete (envío) + `costo_repuestos`** (suma de piezas).
- **Flete proporcional:** el `gastos_envio` del lote se reparte entre equipos **proporcional a su `costo_compra`** (si no hay costos, partes iguales). Helper: **`calcularFleteEquipo(eq)`**. Editar envío: **`editarGastosEnvioLote()`**.
- **Piezas:** `_recalcularCostoRepuestos(equipoId)` recalcula `costo_repuestos` sumando `cantidad*costo_unitario`. Agregar pieza desde Info Plus (solo cuando está Listo): **`agregarPiezaInfoPlus(equipoId)`**.
- Recuadro de costo: dentro de `abrirPanelProceso` (gated `isAdminUser()`).

### Reportes y vistas (añadidos esta sesión)
- **`verHistorialEquipo(equipoId)`** / `cerrarHistorialEquipo()` — el **ojito 👁️** en tarjetas que NO están Listo/Despachado. Vista de **solo lectura**: encabezado, 💰 costos (admin), 👨‍🔧 trabajo por técnico (tareas agrupadas), 🧩 piezas con costos, ⚠️ fallas, 🕓 línea de tiempo (historial). En `evaluado` además hay un lápiz ✏️ que abre `continuarEvaluacion`.
- **`verFichaDespacho(equipoId)`** — el **ojito 👁️** en tarjetas **Listo (`listo_venta`) y Despachado (`vendido`)**. Ficha con costos (admin) y **agregar/editar/quitar piezas de Info Plus** (`agregarPiezaInfoPlus`). El título y la línea de estado se adaptan (Listo vs Despachado). `_vistaEquipoActual` (`'panel'|'ficha'`) + `_refrescarVistaEquipo()` reabren la vista correcta tras tocar piezas.

#### Reportes de costos (todos solo admin) — refactor con helpers compartidos
Helpers en `taller.html` (cerca de `imprimirCostosSeleccionados`):
- **`_costoEquipoRep(e)`** → `{compra, flete, piezas, fin}`. **`_piezasDeEquipoRep(id)`** → piezas del equipo (de `cache.piezasReacond`). **`_loteConcluido(loteId)`** → true si TODOS los equipos del lote están Listo o Despachado.
- **`_reporteCostosPrintHTML({titulo, subtitulo, infoChips, equipos})`** — impresión **organizada**: encabezado con tienda (nombre/dirección/teléfono de `configTaller`), tarjetas de resumen (Equipos/Compra/Envío/Piezas/**Costo final total**), tabla con cabecera oscura y **sub-fila por equipo** con 👷 técnico, 💾 capacidad, 🎨 color, 🏁/🚚 fechas y **🧩 piezas con detalle** (nombre, cantidad×costo=subtotal).
- **`_reporteCostosExcelDL({titulo, infoLineas, equipos, filename})`** — descarga `.xls` con columna extra **Técnico** y **Detalle piezas**.

Usos:
- **Seleccionados (Listo/Despachado):** casillas azules en las tarjetas (`_reacondSelCosto`, `_reacondToggleSelCosto`). Botones en la barra del lote: **"Marcar Listo/Desp."** (`_reacondMarcarTodosCosto`, respeta filtros vía `_reacondVisibleEquipos`), **"Imprimir costos (N)"** (`imprimirCostosSeleccionados`) y **"Excel (N)"** (`exportarCostosSeleccionadosExcel`).
- **Lote / Informe general:** `imprimirReporteCostosLote()` y `exportarReporteCostosLoteExcel()` (usan `_datosReporteCostosLote()`, **respetan filtros activos**). Cuando `_loteConcluido()` es true, los botones del lote se renombran a **"📋 Informe general"** / **"Informe (Excel)"** y el badge del lote muestra **"✅ Lote concluido"**. El informe completo del lote sale sin filtros activos.

## Otros módulos en taller.html (referencia rápida)
- **Liquidación de Aduana** (en Compras, `v-proveedores`): calculadora **independiente** (NO guarda nada, NO se conecta a Supabase ni Info Plus). Botón morado "Liquidación Aduana" → modal `modalLiquidacionAduana`. Pensado para la factura del proveedor **Screen Enterprise Inc.** (Shenzhen) que viene en **US$** con columnas Descripción · Qty · Unit price. Flujo: escribes o **pegas desde Excel** (`_aduanaPegar`, parser tolera SKU al inicio y columna "Total" de más; salta encabezados/Subtotal/Tax/Total) las líneas (descripción, cantidad, **precio US$**); pones la **tasa US$→RD$** y los **gastos en RD$** (Transporte + Impuesto en monto fijo o % sobre la factura en RD$ + Otros). El sistema convierte cada producto a RD$ con la tasa, calcula el **% que cada artículo representa de la compra** (`pctCompra` = importe RD$ ÷ subtotal RD$) y con ese % **reparte los gastos** (transporte+impuesto+otros), sumándolos al costo → **costo final por producto/unidad en RD$**. Imprime y exporta a Excel (columnas: P.U US$, Importe US$, Importe RD$, **% compra**, Aduana RD$, Final unit RD$, Costo final RD$). Funciones: `abrirLiquidacionAduana()`, `_aduanaCalcular()` (núcleo: US$→RD$ + reparto), `_aduanaRecalcular()` (refresca sin perder foco), `_aduanaPegar()`, `imprimirLiquidacionAduana()`, `exportarLiquidacionAduanaExcel()`, `_usd()`/`money()` formateadores. Estado en `_aduanaItems` (`{desc,cant,costo}`).
  - **Comparar con Info Plus** (botón en el footer de la liquidación → `modalComparacionIP`): enlaza cada repuesto con su artículo de Info Plus **por nombre** (`_matchArticuloPorNombre`, token-overlap con stopwords de calidad/color; desempata por ratio→score→artículo más corto/exacto). Muestra **código IP visible**, costo viejo (de `infoplus_articulos.costo`) vs costo nuevo (de la liquidación, `finalUnitRD`), el **cambio %** (▼ bajó / ▲ subió) y el **precio al por mayor actual** (`precio_especial`, casi siempre 0 → cae a `precio`); deja escribir el **nuevo precio al por mayor** a mano (decisión del usuario). Botón **"Cambiar"** por fila reenlaza con `abrirBuscadorArticulos(null, cb)`. Imprime/exporta Excel para actualizar en Info Plus a mano (la API aún NO escribe precios/compras → pendiente Dagoberto). Funciones: `abrirComparacionInfoPlus()`, `_compIPDatos()`, `_compIPRender()`, `_compIPCambiarArticulo(i)`, `imprimirComparacionIP()`, `exportarComparacionIPExcel()`. Estado en `_compIP`. Usa `cache.infoplusArticulos` (vía `_ensureInfoplusArticulos()`) y `_findInfoplusArt(codigo)`.
  - **Formato compra Info Plus (Paso 4, HECHO):** botones en el footer de la comparación → `imprimirFormatoCompraIP()` y `exportarFormatoCompraIPExcel()` (usan `_compFormatoFilas()` = filas con código enlazado). Generan la lista lista para meter a mano en Compras de Info Plus: **código · descripción · cantidad · costo final unitario (con aduana) · monto**, dirigida al almacén 6 (TALLER). Avisa cuántos quedaron sin enlazar (no salen). El envío 100% automático por API sigue pendiente de Dagoberto.
- **Órdenes de cliente** (reparaciones de clientes): flujo `ORDEN_FLUJO = recibido → en_proceso → espera_repuesto → pendiente_cliente → finalizado → entregado`. Etiquetas: `obtenerEtiquetaOrden`.
- **Incentivos a técnicos** (pagos por reparación/pulido): `imprimirIncentivosTecnico`, etc.
- **Financiamiento / MDM (Hexnode)** e **Info Plus sync** — ver `PENDIENTES.md`.
- **Estadísticas / Rentabilidad** — nota: la pestaña Rentabilidad se alimentaba de precio de venta (que ya no se captura en taller). Idea pendiente: adaptarla para mostrar **inversión** (compra+envío+piezas) por lote/equipo.

## Ideas/pendientes mencionados (no hechos aún)
- Imprimir el historial individual del equipo (mini-reporte por equipo).
- Adaptar pestaña "Rentabilidad" a inversión por lote/equipo (sin ventas).
- Casos especiales por probar en vivo: equipo devuelto, reasignar técnico, reparación externa.

## ACTUALIZACIÓN sesión 24-25 jun 2026 (Info Plus API escritura, Contabilidad simple, Reacond)

### Info Plus API — estado con la LLAVE NUEVA (la que pasó Dagoberto)
- **LECTURA: funciona todo** con la clave actual (secret `INFOPLUS_CLAVE`): `listaarticulos`, `factura` (ventas), `compra` (lectura), y ahora también **`inventario`, `proveedor`, `cliente`** (antes daban "Error en las credenciales"). `almacen`/`moneda`/`vendedor` existen pero sin permiso (400). `empleado`/`localidad`/`catalogo`/`serie`/`serial` → 404 (no existen).
- **✅ ESCRITURA YA FUNCIONA — `ajuste` (POST) graba de verdad (probado 25 jun 2026).** Dagoberto habilitó la escritura y pasó los códigos reales de bayol. Prueba en vivo con art. **1843** (BATERIA IPHONE 11 NORMAL ORIGINAL) en almacén 1 (baseline 28): salida 1 → 27 (`AI00000637`), salida otra → 26 (`AI00000638`), entrada 1 → 27 (`AI00000639`), entrada 1 → 28 (`AI00000640`). El **código de ajuste avanza** (ya no se queda pegado en `AI00000636`) y el **stock se mueve** (verificado con `infoplus-existencia` antes/después). Compra (POST) aún sin re-verificar tras el cambio.
  - 🔑 **`codminventario` = TIPO de movimiento y es lo que MANDA la dirección:** **`1` = ENTRADA (suma)**, **`2` = SALIDA (resta)**. ⚠️ El campo **`movimiento` (1 ó 2) del detalle NO cambia la dirección** (se probó: con `codminventario:2` tanto `movimiento:1` como `:2` restaron). Usar siempre `codminventario` para decidir entrada/salida.
  - 🔑 **Códigos reales de bayol confirmados:** `codlocalidad: 1` (almacén principal), `codcatalogo: "62809"`, `codempleado: "6"` (Esterlin). Ejemplo de AjusteModel que funciona: `{codajuste:"", fecha:"2026-6-24", hora:"HH:MM:SS", total, cancelado:false, codempleado:"6", comentario, codminventario:1|2, codlocalidad:1, codcatalogo:"62809", subsidio:false, esmaterialgastable:false, codcentrocosto:null, codactivofijo:null, codotrascompras:null, detallesajuste:[{codarticulo, precio, cantidad, codunidad:1, movimiento:1, fvencimiento, caracteristicas:""}], detallesajuste2:[], seriales:[]}`.
  - Se invoca con la Edge Function `infoplus-ajuste-crear` (acepta el AjusteModel directo en el body). Verificar stock con `infoplus-existencia` (`{codarticulo, codalmacen}`; sin `codalmacen` da el total de todos los almacenes).
- **Seriales/IMEI: NO hay forma por API** (`inventario` no los trae; `serie`/`serial` 404). Sigue a mano.
- **Ventas por sucursal (Santiago/Moca): NO se puede** — el `factura` no trae empleado ni sucursal (solo producto, precio, costo, categoría, cuenta de cliente, direcciones). Pedirle a Dagoberto agregar el **empleado** o la **localidad** a la venta.
- **Modelos POST confirmados por Dagoberto:** `CompraModel` (POST `/api/compra?basedatos&clave`) y `AjusteModel` (POST `/api/ajuste`). AjusteModel: header `codminventario`, `codlocalidad`, `codcatalogo` + `detallesajuste[]` (codarticulo, precio, cantidad, codunidad:1, `movimiento`, fvencimiento) + `seriales[]`.

### Edge Functions nuevas (deployadas, verify_jwt:true)
- `infoplus-compra-crear` — POST compra a Info Plus (lista; espera permiso de escritura).
- `infoplus-ajuste-crear` — POST ajuste de inventario (lista; espera permiso de escritura).
- `infoplus-existencia` — lee existencia de un artículo por almacén (`listaarticulos`), sin exponer la clave. Útil para verificar stock antes/después.
- `infoplus-compras-sync` — lee `compra` de un rango y llena `infoplus_art_prov` (mapeo artículo→proveedor, sumado). Llamar con `{desde,hasta,reset:true}` (rango completo en una sola llamada para que sume bien).
- `infoplus-probe` — diagnóstico de lectura (DESACTIVADA tras la auditoría; redacta la clave).
- Para invocarlas en pruebas: `select net.http_post(url, body, headers jsonb_build_object('apikey',<anon legacy JWT>,'Authorization','Bearer '<anon>...))` y leer `net._http_response`. (El anon legacy JWT se obtiene con el MCP `get_publishable_keys`.)

### Contabilidad — "Estado Mensual" (capa simple para no-contadora) — HECHO
- Nueva pestaña **"Estado Mensual"** (1ª en Contabilidad; `contaTab('mensual')`, es la default al entrar). Estado de Resultados del mes: **Ingresos + Costo automáticos de Info Plus** (RPC `estado_mensual_cat(p_ini,p_fin)` sobre `infoplus_ventas`, que SÍ trae `monto_venta` y `monto_costo`) → Utilidad Bruta − Gastos = **Utilidad Neta**.
- **Registro de gasto simple** (`modalGastoSimple` / `abrirGastoSimple` / `guardarGastoSimple`) → guarda en **`conta_movimientos`** (fecha, tipo='gasto', categoría de `conta_categorias` tipo=gasto, sucursal Santiago/Moca/General, monto, metodo_pago, descripcion). **Sin débito/crédito.** Lista de gastos del mes con borrar (`eliminarGastoSimple`). Imprimir/Excel (`imprimirEstadoMensual`/`exportarEstadoMensualExcel`). Estado en `_emData`.
- Selector de tienda: **Combinado = completo**; por tienda muestra gastos de esa tienda pero **ventas combinadas** (Info Plus no separa por sucursal — pendiente). La contabilidad formal (asientos/balance) quedó intacta.
- `conta_movimientos` RLS: política `conta_mov_acc` (authenticated + `app_puede_contabilidad()`). `conta_categorias`: 52 gasto, 6 ingreso, 3 compra.

### Reacondicionados — cambios
- **Liquidación de Aduana / Comparar / Formato compra:** ver sección "Otros módulos". El reporte de costos (impreso y Excel) ahora tiene **columna "Código" (IP) aparte** (solo número) y montos en **RD$**; Imprimir = misma info que Excel (Técnico, Subcosto, Cant., Costo unit., desglose de piezas).
- **Barra del lote simplificada:** quitados los botones de costos por selección; **"Pasar a ▾"** (menú multiselección) mueve los equipos seleccionados a Pendiente/Evaluado/En proceso/Listo/Despachado/**Completado**. Casilla única por tarjeta. "Asignar a técnico" igual. "Imprimir"/"Exportar Excel" del lote se mantienen.
- **Estado COMPLETADO:** columna `equipos_refurbish.completado` (bool) + `fecha_completado`. Los despachados ya manejados se pasan a Completado (salen de Despachado, siguen editables por garantía). Badge "🏁 Completado". `_aduanaCalcular` etc. sin cambios.
- **Overview por lotes:** las pestañas **Listo, Despachado, Completado** muestran **carpeta por lote** (como En Proceso); al **Abrir Lote** desde una pestaña entra **filtrado a ese estado**. Despachado ya NO cuenta los completados (`despachadosNC` vs `completados`). Pestaña "🏁 Completado" nueva.
- **Bugs arreglados:** buscador de Info Plus que salía vacío (cargaba 1 vez, no clobberea); modal "Imprimir label" quedaba detrás de la ficha (z-index 600); "MARCAR TODOS".

### Tablas nuevas / cambios de datos
- **`infoplus_art_prov`** (codproducto, codproveedor, proveedor, cantidad, monto, ultima_fecha) — mapeo artículo→proveedor desde compras. Para el análisis de **rentabilidad por proveedor** (cruzar con `infoplus_ventas`). Resultado: **ENTERPRISE SUPPLY** es el proveedor más rentable (ganancia ~RD$8.1M, margen 52%). *(Análisis hecho por SQL; aún NO hay reporte fijo en la app — idea pendiente.)*
- `equipos_refurbish.completado` (bool) + `fecha_completado`.
- RPC `estado_mensual_cat(date,date)` (security definer, grant a authenticated/anon).
- `infoplus_articulos` ya tenía política `infoplus_articulos_auth_all` (authenticated). No requirió cambios.
