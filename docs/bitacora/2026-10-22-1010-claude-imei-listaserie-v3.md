# 2026-10-22 10:10 · Claude · IMEI por almacén v3: `listaserie` funciona; se compara por nombre

Sigue a `2026-10-22-2000-claude-imei-listaserie.md`. (La hora 20:00 de esa entrada estaba mal puesta: se escribió en la mañana del 22-oct.)

## Prueba real del dueño (10:02 RD, artículo 1169 «CELULAR IPHONE 8G PLUS», Oficina Santiago)
- `ListaArticulos?tipo=listaserie` → **200 OK**, 69 series. Cada registro trae solo `{ descripcion, serie, localidad }`, por ejemplo `«CELULAR IPHONE  8G PLUS» · 356710082656780 · «OFICINA SANTIAGO»`.
- Info Plus **ignora** `CodArticulo`/`Codalmacen` y devuelve todo. La v2 no mostraba nada porque buscaba códigos.

## Cambio (Edge `infoplus-imei-almacen` v3, desplegada, `verify_jwt` activo)
- Se usa solo `tipo=listaserie`; se quitaron las rutas de prueba viejas.
- **Artículo:** la descripción del código en `infoplus_articulos`, comparada sin mayúsculas, acentos ni espacios dobles.
- **Almacén:** el nombre de la localidad, comparado con un mapa: 1 Oficina Santiago, 3 Garantía China, 4 Moca, 5 2do Nivel, 6 Taller, 7 Navarrete (sin «Localidad»/«Almacén»).
- Una localidad que no está en el mapa **no se muestra**. Se anota en `infoplus_diagnostico` (`ruta='listaserie'`, como mucho una vez cada 10 min) para agregarla.
- Las series se dejan tal cual vienen; hay alguna de 16 dígitos con 0 delante.

## Riesgos y pendientes
- Si dos códigos tienen la misma descripción exacta, salen los IMEI de ambos. Es el mismo modelo, así que se acepta.
- En `infoplus_articulos`, el 1169 dice 1 en Oficina Santiago y 1 en Taller, pero `listaserie` pone 2 series en Oficina Santiago. Puede ser que la copia local de existencias esté vieja; hay que confirmarlo con el dueño.
- Falta que el dueño recargue la página y repita la prueba.
