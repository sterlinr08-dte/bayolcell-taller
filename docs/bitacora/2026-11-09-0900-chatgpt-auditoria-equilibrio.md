# Auditoría del punto de equilibrio — 09-nov-2026, 09:00 RD

## Pedido
Auditar y analizar el punto de equilibrio del taller Bayol Cell. Revisión de lectura; sin cambios en producción, datos, cálculos o envíos.

## Fuentes y alcance
- Memorias, REGLAMENTOS y bitácoras de Contabilidad del 6 al 8 de noviembre, incluida la decisión de usar cuota total de préstamos.
- `conta-equilibrio.js` y `conta-base.js` de main.
- Consultas SELECT al proyecto BayolCell-taller: configuración de equilibrio, ventas copiadas de Info Plus, categorías, notas de crédito, nómina agregada y definiciones de RPC.
- Octubre como último mes completo con gastos guardados; noviembre parcial, con ventas registradas hasta el día 7 al consultar. El módulo incluye las tres tiendas y todas las categorías, no exclusivamente reparaciones.
- Los importes financieros detallados se entregaron al dueño por chat; no se añaden aquí nuevas cifras operativas extraídas de la base, dado que este repositorio es público.

## Hallazgos
1. La fórmula reproduce correctamente los datos de entrada. Eso no certifica la calidad de esos datos ni la ganancia neta.
2. Solo hay configuración guardada para octubre. Noviembre sin gastos produce contribución positiva y equilibrio indefinido; no debe interpretarse como utilidad neta.
3. Nómina mensual de equilibrio y salarios de empleados activos de RRHH tienen una diferencia material, superior al déficit calculado de octubre. Confirmar período, alcance y conceptos antes de corregir.
4. Cuota completa de préstamos sigue en gastos comunes. El dueño ya confirmó capital más intereses el 8-nov; el desglose queda pendiente. El resultado mezcla utilidad y salidas de caja. Tampoco es una conciliación de caja real: faltan cobros, pagos y capital de trabajo.
5. Comisiones guardadas en pesos en Moca y Navarrete conviven con un porcentaje variable de comisión. Posible duplicación, a conciliar; no se eliminó ninguna partida.
6. Revisar clasificación del ITBIS pagado, repuestos y provisiones. Piezas ya incluidas en costo no deben cargarse de nuevo; no se presupone que lo estén.
7. La categoría TALLER tiene muchas líneas con costo cero: puede ser mano de obra con costo en nómina, pero impide tratar su margen bruto como ganancia de reparaciones sin asignar técnicos, piezas y gastos comunes.
8. Doble resta de notas de crédito: corregida en main. La RPC resta CN una vez y el JS solo muestra su aviso.

## Verificación
- Ejecución del archivo real `conta-equilibrio.js` en un entorno JS con DOM mínimo y fecha controlada; `BayolEquilibrio._estado()` se llenó con una copia de los agregados consultados.
- Octubre: equilibrio y resultado de las tres tiendas coinciden con un cálculo independiente, diferencias inferiores a 0.000001 pesos.
- General: margen combinado ponderado y total de gastos reproducidos.
- Noviembre sin configuración: se comprobó equilibrio nulo y gastos faltantes. No es prueba de interfaz ni conciliación contra documentos originales de Info Plus.
- Consultas a producción solo de lectura. No se revisaron movimientos bancarios ni soportes externos; `conta_movimientos` no devuelve registros desde agosto en la consulta realizada.

## Siguiente paso
Conciliar nómina; obtener desglose de préstamos; clasificar impuestos y comisiones; completar noviembre con gastos confirmados. Después recalcular equilibrio operativo y cobertura de caja por separado. La auditoría no autoriza cambios de datos ni publicación.

## Entrega
Rama `codex/auditoria-equilibrio-20261109`; propuesta documental de revisión, sin fusionar a main. Memorias existentes sin modificaciones para no convertir cifras provisionales en estado confirmado.
