# 2026-10-20 23:00 · Claude · Consulta: capacidad o «aviso» junto al nombre y total en Existencia; seriales al día

## Pedido del dueño
El dueño mandó una captura de la Consulta con «14 PRO MAX 256»:
1. «A los artículos les faltan detalles; no dicen si son de 128 y si son con aviso.»
2. «En Existencia debe salir el total y, si no hay, Sin stock.»

## Diagnóstico
Info Plus guarda ese dato en el campo **`referencia`**, por ejemplo:
- 2637 «CELULAR IPHONE 14 PRO MAX» tiene referencia «256GB»;
- 2726 «… 256GB» tiene referencia «AVISO»;
- 1952 «IPHONE XR» tiene referencia «64GB».

Ninguna pantalla mostraba ese campo.

## Cambios
- **`crm-consulta-precio.js` y `.css` (g1)**
  - Junto al nombre sale la referencia como etiqueta gris, por ejemplo «256GB». Si es «AVISO», sale en naranja como «Con aviso».
  - Si la descripción ya contiene la referencia, no se repite.
  - La columna «Existencia» muestra el **total** de todos los almacenes, por ejemplo «216». Si es cero, dice «Sin stock».
- **`taller-recepcion.js` y `.css` (g1)**: el buscador de la Prefactura muestra la misma etiqueta de referencia.

## Seriales automáticos (bitácora de las 22:40)
La puesta al día de las 19:00 UTC ya corrió y se borró sola:
- `infoplus_seriales` pasó de 1,637 a 2,050 IMEI;
- las compras quedan al día hasta el 19-oct-2026.

## Pruebas
- `crmprecio` 21/21: el total «216» sale en la fila y «Con aviso» en 2155.
- `pfvent` 8/8 y `pftest` 49/49.

## Estado
Rama `claude/prefactura-limpia`, **sin publicar**.
