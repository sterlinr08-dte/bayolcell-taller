# 07-nov-2026 · Auditoría de diseño del Punto de equilibrio con 4 agentes (solo lectura, sin cambios)

## Pedido del dueño
«No hagas nada, audita con 4 agentes de diseño el módulo de Punto de equilibrio, la interfaz y los botones». Luego: «Déjalo anotado».

## Cómo se hizo
- Versión revisada: `main` 8d4c18c (`conta-equilibrio.js?v=20261107-pe8`, `conta-ventas.js?v=20261107-rv2`).
- Copia del módulo de solo lectura con los gastos de octubre 2026 que guardó el dueño y las ventas reales de Info Plus. Las cifras de la pestaña «Ventas» eran inventadas.
- Capturas de las 6 pestañas y del «Reporte del mes» a 1280 px y 390 px. Mediciones con Playwright. PDF del reporte en carta.
- 4 agentes, cada uno con un enfoque:
  1. jerarquía visual y cifras;
  2. botones e interacción;
  3. iPhone y accesibilidad;
  4. textos y reglas del dueño.
- No se tocó código, base ni datos.

## Hallazgos ALTOS
1. **Lectura de montos (puede dañar datos).** `num()` (`conta-equilibrio.js:40`) borra todo lo que no sea número o punto:
   - con coma decimal, «1500,50» se guarda como 150,050;
   - «-500» se guarda como 500;
   - no avisa.
2. **Dos «le falta» distintos en la misma pantalla.** Uno es contra la meta (oct: RD$1,595,363) y otro contra el equilibrio (RD$1,233,132). El Reporte repite la confusión.
3. **No hay veredicto.** El resultado (pérdida RD$375,230) es la 6.ª tarjeta, del mismo tamaño que las demás.
4. **iPhone: la respuesta queda al fondo.** El resumen empieza a 2,473 px en Santiago (2,149 Moca, 2,257 Navarrete, 2,166 Comunes). Cada gasto ocupa 2 renglones (~108 px).
   - Alturas por pestaña a 390 px: General 2,764 · Santiago 3,730 · Moca 3,390 · Navarrete 3,591 · Ventas 2,419 · Comunes 3,231.
5. **Cambios sin guardar se pueden perder.**
   - «Guardar» y el aviso quedan al pie (Santiago: 3,662 px).
   - No hay aviso al cerrar la pestaña.
   - Cambiar de mes y «Actualizar» sí piden confirmación.
6. **La × quita una fila al instante**, sin confirmar ni deshacer (líneas ~319 y ~355).
7. **Reporte del mes:**
   - la tabla «Cada tienda» tiene 10 columnas: en pantalla se cortan 4 y en carta van a 9.5 px;
   - en un mes cerrado salen columnas vacías («Por día que queda», «Parte del capital»);
   - frases de mes en curso («llevan vendido», «a la fecha»);
   - letra de 10–12 px en el celular.
8. **Etiquetas en MAYÚSCULAS y cortadas** (gastos variables, días hábiles, botones del reparto, ITBIS): contra `DESIGN.md` §4b.

## Hallazgos MEDIOS
- Palabras contables («contribución», «margen de seguridad», «aporte (sin comunes)», «fijos (+ comunes)»).
- 9 notas explicativas fijas en pantalla: deberían ir detrás de la ⓘ.
- Tarjetas «Ganancia que necesita» y «Gastos fijos» con la misma cifra.
- Rojo en «Lleva» (no es un problema). La barra de avance va en naranja hasta el 100 %. El signo sale «RD$-375,230.74».
- Dos pestañas marcadas a la vez: Estado Mensual y Punto de equilibrio (`abrir()`, ~:806).
- En Ventas, una segunda fila de pestañas repite la de arriba.
- «Guardar gastos del mes»:
  - mide 44 px (regla: 54);
  - está encendido sin cambios;
  - sale también en General.
- Letra de 12 px:
  - títulos de tarjetas (una regla global de `small` le gana);
  - pestañas de Contabilidad.
- Etiquetas de la tabla en modo tarjeta: 10.5 px.
- Contraste:
  - blanco sobre `#e4572e` de la pestaña activa: 3.68:1;
  - verde `#059669` de los montos: 3.77:1 (gana la variable global `--fin-ok`; el módulo prevé `#15803d`).
- Montos sin separador de miles al escribir.
- Mes como «2026-10»: el campo ocupa 530 px en la PC.
- Lectores de pantalla:
  - el campo del mes no tiene etiqueta;
  - las tablas no tienen `scope`;
  - la × no dice qué concepto quita.
- Foco de las pestañas poco visible (1.47:1).
- Pestaña Ventas:
  - barra de detalle azul `#2563eb`, fuera de la paleta;
  - nota «El 0.0 % de lo vendido…» que parece un error (revisar si `pct_por_precio` viene vacío).

## Bien
- Los 16 íconos existen en Tabler 2.47.
- Sin desplazamiento de lado.
- Campos de 48 px con letra de 16 px e `inputmode` correcto.
- `tabular-nums` en los números.
- Respeta «reducir movimiento».
- Sin errores de JavaScript.

## A confirmar con el dueño (no es diseño)
En los «Gastos comunes» guardados de octubre hay dos renglones que pueden inflar el punto de equilibrio:
- «ITBIS» RD$35,977.87: el ITBIS no es un gasto;
- «Préstamos (cuota del mes)» RD$395,825.26: la cuota completa incluye capital, y el propio módulo dice que el capital no es gasto.

## Las 5 mejoras de más impacto (propuestas, sin hacer)
1. Leer montos con coma o punto, avisar si no se entiende y mostrar con formato al salir del campo.
2. Franja de veredicto arriba, con 3 cifras grandes (Debe vender · Lleva · Falta) y un solo «falta» con nombre claro.
3. En el iPhone: resumen primero, cada gasto en una línea, tarjetas en 2 columnas.
4. Barra «Cambios sin guardar · Guardar» (54 px) solo cuando hay cambios, aviso al salir y «Deshacer» al quitar una fila.
5. Textos y Reporte:
   - palabras de tienda (tabla de reemplazos del agente de textos);
   - notas detrás de la ⓘ, sin MAYÚSCULAS;
   - Reporte sin columnas vacías y legible en carta;
   - en el celular, tablas como tarjetas.

## Pendiente
El dueño decide qué corregir. Antes de tocar el código se le presentan 2–3 opciones (regla de puntos de control).

Evidencia (fuera del repo, en la sesión): capturas, mediciones y el PDF del reporte en la carpeta `pe-audit` del scratchpad.
