# 2026-10-15 16:00 — Claude — Meta Ads: error #1870194 de ubicación corregido en los 5 conjuntos activos

## Pedido del dueño
- Mandó captura del Administrador de anuncios con el error «Tu público contiene una opción de segmentación por lugar que se eliminó… (#1870194)» en el conjunto «SANTIAGO - CL» (11 anuncios).
- Pidió corregirlo y una recomendación «para tener buen resultado en mi zona».
- Aprobó con «sí, hazlo».

## Diagnóstico
- Cuenta 988971888850978 (la que no figura a nombre del negocio BayolCell), vía conector Meta Ads.
- 5 conjuntos activos tenían `location_types` = `["frequently_in","home"]` (la combinación que Meta retiró). El de Navarrete tenía el tipo bien, pero ningún radio.

## Cambios (se tocó solo `targeting.geo_locations`; presupuesto, anuncios, edades, ubicaciones de anuncio y Advantage+ iguales)

| Conjunto | Antes | Después |
|---|---|---|
| SANTIAGO - CL | Santiago de los Caballeros a 21 km | 20 km |
| SANTIAGO (Reparaciones Santiago Imagen) | Toda la provincia | Ciudad de Santiago a 20 km |
| VENTAS Y FINANCIAMIENTO MOCA | Moca a 17 km | Igual |
| "REPARACION MOCA" | Moca a 17 km | Igual |
| Interacción Navarrete | Villa Bisonó, solo el pueblo | Villa Bisonó a 17 km |

- **Tipo de ubicación:** `home` + `recent`. Meta lo guarda como `["frequently_in","home","recent"]`, que es el tipo estándar vigente.
- 15 km no es posible: Meta exige un mínimo de 17 km alrededor de una ciudad (error 1487110). Moca y Navarrete quedan en 17 km.
- **Reactivación:** al editarlos, Meta pausó solos 4 conjuntos (`status_forced_to_paused`). Se reactivaron de inmediato.
- **Verificado al releer:**
  - los 5 están ACTIVE;
  - «REPARACION MOCA» y Navarrete aparecen IN_PROCESS (revisión de Meta);
  - radios y tipo de ubicación correctos.

## Pendiente del dueño
- En el Administrador de anuncios, tocar «Descartar borrador» en «SANTIAGO - CL». Su borrador tenía +80 km y el tipo viejo; si lo publica, vuelve el error.
- Decidir si se deja un solo conjunto de Santiago. Los 2 activos le llegan a la misma gente y compiten entre sí. No se tocó.
