# Códigos de empleado en Info Plus: guardados y búsqueda en las ventas — Claude (19-oct-2026)

## Pedido del dueño
«Publícalo, Michelle 748 y Kenifer 1020, búscalo en el sistema de InfoPlus.»

## Hecho
- **Publicado:** `claude/bayol-vendedor` pasó a `main` (`f2aa6d2`, avance directo). bayolcell.com sirve `taller-app.js?v=20261019-vd1`.
- **Datos guardados** con la autorización escrita del dueño, en `tecnicos.infoplus_codempleado`:
  - MICHELLE FELIPE BAEZ (servicio, Santiago) = **748**;
  - kenifer perez (servicio, Moca) = **1020**.
  - Se hizo con un `update … returning` sobre esas 2 filas; no se tocó nada más.

## Búsqueda en Info Plus (solo lectura)
El endpoint `vendedor` sigue sin permiso, así que se buscó en `infoplus_ventas`, que tiene `codempleado` y `codlocalidad` y se sincroniza desde Info Plus. Facturas de los últimos 120 días:

| codempleado | Localidad | Facturas | Desde → hasta | Lectura |
|---|---|---|---|---|
| 697 | 1 Santiago | 3 261 | 22-jun → 17-oct | Mayorista |
| 748 | 1 Santiago | 1 017 | 22-jun → 17-oct | Michelle ✔ |
| 1020 | 4 Moca | 714 | 22-jun → 17-oct | Kenifer ✔ |
| **1192** | **7** | **370** | **24-ago → 18-oct** | **probablemente Yosmeiry (Navarrete)** |
| 6 | 7 / 1 / 4 | 115 / 3 / 2 | — | Esterlin |
| 249 | 1 / 4 | 121 / 10 | — | sin identificar |
| 750 | 1 / 7 / 4 | 29 / 1 / 3 | — | sin identificar |

## Hallazgo: localidad 7 (probablemente Navarrete, abierta el 24-ago)
- El taller **no conoce la localidad 7**:
  - `INFOPLUS_ALMACENES` y `PREF_ALMACENES` solo tienen 1, 3, 4, 5 y 6;
  - `infoplus-existencia-art` solo consulta los almacenes [1, 3, 4, 5, 6].
- Por eso, desde Navarrete no se puede elegir su almacén al prefacturar, ni ver su existencia.

## Falta (confirmación del dueño)
1. ¿La localidad 7 de Info Plus es Navarrete? ¿El código 1192 es Yosmeiry?
2. Si lo es:
   - guardar 1192 en Yosmeiry;
   - agregar la localidad 7 a las listas del taller;
   - agregarla a la consulta de existencia en vivo; ese cambio es en la función del servidor y se despliega aparte;
   - opcional: que el almacén por defecto de la prefactura sea el de la sucursal de la empleada (Moca → 4, Navarrete → 7).
3. ¿De quién son los códigos 249 y 750?
4. Una empleada hace una prefactura de prueba y el dueño confirma en Info Plus que sale con su código.
