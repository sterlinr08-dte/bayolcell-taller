# Prefactura: botón «Delivery» (artículo 1161) + pregunta para clientes por mayor (30-oct-2026, 19:30 RD) — rama, SIN publicar

**Dueño:** «el código 1161 de Info Plus (servicio de mensajería)… en la prefactura un ícono de delivery con la descripción abajo, como el servicio, que se agregue automático… por mayor 50 pesos… si se quiere poner manual… o un botón smart que a un cliente por mayor le pregunte si quiere incluir delivery».

**Fuente de verdad:** `infoplus_articulos` 1161 = «ENVIO - MENSAJERIA», niveles {1: 100, 2: 50, 3: 200}, sin existencias.

**Qué hace (`taller-prefactura.js` i27 / `.css` n14):**
- Botón **Delivery** (ícono de camioncito y la palabra debajo en el celular) junto a **Servicio**.
- Agrega la línea 1161 con descripción «DELIVERY» y el precio del nivel del cliente (Cliente final 100, Por mayor 50). Si ya está, avisa y no la repite.
- **Precio manual:** cualquier usuario puede escribir otro precio en la línea del delivery (los demás artículos siguen bloqueados para empleados). El precio manual queda fijo aunque cambie el tipo de cliente.
- El delivery no pasa por el control de existencia (es un servicio).
- **Smart:** con cliente **Por mayor** y artículos sin delivery aparece «Cliente por mayor: ¿incluir delivery de RD$ 50.00?» con **Sí, agregar** / **No**. Si se quita el delivery vuelve a preguntar; «No» la oculta en esa prefactura.
- Nada cambia en Info Plus ni en la base: es una línea más de la prefactura.

**Pruebas:** `scripts/pruebas/prefactura-delivery.cjs` 51/51 (390 empleado, 1280 empleado, 1280 admin). Botones 44–48 px, sin desbordes ni errores.
