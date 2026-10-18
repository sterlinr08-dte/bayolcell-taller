# «Max rows» de la Data API subido a 5000 por el dueño — Claude

- **Antes:** el proyecto `vkhwdvjtowrhkhqavnvk` tenía **Max rows = 1000**, según la captura del dueño en Integrations → Data API.
- **Riesgo que se evita:** ninguna tabla del Dashboard (`loadAll`) pasaba todavía de 1,000, pero `tareas_trabajo` tenía 784 y se pide en orden ascendente. Al pasar de 1,000 se habrían dejado de cargar **las tareas más nuevas**, sin aviso.
  - Las demás tablas: órdenes 336, equipos 294, piezas pedidas 286, reacondicionados 250, clientes 231, y el resto menos de 35.
- **Cambio (lo hizo el dueño en el panel, 18-oct-2026):** Max rows pasó de 1000 a **5000**.
  - No toca datos y se revierte poniendo 1000.
  - En NEXUS se hizo lo mismo.
- **Pendiente:**
  - que `loadAll` pida las tablas grandes por partes o resumidas (punto 3 de la auditoría del Dashboard);
  - revisar el aviso de cuota de la organización: «restricted from 27 Oct, 2026».
