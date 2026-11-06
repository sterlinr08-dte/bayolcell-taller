# 06-nov-2026 · Barra de los equipos marcados → cápsula flotante (RAMA DE PRUEBA, sin publicar)

Sigue a `2026-11-06-1100-claude-publicado-lote-arrastrar.md`.

## Pedido del dueño
- Captura de Reacondicionados › Equipos del Lote en la PC (1920 px) con la barra oscura de abajo: «Vamos a ajustar la barra inferior» (skill `apple-design`).
- Se le dieron 3 opciones (cápsula flotante / misma barra más chica / sin barra). Eligió **A** («hazlo en la rama de prueba»).

## Problemas que tenía la barra (publicada ayer)
1. Franja oscura de lado a lado: en 1920 px quedaba un hueco vacío en el medio y pesaba más que el contenido.
2. Acciones repetidas arriba y abajo, con nombres y colores distintos («Despachar teléfonos» azul arriba / «Despachar» naranja abajo; «Asignar a técnico» / «Asignar técnico»).
3. Azul noche casi negro sobre una página clara.

## Qué se cambió (solo `bc-lote-arrastrar.css`/`.js`, sin tocar `taller-app.js` ni la base)
- **Cápsula:** del ancho de sus botones (`fit-content`), centrada, vidrio claro (blanco 84 % + desenfoque 18 px, borde fino, sombra suave), radio 26 px, sube con resorte (320 ms) al marcar el primer equipo. Con «reducir transparencia» queda blanca sólida; con «reducir movimiento», solo aparece.
- **Contador** en una píldora naranja (`#c2410c`, letra blanca, contraste AA). **Botón principal** «Despachar teléfonos» en el mismo naranja; el resto son botones lisos.
- **Mismos nombres que arriba:** «Asignar a técnico», «Pasar a ▾», «Listo para venta», «Despachar teléfonos».
- **Una sola entrada por acción:** mientras la cápsula se ve (`html.bclb-activa`), se esconden de la barra de arriba «Asignar a técnico», «Pasar a», «Despachar teléfonos» y el texto «N seleccionado(s)». Al quitar la selección vuelven. Se buscan por su `onclick`/`id`, así que funciona aunque `taller-ui-reacond.js` los haya movido a sus grupos.
- **Celular (≤700 px):** ocupa el ancho con 8 px de margen. Fila 1: contador + Quitar. Debajo, los 4 botones en dos columnas.
- Cada botón sigue llamando a la función de siempre (`abrirModalAsignarLote`, `_reacondPasarA`, `pasarSeleccionListoVenta`, `despacharTelefonosSeleccionados`): mismas validaciones, bloqueos y confirmaciones.
- Versión `?v=20261107-la2` en `taller.html` (css y js).

## Pruebas
- `scripts/pruebas/lote-arrastrar/qa.cjs`: **25/25** (las 20 de antes + 5 nuevas). La página de prueba ahora trae las acciones de arriba.
- Pruebas nuevas:
  - arriba se esconden con la cápsula y vuelven sin selección;
  - la cápsula mide 897 px en una pantalla de 1280 px y está centrada;
  - tiene los mismos nombres que arriba.
- Tamaños: todos los botones miden ≥44 px de alto (PC 1280 y iPhone 390). No hay scroll de lado.
- En el iPhone, todos los botones quedan dentro de la cápsula. En la primera versión la fila del medio se salía; se corrigió.
- Capturas antes/después (PC 1920 e iPhone 390) entregadas al dueño por el chat.

## Pendiente
- Que el dueño lo vea en la rama y diga «publícalo».
- Probar con un lote real en el iPhone y en la PC después de publicar.

## Rama
`claude/lote-barra-capsula` (desde `main` 745cf47), sin publicar.
