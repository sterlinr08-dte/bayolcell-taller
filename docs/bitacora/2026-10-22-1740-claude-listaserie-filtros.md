# 22-oct-2026 17:40 · Claude · Piezas publicadas + IMEI por almacén con los filtros nuevos de Dagoberto

## Pedido del dueño
«Publícalo y mira el link que mandó Dagoberto que faltaba» (enlace de `listaarticulos` con `tipo=listaserie`,
`codarticulo=` y `codalmacen=1`). La clave del enlace **no** se copia aquí ni al repo.

## 1. Publicado: piezas del costo como renglones (bit. 2026-10-22-1750)
- `claude/piezas-factura` → `main`, commit `0051d1c`. `taller.html` carga `taller-app.js?v=20261022-p7`.
- Verificado en vivo: el archivo publicado contiene `_piezasCostoHTML` (lápiz y papelera siempre visibles, 36×44 px).

## 2. Diagnóstico del enlace de Dagoberto (probado con curl, clave fuera del repo)
`ListaArticulos?tipo=listaserie` ahora **sí filtra por almacén**:

| `codalmacen` | Series | Localidad que devuelve |
|---|---:|---|
| 1 | 77 | todas «OFICINA SANTIAGO» |
| 6 | 72 | todas «TALLER BAYOL» |
| 4 | 37 | todas «LOCALIDAD MOCA» |

- «CELULAR IPHONE 12 NORMAL»: almacén 1 → 1 IMEI (357504274495225); almacén 6 → 7 IMEI distintos. Antes (sin filtro) solo
  salían las 77 series del almacén 1, por eso la lista «prudente» casi nunca cuadraba.
- `codarticulo=1023` devolvió 0 (ese código no es un celular). Los códigos reales de ese iPhone en `infoplus_articulos` son
  1125 (existencia {6:3}), 1133, 1143 ({6:3, 7:1}), 1988 y 2641. El filtro por artículo quedó **sin confirmar** porque el
  clasificador de seguridad bloqueó volver a sacar la clave del historial (no se intentó rodearlo).

## 3. Edge `infoplus-imei-almacen` → **v8** (desplegada, `verify_jwt` activo)
Archivo: `supabase/functions/infoplus-imei-almacen/index.ts` (rama `claude/listaserie-filtros`, luego `main`).
1. Pide `listaserie&codalmacen=<almacén>&codarticulo=<código>`.
2. Si vuelve vacío, pide `listaserie&codalmacen=<almacén>` y compara la **descripción** de Info Plus del código
   (`infoplus_articulos`), como antes. La respuesta dice `modo: 'codarticulo' | 'descripcion'`.
3. En los dos casos exige que la localidad sea la del almacén pedido (mapa `ALMACENES`).
4. **Lista prudente** (opción B del dueño) ahora compara **solo el almacén pedido**: se muestran los IMEI solo si la cantidad
   de series listadas es igual a la existencia en vivo de ese almacén. Antes comparaba los 7 almacenes con una sola lista
   que solo traía el almacén 1, y por eso daba `no_cuadra`.
   Si no cuadra: `{ imeis: [], prudente: 'no_cuadra', modo, listadas, existencia }` y se escanea o escribe el IMEI.
5. Se quitaron las 6 consultas de existencia por almacén (queda 1). Localidades desconocidas se siguen anotando en
   `infoplus_diagnostico` (máx. una vez cada 10 min).

Sin cambios en el frontend ni en la base.

## Pruebas
- Sintaxis TypeScript sin errores (`tsc`, solo errores TS1xxx). No hay sesión de usuario en esta máquina para llamar a la
  Edge, así que la prueba de punta a punta la hace el dueño: prefacturar un iPhone 12 Normal en el almacén 1 y abrir la
  ventana IMEI; debe salir **solo** 357504274495225. En el almacén 6 deben salir los que haya en existencia (si cuadran).
- Si en la prueba real no sale nada, leer `infoplus_diagnostico` y los logs de la Edge: el campo `modo` dice qué filtro usó.

## Riesgos / pendientes
- Falta confirmar con Dagoberto si `codarticulo` filtra en `listaserie` (si no, la v8 cae sola al modo «descripción»,
  que ya funciona pero puede no cuadrar cuando un mismo nombre tiene varios códigos).
- No se sabe si la localidad de `listaserie` sigue las transferencias entre almacenes; la lista prudente lo cubre.

## Siguiente paso
Prueba real del dueño en la Prefactura; después, si cuadra, cerrar el pendiente de MEMORIA §6.
