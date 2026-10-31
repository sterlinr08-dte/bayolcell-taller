# 2026-10-31 05:30 — Claude — Prueba de solo lectura: CxC, historial del cliente y clientes nuevos

Sigue a `2026-10-31-0500-claude-api-infoplus-mapa-completo.md`. El dueño eligió probar: «Cuenta por cobrar, Ficha del cliente, Traer solo los nuevos clientes».

## Cómo
Función temporal `infoplus-prueba-cxc-20261031` (v1 y v2; **retirada en v3 → 410**). Solo GET con la clave del Vault; devolvió
nombres de campos, cantidad de filas y el formato de la fecha. Nunca devolvió la clave ni datos de clientes. No se escribió nada.

## Resultado
| Ruta | Respuesta de Info Plus |
|---|---|
| `CxC` (sin fechas, con fechas ISO y m/d/a) | **«Error en las credenciales»** — cerrada a nuestra clave |
| `DocumentosCliente?fechas` (historial) | **«Error en las credenciales»** — cerrada |
| `Ingreso?fechas` (cobros) | «Error en las credenciales» — cerrada |
| `MetodoPago` | «Error en las credenciales» — cerrada |
| `Cliente?fechacreacion=` (ISO, d/m/a, m/d/a, aaaammdd, con hora, fecha futura 2030) | 200, pero **siempre las 1,134 filas**: el filtro se ignora |
| `Cliente?codigocrm=1` | 200, las mismas 1,134 filas: también se ignora |

- Formato de fechas con dos parámetros: `d/m/a` da 400 («null entry for parameter fechafinal»); ISO y `m/d/a` se aceptan.
- `fechacreacion` viene como `AAAA-MM-DD`; clientes desde 2017-03-29 hasta 2026-10-24. El 19-oct eran 1,133; hoy 1,134.

## Conclusión
De las tres cosas que pidió el dueño, **ninguna** la da la API hoy: CxC e historial están cerradas a la clave, y «solo los nuevos»
no filtra en el servidor. Lo único posible sin Dagoberto: filtrar los nuevos **en nuestro lado** (bajar los 1,134 y quedarse con
`fechacreacion` ≥ la última sincronización), que es lo que `infoplus-clientes` ya puede hacer con un cambio pequeño.

## Siguiente paso
Pedirle a Dagoberto que abra `CxC`, `DocumentosCliente`, `Ingreso`, `MetodoPago` (y `Vendedor`) para nuestra clave, y que
`Cliente?fechacreacion` filtre. Mensaje preparado en el chat para que el dueño lo mande.
