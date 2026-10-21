# 21-oct-2026 · MEMORIA del proyecto y recarga automática al compactar

## Pedido del dueño
«¿Qué se puede hacer para que no pierdas lo que sabes cuando se compacta este chat?» → «Hazlo».

## Cambios
- `docs/MEMORIA.md` (nuevo, unas 140 líneas). Resume:
  - reglas del dueño;
  - qué tenemos funcionando por módulo;
  - piezas técnicas (Info Plus, Zernio, Edge Functions, crons, tablas);
  - IA de WhatsApp;
  - pendientes y esperas;
  - errores que no se repiten;
  - dónde buscar más.
- Origen y revisión:
  - redacción hecha con una ayuda (subagente) a partir de `CLAUDE.md`, las reglas, la bitácora del 17 al 21 de octubre y lo verificado en esta sesión;
  - revisada: se quitó la asignación de líneas a sucursales porque era una suposición.
- `.claude/settings.json` + `.claude/hooks/memoria.sh`:
  - el hook `SessionStart` (`startup|resume|compact`) imprime la MEMORIA de este proyecto y la de los proyectos hermanos que estén clonados al lado (`nexus-pro`, `studio-rd`);
  - así vuelve sola al contexto después de cada compactación;
  - solo lee archivos, nunca falla (exit 0) y corta cada MEMORIA a 20 KB.
- `CLAUDE.md`: regla al inicio («leer primero `docs/MEMORIA.md`; actualizarla en cada entrega; si el dueño dice "anótalo en la memoria", va ahí»).

## Pendiente
- Revisar contra la regla de agente supervisado los modos de la IA del 19-oct (Moca y Santiago automático, Navarrete copiloto).
- STUDIO: hacer lo mismo cuando ese proyecto esté abierto.
