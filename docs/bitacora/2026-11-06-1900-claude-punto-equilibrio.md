# 6-nov-2026 · Claude · Contabilidad: «Punto de equilibrio» por tienda y General (PUBLICADO)

## Pedido del dueño
«En contabilidad vamos a poner puntos de equilibrio por tienda, donde vamos a poner manual todo lo que necesita para determinar el punto de equilibrio con ayuda de los agentes, y después todas las tiendas para ver en general.» Luego: «Publícalo».

## Hecho (5 agentes: mapa del código, datos/base, contador, prueba, revisión)
- **Capa nueva `conta-equilibrio.js`** (se carga después de `taller-app.min.js`; no toca `taller-app.js`). Envuelve `contaTab()` y agrega el botón «Punto de equilibrio» junto a «Estado Mensual». API `window.BayolEquilibrio`. Apagar: `localStorage.bc_pe_off='1'`.
- Pestañas: General · Santiago (1) · Moca (4) · Navarrete (7) · Gastos comunes.
- Por tienda: gastos fijos a mano (10 conceptos ya escritos, se pueden agregar/quitar), botón «Calcular TSS y provisión» (16.29 % y 13.2 % de la nómina), gastos variables % (comisión 1, tarjeta 1.5, garantías 1), días hábiles (Navarrete cuenta domingos).
- Comunes: contadora, Info Plus, Hexnode, Zernio, hosting, publicidad, préstamos, seguros, sueldo de administración; reparto según venta / partes iguales / % manual (debe sumar 100 %); casilla «las ventas incluyen ITBIS» (venta ÷ 1.18).
- Ventas y costo: RPC `estado_mensual_cat(ini, fin exclusivo, localidad)`.
- Cálculo: MB = (VN−costo)/VN; MC = MB − variables; PE = (fijos propios + parte de comunes)/MC; diario; falta; venta diaria necesaria (hoy cuenta como día que queda); proyección; resultado. General con margen combinado. Mes pasado = resultado del mes; mes futuro = sin resultado.
- **Tabla nueva `conta_equilibrio`** (APLICADA): una fila por mes + tienda (0 = comunes), jsonb de gastos/variables, reparto, ITBIS. RLS `app_puede_contabilidad()` (igual que `conta_movimientos`), sin anon, sin TRUNCATE. Migración `supabase/migrations/20261106000000_conta_equilibrio.sql`.
- Quién lo ve: admin, dueño o permiso `contabilidad_ver` (mismo criterio que la base).

## Pruebas
- Copia local con Supabase simulado: 8/8 OK (pestañas, cálculo a mano = `calcular()`: Santiago oct con gastos de prueba RD$885,850.02, General cuadra, ITBIS, reparto manual 100 %, guardado de 4 filas, medidas ≥44 px / campos 48 px y letra 16 px a 390 y 1280 sin desborde, sin errores).
- Revisión de código: 15 hallazgos; corregidos los de cálculo (mes en blanco, días, mes futuro/pasado, respuestas cruzadas al cambiar de mes), no perder lo escrito al cambiar de pestaña, pestaña en blanco sin permiso, textos.

## Pendiente
- Que el dueño anote los gastos reales de noviembre.
- Confirmar con la contadora si la venta de Info Plus incluye ITBIS (cambia mucho el resultado).
- «Estado Mensual» todavía no tiene Navarrete en su selector.
