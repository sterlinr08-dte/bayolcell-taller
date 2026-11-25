# Historial del IMEI publicado (25-nov-2026)

- El dueño dijo «Publícalo».
- Migración `20261125200000_historial_imei` aplicada en `vkhwdvjtowrhkhqavnvk`:
  - 2 funciones, RLS activo y 1 política;
  - sin sesión, `rpc/imei_historial` responde «Sin permiso» (comprobado en vivo).
- El PR #348 se fusionó a `main` (commit `66eaabb`).
- En vivo: `taller.html` carga `?v=20261125-himei1` y el `.min.js` contiene `imei_historial`.
- MEMORIA actualizada.
- Detalle en `*-claude-historial-imei.md`.
