# Rutas: consultar equipos por IMEI o serial (taller Bayol Cell)

Guía para cualquier chat. Hoy (20-oct-2026) **no hay una consulta única**: cada búsqueda vive en su pantalla. Líneas de `taller-app.js` / `taller.html` a la fecha (pueden moverse; buscar por nombre de función).

## Dónde se guarda el IMEI (Supabase, proyecto vkhwdvjtowrhkhqavnvk)
| Tabla | Columna(s) | Qué es |
|---|---|---|
| `equipos_refurbish` | `imei`, `serial` | Equipos reacondicionados de los lotes |
| `equipos` | `imei`, `serial` | Equipos de clientes (reparaciones); ~293 con IMEI |
| `ordenes_reparacion` | (por `equipo_id` → `equipos`) | Órdenes de servicio |
| `financiamientos` | `equipo_imei`, `mdm_serial` | Equipos financiados (Hexnode) |
| `fin_solicitudes` | `equipo_imei` | Solicitudes de financiamiento |
| `infoplus_seriales` | `imei, codproducto, producto, codproveedor, proveedor, factura, fecha, costo` | Índice de IMEI de las COMPRAS de Info Plus (~1,637). Lo llena la Edge `infoplus-seriales-sync` |
| `recepcion_prefacturas` | `imei` | Prefacturas hechas desde Recepción |
| `inv_fisico_lineas` | `imeis` (jsonb), `serial` | Conteo de inventario físico |
| `diagnosticos`, `panic_logs`, `bateria_registros`, `pantalla_registros` | `imei` | Diagnóstico IA / BDE |

## Búsquedas que ya existen en la app
1. **Dashboard → buscador global** (solo reacondicionados)
   - HTML: `#buscadorGlobalImei` + `#resultadoBusquedaGlobal` (taller.html ~2573, vista `v-dashboard`).
   - JS: `buscarEquipoGlobal()` (taller-app.js ~2948) filtra `cache.refurb` por imei/modelo/marca/capacidad/color. Al tocar: `irAEquipoDesdeBusqueda(id)` (~2994) abre el panel o la evaluación.
2. **Reacondicionados → buscador en TODOS los lotes**
   - HTML: `#reacondBuscadorGlobal` + `#reacondBuscadorGlobalResultados` (taller.html ~3640).
   - JS: `buscarEquipoGlobalReacond()` (~11681) también busca por `articulo_codigo`. Al tocar: `_irAEquipoReacond(id, loteId, q)` (~11710) abre el lote ya filtrado.
3. **Dentro de un lote**
   - HTML: `#reacondBusq` (taller.html ~3752).
   - JS: el filtro está dentro de `renderDetalleLoteReacond()` (busca imei, articulo_codigo, modelo, marca, capacidad, color).
4. **Recepción → aviso de equipo que ya vino**
   - HTML: `#e_imei` con `onblur="chequearEquipoExistente()"` (taller.html ~2734).
   - JS: `chequearEquipoExistente()` (~23927) busca en `equipos`. Historial: `verHistorialEquipo(equipoId)` (~23943).
5. **Órdenes de Servicio → buscador**
   - HTML: `#ordBusq`.
   - JS: `setOrdBusq(v)` (~3041) → `renderOrders()` (~3095) busca por número, cliente, marca, modelo, **imei** y falla.
6. **Compras → «IMEI → Proveedor»**
   - Botón en taller.html ~3318.
   - JS: `abrirBuscarSerialIP()` / `buscarSerialIP()` (~5863) consulta `infoplus_seriales` (de qué compra, proveedor, factura y costo vino).
   - Admin: «Sincronizar» (`sincronizarSerialesIP()`, ~5905) invoca la Edge `infoplus-seriales-sync` con `{desde, hasta}`.
7. **Historial de un reacondicionado:** `verHistorialEquipoReacond(equipoId)` (~14404) y `verFichaDespacho(equipoId)`.
8. **Inventario físico (escaneo de IMEI por artículo):** `_invAbrirImeis(cod)` (~16765).

## Lo que falta (idea propuesta al dueño el 20-oct-2026, sin hacer)
- Una **«Consulta de IMEI» única** con escáner que junte en una sola respuesta:
  - `equipos_refurbish` (lote/etapa);
  - `equipos` + `ordenes_reparacion` (reparaciones);
  - `financiamientos` (financiado/estado MDM);
  - `infoplus_seriales` (compra/proveedor).
- Info Plus NO tiene un endpoint de IMEI suelto: los IMEI solo vienen dentro de `GET /compra` (por eso existe `infoplus_seriales`).

## Info Plus: IMEI / seriales (API `https://apicliente.infoplusplatinum.com/api/…`)
Siempre por Edge Function (secrets `INFOPLUS_BASE` e `INFOPLUS_CLAVE`, siempre con `.trim()`). Nunca llamar desde el navegador ni mostrar la clave.

**LEER IMEI**
- **No hay endpoint de IMEI suelto.** `serie`, `serial`, `seriales`, `imei` y `lote` dan 404. `inventario` trae cantidades y costos, sin IMEI.
- **La única fuente es `GET /compra?basedatos&clave&fechainicial=AAAA-M-D&fechafinal=AAAA-M-D`:** cada línea trae `seriales` con los IMEI de ese producto.
  - Edge **`infoplus-compras`**: devuelve las facturas agrupadas `{factura, proveedor, codproveedor, fecha, vencimiento, termino, total, lineas:[{producto, codproducto, cantidad, precio, monto, seriales:[IMEI…]}]}`.
    - La usa el importador «Importar de Info Plus» (`crearLoteDesdeCompraInfoPlus`: cada unidad k recibe `seriales[k]`).
    - También la usa Cuentas por Pagar.
  - Edge **`infoplus-seriales-sync`** `{desde, hasta}`: recorre las compras y llena la tabla **`infoplus_seriales`** (imei → producto, proveedor, factura, fecha, costo).
    - En la app: Compras → «IMEI → Proveedor» → «Sincronizar» (`sincronizarSerialesIP()`, solo admin, desde 2025-1-1).
- Las ventas (`GET /factura`) **no** se sabe si traen el IMEI vendido (no está documentado). Para saber a quién se vendió un IMEI habría que confirmarlo con Dagoberto.

**ESCRIBIR IMEI** (los seriales van en la cabecera como `seriales:[{numero:"<IMEI>", codarticulo:<int>}]`; el IMEI no se puede repetir)
- **Compra:** `POST /compra`, Edge `infoplus-compra-crear`.
  - Graba artículos serializados.
  - Mandar `ncf:""`.
  - ⚠️ Con `codpedido` existente **REEMPLAZA** toda la compra: mandar siempre el lote completo.
- **Despacho entre almacenes:** `POST /despacho`, Edge `infoplus-despacho-crear`.
  - Graba con IMEI.
  - Cada serie debe estar en la localidad de origen.
  - Localidades: 1 Santiago, 3 Garantía China, 4 Moca, 5 2do nivel, 6 Taller, 7 Navarrete.
- **Ajuste:** `POST /ajuste` con artículos con serial responde «creado» pero NO graba. No usar para teléfonos.
- **Prefactura:** `POST /prefactura`, `seriales:[]` (no se mandan IMEI hoy).

**Pendiente con Dagoberto**
- Un endpoint para LEER seriales por artículo/almacén (hoy solo vía compras).
- Confirmar si `factura` puede traer el IMEI vendido.
- La serie `355617283201152` quedó dañada en las pruebas.
