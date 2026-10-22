# 2026-10-22 10:40 · Claude · IMEI: ¿se puede separar listaserie por almacén? No

**Pedido del dueño:** «primero prueba si lo puedes separar por almacén» y «el API lo tiene separado».

## Prueba (Edge v4, 14:32 UTC; solo GET)
Se probaron 21 variantes de `ListaArticulos?tipo=listaserie&…`:
- `codalmacen`, `Codalmacen`, `CodAlmacen`, `almacen`, `localidad`, `codlocalidad`, `CodLocalidad` e `idalmacen`, cada uno con 1 y con 6;
- `CodArticulo`, `codarticulo` con `codalmacen`, `articulo`;
- `localidad=OFICINA SANTIAGO`.

**Las 21 devolvieron 200 y exactamente las mismas 77 series.** Info Plus ignora cualquier filtro en `listaserie`.

## Evidencia del dueño (capturas 10:33)
Artículo 1906 «CELULAR IPHONE 13 PRO MAX».

| Fuente | Series |
|---|---|
| Factura de InfoplusWEB, buscador de Serial (Oficina Santiago) | **2** «Disponible Ok»: 354941737612785 y 355387490776525 |
| `listaserie`, ventana IMEI del taller (todas marcadas «OFICINA SANTIAGO») | **4**: las 2 de arriba + 354798781661047 y 357447884037872 |

**Conclusión:** Info Plus sí sabe qué series están en cada almacén (su pantalla de Factura las filtra bien), pero `listaserie` da en `localidad` otro dato, probablemente la localidad donde entró la serie, que no cambia con las transferencias. Con esta API el taller no puede separarlas.

## Estado
- Edge v5 desplegada: sin la prueba de filtros; queda igual que la v3.
- Hace falta que Dagoberto diga qué ruta o parámetro da las series **disponibles por almacén**, la misma consulta del buscador de Serial de la Factura.
- Pendiente de decisión del dueño: mientras tanto, ¿se deja la lista con aviso o se apaga?
