# 2-nov-2026 12:00 RD — Prefactura: subir el precio libre y bajarlo hasta el mínimo (Claude)

## Solicitud del dueño
«Cuando seleccionas un artículo no deja subir ni bajar precio aparte del descuento… el precio de venta que permita al mínimo».
Eligió: **subir libre, bajar hasta el mínimo**. Aclaró: el mínimo es el que él pone en el sistema al editar los tres precios de un nivel.

## Diagnóstico
- Regla del 24-oct: en artículos del catálogo solo el administrador cambiaba el precio (`_rpPrecio` + `readonly` en `taller-prefactura.js`).
- Info Plus **no devuelve** el mínimo por ninguna ruta (bitácoras 2026-10-20-0930 y 0945). Confirmado hoy: `ListaArticulos detallado`
  trae solo `codnivelprecio, precio` (`infoplus-precios-sync` v15 → `claves_precio`).
- El editor «Editar precios» del sistema sí manda el mínimo a Info Plus, pero no lo guardaba en ningún lado.

## Cambios
- **Base (aplicada):** `infoplus_articulos.niveles_min jsonb` (migración `20261102150000_infoplus_niveles_min.sql`, solo agrega).
- **Edge `infoplus-precio-actualizar` v17 (desplegada):** si Info Plus acepta el cambio, guarda en la copia local `niveles` y `niveles_min`
  del artículo (fusionando). Responde `copia_local`. Sigue siendo solo admin (403 probado).
- **Edge `infoplus-precios-sync` v16 (desplegada):** lee el mínimo si algún día Info Plus lo manda; mientras no, **no toca** `niveles_min`.
  Se corrió una vez: 2,135 artículos, `con_minimo: 0`.
- **Frontend (rama `claude/precio-editable`, SIN publicar):**
  - `taller-app.js`: carga `niveles_min`; `_rpPrecioMin(it)` = mínimo del nivel del cliente o, si no se conoce, el precio de lista;
    `_rpPrecio` deja subir libre y, por debajo del mínimo, deja el mínimo y avisa «Mín. RD$ …». Admin, servicio, delivery y accesos
    rápidos: libre. El editor muestra el mínimo guardado y ya no borra los niveles que no se tocaron en el caché.
  - `taller-prefactura.js`: el precio del artículo ya es editable para todos; al pasar el ratón dice «Mínimo RD$ …».
  - Versiones `?v=20261102-pm1`.

## Pruebas
- Nueva `scripts/pruebas/prefactura-precio-minimo.cjs`: 12/12 OK (empleado y admin).
- `prefactura-boton-precio`, `prefactura-confiable`, `prefactura-delivery`, `prefactura-instantanea`: sin errores.

## Límite
- Los artículos cuyo mínimo se puso **directo en Info Plus** (o antes de hoy) no tienen mínimo conocido: ahí el empleado solo puede
  subir el precio. Para que tengan mínimo, editar sus precios una vez desde el sistema (o que Dagoberto entregue el mínimo por la API).

## Pendiente
- «Publícalo» del dueño.
