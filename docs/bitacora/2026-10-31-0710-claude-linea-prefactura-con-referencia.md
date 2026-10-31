# 2026-10-31 07:10 — Claude — La línea de la prefactura lleva la referencia de Info Plus

## Dueño
«Cuando se trae un artículo de consulta faltan más detalles, por ejemplo en la descripción y referencia… celulares con aviso de
128 GB… housing que vienen vacío.» Pidió consultar qué trae la API. Eligió la **opción A**.

## Diagnóstico (API + base, solo lectura)
- `ListaArticulos?CodArticulo&Codalmacen` (la ruta de `infoplus-sync`) trae 15 datos: codigo, referencia, referenciafabrica,
  descripcion, cantidad, precio, precioespecial, fechas de oferta, fechacreacion, costo, categoria, subcategoria, marca, localidad.
- Guardamos descripcion, referencia, referencia_fabrica, marca, precios y existencias. **No** guardamos categoria ni subcategoria.
- En `infoplus_articulos` (2,135): 1,955 tienen referencia (22 son «AVISO»), 1,708 marca, **0** referencia de fábrica (Info Plus la manda vacía).
- La referencia **sí** salía en el buscador (`pkRef`) pero **se perdía al agregar**: `_rpAgregarArticulo` y `_prefAgregar` usaban solo
  `descripcion`. Por eso la línea, el ticket, el WhatsApp y la prefactura de Info Plus decían «CELULAR IPHONE 14 NORMAL» sin «128GB».

## Cambio
- `taller-app.js`: nueva `_ipDescCompleta(a)` = descripción + « · » + referencia («AVISO» → «Con aviso»; espacios limpios; tope 100
  letras como pide Info Plus). No repite si **todas las palabras** de la referencia ya están en la descripción
  («HOUSING 8G PLUS BLANCO» dentro de «HOUSING IPHONE 8G PLUS BLANCO COMPLETO»). La usan `_rpAgregarArticulo` (Prefactura) y
  `_prefAgregar` (prefactura desde Órdenes).
- `taller-app.min.js` regenerado (`scripts/minificar.sh`); `taller.html` → `?v=20261031-o5`.

## Pruebas
- Nueva `scripts/pruebas/prefactura-linea-referencia.cjs`: 20/20 a 390 y 1280 (128GB, Con aviso, VACIO, referencia contenida,
  sin referencia, pantalla, texto a Info Plus, tope 100, sin errores JS).
- Regresión: `prefactura-boton-precio`, `prefactura-delivery`, `prefactura-confiable`: todo bien.

## Qué hace solo
| Acción | Qué pasa |
|---|---|
| Agregar un artículo con referencia | La línea sale completa: «CELULAR IPHONE 14 NORMAL · 128GB» |
| Referencia «AVISO» | Se lee «Con aviso» |
| Referencia ya dicha en la descripción | No se repite |
| Guardar | El mismo texto va al ticket, al WhatsApp y a Info Plus |

## Pendiente / idea
Opción B (guardar categoria y subcategoria para las fichas del buscador) queda para cuando el dueño la pida.

## Estado
Rama `claude/linea-con-referencia`, sin publicar. Falta el «Publícalo» del dueño.
