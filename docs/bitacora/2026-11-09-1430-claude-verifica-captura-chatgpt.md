# Verificación de la captura guiada de ChatGPT en Punto de equilibrio

Se revisó lo que entregó ChatGPT:

- PR #263, commit `de15df6`;
- sus bitácoras `2026-11-09-1000-chatgpt-captura-equilibrio.md` y `2026-11-09-0952-chatgpt-publicacion-captura-equilibrio.md`;
- su auditoría de la rama `codex/auditoria-equilibrio-20261109`, que no se unió.

## Pedido
El dueño escribió: «Verifica lo que hizo gpt en el punto de equilibrio».

## Qué se revisó y resultado
| Punto | Resultado |
|---|---|
| Publicación | ✅ El `taller.html` en vivo carga `conta-captura.*?v=20261109-pc1` y `conta-equilibrio.js?v=20261109-pe25`. |
| Cálculos | ✅ Con el arnés `cmp2` se comparó `conta-equilibrio.js` antes (`99c053c`) y ahora en 21 casos: 7 fechas × 3 meses. `calcular()` da idéntico en los 21. En el texto de las pestañas solo cambia el «×» del botón Quitar. |
| Base de datos | ✅ Ver el detalle abajo. |
| Pantalla a 390 y 1280 px | ✅ Sin errores de JS ni scroll horizontal. Ningún control de gasto mide menos de 44 px. |

**Detalle de la base de datos**
- El bucket `conta-comprobantes` es privado y acepta archivos de hasta 8 MB.
- Las políticas SELECT e INSERT exigen `app_puede_contabilidad()`. No hay UPDATE ni DELETE.
- La RPC es SECURITY INVOKER, con `search_path` vacío, y anon no tiene acceso.
- El trigger `conta_equilibrio_touch` actualiza `actualizado_en`, así que el control de versiones funciona.
- Los datos de octubre siguen intactos y no hay filas de noviembre.

## Puntos para el dueño (no son errores de código)
1. **Octubre ahora sale como «Resultado provisional».** Los gastos viejos no tienen estado, así que quedan «Por revisar». Para que deje de decir «provisional», cada gasto necesita estado «Confirmado» y un comprobante o una nota.
2. **La pantalla es larga en el celular.** Cada gasto ocupa unos 330 px: concepto, monto, estado, comprobante y nota. Una tienda con 10 gastos da varias pantallas de scroll.
3. **La auditoría de ChatGPT quedó sin unir y tiene hallazgos de dinero:**
   - una diferencia grande entre la nómina del equilibrio y la de RRHH;
   - una posible comisión contada dos veces en Moca y Navarrete;
   - el ITBIS y los repuestos sin clasificar.

   No se tocó nada; hay que conciliarlo con el dueño.

## Cambios
Ninguno en el código ni en los datos. Solo esta bitácora, en la rama `claude/verifica-captura`.
