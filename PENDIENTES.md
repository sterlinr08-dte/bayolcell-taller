# 📋 PENDIENTES — BAYOL CELL

> Lista de tareas pendientes para retomar cuando estés listo. Última actualización: 15 jun 2026.

---

## 🔐 1. Blindar Android (Hexnode) — FRP + bloquear reset  ⬅️ PRIORIDAD
**Objetivo:** que NO puedan quitar el MDM con un reset de fábrica por modo recovery.
- En Hexnode → **Policies** → política de Android:
  1. **Factory Reset Protection (FRP)** → activar y poner **la cuenta de Google del negocio** (si resetean, el equipo queda pidiendo TU cuenta = inservible para ellos).
  2. **Restrictions** → desactivar **"Allow factory reset"**.
  3. **Guardar** y **asociar la política** a los equipos (o grupo).
- *(Lo hacemos juntos: tú entras a Hexnode y mandas capturas, yo te guío.)*

## 📍 2. Activar rastreo de ubicación (Hexnode)
- Hexnode → **Policies** → **Location Tracking** → activar y aplicar a los equipos.
- Sin esto, el botón "Ubicar equipo" dirá "no hay ubicación disponible".

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
