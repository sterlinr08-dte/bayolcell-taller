# «Asignar equipo» y «Seleccionar técnico» (antes «Pasar con pistola» y «Técnico del grupo»)

Sigue a `…-claude-pistola-hoja-entrega.md` (misma rama, se publican juntas).

## Pedido del dueño
«Publícalo y el botón que dice pasar con pistola cambiarle el nombre por asignar equipo, y donde dice técnico del grupo ponerle seleccionar técnico y que salgan cuando clique».

## Qué se hizo (`taller-reacond-pistola.js`, `?v=20261112-k4`)
- Botón del tablero y título de la ventana: «Asignar equipo» (mismo nombre en los dos, regla de microcopy).
- Arriba de la ventana, un botón «Seleccionar técnico ▾» de 48 px. Al tocarlo se despliegan los técnicos (con cuántos tienen en reparación). Al elegir uno se recoge y el botón dice «Técnico: NOMBRE». Si se toca el mismo técnico otra vez, se quita y la lista queda abierta.
- Lo demás igual: la hoja de entrega con las fallas, el guardado y los permisos. Los nombres internos (`BayolReacondPistola`, `bc_reacond_pistola_off`) no cambian.

## Pruebas
`reacond-pistola-tecnico.cjs` y `reacond-pistola.cjs`: Todo OK a 390 y 1280 px. Capturas de los 3 pasos en el celular.

## Publicación
Autorizada por el dueño en el mismo mensaje («Publícalo»), junto con la hoja de entrega.
