# Microcopy de la Prefactura (31-oct-2026, 00:40 RD) — rama, SIN publicar

**Dueño:** eligió la opción A (pantalla por pantalla) y aprobó la tabla de 18 cambios («Aprobado, aplícalo»). Reglamento en `DESIGN.md` «Reglamento de microcopy».

**Aplicado:**
- Ayudas a la ⓘ y más cortas: «Con equipo, se crea también la orden.» · «Sale impreso y va a Info Plus.» · Pedir reseña → «Envía el enlace de Google.» · Boleto de rifa → «Número al azar. Requiere rifa activa.»
- Títulos y etiquetas: «Equipo y falla» · «Pedir reseña» · «Boleto de rifa» · «Bloqueo» · «Clave del equipo» · «Apple ID» · «Google» · ejemplos «Nota» y «Qué le pasa».
- Avisos: «Falta un artículo o el equipo» · «Precio fijo · solo administrador» · «Faltan las cuentas · Configuración» · «Guardando…» · «Sin stock en {almacén}» · «Máx. 10 %» / «Máx. 10 % · quedan RD$ …» · «Agregado sin IMEI» · «Impresora desconectada · Reconectar» · «Guárdela primero» · «Ya facturada».
- Sin tocar: avisos de dinero de Info Plus («Info Plus creó la prefactura Nº … pero…»).
- Arreglo de paso: las notas de Pedir reseña y Rifa nunca se escondían tras la ⓘ porque la capa de Prefactura las sacó de `.rx-tools`; la regla de `taller-info.js` ahora las busca en `.card > p`. Nueva regla para las `.bcpf-nota`.

**Archivos:** `taller-app.js` (+ `taller-app.min.js` regenerado con `scripts/minificar.sh`, `?v=20261031-o2`), `taller-prefactura.js` i29, `taller-recepcion.js` g13, `bc-prefactura-pro.js` p2, `taller-info.js` t11, `taller.html`. Prueba `prefactura-confiable.cjs` ajustada al aviso «Guardando…».

**Pruebas:** prefactura-confiable (T1 doble clic OK, sin errores), prefactura-delivery y prefactura-boton-precio «Todo bien», ui-global «Todo bien»; raspa-y-gana igual que antes (solo el QR por el CDN bloqueado en el banco). Notas de reseña/rifa/comentario/equipo ocultas tras la ⓘ (13 ⓘ en la pantalla).
