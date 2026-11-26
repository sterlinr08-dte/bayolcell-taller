# 2026-11-25 23:30 RD · Claude — «Reponer y quieto» (sin publicar)

## Pedido del dueño
- «Con todas las APIs que tenemos juntas, qué mejoras podemos hacer.»
- Eligió **5 · Qué reponer y qué está muerto**, con la **opción C**: ventana, botón «Traer» y aviso cada lunes.
- «Quieto» = **60 días**.

## Diagnóstico y fuente de verdad
- El taller usa hoy solo unas 6 de las 161 rutas de Info Plus.
- Para esto alcanza con lo que ya se sincroniza:
  - `infoplus_articulos.existencias`: existencia por almacén, cada 30 min;
  - `infoplus_ventas`: 70,969 líneas por localidad, cada hora;
  - `infoplus_art_prov`: última compra;
  - `infoplus_seriales`: qué artículos llevan IMEI.
- **`niveles_min` no es existencia mínima: es el PRECIO mínimo por nivel.** Info Plus no da mínimo de existencia; se calcula con las ventas.
- La localidad 1/4/7 de las ventas corresponde al almacén 1/4/7.
- La tabla `articulos` del taller está vacía. Por eso «lleva IMEI» se saca de `infoplus_seriales`.

## Reglas
- **Se agota:** vendido en 30 días en esa sucursal y lo que hay no llega a 2 semanas.
  - Sugerido = un mes de venta menos lo que hay.
- **Traer:** sale de donde sobra, en este orden: 2do Nivel, luego Oficina; de una sucursal, solo lo que le sobra tras su propio mes de venta.
  - Nunca de Garantía China ni del Taller.
  - Se hace un despacho de Info Plus por cada ruta (`_ejecutarDespachoReal` + `_despGuardarHistorial`, el mismo de Despacho de Almacén).
  - Una sola confirmación y candado contra el doble toque.
  - Los celulares con IMEI no se traen desde aquí: van por «Despachar teléfonos».
- **Quieto:** hay existencia (sin contar Garantía China) y no se vendió ni se compró en 60 días. Valor a costo.

## Datos reales (prueba con funciones temporales, 25-nov)
| Qué | Cantidad |
|---|---|
| Se agota | 145 (59 con IMEI) |
| Se puede traer | 60 |
| Quieto 60 días | 1,125 artículos · RD$ 6,453,435 a costo |

## Archivos
- `supabase/migrations/20261126130000_inv_reponer_quieto.sql` (**sin aplicar**):
  - `inv_reponer(p_dias)`: admin/técnico, solo lectura;
  - `inv_reponer_resumen()`;
  - `push_destinatarios_admin()`;
  - `inv_reponer_aviso_semanal()`;
  - cron `inv-reponer-lunes` (`47 11 * * 1` = lunes 7:47 a. m. RD).
- `supabase/functions/push-enviar/index.ts`: nueva rama `{ aviso: 'reponer_semanal' }`, solo a administradores. **Sin desplegar** (sigue la v1).
- `sw.js`: avisos con `u`. Al tocar el del lunes se abre `taller.html?abrir=reponer`, o un mensaje `abrir-ventana` si la app ya está abierta.
- `taller-reponer.js` (nuevo, `?v=20261126-rep1`):
  - ventana con pestañas Se agota · Traer · Quieto;
  - filtros por sucursal o almacén y buscador;
  - ⓘ `AYUDAS.reponer`.
- `taller.html`: botón **«Reponer y quieto»** en Despacho de Almacén, al lado de «Kárdex del artículo», y carga del script.

## Pruebas
- Página de prueba con los estilos reales del taller, datos de ejemplo y el despacho simulado. **No se tocó Info Plus.** Playwright a 390 y 1280 px:
  - sin errores de página;
  - sin scroll horizontal;
  - todo lo tocable mide ≥ 44 px;
  - buscador de 48 px con letra de 16 px;
  - cantidad y «Desde» de 44 px con letra de 16 px;
  - botón «Traer» de 54 px.
- Doble toque en «Traer»: **1** confirmación y 2 despachos (Moca→Santiago y 2do Nivel→Navarrete), con 2 filas en el historial y cada fila marcada «Despacho #…».
- Búsqueda en Quieto: «televisor» deja 1 fila.
- **No probado:**
  - el aviso real del lunes (necesita aplicar la migración y desplegar push-enviar);
  - un despacho real en Info Plus desde esta ventana.

## Riesgos y pendientes
- «Traer» escribe en Info Plus (despacho) después de la confirmación, igual que Despacho de Almacén.
- Las existencias pueden tener hasta 30 min de atraso.
- Para publicar: aplicar la migración, desplegar push-enviar v2 y unir el PR.

## Siguiente paso
Que el dueño lo vea y diga «Publícalo» o «Todavía no».
