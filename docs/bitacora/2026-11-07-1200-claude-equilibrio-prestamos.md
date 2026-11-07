# Punto de equilibrio: cuota completa del préstamo (07-nov-2026)

**Pedido del dueño:** «Para cubrir también el capital: cuánto vender para que le alcance el efectivo para pagar la cuota completa del préstamo», y luego «Sí, haz las mejoras».

**Rama:** `claude/conta-correcciones`. Todavía no está publicado; falta el «publícalo».

## Qué cambió (`conta-equilibrio.js`, `?v=20261107-pe6`)

1. **Lista de préstamos** en «Gastos comunes».
   - Cada préstamo es un renglón con banco, intereses y capital. Hay botón «Agregar préstamo» y una × para quitar.
   - Abajo se ven los totales: intereses, capital y cuota del mes.
   - Se guarda en `conta_equilibrio.variables.prestamos` (jsonb de la fila 0). No hace falta migración.
2. **Intereses sin contarlos dos veces.**
   - La fila de gastos que menciona «préstamo» pasa a llamarse «Intereses de préstamos». Ahí está incluida la vieja «Préstamos (cuota del mes)» de octubre.
   - Esa fila se llena sola con la suma de los intereses, queda bloqueada y muestra un candado.
   - Si no existe, se crea.
3. **«Para pagar también la cuota del préstamo»** aparece en General y en cada tienda. Muestra:
   - la venta necesaria: `(gastos fijos + capital) / contribución`;
   - cuánto falta;
   - cuánto hay que vender por cada día que queda.
4. **Parte de cada tienda.** El capital se reparte igual que los gastos comunes (`partePct`).
5. **Compatibilidad.** Si no hay lista, se usa el capital suelto que ya existía (`variables.capital`). El primer préstamo que se agrega se lleva ese capital y los intereses que ya estaban escritos.

## Pruebas
Simulador con Playwright, con datos de prueba:
- Intereses 25,000 y capital 75,000. Venta neta: Santiago 60,000, Moca 300,000 y Navarrete 900,000.
- **General:** `(25,000 + 75,000) / 29.83 % = 335,195.53`. Coincide.
- **Por tienda:** cada una da `(ft + capital × parte) / mc`. Coincide.
- **Santiago:** le faltan 51,731.84 en 20 días hábiles, o sea 2,586.59 por día. Coincide.
- **Tamaños:** a 390 px y a 1280 px no hay controles de menos de 44 px. Los campos miden 48 px con letra de 16 px. No hay desplazamiento hacia los lados.

## Pendiente
- Publicar con el OK del dueño. Este JS se puede publicar sin la migración de permisos, que sigue pendiente.
