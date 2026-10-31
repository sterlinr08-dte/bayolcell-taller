# Prefactura: accesos rápidos «smart» (31-oct-2026, 02:00 RD) — rama, SIN publicar

**Dueño:** «Que sea smart» (sobre la fila Delivery · Servicio · Activar · Recarga, bit. 2026-10-31-0130).

**Qué se agregó (`taller-prefactura.js` i31 / `.css` n17):**
- **Precio debajo de cada botón**, el que se va a poner según el cliente (Delivery RD$ 50 si es por mayor, RD$ 100 si es final).
- **Poner y quitar con el mismo botón:** si ya está en la prefactura queda verde con «✓ Agregado»; otro toque lo quita («Delivery quitado»). Nunca se duplica.
- **Sugerencias con punto naranja:** Delivery cuando el cliente es por mayor; **Activar** cuando hay un chip / Turbo SIM / e-SIM en la lista; **Servicio** cuando se escribió una falla y aún no hay servicio. La píldora «+ Delivery» de abajo se quitó (la sugerencia vive en el botón).
- «Activación» pasa a **«Activar»** en el botón para que quepa en el celular (la etiqueta de la línea sigue «Activación»).

**Pruebas:** `prefactura-delivery.cjs` 78/78 OK a 390 y 1280 (precio debajo, ✓ al agregar, 2.º toque quita, sugerencia vuelve, Activar sugerido con Turbo SIM, recarga con cursor en el monto). `prefactura-confiable.cjs` sin errores.
