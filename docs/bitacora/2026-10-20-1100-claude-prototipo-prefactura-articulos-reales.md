# 2026-10-20 11:00 — Claude — Prototipo HTML de la Prefactura con artículos reales

Sigue a `2026-10-20-0945-claude-minimo-api-solo-escritura.md`.

## Dueño
«Enséñame en HTML cómo va quedando» → PC compacta con artículos en una sola fila → mínimo solo al consultar el artículo
(«Mínimo: $») y solo color rojo en la línea → «Entra a STUDIO y consulta el modo de prefactura» → «Consulta un artículo o varios».

## Qué se hizo
- Prototipo aparte (no toca el sistema): artifact «Prefactura Bayol Cell» (privado del dueño).
- Buscador igual que STUDIO (`parches-pos.js` `nxProdPick` MODO LISTA, `ppkDetailHTML`): panel en línea con Cerrar,
  columnas Código · Artículo · Existencia · Precio · «+»; al tocar la fila, recuadros Contado · Crédito · Mínimo,
  existencia por almacén y «Elegir — RD$ …».
- Clic en el nombre de una línea: tabla de precios por nivel (1, 2, 3); clic en un precio lo usa.
- Línea bajo el mínimo: solo color rojo; al guardar pide clave de administrador.

## Consulta de solo lectura (Supabase `infoplus_articulos`, copia del 20-oct 00:30)
- `niveles` trae **un solo precio por nivel (contado)**, niveles 1, 2 y 3; algunos artículos solo tienen nivel 1.
- `existencias` por almacén: 1 Oficina Santiago, 3 Garantía China, 4 Moca, 5 2do Nivel, 6 Taller, 7 Navarrete.
- No hay crédito ni mínimo (confirma la bitácora 0945). En el prototipo se ven «—»; el botón «Ejemplo con mínimo» los inventa
  (crédito = contado × 1.1, mínimo = contado × 0.9) solo para probar la pantalla.
- El servicio real es el código **1121 «SERVICIO TECNICO»** (RD$ 300). Ojo: el 3001 real es «CELULAR IPHONE 17 PRO MAX»
  (el banco de pruebas lo usaba como servicio).

No se escribió nada en Info Plus ni en la base. Nada publicado.

## Siguiente paso
Que el dueño termine de ajustar el prototipo; luego pasarlo a `taller-prefactura.js/.css` en `claude/prefactura-limpia`.
