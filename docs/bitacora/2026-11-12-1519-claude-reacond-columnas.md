# Reacondicionados · el lote por columnas («Columnas»), curvo como el reel «Glassy Dashboard V31»

## Pedido del dueño
Vio la muestra del lote por columnas (idea sacada del reel `Dfpso-izxkY`) y dijo: «Como está pero todo curvo como se ve en el video».

## Qué se hizo
- Archivo nuevo `taller-reacond-columnas.js` (`?v=20261112-co3`), cargado en `taller.html` después de `taller-reacond-costado.js`. No toca `taller-app.js`.
- Dentro de un lote, botón «Lista / Columnas» (por defecto Columnas; se recuerda en ese equipo con `bc_reacond_vista`).
- 6 columnas: Recibido → Diagnosticado → En reparación → Calidad → Listo → Despachado, cada una con su cuenta y (solo administrador) cuánto suman.
- Arriba, 5 cifras: en el taller (de N del lote), movidos hoy comparado con ayer (consulta `equipo_historial` de esos equipos, solo lectura, hora de RD), días promedio en reparación, listos sin despachar (y su monto) e invertido en el taller (solo admin; mismo cálculo que el resto: compra + repuestos + envío).
- Tarjetas propias, curvas (columnas 28 px, tarjetas 22 px, cifras 26 px), con vidrio suave: modelo, final del IMEI, color, avisos (Atrasado, Técnico recibió, Salida por cerrar), técnico y días (en rojo si va atrasado). Hasta 8 por columna; «+N más» abre el resto.
- Cada tarjeta lleva escondida la tarjeta de siempre: tocarla abre la ficha al costado con sus 9 funciones; si la ficha está apagada, abre la ventana de siempre. Respeta la búsqueda y los filtros del lote; en columnas no hay páginas.
- `taller-reacond-costado.js` (`?v=20261112-c4`): reconoce las tarjetas de columnas (`.rco-card`, `data-eq`) para abrir, pasar con ↑ ↓ y marcar la activa.
- En la PC con la ficha abierta, o en el celular, las columnas se deslizan de lado.
- Apagar: `localStorage.bc_reacond_columnas_off='1'` o `window.BC_REACOND_COLUMNAS=false`.

## Pruebas
- `scripts/pruebas/reacond-columnas.cjs` (nueva): Todo OK a 390 y 1280 px, y con un usuario técnico (no ve montos).
- `reacond-costado.cjs`, `reacond-costado-funciones.cjs` y `reacond-limpio.cjs` (ahora fijan la vista Lista, que es lo que prueban), `reacond-pistola.cjs`, `reacond-asignar-mejoras.cjs`: Todo OK.
- Error encontrado y corregido: al tocar una tarjeta se abrían la ficha al costado Y la ventana; ahora solo la ficha.

## Estado
Rama `claude/reacond-columnas`. **Sin publicar**.
