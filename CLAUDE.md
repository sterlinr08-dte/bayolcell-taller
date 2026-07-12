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

### 🔑 ¿CUÁL LLAVE USAR? (guía para cualquier chat — leer antes de preguntar)
| Llave | Valor / dónde está | ¿Se puede escribir en código/repo? |
|---|---|---|
| **Publicable (browser)** | `sb_publishable_PynS5ZjKoQ36HCpguVzxaw_KZOlagtz` (está en `taller.html` ~línea 3367 e `index.html`) | ✅ SÍ — es pública por diseño. Es la única que va en el cliente. |
| **Anon legacy JWT** (para probar Edge Functions vía `net.http_post`) | Se obtiene con el MCP de Supabase: `get_publishable_keys` | ✅ Sí (es equivalente a la publicable) |
| **service_role** | Secret de Supabase (panel) | 🚫 JAMÁS — solo dentro de Edge Functions vía `Deno.env` |
| **INFOPLUS_CLAVE / INFOPLUS_BASE** | Secrets de Edge Functions | 🚫 JAMÁS — siempre `Deno.env.get(...).trim()` |
| **Token Hexnode / API key IA** | Secrets de Edge Functions | 🚫 JAMÁS |

Regla: el **cliente (browser)** SOLO usa la publicable + login (rol `authenticated`); las tablas se protegen con **RLS**. Todo lo que necesite un secreto va en una **Edge Function**. Si un flujo "necesita" la service_role en el cliente, el diseño está mal — se hace una Edge Function o una policy/RPC.
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
- **Edge Function `infoplus-compras`** (v2, verify_jwt) — lee `compra` y devuelve las facturas **agrupadas** (`{factura, proveedor, codproveedor, fecha, termino, total, lineas:[{producto, codproducto, cantidad, precio, monto, seriales:[...IMEI]}]}`). **Cada línea ahora trae sus `seriales` (IMEI)** que Info Plus devuelve en `compra`. La usa el importador.
- **IMPORTADOR "jalar compra → crear lote" (HECHO, 20 jun 2026; IMEI AUTO desde 29 jun 2026):** botón **"Importar de Info Plus"** en el módulo **Compras** (`v-proveedores`). Funciones: `abrirImportarCompraInfoPlus()`, `buscarComprasInfoPlus()`, `verLineasImportCompra(i)`, `crearLoteDesdeCompraInfoPlus(i)`. Flujo: rango de fechas → lista compras → marcar los modelos de teléfono → crea `refurb_lotes` (codigo_lote = nº factura) + **un `equipos_refurbish` por CADA unidad** (cada IMEI = equipo individual con su `costo_compra`). Guarda el código de producto de Info Plus en `equipos_refurbish.articulo_codigo` y `costo_origen='infoplus_compra'`. **El IMEI ahora se rellena SOLO** desde `lineas[].seriales` (cada unidad k recibe `seriales[k]`); la lista muestra un badge "🔖 N IMEI" por modelo.
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
  - ⚠️ **IMEI/SERIAL: escritura AÚN bloqueada (probado 25 jun 2026).** Para artículos que **manejan serial** (teléfonos, ej. art. **3082** CELULAR IPHONE XS MAX), el ajuste responde "Se ha creado correctamente" **pero NO guarda**: el código de ajuste **se queda pegado en `AI00000641`** y el stock sigue en 0. Probado con IMEI falso y con **IMEI real** (`351829689413208`), entrada `codminventario:1`. En cambio los artículos **sin serial** (batería 1843) **sí guardan**. 
  - 🔑 **Formato del serial descubierto:** `seriales` es una **lista simple de textos** a nivel de cabecera: `"seriales": ["351829689413208"]` (NO objetos `{serial:...}` — esos se ignoran; tampoco va dentro de `detallesajuste[]`). Info Plus lo **recibe y lo devuelve en la respuesta**, pero aun así no commitea el ajuste del artículo serializado.
  - ⏳ **Pedir a Dagoberto:** (1) habilitar **escritura de artículos con serial** para la llave del API; (2) un **ejemplo de AjusteModel CON serial que SÍ grabe** (confirmar campos exactos del IMEI). Hasta entonces, el despacho de reacondicionados a Info Plus con IMEI sigue a mano.
- **Seriales/IMEI: NO hay forma por API** (`inventario` no los trae; `serie`/`serial` 404). Sigue a mano.
- **DESPACHO/TRASLADO entre almacenes: NO está en el API público (probado 25 jun 2026).** El módulo **"Despacho Almacen"** existe en la web de Info Plus pero su endpoint **no está publicado**: se probaron por GET y POST `despacho`, `despachos`, `traslado(s)`, `transferencia(s)`, `traspaso`, `movimiento`, `requisicion`, `despachoinventario`, `despachoalmacen`, `conduce`, `envio`, `entrega`, `salidainventario`, `departamento` → **todos 404** ("No HTTP resource was found"). Por eso el módulo **🚚 Despacho de Almacén** del taller mueve stock con **dos `ajuste`** (salida del origen `codminventario:2` + entrada al destino `codminventario:1`); funciona (probado en vivo: art. 1843 1→6 y revertido) pero en Info Plus se ve como 2 ajustes, no como un documento de Despacho. ⏳ **Pedir a Dagoberto el endpoint + modelo del Despacho Almacen.**
  - **Campos de la pantalla "Despacho Almacen"** (capturada 25 jun 2026, para mapear el modelo): *Cabecera* — Despacho No. (auto, ej. 3198), Fecha, Comentario, **Despachado Por** (codempleado, ej. 6=ESTERLIN ESPINAL), Recibido Por, Prefactura, Cotización, O.S.No, Compra No, Requisición, Despacho, Factura, Recepción, Orden de Producción, Ajustes, **Origen** (almacén, ej. 1=OFICINA SANTIAGO), **Destino** (almacén), Total, **Departamento (REQUERIDO)**, **Tipo** (ej. "Productos Terminados"), "Despacho en PDF" (check). *Detalle por línea* — Artículo, Descripción, Referencia, **Cantidad**, **Costo**, **Monto**, Comentario (muestra Existencia).
- 🔒 **Bug de seguridad de Info Plus (mitigado):** en sus errores 404 el API **devuelve la URL completa con la clave incluida**. La Edge Function `infoplus-probe` ahora **redacta** la clave (`***CLAVE***`) antes de responder. No exponer respuestas crudas de Info Plus sin redactar.
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

## ACTUALIZACIÓN 29 jun 2026 — Info Plus API: leer Y escribir SERIALES/IMEI (¡resuelto!) + Liquidación módulo

> Dagoberto pidió dejar esto SIEMPRE documentado en CLAUDE.md.

### Info Plus — SERIALES/IMEI: ya se puede en ambos sentidos
- **ESCRITURA de compras CON serial — FUNCIONA (probado 29 jun 2026).** `POST /compra` (Edge `infoplus-compra-crear`, acepta el `CompraModel` directo) **graba de verdad**: mueve stock y avanza el `codpedido`, **incluso artículos serializados (teléfonos)**. Probado con art. 3082 (iPhone XS Max): stock 2→3, `codpedido` avanzó a **C00001927** (antes se quedaba pegado en C00001925 = no committeaba).
  - 🔑 **El NCF NO se puede repetir.** Si mandas un `ncf` ya usado → responde **"NCF repetido."** y NO graba. Solución: **mandar `ncf:""` (vacío)** o un NCF nuevo válido. Con `ncf:""` grabó.
  - 🔑 **Formato del serial que graba:** `"seriales": [{ "numero": "<IMEI>", "codarticulo": <int> }]` a nivel de cabecera del CompraModel. El IMEI debe ser **único** (no repetir uno ya usado).
  - `CompraModel` clave: `codproveedor` (ej. "7"=YVES BAYOL), `codempleado` "6", `codlocalidad` 1, `codmonedas/codmonedap` 1, `tasacambio` 1, `generarncf:false`, `codcentrocosto:""`, `factura2:""` (ojo: el campo es **`factura2`**, no `fatura2`), `detallescompra:[{codarticulo, precio, cantidad, codunidad:1, descripcion, fvencimiento, costoanterior}]`, `detallescompra2:[]`, `detallescompra3:[]`, `seriales:[{numero,codarticulo}]`.
- **LECTURA de IMEI — SÍ se puede, vía `compra` (descubierto 29 jun 2026).** No existe endpoint `serie`/`serial`/`seriales`/`imei`/`lote` (todos 404), y `inventario` NO trae IMEI (solo cantidades/costos, probado con `&detalle=1`/`&serie=1`). **PERO el `GET /compra?...&fechainicial&fechafinal` devuelve, en cada línea, el campo `seriales` con los IMEI de ese producto.** Ej. real: factura C00001924, OUKITEL C62 GT, cantidad 13 → 13 IMEI en `seriales`. → **Se puede "jalar el lote por IMEI" automático** leyendo la compra.
- ⏳ **Pendiente Dagoberto (no urgente):** un endpoint de lectura de seriales por artículo/almacén (independiente de la compra) sería ideal, pero **ya no bloquea** porque `compra` los trae.

### Flujo completo HABILITADO (taller ↔ Info Plus por IMEI)
1. Sterling registra la compra en Info Plus (teléfonos + IMEI). → 2. El importador "Importar de Info Plus" **lee la compra y rellena los IMEI solos** (de `lineas[].seriales`) al crear el lote. → 3. Se repara y se lleva el costo por equipo. → 4. (Opcional) registrar de vuelta a Info Plus con `compra` (escritura ya funciona).

### 🔒 SEGURIDAD — clave Info Plus expuesta
- La clave actual (`24324...`) **se filtró en chat** (el usuario la pegó) y además está **hardcoded** en `infoplus-ventas-sync` y `infoplus-sync`. **Pedir a Dagoberto una clave NUEVA** y migrar las Edge Functions a leer solo de `INFOPLUS_CLAVE` (secret). El sondeo `infoplus-probe` se deja **desactivado** (stub 403); se reactiva temporal solo para probar y redacta la clave.

### Liquidación de Aduana — ahora es MÓDULO (vista, no modal) con guardado
- Dejó de ser ventana flotante: es la **vista `v-liquidacion`** (se abre con `nav('liquidacion')` desde el botón de Compras; `cerrarLiquidacionAduana()` = `nav('proveedores')`).
- **Tabla `aduana_liquidaciones`** (RLS authenticated; gating admin en UI). Guarda: proveedor, factura, fecha, tasa, transporte, impuesto_modo/valor, otros(jsonb), ganancia_pct, items(jsonb con desc/cant/costo/registrado), subtotal_usd, gran_total_rd, creado_por. Funciones: `guardarLiquidacionAduana()`, `abrirHistorialLiquidaciones()`, `cargarLiquidacionGuardada(id)`, `eliminarLiquidacionGuardada(id)`. **Solo admin.**
- Columnas nuevas por unidad: **Costo unit RD$, Gastos/unid RD$, Costo unit FINAL RD$, Total FINAL RD$** y **Precio venta ref.** (= costo final × (1+% ganancia), REFERENCIAL). En pantalla, impresión y Excel. Impresión/Excel además traen columnas en blanco **"Nombre corregido"** y **"Código IP"** (entrada manual; NO se enlaza con Info Plus a propósito).
- Pro: **métricas** en el resumen (artículos/unidades, % gastos, ganancia estimada), columna **"✅ Reg. IP"** por fila (se guarda) + **barra de progreso**, y **auto-guardado de borrador** en localStorage (`bayol_aduana_borrador`, pregunta "¿retomar?" al abrir).
- UX: subir archivo unificado **"Subir PDF/Excel"** (`_aduanaSubirArchivo` → detecta tipo; Excel con SheetJS por CDN). Click en título de columna la oculta (`_aduanaToggleCol`/`_aduanaMostrarColumnas`), filtro por descripción, click en "Costo unit FINAL" copia + check (toggle), scroll horizontal arriba sincronizado (`_aduanaSyncScroll`).
- `money()` ahora muestra **2 decimales fijos** (maximumFractionDigits:2) en toda la app.

### Reacondicionados — descuento de piezas (29 jun 2026)
- Al agregar pieza de Info Plus a un equipo: **siempre pregunta de cuál almacén descontar** (`_piezaElegirAlmacen`, muestra existencia por almacén). Comentario del ajuste legible: "Salida/Ajuste/Devolución pieza reparación: <modelo> IMEI <imei>" (`_equipoComentarioRef`).
- En la evaluación se eligen piezas de Info Plus **sin descontar** y **sin que el técnico vea el costo**; quedan "⏳ por descontar". El admin confirma el descuento por pieza desde la caja de costo (panel/ficha) con `_descontarPiezaPendiente`/`descontarPiezasPendientesEquipo`. `guardarEvaluacion` preserva las ya descontadas (no re-descuenta).

## ACTUALIZACIÓN sesión 2-3 jul 2026 (Ventas por tienda, Nómina, Comisiones, Validación de Tickets, descuento de piezas al Completar)

### Info Plus — la venta ya trae tienda y vendedor
- El endpoint `factura` ahora devuelve **`codlocalidad`** (1=Santiago, 4=Moca) y **`codempleado`** (vendedor). Se agregaron columnas `infoplus_ventas.codlocalidad` y `infoplus_ventas.codempleado` (edge `infoplus-ventas-sync` v4 las captura). Se **backfilleó** todo 2025-2026 con `infoplus-probe` (la sync por cron devuelve 0 por rate-limit; el probe no).
- **Ventas por tienda:** 1=Santiago, 4=Moca. **Comisiones por vendedor:** `codempleado`. Ojo: Info Plus calcula la comisión sobre el **neto SIN ITBIS** (nuestro `monto_venta` es CON itbis), por eso da un poco más alto; para cuadrar exacto habría que sincronizar el neto.

### Estado Mensual (Contabilidad) — ventas separadas por tienda
- RPC `estado_mensual_cat(p_ini date, p_fin date, p_localidad int default null)` filtra `infoplus_ventas` por `codlocalidad`. `_datosEstadoMensual` mapea el selector (Santiago→1, Moca→4) y lo pasa. Se quitó el aviso de "ventas combinadas".

### NÓMINA (módulo nuevo, vista `v-nomina`, solo admin) — quincenal formato BHD
- Tablas: `nomina_empleados` (nombre, cedula, cuenta_bhd, puesto, fecha_ingreso, salario_mensual, deduce_ley, activo), `nomina_periodos`, `nomina_lineas`. Constantes `NOM_ARS=0.0304, NOM_AFP=0.0287`. TSS patronal: SFS 7.09%, AFP 7.10%, SRL 1.10%, INFOTEP 1%.
- 19 empleados reales cargados (17 fijos + 2 "por día": Julio Ángel, Manuel Felipe). Funciones: `renderNomina`, `nominaTab`, `_renderNominaEmpleados`, `_nominaEditarEmpleado`/`_nominaGuardarEmpleado`, **`_nominaEliminarEmpleado`** (borra; si tiene FK lo deja inactivo).
- **Generar quincena AUTOMÁTICA:** al entrar detecta la quincena por la fecha (día ≤15 → 1ra 1-15 paga 15; si no → 2da 16-fin de mes paga fin). Encabezado profesional con `_nominaCalcPeriodo/_nominaAplicarPeriodoAuto/_nominaCambiarQuincena/_nominaMesShift`. Ya no se piden fechas a mano.
- **Exportar BHD** (`_nominaExportarBHD`) = formato exacto del banco (Cuenta · Nombre · Referencia ddmmaaaa · Monto · "PAGO NOMINA" · Correo). También volante individual, Excel, imprimir, historial, resumen TSS. Días base 23.83 para pago por día. **Guía "¿Cómo hago la nómina?"** (`_nominaGuia`, imprimible) — commit en dev, NO subido a main (el usuario dijo que no por ahora).

### INCENTIVOS / TICKETS — sistema de validación (el más trabajado esta sesión)
- Tabla `taller_incentivos` (ticket=nº factura, tipo reparacion/pulido/manual, monto_factura, monto_incentivo, estado). Estados: **pendiente → validado → pagado**; extra **rechazado** (devuelto). Columnas nuevas: **`rechazo_motivo`**, **`sellado`/`sellado_por`/`sellado_en`**, y ya existían `aprobado_por/aprobado_en`.
- **Validador global** (`abrirValidadorGlobal`, botón "Validar Tickets" en Incentivos): lista TODOS los tickets de todos los técnicos + **buscador** (nº/técnico/nota) + filtro (Por validar / Validados (por sellar) / Validados / Devueltos / ⚠️ Duplicados / Todos). Validar/Devolver/Borrar por fila. El botón "Validar" por técnico abre el mismo validador filtrado a él (chip "Solo: X").
- **Revisar uno por uno** (`_revRender`/`_revCorrecto`/`_revRechazar`): un ticket a la vez, editable, con check **"Firmada y sellada"**.
- **Estados con checks de color** (`_incEstadoBadge(estado, sellado)`): ⏳ Pendiente → ✔ Validado (azul claro) → ✔✔ Validado y sellado (azul fuerte) → ✔✔ Pagado (verde) → ⚠️ Devuelto (rojo).
- **"Firmado y sellado" = REQUISITO para validar.** En la lista, en la columna de acciones (debajo de los botones ✔/↩/🗑) hay un check **"☐ Firmado y sellado"** (`_valToggleSello`, se pone azul al marcar, solo marca el sello, no valida). El ✔ **no deja validar** si no está marcado. Al validar, el cursor salta al buscador y selecciona lo escrito (para el siguiente rápido).
- **Devolución con nota:** al Devolver se pide motivo (`rechazo_motivo`); el técnico lo ve en su "Registro de Ticket" en rojo ("⚠️ Devuelto: …") y al corregir+guardar vuelve a la cola.
- **Permiso `validar_tickets`** (grupo "🎁 Incentivos / Tickets" en Config→Roles): un no-admin puede ver Incentivos y validar/devolver (pero NO pagar). Helper `puedeValidarTickets()`. Se muestra **"Validado por [nombre]"**.
- **Facturas DUPLICADAS:** (1) BLOQUEO al registrar (admin y técnico) el duplicado exacto (mismo nº ticket + mismo tipo reparación/pulido + mismo técnico); "manual" no se bloquea (`_incChequearDuplicados`/`_incDupExactoId`). (2) En el validador: etiqueta "⚠️ DUPLICADO", filtro "Duplicados", aviso con conteo, y borrar (admin). Quedaron 7 duplicados viejos (2 ya pagados: tickets 112188, 112322 — sin tocar).

### Reacondicionados — descuento de piezas AL COMPLETAR (cambio de política)
- Antes: el admin confirmaba el descuento pieza por pieza. **Ahora: se descuenta AUTOMÁTICO al pasar el equipo a "Completado"** (`marcarDespachado` y `_reacondPasarA('vendido')`), con `_descontarPiezasAlCompletar(equipoId)`: baja del **Taller (almacén 6)** por defecto; **si no hay stock en el 6, pregunta** el almacén (`_piezaElegirAlmacen`). Las piezas por descontar (infoplus_desc_cant=0) se descuentan solas; las ya descontadas no se repiten.
- Botón renombrado: **"Pieza inventario (Info Plus)" → "Agregar piezas (Info Plus)"** (ficha `verFichaDespacho` y panel; ese botón `agregarPiezaInfoPlus`/`_agregarPiezaInfoPlusConfirm` ya descontaba al instante preguntando el almacén).

### Fix UI
- **Toast/notificaciones** subidas a `z-index: 99999` (antes 99, quedaban DETRÁS de los modales que llegan a ~790).

### Pendientes / infra
- **🚚 Despacho de Almacén REAL de Info Plus:** sigue **pendiente de Dagoberto** (endpoint + modelo/JSON + códigos de Departamento/Tipo + ejemplo que grabe). El módulo del taller lo hace con 2 ajustes mientras tanto.
- **Hosting/dominio:** la app corre en **GitHub Pages (gratis) + Supabase**, NO en el hosting "Stellar" ($55.88/año) que llegó a vencer — ese es el **dominio/DNS** de bayolcell.com (y el correo Zoho). **Plan: migrar el DNS a Cloudflare (gratis)** y solo pagar el dominio (~US$10-12/año), manteniendo la web en GitHub Pages. Pendiente: confirmar dónde está registrado el dominio. ⚠️ Ojo con correos de "renueva ya" (posible phishing) — entrar directo al registrador, no al link del correo.
- Idea pendiente: dejar **Comisiones** (1% por vendedor/tienda) y **Reporte de celulares vendidos** (por modelo, costo/venta/ganancia desde `infoplus_ventas`) como botones fijos.

## ACTUALIZACIÓN 9 jul 2026 — Info Plus ESCRITURA completa (despacho, compra, IMEI), Inventario Físico, Importar manifiesto, Ayuda de módulos

### 🎯 EL BUG que bloqueaba el DESPACHO: salto de línea en `basedatos` (RESUELTO)
- El secret **`INFOPLUS_BASE` trae `"bayol\n"`** (con salto de línea). La función de `ajuste` ya hacía `.trim()`, pero la de **`despacho` NO** → por eso ajuste/compra grababan y **despacho daba 400**. Dagoberto lo detectó ("después de bayol hay cambio de línea"). **Fix: `.trim()` al basedatos** en `infoplus-despacho-crear` (ahora v9+). **Regla: SIEMPRE `.trim()` a `INFOPLUS_BASE` y `INFOPLUS_CLAVE`** en toda Edge Function (idealmente arreglar el secret para que no traiga el `\n`).
- Diagnóstico largo (por si reaparece): el despacho devuelve **HTTP 200** con cuerpo `{status:400, message:null, data:[modelo]}` = rechazo sin motivo. Descartamos endpoint, clave (probada la de Dagoberto), IP, headers y JSON — todo idéntico. El motivo real solo estaba en el **log del servidor de Info Plus** (Dagoberto puso un mensaje `"dblogin vacio"` que al final era el efecto del `\n`).

### DESPACHO REAL de Info Plus — FUNCIONA (piezas Y teléfonos con IMEI)
- **Endpoint:** `POST /api/despacho?basedatos=bayol&clave=...` (Edge `infoplus-despacho-crear`, pasa el DespachoModel directo).
- **DespachoModel** (campos clave): `codlocalidado` (origen, termina en **o**), `codlocalidadd` (destino, **doble d**), `coddepartamento:"1"`, `codempleado:"6"`, `codempleado2:"6"`, `tipodespacho:0`, `detallesdespacho:[{codarticulo, precio, cantidad, codunidad:1, descripcion, comentario}]`, `seriales:[{numero, codarticulo}]`. **NO mandar `detallesdespacho2`.** Éxito = respuesta `status:200`, `message:"Se ha creado correctamente"`, `data[0].codalmacen` = **Nº de despacho (DA000...)**.
- **Con IMEI SÍ graba** (probado: art 1170, IMEI `...1830`, Santiago 1→Garantía 3, stock 7→6/1→2). ⚠️ La serie **`355617283201152` quedó dañada** de tantas pruebas (da "error"); pedir a Dagoberto que la limpie. No afecta a las demás.
- **Localidades/almacenes (codlocalidado/d = codalmacen):** **1 Oficina Santiago · 3 Garantía China · 4 Localidad Moca · 5 Almacén 2do Nivel · 6 Taller.** Cada serie debe estar en la localidad de **origen**.
- **Módulo "🚚 Despacho de Almacén"** reescrito (`v-despachos`): carrito de **varios artículos**, origen→destino, **documento único**, **conduce imprimible** (`imprimirDespacho(id)`) e **historial con reimprimir**. Funciones: `renderDespachos`, `_despAgregarItem`, `_despRenderCart`, `_ejecutarDespachoReal({origen,destino,items,nota,seriales})`, `hacerDespachoAlmacen`, `_despGuardarHistorial`, `_despachoCargarHistorial`. Tabla `despachos_almacen` (+ `despacho_numero`, `items` jsonb, `nota`).
- **Despacho rápido** (panel reparación) también usa `_ejecutarDespachoReal`.

### DESPACHAR TELÉFONOS desde Reacondicionados
- Botón **"Despachar teléfonos"** (barra del lote, admin): marca teléfonos → agrupa por modelo (`articulo_codigo`), **costo PROMEDIO**, manda **todos sus IMEI**, un documento. `despacharTelefonosSeleccionados()` / `_despTelConfirmar()`. Usa `_reacondSel`, `_costoEquipoRep(e).fin`, `_modeloRep(e)`. Default Taller(6)→Santiago(1).

### INVENTARIO FÍSICO (módulo nuevo `v-invfisico`, solo admin)
- Cuenta la mercancía real y la **cuadra con Info Plus por DIFERENCIA** (delta = contado − sistema en vivo), sin parar la venta. Por **almacén** + **categoría** (deducida de la descripción: PANTALLAS, BATERÍAS, CELULARES…). Guarda avance (sigue otro día).
- **Piezas:** casilla de número. **Celulares:** botón que abre escáner de **IMEI** (uno por uno); conteo = nº de IMEI; se guarda la lista. Tablas **`inv_fisico_sesiones`** y **`inv_fisico_lineas`** (con `imeis` jsonb). Cuadrar manda **ajustes** (`_infoplusAjustePieza`). Imprime **hoja de diferencias** y **hoja en blanco** (conteo a ciegas). Funciones `renderInvFisico`, `_invUpsertLinea`, `_invAbrirImeis`, `_invCuadrar`, `_invImprimir`, `_invImprimirHojaBlanco`.

### IMPORTAR MANIFIESTO (Excel del proveedor) → lote con IMEI individual
- Botón **"Importar manifiesto (Excel)"** en Compras (morado). Lee el Excel (cada fila = 1 teléfono con IMEI), **detecta la tasa US$→RD$ sola** (mediana rd/usd), **enlaza cada modelo con Info Plus por nombre** (`_matchArticuloPorNombre`, editable/verificable; marca en rojo los **sin código IP**), y crea el lote con **un `equipos_refurbish` por teléfono** (modelo, imei, `costo_compra`=RD$, capacidad, color, marca, `articulo_codigo`, `costo_origen='manifiesto'`). Sin código IP = se crea igual en el taller, se enlaza después para despachar. Usa **SheetJS** (`window.XLSX`, se carga por CDN). Funciones `abrirImportarManifiesto`, `_manifSubirArchivo`, `_manifRender`, `crearLoteDesdeManifiesto`. Columnas manifiesto Yves: Item Description·Unit Price(US$)·(RD$)·Quantity·IMEI·Brand·Model·Carrier·Memory·Color.

### COMPRA Info Plus — Guardar + Imprimir
- Al **"Registrar compra en Info Plus"** ahora guarda un comprobante en **`compras_infoplus`** (pedido, lote, proveedor, almacén, items con modelo/promedio/IMEIs, total) y ofrece **imprimir** (`imprimirCompraIP(rec)`): encabezado tienda, Nº pedido, tabla con promedio e IMEIs, firmas.

### AYUDA DE MÓDULOS (convención NUEVA — seguir SIEMPRE)
- Cada módulo lleva **un ícono discreto** `<i class="ti ti-info-circle">` (gris `#94a3b8`, **NO emoji**, uno solo, junto al título) que abre su explicación. Motor: `abrirAyuda(titulo, html)` + registro **`AYUDAS`** + `ayudaModulo('clave')`. **Regla: cada módulo nuevo agrega su texto a `AYUDAS` y el botón ℹ️ (ícono, no emoji) en su encabezado.** Ya tienen: `invfisico`, `despachos`.

### Estados de resultados
- **Mayo 2026** (contadora): ventas netas 3,594,629 · costo 2,380,861 · **utilidad +3,183** (Santiago +6,086, Moca −2,903) — casi en cero. El costo de la contadora quedó **131,504 MÁS BAJO** que Info Plus → inventario final probablemente **inflado** (piezas no descontadas). Pendiente: confirmar con la contadora el **inventario final de mayo** (ella 10,252,130 vs Sterling 10,735,925 — cambia si ganó o perdió).

### Fix 11 jul 2026 — sync de ventas rota desde el 1 jul (MISMO bug del `\n`)
- `infoplus-ventas-sync` devolvía `ok:true, facturas:0` desde el 1 de julio: **le faltaba `.trim()` a `INFOPLUS_BASE`** (mandaba `bayol\n`; el endpoint `factura` responde vacío en vez de error). Arreglado en **v5** (trim a base y clave). Diagnóstico: los artículos sí sincronizaban (esa función tiene la base hardcodeada) y el probe con `.trim()` traía datos → era el código de la sync, no rate-limit.
- **Cron corregido:** `infoplus-sync-cada-min` corría **CADA MINUTO** (1,440 llamadas/día); se bajó a `*/30 * * * *` (cron.alter_job id 1). Ventas sigue a las :07 de cada hora.
- Julio 1-11 re-sincronizado (494 facturas, RD$1.11M). El probe volvió a stub 403.

### 🎯 METAS POR VENDEDOR (acordadas 11 jul 2026 — se manejan POR CHAT, Sterling NO quiso panel en la app)
- Vendedores (por `infoplus_ventas.codempleado`): **697** = mayorista Santiago (~28% crédito, margen ~35%) · **748** = Michelle, detalle/contado Santiago (margen ~38%) · **1020** = vendedora Moca (margen ~26%, el más bajo).
- **Metas mensuales** (equilibrio / ganancia 200k): 697 → **2,100,000 / 2,400,000** · 748 → **1,100,000 / 1,300,000** · 1020 → **550,000 / 650,000** · otros/taller ~150,000. Total 3.9M / 4.5M (gastos ~1.21M, margen real ~31%).
- Cuando Sterling pida **"proyección"** (lo hace semanal): sacar ventas del mes por `codempleado` de `infoplus_ventas`, comparar contra estas metas (ritmo diario y % del ritmo necesario), y contra el mismo período del mes anterior. Referencias: junio cerró 3,370,172; mayo 3,796,579 (contadora: utilidad mayo +3,183). Julio 1-11: 1,112,480 (697: 602k · 748: 297k · 1020: 119k).

### Auditoría 12 jul 2026 (aplicada)
- **FIX:** `infoplus_ventas` tenía RLS sin política → los reportes que la leen directo del navegador ("Celulares por modelo" y "Estado de Resultados formato contadora") recibían VACÍO. Se creó `infoplus_ventas_auth_read` (select para authenticated). Regla: toda tabla nueva que lea el cliente necesita su política.
- **FIX:** se revocó el EXECUTE **anon/public** de 16 funciones de negocio (stats_*, infoplus_valor_inventario, estado_mensual_cat, set_taller_existencia, etc.) — quedaban llamables SIN login con la clave publicable. Solo `web_visitas_por_dia`/`web_visitas_resumen` conservan anon (las usa la landing).
- **Preventivo pendiente:** buckets `fin-documentos`/`fin-evidencias` son PÚBLICOS (hoy vacíos) — volverlos privados antes de subir documentos de clientes. 2 IMEI duplicados (garantías) y 2 lotes con contador descuadrado (cosmético).

### Pendientes
- 🔒 **ROTAR la clave de Info Plus** (`24324...` se filtró en chat) y migrar Edge Functions a leer solo del secret con `.trim()`.
- Serie `355617283201152` dañada (Dagoberto).
- Cloudflare Pages (Fase 1 lista para montar, riesgo cero) para deploy instantáneo.
- Poner el ícono de ayuda a los módulos viejos (Reacond, Compras, Contabilidad, Nómina, Incentivos…).

## ACTUALIZACIÓN 12 jul 2026 — Financiamiento: 4 herramientas estilo FDL Pro (rama `claude/jevi-financing-module-GSzW0`, ya en `main`)
Se replicaron **herramientas** del competidor **FDL Pro** (device locker / EMI, `fdlpro.com`) pero con **nuestro diseño claro** (Sterling: "sus herramientas necesarias, el diseño lo modernizamos nosotros; del tema oscuro nada"). Todo en `taller.html`, módulo Financiamientos.
- **Modal de pago flotante** (`abrirModalPago(finId)`/`cerrarModalPago()`/`_finModalPago(titulo,cont)`/`_finModalPagoExito(finId,pagoId)`): el registro de pago ya no redirige ni auto-abre el recibo en ventana nueva; se queda flotante encima del detalle, con chips de monto sugerido (cuota/saldo), método, vista previa en vivo, y pantalla de éxito con botones Imprimir ticket / WhatsApp / Listo. `registrarAbonoFin` ahora llama `_finModalPagoExito` (quitado el `setTimeout(imprimirReciboFin)`).
- **Cobro rápido** (`abrirCobroRapido()`/`_cobroRapidoFiltrar()`): botón "Registrar pago" en el Dashboard (barra superior con contador de cuotas vencidas/vencen hoy) → buscador de financiamiento activo (por cliente/contrato/cédula, prioriza atrasados) → abre el modal de pago. Es el "Add Payment" de FDL.
- **Recordatorios automáticos** (`finRecordatoriosHoy()`/`abrirRecordatoriosHoy()`/`_finRecordatoriosRender()`/`_finEnviarRecordatorio(finId,tipo)`/`_finRecordatorioMsg(rec)`): el sistema arma solo la lista "Recordatorios de hoy" clasificada en **previo** (N días antes) / **vence** (hoy) / **atraso**; un recordatorio por financiamiento con teléfono, el más urgente. Mensaje de WhatsApp ya escrito, se envía con un toque (`wa.me`) y **queda marcado** para no repetir en el día. Botón "Recordatorios" en Dashboard (con contador) y en pestaña Cobros. **Tabla nueva `fin_recordatorios`** (financiamiento_id, cuota_num, tipo, fecha, canal, enviado_por; RLS `fin_recordatorios_auth_all` authenticated) registra los envíos del día; se cargan en `_finCache.recordatorios` (solo los de hoy). Config `fin_config.recordatorio_dias_previos` (default 2). Envío 100% desatendido = **Fase 2** (API oficial WhatsApp de Meta + cron, con costo) — pendiente.
- **Auto-marcado para bloqueo** (`finListosParaBloqueo()`/`abrirListosBloqueo()`/`_finListosBloqueoRender()`/`_finBloquearDesdeCola()`/`_finBloquearTodosEnrolados()`/`_finMaxAtraso(f)`/`_finDiasGracia()`): cola "Listos para bloquear" con los atrasados que pasan los **días de gracia** (`fin_config.bloqueo_dias_gracia`, default 3, editable en el modal) y no están bloqueados/liberados; muestra días de atraso, cuotas venc., monto, si está enrolado. Botón Avisar (WhatsApp última oportunidad) y Bloquear (Hexnode vía `mdmAccionReal`), más bloqueo masivo de enrolados. La alerta del Dashboard y un botón en la pestaña MDM abren la cola. Bloqueo real depende del enrolamiento Hexnode (pendiente DUNS). También existe `fin_config.bloqueo_auto` (bool, default false) reservado para la Fase 2 (bloqueo desatendido por cron).
- **Convenciones NEXUS aplicadas al código nuevo:** sin emojis en la interfaz (solo íconos `ti-*` + texto), RD$/es-DO, imprimible+WhatsApp, RLS en la tabla nueva.
- **Rediseño NEXUS del módulo Financiamiento (12 jul 2026, por fases):** se está alineando TODO el módulo (líneas ~23537–26868 de `taller.html`) a las convenciones NEXUS. **Fase 1 (Dashboard):** capa de diseño con variables semánticas en `:root` (`--fin-ok/--fin-warn/--fin-danger/--fin-info/--fin-ink/--fin-muted`) y clases reutilizables (`.fin-badge` con `.ok/.warn/.danger/.info/.muted`, `.fin-chip`, `.fin-dot`); Dashboard sin emojis y con color por variable. **Fase 2 (limpieza de emojis en TODO el módulo):** se quitaron ~90 emojis de la UI del módulo (insignias de cronograma, filtros, etiquetas, estados MDM 🟢🟡🔴🔒🔓, teléfonos, vacíos, avisos) → ahora solo íconos `ti-*`/`.fin-dot` + texto. **Se dejaron a propósito:** el emoji del mensaje de recibo por WhatsApp al cliente (contenido para el cliente, no UI) y los comentarios `// ✨` del código. **Regla al editar el módulo:** nada de emojis en la UI, usar las clases `.fin-*` y las variables semánticas, no hex sueltos. **Deuda conocida:** el RESTO de `taller.html` (Taller, Reacond, Compras, Contabilidad, Nómina, etc.) todavía usa emojis y hex sueltos; alinearlo sería otra migración aparte (el otro chat también edita ese archivo). El rediseño se mantiene ACOTADO al módulo de Financiamiento para no chocar.
- **🔒 Buckets de documentos AHORA PRIVADOS (12 jul 2026):** `fin-documentos` (fotos de cédula/contrato) y `fin-evidencias` (videos) se volvieron **privados** (`storage.buckets.public=false`) y sus políticas pasaron de `{anon,authenticated}` a **solo `authenticated`** (`fin_documentos_auth_all`/`fin_evidencias_auth_all`). Estaban vacíos, así que no rompió nada. **El código ahora guarda la RUTA** (no la URL pública) en `fin_documentos.url` y `financiamientos.video_url`, y genera **enlaces firmados de 1h** al cargar con `_finSignUrl(bucket, ruta)` dentro de `cargarFinanciamientos` (el helper deja pasar tal cual los registros viejos que empiecen con `http`). Regla: cualquier bucket con datos de clientes va **privado + signed URLs**, nunca público.
