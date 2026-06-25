# 📋 PENDIENTES — BAYOL CELL

> Lista de tareas pendientes para retomar cuando estés listo. Última actualización: 25 jun 2026.

> ✅ **Plan Hexnode PRO comprado (anual)** — ya no se vence la prueba. Tienes bloqueo, ubicación, kiosk, FRP, wipe y notificaciones.

---

## ✅ 1. Política de Android (Hexnode) — HECHA (16 jun 2026)
Política "FINANCIAMIENTO BAYOL CELL ANDROID" creada, asociada al equipo y probada:
- ✅ **FRP** activado con cuenta `admin@bayolcell.com` (ID Google `104664341594312054855`). Si resetean por recovery, pide ESA cuenta.
- ✅ **Reset de fábrica BLOQUEADO** (y "reset avanzado", modo desarrollador y depuración USB apagados).
- ✅ **Auto-conceder permisos** a "Hexnode para trabajar" (com.hexnode.mdm.work).
- ✅ Batería "NOT OPTIMIZED" para el agente (sincroniza en segundo plano).
- ✅ **PROBADO:** bloqueo/desbloqueo funciona con la **app CERRADA** (no depende de tenerla abierta).
- ⚠️ **Llave maestra:** la contraseña de Google de `admin@bayolcell.com` es la que reactiva un equipo tras un formateo. NO perderla.
- ⚠️ **bayol0530\*** era para la "contraseña de salida" (Kiosk) — quedó PENDIENTE (no se puso, porque no queremos activar kiosk completo). Revisar si hace falta.

## ⏳ 2. Pendientes finos del Android
- 📍 **Ubicación:** activar el rastreo (el botón "Ubicar" aún dice "rastreo APAGADO"). Ver dónde se enciende (política o Admin → General Settings).
- 🔑 **Contraseña de salida del Lost Mode** (`bayol0530*`): confirmar dónde se configura sin activar kiosk completo.
- 📋 **Checklist de enrolamiento** para la empleada (4 pasos): enrolar QR → abrir Hexnode/permitir → Autostart (marcas baratas) → verificar 🟢 en el sistema.
- 💡 Comprar equipos con Android limpio (Motorola/Samsung) = menos pasos manuales (autostart).

## 🧰 3. Simplificar el módulo de Financiamiento (para el vendedor)
- Hacerlo fácil de entender y usar para el vendedor.
- Pasos guiados, lenguaje sencillo, menos campos confusos.
- Que la parte de **enrolamiento** se entienda fácil.

## 📦 4. Mini-módulo de "Equipos pre-enrolados" (dentro de Financiamientos)
- Pantalla que muestre los equipos ya enrolados en Hexnode:
  - ✅ **Disponibles** (enrolados pero no vendidos/asignados).
  - 🔗 **Asignados** (ya enlazados a un cliente).
- Poder **asignar** un equipo pre-enrolado a un financiamiento con un clic.
- *(Factible: ya tenemos la conexión que lista equipos de Hexnode.)*

## 🔌 5. Info Plus — pedir más accesos a la API
Pedirle a Info Plus que **habilite la clave** para estos endpoints (hoy dan "Error en las credenciales"):
- `compra` (compras a proveedores → contabilidad)
- `cliente` (nombres de los clientes)
- `prefactura`, `cotizacion`, `presupuesto`
- *(Cuando los habiliten → conectarlos al sistema.)*

## ✅ 6. Pruebas del MDM — HECHAS (16 jun 2026)
Probadas en vivo contra el equipo real (Smooth 6.5, Android 11, ID Hexnode 1):
- ✅ Verificar enrolamiento + conexión (muestra modelo, última conexión, 🟢 en línea, 🔒/🔓 estado).
- ✅ Notificación a la pantalla (se arregló: el endpoint correcto es `message`, no `broadcast_message`).
- ✅ Bloquear / Desbloquear (orden aceptada por Hexnode).
- ⏳ Ubicar: responde "rastreo APAGADO" → falta activar la política (pendiente #2).
- Falta: hacer una **entrega real completa** con un cliente (verificar → entregar → cobrar → liberar).

## ⭐ 7. Margen por teléfono / lote (módulo "Ventas de Lotes" en Estadísticas) — NUEVO (25 jun 2026)
**Idea (Sterling):** en Estadísticas, ver por cada teléfono de un lote: **costo final** (compra+flete+piezas, ya lo tenemos) vs **precio de venta** vs **margen RD$ y %**, y totales por lote. Para saber la ganancia real por teléfono reacondicionado.
- **Bloqueo:** el **precio de venta NO se captura** (de 18 despachados, solo 2 tienen `precio_venta_real`). Y **no se puede sacar automático** de Info Plus porque el endpoint `factura` **no trae el IMEI/serial** por venta, y además mezcla stock normal con reacondicionado del mismo modelo → no se puede saber a qué precio se vendió ESE teléfono.
- **Pendiente clave (Dagoberto, posiblemente mañana):** agregar el **IMEI/serial a cada línea de venta** del endpoint `factura`. Con eso se cruza la venta ↔ el equipo reacondicionado (por IMEI) y el margen sale **automático**.
- **Plan B (si no llega el IMEI):** capturar el `precio_venta_real` a mano (campo en la ficha del equipo) y armar el reporte igual. Campos ya existen en `equipos_refurbish`: `precio_venta_real`, `precio_venta_estimado`.
- Nota: la pestaña **Rentabilidad** de Reacond se alimentaba de `precio_venta_real` (hoy casi vacío) — este módulo la revive.

## ⏳ 8. Info Plus API — lo que falta de Dagoberto (25 jun 2026)
- 🔴 **ESCRITURA no guarda:** `compra` y `ajuste` (POST) responden "creado correctamente" pero **no hacen commit** (el código no avanza, el stock no baja). La **llave del API no tiene permiso de escritura** en bayol (el usuario web sí). → Pedir habilitar escritura + dar los códigos reales de bayol (`codminventario`="Salida Mercancía", `codlocalidad`="TALLER BAYOL", `codcatalogo`). Sin esto NO se puede: descontar piezas, registrar compras automáticas.
- 🔴 **IMEI en ventas:** pedir agregar el **IMEI/serial** (y/o el **empleado/sucursal**) a `factura` → habilita margen por teléfono (#7) y separar ventas Santiago vs Moca.
- ✅ **Lectura YA funciona** con la llave nueva: inventario, proveedor, cliente, listaarticulos, factura, compra.

---

## ✔️ YA HECHO (referencia)
- ✅ Enrolamiento Android Device Owner (no removible) + QR
- ✅ Bloquear / Desbloquear (probado, funciona)
- ✅ Verificar enrolamiento (antes de entregar)
- ✅ Enviar notificación (5 plantillas)
- ✅ Ubicar equipo (ubicación actual + Google Maps)
- ✅ Borrar equipo recuperado (wipe)
- ✅ Liberar equipo (saldado / disenroll)
- ✅ Estadísticas (ventas, rentabilidad, agotamiento, clientes, contado vs mayor, dinero dormido)
- ✅ Info Plus sync (ventas + inventario, automático)
- ✅ Reseñas Google (web + WhatsApp + recepción)
- ✅ Correo Zoho arreglado (MX) · Visitas web con personas únicas
