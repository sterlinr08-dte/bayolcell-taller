# Códigos de vendedores de Info Plus aclarados por el dueño (07-nov-2026)

**Dato del dueño:**
- «697 Esther Reyes, vendedora»;
- «750 Loribel Ventura, no es vendedor»;
- «6 Yves, no es vendedor».

## Cambio (`conta-equilibrio.js`, versión pe14, rama `claude/vendedores-nombres`)
- Nueva tabla `CODIGOS_IP` en la capa:
  - 697 → Esther Reyes (vende);
  - 750 y 249 → Loribel Ventura (no vende; el 249 ya figuraba como Loribel en `tecnicos`);
  - 6 → Yves (no vende).
- Los que no venden salen de la «Meta quincenal por vendedor» y del reparto de %. **Sus ventas siguen contando** en el total de la tienda y en las metas por periodo.
- Los nombres se escriben con mayúscula en cada palabra («Esther Reyes»).

## Prueba (simulador)
- Santiago: Esther Reyes 65.5 % y Michelle 34.5 %.
- Navarrete: Yosmeiry 100 %; Yves ya no aparece.

**Nota:** el 697 no tiene ficha en `tecnicos`. Si se crea la ficha de Esther con su código de Info Plus, el nombre puede salir de ahí; mientras tanto vale `CODIGOS_IP`.
