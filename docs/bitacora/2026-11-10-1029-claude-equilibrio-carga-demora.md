# Claude · Punto de equilibrio y metas de vendedores: carga que no parpadea (sin publicar)

## Pedido del dueño
Tras ver el reel de Moxen «Carga que no parpadea» (`DffkNoXh1-f`): «Aplícalo en punto de equilibrio y donde está la parte de fijarle meta a los vendedores» (10-nov-2026).

## Diagnóstico
«Meta por vendedor» vive dentro de Punto de equilibrio (`conta-equilibrio.js`) y las dos partes comparten una sola carga (`cargar()`): 5 lecturas seguidas (gastos guardados, ventas del mes y del anterior, notas de crédito, venta por día y vendedor, facturas por tienda). Antes: «Cargando ventas de Info Plus…» salía al instante y borraba la pantalla, aunque la respuesta llegara rápido.

## Qué se hizo (`conta-equilibrio.js`, pe29)
| Tiempo | Antes | Ahora |
|---|---|---|
| Menos de 0,3 s | Parpadeo de «Cargando…» | No se enseña nada; cambia directo al dato nuevo |
| Desde 0,3 s | Texto «Cargando…» | Esqueleto gris con la forma de la pantalla; dura al menos 0,5 s |
| A los 4 s | Igual | «Sigue tardando…» + botón **Cancelar** (arriba, a la vista) |
| A los 15 s | Se quedaba cargando | Se corta: «No cargó en 15 segundos.» + **Reintentar** |

- Solo cambia cómo se muestra la espera. No toca cálculos, metas, guardado, base ni Info Plus.
- Lo cancelado o cortado nunca pinta datos después (se invalida con el mismo `st.token` de siempre).
- Respeta «reducir movimiento». Botones de 44 px o más.
- Apagar en un equipo: `localStorage.bc_pe_demora_off='1'` (vuelve el «Cargando…» de antes).

## Archivos
- `conta-equilibrio.js`, `taller.html` (versión `20261110-pe29`).
- Nueva prueba: `scripts/pruebas/equilibrio-demora.cjs`.

## Pruebas (banco local, datos inventados, 390 y 1280 px)
`equilibrio-demora.cjs`: **Todo bien** (32 comprobaciones): rápida sin esqueleto; media con esqueleto desde 0,3 s y mínimo 0,5 s; lenta con aviso a los 4 s; Cancelar; lo cancelado no pinta; corte a los 15 s; Reintentar; capa apagada; botones ≥ 44 px; sin desplazamiento horizontal; sin errores de JavaScript.
No probado: datos reales ni iPhone real.

## Estado
Rama `claude/carga-demora`, sin publicar. Falta el OK del dueño.

## Siguiente paso
Si lo aprueba: PR a `main`, verificar en vivo y bitácora de publicación. Luego se puede llevar el mismo patrón a otras pantallas.
