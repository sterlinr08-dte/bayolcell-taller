# 21-oct-2026 · Formulario de financiamiento en «usted»

Sigue a `2026-10-21-0230-claude-ia-mas-humana.md`. Dueño: «Sí» a pasar el formulario a usted.

## Cambios
- Texto: «Para iniciar **su** solicitud… por favor **complete**…», «…que **desea** financiar», «Por favor, **verifique**…».
- El encabezado «SOLICITUD DE FINANCIAMIENTO» no cambió: se usa para no repetir el formulario en 30 días.
- `whatsapp-ia-responder` **v31** desplegada (verify_jwt false). Solo cambió el texto del formulario respecto a v30.
- `crm-financiamiento-quick-reply.js` (botón del CRM) con el mismo texto:
  - versión `?v=20261021-1` en `crm-marketing-consent.js`;
  - `crm-marketing-consent.js?v=20261021-u3` en `taller.html`.
- **Pantalla del CRM: en la rama `claude/prefactura-limpia`, sin publicar** (falta el «publícalo» del dueño).

## Pruebas
- `node --check` en los dos JS.
- `esbuild` compila `index.ts`.

## Pregunta del dueño
«¿Cambiaste el modelo?» → sí: de Claude Haiku 4.5 a **Claude Haiku 5.5** (desde v30).
