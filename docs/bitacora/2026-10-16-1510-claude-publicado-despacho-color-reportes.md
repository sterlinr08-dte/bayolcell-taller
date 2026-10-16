# Publicado: despacho con color, conduce sin costos, «Guardar e imprimir» y reportes por WhatsApp — 16-oct-2026

**Autorización del dueño:** «Si», a la pregunta «¿Lo publico?».

**Qué se publicó:** la rama `claude/despacho-color`, con avance directo de `main`. Incluye estos cambios, cada uno con su bitácora:
- color de cada IMEI en el conduce, el PDF y la hoja previa (`2026-10-16-1420`);
- un solo botón «Guardar e imprimir» (`2026-10-16-1430`);
- conduce y PDF sin costos, y elegir el color en la ventana de despacho (`2026-10-16-1440`);
- reportes por WhatsApp: del equipo sin costos y administrativo con costo y lote, más el botón en el historial (`2026-10-16-1500`).

**Versión:** `taller-app.js?v=20261016-dw1`.

**Verificación:** `node --check` sin errores.

**Riesgo:**
- Lo que se manda a Info Plus no cambió.
- Elegir el color escribe `equipos_refurbish.color`, igual que «Poner colores».
- Los contactos y el número del dueño quedan en `localStorage` de esa computadora.

**Para deshacerlo:** revertir los commits de la rama.
