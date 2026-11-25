# Enviar a Garantía China (IMEI en Info Plus) — 25-nov-2026

## Pedido del dueño

«Con la nueva API que me envió Dagoberto, ¿qué más podemos hacer?»

- No encontré ninguna API nueva más allá del JSON de hoy, el ajuste con `seriales`. Le pedí al dueño que la pegue si hay otra.
- De las ideas ofrecidas eligió:
  - **1, «Listo pasa a venta solo»**: preguntado después, respondió que en Info Plus «no cambia nada» al quedar listo, así que **no se hace**;
  - **2, «Enviar a garantía»**: eligió la opción **«Mover y marcar»**.

## Fase 0: qué había

- El campo `es_garantia` de `equipos_refurbish` marca el equipo que **regresó** por garantía del cliente. No sirve para el envío a China.
- Ya existían:
  - el estado `reparacion_externa` con `taller_externo`, con etiqueta, KPI, filtros y el botón «Volvió de reparación externa»;
  - `_ejecutarDespachoReal({origen, destino, items, seriales})`, el despacho DA de Info Plus con IMEI.
- El almacén Garantía China es el **3**.

## Cambio (`taller-app.js`, `taller.html` → `?v=20261125-gch1`)

### `enviarGarantiaChina(equipoId)`
- Solo el administrador o quien tenga el permiso `estado_despachar`.
- Pasos:
  1. Revisa el IMEI y el código del artículo.
  2. Pregunta a Info Plus dónde está el IMEI (`_ipDondeEstanImei`).
  3. Pide el «Motivo».
  4. Confirma: «Enviar a Garantía China · modelo · IMEI · origen → Garantía China».
  5. Hace el despacho del IMEI exacto al almacén 3, con su número y su conduce (`_despGuardarHistorial`).
- Solo si Info Plus lo hace:
  - el equipo pasa a `reparacion_externa` con `taller_externo = 'Garantía China · Nº DA… · motivo'`;
  - queda anotado en el historial;
  - se vuelve a revisar que el IMEI quedó en Garantía China.
- Si Info Plus rechaza, el equipo no cambia.

### `volvioGarantiaChina(equipoId)`
- Si el IMEI está en Garantía China: despacho 3 → 6 (Taller) y el equipo pasa a `tecnico_recibio`, igual que el regreso de la reparación externa.
- Si no está ahí (por ejemplo, China lo cambió por otro): pregunta si se marca como regresado sin moverlo.

### Otros detalles
- Candado `_garEnCurso`: un doble toque no hace dos despachos.

### Botones
- Ficha del equipo → «Más acciones»: «Enviar a Garantía China», o «Volvió de Garantía China» si ya está allá.
- Panel de proceso: al lado de «Enviar a reparación externa».
- Cuando el equipo está en Garantía China, el panel cambia «Volvió de reparación externa» por «Volvió de Garantía China».

## Pruebas

Playwright, con Info Plus simulado, a 1280 y 390 px:

| Caso | Resultado |
|---|---|
| Enviar desde el Taller, con doble toque | Un solo despacho `6→3 IMEI/3082 «Garantía China · Pantalla con rayas»`. El equipo queda `reparacion_externa · Garantía China · Nº DA001 · …` y el IMEI en el almacén 3. |
| Ficha del equipo en garantía | El menú muestra «Volvió de Garantía China». |
| Volvió | Despacho `3→6`. El equipo queda `tecnico_recibio` y el IMEI de nuevo en el Taller. |
| Info Plus rechaza | Sale «Info Plus no lo movió: …» y el equipo **no** cambia. |
| IMEI que no está en Info Plus | No se hace nada. |
| Errores de consola | Ninguno |

## Estado

- Rama `claude/garantia-china`. Sin publicar.
