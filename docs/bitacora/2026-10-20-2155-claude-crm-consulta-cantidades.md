# 2026-10-20 21:55 · Claude · CRM «Consulta»: cantidades por almacén

## Pedido del dueño
«Pero no salen las cantidades.» Esto corrige la decisión anterior de mostrar los almacenes sin cantidades.

## Cambio (`crm-consulta-precio.js` y `.css`, versión 20261020-e2)
- **En cada fila:** las píldoras muestran almacén y cantidad, por ejemplo «Santiago **160**», «Moca **32**».
- **Al tocar el artículo:** el detalle muestra las mismas píldoras y una píldora oscura con el **Total**, por ejemplo «Total **216**».
- **De dónde salen los números:** son las mismas existencias de Info Plus que usa la Prefactura (`cache.infoplusArticulos`), que se actualizan cada 30 minutos.

## Pruebas
`crmprecio` 21/21. El detalle espera «Santiago 160, Moca 32, Navarrete 18, Taller 2, Garantía China 4, Total 216».

## Estado
Rama `claude/prefactura-limpia`, sin publicar.
