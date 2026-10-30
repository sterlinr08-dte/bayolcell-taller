# 2026-10-30 10:50 (RD) — Claude — Buscador de artículos de la Prefactura: fuera la franja naranja de la fila

## Solicitud del dueño
Captura de la Prefactura en PC (1920 px) con el buscador «Buscar artículo» abierto: la primera fila (la señalada) mostraba
una franja anaranjada degradada en su borde de arriba. «Vamos a corregir eso que se ve orange».

## Diagnóstico (fuente de verdad)
- No era el fondo de la fila: con la capa de Prefactura (`html.bc-pf`) la fila señalada es azul (`rgba(59,130,246,.07)`,
  `taller-prefactura.css`), y gana la cascada sobre el naranja viejo de `taller-recepcion.css`.
- Era la **«luz de vidrio» del efecto reflector** (`bc-reflector.js`, capa `.bc-vidrio`, fija sobre todo, `pointer-events:none`):
  sigue al puntero sobre cualquier cosa tocable (`[role="option"]` incluye las filas) y pinta una luz con el acento naranja del
  taller (255,107,53) en el borde superior. Sobre la fila azul se veía como una franja naranja.
- Reproducido en el banco local a 1920 px: píxel del borde (244,214,207) con la luz; (241,246,254) sin ella. El elemento no sale en
  `elementsFromPoint` porque no recibe el puntero; se encontró apagando piezas una por una.

## Cambio (rama `claude/buscador-sin-luz-naranja`, SIN publicar)
- `taller-recepcion.js`: la lista del buscador (`.bcrx-ppk-list`) lleva la clase `no-reflector`, que el reflector ya respeta.
  Las fichas de acceso rápido, «Catálogo completo» y el botón «+» conservan su luz; solo las filas quedan sin ella: el resaltado
  azul de la fila ya dice cuál está elegida.
- `taller.html`: `taller-recepcion.js?v=20261030-g10`.
- Nada de base, precios ni Info Plus. Reversible quitando la clase.

## Pruebas
- Banco local 1920 px: antes/después en `docs/bitacora/img/2026-10-30-buscador-sin-luz/` (`antes-1920.png`, `despues-1920.png`).
- `scripts/pruebas/prefactura-confiable.cjs`: ver resultado abajo (se corrió tras el cambio).
- No probado en el navegador del dueño; el efecto depende del puntero, en celular no aparece.

## Pendiente
- «Publícalo» del dueño.
