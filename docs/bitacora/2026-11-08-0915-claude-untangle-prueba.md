# Skill `/untangle-codebase`: instalación y prueba en el Punto de equilibrio (08-nov-2026, 09:15 RD)

## Pedido
El dueño mandó un reel de @mazeincoding que presenta la skill gratis `/untangle-codebase` (caldoai/skills, MIT). Se revisó y eligió la opción **B**: instalarla y probarla en un solo módulo, **solo con la lista de problemas y sin cambiar nada**.

## Instalación
- `.claude/skills/untangle-codebase/` (SKILL.md + LICENSE) y la entrada correspondiente en `LICENCIAS-TERCEROS.md`.
- Son solo instrucciones; sin programas.

## Prueba: `conta-equilibrio.js` (y su relación con `conta-ventas.js`)
Auditoría de solo lectura. **No se cambió código.**
- Unos 52 problemas: 20 vínculos ocultos, 3 vínculos innecesarios, 12 sobrantes y 17 casos especiales.
- Diez correcciones propuestas. Siete tocan dinero o cálculos y requieren auditar antes de cambiarlas.

| # | Corrección | Riesgo | ¿Dinero? |
|---|---|---|---|
| C1 | Que un fallo de carga se vea, en vez de quedar en 0 en silencio. Si falla la venta del mes anterior (`:243`) los comunes se reparten en partes iguales y sale el aviso falso «el mes anterior no tiene ventas». Si falla `ventas_diarias_vendedor` (`:266`), las metas salen con 0 vendido sin aviso. | bajo | sí |
| C2 | Un solo calendario de días hábiles. Hoy está en `contarDias`, `diasRango` y `quincenaVista`, y la fórmula «días que quedan» está copiada 5 veces. La General mezcla lunes a sábado con días de tienda. | medio | sí |
| C3 | Préstamos como única fuente de intereses y capital. Hoy la fila de intereses se busca por el texto «préstamo» (`:105`) y hay dos fuentes de capital sincronizadas a mano. | medio-alto | sí |
| C4 | Clave fija para Nómina, TSS y regalía. Hoy `sugerirNomina` depende de que el texto empiece igual (`:371-375`). | medio | sí |
| C5 | Una base común (tiendas, mes, formato, permisos) para Equilibrio y Ventas. Hoy la lista de tiendas está copiada y los dos módulos dependen uno del otro. | bajo | no |
| C6 | Periodos de meta como datos y no como texto que se vuelve a leer. | bajo-medio | presentación |
| C7 | Una sola regla para leer números e ITBIS. Hoy `num()` (`:40`) convierte «-500» en 500 sin aviso y el factor del ITBIS está copiado 3 veces. | bajo | sí |
| C8 | Integración declarada con `contaTab`: reintento infinito cada 300 ms y nombre `__ninguna__`. Toca `taller-app.js`, así que la decide el dueño. | medio | no |
| C9 | Códigos de vendedores de Info Plus como datos, no escritos en el código. | bajo | metas |
| C10 | Limpieza: `fISO` sin uso, input `pe_mes` sin lectura, CSS muerto y repetido, `setTimeout` innecesarios. | bajo | no |

- Hallazgos verificados a mano en el código: `:40` `num()`, `:243` venta del mes anterior y `:264-266` ventas diarias.

## Recomendación
Orden propuesto: C1, luego C2 (con comparación de cifras antes y después en un mes abierto y en uno cerrado) y luego C5. C3 solo después de revisar las filas reales de `conta_equilibrio.variables`.

## Estado
- Rama `claude/skill-untangle`. No publicado. Nada se cambia sin el OK del dueño.
