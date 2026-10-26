# 26-oct-2026 02:00 (RD) · Reacondicionados: mapa del proceso, permisos y pendientes de la auditoría — Claude (agente 10 de 10)

## Pedido
Dentro de la tanda de 10 agentes para el taller («parte gráfica e interfaz y los procesos de los reacondicionados»):
revisar la auditoría contrastada (`2026-10-24-0130`, R01–R15 y V01–V06) contra el código de `main` (af7016f) y las fases 1
y 2 publicadas; entregar el mapa del proceso con permisos y estado real, arreglos pequeños en el navegador y propuestas SQL
sin aplicar. Rama `claude/taller10-a10`. **Sin publicar, sin push, sin tocar la base.**

## Qué se encontró (verificado en el código)
La mayoría quedó resuelta en las fases 1 y 2. Huecos que seguían abiertos en `main`:
1. **«Cerrar salida»** (`marcarEquipoCompletado`) ponía `vendido + completado` a un equipo en **Listo para venta**: se saltaba
   el despacho, la fecha de despacho y el descuento automático de piezas (R04). El servidor lo permite desde Listo.
2. **«Registrar salida»** (`marcarDespachado`) no miraba el estado: un admin podía despachar desde reparación o repetir un
   Despachado (y volver a intentar el descuento de piezas). El historial anota siempre «listo_venta» como estado anterior.
3. **«Despachar teléfonos»** (`_despTelConfirmar`): la lista acepta cualquier equipo marcado en el lote
   (`_despTelCandidatos` incluye la selección), así que un equipo ya Despachado podía ir **otra vez a Info Plus**.
4. **«Pasar a → Listo para venta» en bloque** desde «Diagnóstico listo» sin técnico no revisaba tareas ni piezas (R05).
5. **«Reabrir salida»** sin confirmación; **«Quitar equipo»** con un «¿Quitar este equipo del lote?» sin detalle;
   **«Eliminar lote»** borraba los equipos sin leer el error y seguía con el lote.
6. Los avisos de error largos (p. ej. «Info Plus ya tiene el despacho Nº…; no repita el despacho») **desaparecían a los 4 s**.
7. Otros: 4 notas del tablero rápido (`taller-reacond-smart.js`) no leen el error del historial (el rastro del estado igual
   queda en `refurb_transiciones`); las píldoras `#0891b2` de V02 no están en Reacondicionados.

## Qué se cambió
- **Capa nueva `taller-reacond-proceso.js` (p1)**, cargada con `defer` después de `bc-dialogos.js`. No toca `taller-app.js`
  (así no choca con los otros 9 agentes ni con `taller-app.min.js`): envuelve las funciones globales.
  Apagar: `localStorage.bc_reacond_proceso_off='1'`, `<html class="bc-reacond-proceso-off">` o `window.BC_REACOND_PROCESO=false`.
  1. «Cerrar salida» solo para Despachados: «Primero registre la salida…».
  2. «Registrar salida»: si ya está Despachado avisa y no escribe; si no está en Listo, el técnico recibe el motivo y el
     admin una confirmación («se salta el control de calidad»).
  3. «Despachar teléfonos»: **antes de llamar a Info Plus** lee el estado en la base; si alguno ya está Despachado, no se
     mueve nada; si alguno no está en Listo, pregunta («El documento de Info Plus no se deshace desde aquí»).
     Si no puede leer la base, no despacha.
  4. «Pasar a → Listo para venta» en bloque: no mueve nada si hay piezas pendientes o tareas sin terminar y dice cuál.
  5. Confirmaciones con detalle: «Reabrir salida», «Quitar equipo» (Despachado, piezas ya descontadas en Info Plus,
     «No se puede deshacer») y «Eliminar lote» (cuántos en taller y Despachados, piezas descontadas). «Eliminar lote» ya
     no borra el lote si la base no dejó borrar sus equipos.
  6. Avisos de error de más de 80 letras quedan 6–15 s, se cierran al tocarlos y se anuncian con `role="alert"`.
- `taller.html`: solo la línea `<script defer src="taller-reacond-proceso.js?v=20261026-p1"></script>`.
- `docs/REACONDICIONADOS-PROCESO.md`: mapa paso a paso (quién, qué estado, qué se deshace), tabla de permisos y estado real
  de los 21 hallazgos.
- **Propuestas SQL, sin aplicar** (arrancan con un `raise exception` para que no corran por error):
  - `supabase/migrations/20261026150000_PROPUESTA_reacond_conciliacion_datos.sql`: consultas de diagnóstico (D1–D5) y
    arreglos por bloque con `BEGIN … COMMIT` (A1 fecha a 32 Despachados sin fecha; A2 cerrar 60 tareas abiertas en 36
    equipos Listos/Despachados; A3 las 14 piezas sin descontar van por la ficha, sin SQL; A4 rechazar las 9 solicitudes sin
    equipo de más de 30 días; A5 recalcular costos de repuestos). Las cifras son las de la auditoría; **confirmar con D1–D5**.
  - `supabase/migrations/20261026151000_PROPUESTA_reacond_candados_fase3.sql`: trigger `trg_refurb_guardia_fase3`
    (cerrar salida solo de Despachados; despachar siempre deja fecha; técnico no pasa a calidad/venta con piezas o tareas).
- Prueba nueva `scripts/pruebas/reacond-proceso.cjs` y su entrada en `scripts/pruebas/README.md`.

## Pruebas (banco local, puerto 8810 copiado fuera del repo)
- **Antes** (mismo guion con la capa apagada, igual que `main`), a 390 y 1280 px: 0 de 9 controles — reabrir sin confirmar,
  cerrar desde Listo escribió 1 vez, despachar dos veces escribió 1 vez, bloque a Listo con tarea abierta escribió 1 vez,
  confirmaciones sin detalle, error largo invisible a los 4.6 s, despacho con un equipo ya Despachado: **1 llamada a Info Plus**.
- **Después**, a 390 y 1280 px: 9 de 9 — 0 escrituras en los casos bloqueados, confirmaciones con detalle, error visible a
  los 4.6 s con `role=alert`, despacho con equipo ya Despachado: **0 llamadas a Info Plus**; con equipo en reparación:
  pregunta antes. 19 botones/casillas visibles del módulo, 0 por debajo de 44 px; sin desplazamiento horizontal;
  **0 errores de JavaScript**.
- Regresión `reacond-fase2.cjs` a 390/440/1280: OK en los tres. `node --check` en la capa y en la prueba.
- Capturas antes/después (fuera del repo): ventana «Quitar equipo» a 390 y 1280 y lista del módulo.

## Riesgos
- La capa envuelve funciones globales; si otra rama cambia el nombre de `marcarEquipoCompletado`, `marcarDespachado`,
  `_despTelConfirmar`, `_reacondPasarA`, `_reacondRegresarDespachado`, `eliminarEquipoLote`, `eliminarLote` o `toast`,
  esa parte deja de actuar (sin romper nada).
- El admin ya no puede «Cerrar salida» de un equipo en Listo ni mover en bloque a Listo con tareas abiertas: debe registrar la
  salida primero o usar la ficha de cada equipo (pide justificación). Si el dueño prefiere lo de antes, se apaga la capa.
- «Registrar salida» de un admin desde un estado que no es Listo sigue posible (con una confirmación de más).

## Pendientes (requieren al dueño)
- Autorizar (o no) cada bloque de conciliación A1, A2, A4, A5 y la fase 3 de servidor.
- Las 14 piezas sin descontar: descontarlas desde la ficha (escribe en Info Plus).
- Fuera de este encargo: la ventana de confirmación general tiene botones de 33 px en PC y el texto «deja el dedo… / Mantén
  para quitar» va en tú, no en usted.
- MEMORIA.md no se tocó en esta rama para no chocar con las otras 9; agregar la línea al juntar.
