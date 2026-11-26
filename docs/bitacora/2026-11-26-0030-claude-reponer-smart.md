# 2026-11-26 00:30 RD · Claude — «Reponer y quieto» más inteligente (sin publicar)

Sigue a `2026-11-25-2330-claude-reponer-quieto.md`. Al preguntarle si publicaba, el dueño contestó **«Hazlo smart»**. Se toma como la regla «Todo smart» (MEMORIA §2): pensar por el usuario y avisar antes de fallar. **No es un «Publícalo».**

## Qué se agregó
1. **Lo urgente arriba.** «Se agota» se ordena así:
   - primero lo que está en cero;
   - después por los días que le quedan;
   - después por lo más vendido.
2. **Cada fila dice qué hacer:**
   - «Traer de Moca 4»;
   - «Comprar a [último proveedor] · último RD$ X · fecha»;
   - «Con IMEI · use Despachar teléfonos».
   - El proveedor sale de `infoplus_art_prov` (la compra más reciente). 118 de 145 lo tienen.
3. **Filtro «Para comprar»** (lo que no sobra en ningún almacén) y botón **«Copiar pedido»**:
   - copia la lista agrupada por proveedor, con cantidad sugerida, descripción y código, lista para WhatsApp;
   - si el mismo artículo hace falta en varias sucursales, suma las cantidades.
4. **Revisión en vivo antes de despachar.**
   - Antes de confirmar se pregunta a Info Plus (`infoplus-existencia-art`, solo lectura) cuánto hay de verdad en el origen.
   - Si hay menos, se trae lo que hay; si no hay, se salta.
   - La confirmación lo dice en «Revisado en Info Plus: …».
5. **«Marcar todo / Quitar todos»** en Traer, sobre lo que deja el filtro.
6. **Recuerda** la pestaña, la sucursal o el almacén y «Para comprar» (localStorage `bc_rep_pref`, solo en ese equipo).
7. **Celular:** las sucursales se deslizan en una sola fila y la búsqueda ocupa el ancho completo. Medido: antes la caja se salía 51 px; ahora va de 16 a 374 px.

## Archivos
- `supabase/migrations/20261126130000_inv_reponer_quieto.sql`:
  - `inv_reponer` agrega `prov`, `prov_costo` y `prov_fecha`, y el nuevo orden;
  - todavía **sin aplicar**;
  - la parte del proveedor se probó con datos reales, solo lectura.
- `taller-reponer.js` → `?v=20261126-rep2`; ⓘ actualizada.

## Pruebas (Playwright, 390 y 1280 px, página de prueba con despacho simulado)
- Sin errores de página y sin scroll horizontal.
- Todo lo tocable mide ≥ 44 px; la búsqueda, 48 px con letra de 16 px.
- «Para comprar»: 22 filas. «Copiar pedido» agrupó 22 artículos en 3 proveedores.
- Revisión en vivo: lo guardado decía Moca 4 y en vivo había 1. Se despachó 1 y la confirmación lo dijo.
- Doble toque: 1 confirmación y 2 despachos.
- Al reabrir, volvió a la última pestaña.
- **No probado:** el despacho real en Info Plus y el aviso real del lunes. Eso necesita publicar.

## Siguiente paso
Preguntarle al dueño «Publícalo» / «Todavía no».
