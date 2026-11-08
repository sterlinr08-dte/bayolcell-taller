# Contabilidad: base común `conta-base.js` (paso 3 de untangle) (08-nov-2026, 11:45 RD)

## Cambio
- **Nuevo `conta-base.js`** (`window.BayolConta`), cargado antes que Ventas y Equilibrio en `taller.html`. Reúne en un solo lugar:
  - la lista de tiendas (con la marca de domingo), más «Santiago, Moca y Navarrete» y «las tres tiendas» sacados de esa lista;
  - `esc`, `plata`, `pct`, `sb`, `puede`;
  - las cuentas de meses: `sumarMes`, `mesAnterior`, `periodo`;
  - la animación de entrada (`animar`).
- **`conta-ventas.js` (rv4) y `conta-equilibrio.js` (pe19)** usan la base y ya no se copian entre sí:
  - Se quitó la dependencia circular: Ventas ya no usa `BayolEquilibrio._anim`.
  - Equilibrio ya no entra en las tripas de Ventas: «Actualizar» usa el nuevo `BayolVentas.olvidar()` en vez de `_estado().cache = {}`.
  - `copiarMesAnterior` usa `mesAnterior` en vez de calcular el mes a mano.
  - El reporte y la ayuda sacan los nombres de las tiendas de la lista, en vez de tenerlos escritos.
- **Sin cambio de cifras.**

## Pruebas (Playwright, arnés `h8.html` con datos simulados)
Foto de todo lo que se ve:
- 7 fechas simuladas × 3 meses (octubre, noviembre y diciembre);
- pestañas General, Santiago, Moca, Navarrete, Ventas y Gastos comunes;
- las 2 quincenas de vendedores, más `calcular()`.

| Comparación | Resultado |
|---|---|
| Antes del paso 3 (`pe18`) → después (`pe19`) | **273 comparaciones, 0 diferencias** |
| Reporte del mes (HTML), 3 fechas | idéntico |
| Errores de JavaScript | ninguno |

### Revisión extra del paso 2, ya publicado
La prueba del paso 2 (bitácora `2026-11-08-1040`) solo recorría en pantalla General y Santiago; Moca, Navarrete y Ventas solo se comparaban por `calcular()`. Se repitió con todas las pestañas, de `pe17` a `pe18`:
- 273 comparaciones;
- las únicas diferencias son las del cambio que pidió el dueño (General, «debe vender por día» con domingos: 42 casos, la misma línea);
- nada más cambió.

## Estado
- Rama `claude/conta-base`. No publicado: espera el «publícalo».
- Siguientes correcciones de la auditoría, en espera: C3 préstamos (antes hay que revisar los datos guardados), C4 claves de gastos, C6 periodos como datos, C7 lectura de números, C9 códigos de vendedores y C10 limpieza.
