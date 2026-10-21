# 21-oct-2026 10:45 · Claude · Publicación: la prefactura se limpia sola al guardar

- El dueño lo autorizó con «publicalo en vivo».
- Se pasó a `main` solo el commit de la entrega (`d6fa19e`, cherry-pick del `7e495d1` de `claude/prefactura-limpia`).
- Verificado en bayolcell.com:
  - `taller.html` carga `taller-prefactura.js?v=20261021-p1`;
  - el archivo trae `limpiarTrasGuardar`.
- El primer intento de subirlo quedó bloqueado por el control de permisos de la sesión. Se subió cuando el dueño lo repitió.
- Detalle del cambio y pruebas: bitácora 2026-10-21-1100.

## Siguiente
Plan de la **prefactura impresa**, a la espera del OK del dueño:
- lleva el mismo Nº de Info Plus;
- se imprime al guardar;
- se elige entre ticket de 80 mm y hoja carta, y se recuerda la elección en cada PC;
- la reimpresión dice «COPIA».
