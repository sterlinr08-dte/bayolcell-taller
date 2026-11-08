# Punto de equilibrio: los fallos de carga se ven (paso 1 de untangle) (08-nov-2026, 09:50 RD)

## Pedido
El dueño eligió el «Paso 1» de la auditoría `/untangle-codebase` (bitácora `2026-11-08-0915`): que un fallo de lectura se avise, en vez de convertirse en 0 sin decir nada.

## Cambio (`conta-equilibrio.js`, versión `20261108-pe17`)

| Lectura que falla | Antes | Ahora |
|---|---|---|
| Venta del mes anterior | Quedaba en 0 sin aviso: los comunes se repartían en partes iguales y salía el aviso falso «el mes anterior no tiene ventas» | Se marca el error y se avisa: «No se pudo leer la venta de octubre…; reparto provisional en partes iguales». El aviso falso ya no sale |
| Venta por día (`ventas_diarias_vendedor`) | Metas por periodo y de vendedores con 0 vendido, sin aviso | Avisa que no muestran lo vendido |
| Notas de crédito | Solo iba al registro interno | Avisa que falta el detalle de devoluciones; la venta ya viene neta |
| Ventas del mes | Aviso en la lista de abajo | Va en el recuadro nuevo |

- Recuadro rojo «Faltan datos», debajo de la barra de avance, con el botón «Volver a intentar» (44 px de alto), que usa `BayolEquilibrio.recargar()`.
- El reporte del mes (imprimir o PDF) empieza sus conclusiones con «Ojo: …» si faltaron datos.
- **Ningún cálculo cambió:** las cifras son las mismas; solo se avisa cuando faltan datos.

## Pruebas
Playwright a 390 y 1280 px, con el arnés `h6.html` (datos simulados más un interruptor de falla):
- Normal: sin recuadro y sin avisos nuevos. Las cifras son iguales a las de antes.
- Con falla: el recuadro muestra los 3 avisos. Sin el aviso falso del mes anterior. Sin errores de JavaScript.

## Estado
- Rama `claude/equilibrio-errores-visibles`. No publicado: espera el «publícalo».
