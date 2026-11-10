# CRM rápido · paquete C unido con A y B (listo para publicar)

- La rama `claude/crm-rapido-c` salía de `a29f231`; mientras tanto se publicó A + B (#281). Uní `main` en la rama.
- Choques resueltos (3):
  - `taller.html`: queda `taller-app.min.js?v=20261110-ab1` más la línea de `crm-estilos.js`, y `crm-marketing-consent.js?v=20261110-c2`.
  - `crm-marketing-consent.js`: `crm-wa-identico.js?v=20261110-w23` (las dos ramas habían puesto `w22` con archivos distintos).
  - `scripts/pruebas/README.md`: se conservan los dos textos.
- Pruebas sobre la rama unida (hechas por mí, puerto 8792):
  - `crm-estilos.cjs`: Todo bien.
  - `crm-rapido.cjs`: 139 aprobadas, 0 fallidas.
- Tiempos con todo unido, contra el `main` de antes de A, B y C (banco local, Chromium, CPU ×4, una corrida; el ruido entre corridas iguales llega a ±15 %):

| Acción | 390 px | 1280 px |
|---|---|---|
| Ver la bandeja | 1,255 → 1,110 ms | 732 → 799 ms |
| Abrir un chat | 1,536 → 519 ms | 2,432 → 701 ms |
| Mensaje entrante | 511 → 162 ms | 1,097 → 287 ms |
| Enviar: pantalla ocupada después | 2.4 → 0.3 s | 3.9 → 0.4 s |
| Buscar 6 teclas: tiempo ocupado | 6.3 → 2.8 s | 7.2 → 1.6 s |
| Estilos al abrir un chat | 1,802 → 402 ms | 3,203 → 483 ms |

- 0 errores de JavaScript en la medición.
- La bandeja en la primera entrada no mejora (en PC queda dentro del ruido). Lo demás sí.
- Revisé a la vista el chat a 390 y 1280 px, antes y después: iguales. La comparación completa (15 pantallas, estilos calculados y píxeles) está en la entrada `2026-11-10-0640-claude-crm-rapido-c.md`.
- No probado: Safari ni iPhone real. La ganancia está medida solo en Chromium.
- Apagar C: `localStorage.bc_crm_estilos_off='1'`. Apagar A + B: `localStorage.bc_crm_rapido_off='1'`.
- Falta el «Publícalo» del dueño.
