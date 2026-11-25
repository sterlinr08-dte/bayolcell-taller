# 25-Nov-2026 07:41 (RD) — Claude — Ajuste con IMEI en Info Plus: Ajuste rápido (A) y Registrar equipo existente (B) (sin publicar)

## Pedido
- Tras el JSON de Dagoberto (ver la entrada anterior, «ajuste con IMEI — formato»), el dueño eligió «A y B».

## Cambios (`taller-app.js`, `taller.html`)
- **`_infoplusAjustePieza(…, imeis)`:** nuevo parámetro opcional.
  - Manda `seriales: [{numero, codarticulo}]`.
  - Exige que la cantidad sea igual al número de IMEI.
  - `fvencimiento` ya iba igual a la fecha del ajuste.
- **Ayudantes:**
  - `_ipDondeEstanImei(imeis, almacenes)` lee en vivo, con la Edge `infoplus-imei-almacen` (modo `almacen_todo`), en qué almacén está cada IMEI (1, 3, 4, 5, 6 y 7). Si un almacén no responde, `ok=false` y no se mueve nada.
  - `_leerImeis(texto)`: uno por línea; acepta 14–17 dígitos; marca los mal escritos y los repetidos.
  - `_esArticuloCelular(a)`.
- **A · Ajuste rápido:**
  - Los celulares ya no se rechazan. Llevan una caja de IMEI (48 px, letra de 16 px) y la cantidad sale de los IMEI.
  - Antes de confirmar se revisa:
    - **entrada:** el IMEI no puede estar en ningún almacén;
    - **salida:** el IMEI tiene que estar en la localidad elegida.
  - La pregunta de confirmación lista los IMEI.
  - Después del ajuste se revisa en Info Plus que el IMEI de verdad se movió. Si no se movió, o no se pudo revisar, la línea queda «hecha» con un aviso y no se reenvía con otro clic, para no duplicar.
- **B · Registrar equipo existente:**
  - Casilla nueva «Darle entrada en Info Plus (almacén Taller) con este IMEI», de 44 px y desmarcada por defecto.
  - Exige que sea un celular y que el IMEI esté completo.
  - Antes de guardar se revisa que el IMEI no esté en ningún almacén, y se pide confirmación.
  - Entrada en el almacén 6 con el costo escrito (si no hay, el costo del artículo) y revisión posterior.
  - El resultado se anota en el historial del equipo. Si la entrada falla, el equipo queda registrado y se avisa.
- Versión `taller-app.min.js?v=20261125-imei1`. El `.min.js` lo regenera `minificar.yml`.

## Pruebas (local, a 1280 y 390 px; Info Plus simulado con estado: recuerda dónde queda cada IMEI)
| Caso | Resultado |
|---|---|
| A1 entrada de IMEI nuevo | 1 ajuste: `codminventario` 1, localidad 6, cantidad 1, `fvencimiento` = fecha, `seriales` = [{numero, codarticulo:3082}]; ✓ Hecho |
| A2 entrada de IMEI que ya existe | Bloqueado sin enviar: «ya está en Info Plus (Oficina Santiago)» |
| A3 salida de IMEI que sí está | 1 ajuste con `codminventario` 2 y su serial; ✓ Hecho |
| A4 salida de IMEI que no está | Bloqueado: «no está en Oficina Santiago» |
| A5 IMEI mal escrito | Bloqueado: «Revise los IMEI» |
| A6 Info Plus responde «creado» pero no guarda | Aviso «el IMEI no se movió», contado como error, sin reenvío |
| B1 equipo nuevo con la casilla | 1 entrada en el Taller con precio 8500 y serial; aviso «Entrada en Info Plus, almacén Taller · AI…» |
| B2 IMEI que ya está en Info Plus | Bloqueado antes de guardar nada |
| B3 sin la casilla | Se registra igual que antes, sin tocar Info Plus |

- Sin errores de consola.
- **No verificado contra el Info Plus real:** no se escribió nada allá. La primera prueba real necesita el OK del dueño.

## Estado
- Rama `claude/ajuste-imei`. Espera el «Publícalo».
