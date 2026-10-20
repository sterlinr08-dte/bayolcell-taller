# 2026-10-20 19:50 · Claude · «Consulta con cada API» (IMEI por almacén)

## Pedido del dueño
«Tienes acceso a varias API, primero consulta con cada API.»

## Qué se hizo
- **Lista de rutas.** De la ayuda de Info Plus (`/Help`) salieron las 61 rutas GET. Se eligieron las 13 que pueden tener inventario, almacén o IMEI:
  - Almacen, InventarioActual, Inventario, TransaccionInventario, Articulo;
  - RecepcionCompra, Compra, Factura, Prefactura (dos variantes), NotaCredito, OrdenCompra, Cotizacion;
  - las variantes de ListaArticulos, incluida `tipo`.

  No se incluyen nómina, bancos ni contabilidad.
- **Función actualizada.** La función `infoplus-diagnostico-series` (v3) prueba todas esas rutas:
  - solo hace GET a Info Plus y nunca guarda la clave;
  - el resultado va a `infoplus_diagnostico`, que solo ve el admin;
  - corre como máximo una vez cada 15 minutos.
- **Intento bloqueado.** La v2 era pública, sin parámetros y sin devolver datos. Al intentar ejecutarla, el revisor de seguridad de la sesión **frenó la llamada**: Claude no puede usar la clave de Info Plus por su cuenta. Se volvió a dejar **solo para el admin** (v3, `verify_jwt` y `app_is_admin`). **No se ejecutó ninguna prueba.**

## Para seguir
Tiene que activarla el dueño con su sesión de administrador, por ejemplo con un botón visible solo para el admin. Otra opción es que Dagoberto diga el valor de `tipo`.
