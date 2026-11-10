# CRM rápido (parte C): ensayo de unión con la parte A/B · sin publicar

Complementa `2026-11-10-0640-claude-crm-rapido-c.md` (no la corrige).

## Qué pasó
Mientras se hacía la parte C, `main` avanzó a `c8632fd` con la parte A/B (#281). La rama `claude/crm-rapido-c` salió de `a29f231` y **no se unió con `main`** (no se pidió unir ni publicar).

## Ensayo (fuera del repo, en el área de trabajo de la sesión; nada confirmado)
Se armó la unión de `claude/crm-rapido-c` con `origin/main` en una carpeta aparte. Git une solo 13 archivos y deja 3 choques, todos de una línea o de texto añadido al final:

| Archivo | Choque | Cómo se resolvió en el ensayo |
|---|---|---|
| `taller.html` | `taller-app.min.js?v=` (A/B la subió a `20261110-ab1`) junto a la línea nueva de `crm-estilos.js` | las dos: la versión de A/B y, debajo, `crm-estilos.js` |
| `taller.html` | `crm-marketing-consent.js?v=` (`-c1` aquí, `-ab1` en A/B) | una versión nueva (`20261110-abc1`) |
| `crm-marketing-consent.js` | `crm-wa-identico.js?v=20261110-w22` en las dos ramas, con archivos distintos | subirla a `w23` (A/B dejó la versión interna en `w21`; aquí es `w22` porque las hojas sí cambiaron) |
| `scripts/pruebas/README.md` | las dos ramas añadieron su prueba al final | dejar las dos |

Con la unión servida en el banco:
- `scripts/pruebas/crm-estilos.cjs`: **Todo bien**.
- `scripts/pruebas/crm-rapido.cjs` (la prueba de A/B): **139 aprobadas · 0 fallidas**.

## Lo que no se hizo
- No se repitió con la unión la comparación de capturas ni la de estilos calculados, ni las mediciones de velocidad. Los números de la bitácora anterior son de la parte C sola contra `main` en `a29f231`.
- La prueba `crm-editar-mensaje.cjs` espera aquí la versión interna `w22`; al unir hay que mirar que siga siendo esa.

## Siguiente paso
Quien una las dos partes: resolver los 3 choques como arriba, correr las dos pruebas y repetir la comparación de capturas antes de pedir el OK del dueño.
