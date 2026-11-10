# Claude · «Imprimir label»: accesos rápidos editables (sin publicar)

Sigue a la entrada anterior de hoy (`…-claude-label-ajustado-smart.md`), que no se edita.

## Pedido del dueño
Al preguntarle si se publicaba contestó: «Se puede poner editable el acceso rápido smart» (10-nov-2026).

## Qué cambia respecto a la entrada anterior
- Los botones bajo «Texto de estado» son ahora **una sola lista editable** (`localStorage.bc_lr_lista`, hasta 10). Sin lista guardada: CLASE A · CLASE B · CLASE C.
- Botón **«Editar»** al final de la fila:
  - cada acceso muestra ✕ y un toque lo quita;
  - lo escrito arriba aparece como «+ TEXTO» y un toque (o Enter) lo agrega, sin imprimir;
  - «Listo» cierra la edición.
- Un texto propio que se imprime se suma solo a la lista si hay espacio (reemplaza a los «usados» de la entrada anterior; `bc_lr_estados` ya no se usa).
- La lista vive en ese navegador: cada computadora tiene la suya. Compartirla entre todas pediría guardarla en la base; no se hizo sin el OK del dueño.

## Pruebas (banco local, datos inventados)
`label-rapido-smart.cjs` a 390×844, 1280×720 y 1920×950: **Todo bien**, con la comprobación nueva (quitar «CLASE C», agregar «SIN FACE ID» con Enter sin imprimir, queda guardado, botón ≥ 44 px).

## Estado
Rama `claude/label-ajustado-smart`, sin publicar. Falta el OK del dueño.
