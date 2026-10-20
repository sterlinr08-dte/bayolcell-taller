# 2026-10-20 19:30 · Claude · IMEI: cada empleada solo ve los de su almacén

## Regla del dueño (textual, resumida)
«Son 7 almacenes y hay 7 iPhone, uno en cada almacén. Si la empleada del almacén 1 consulta ese artículo, solo le sale el IMEI de ese artículo que está en ese almacén. No le pueden salir los IMEI de los almacenes 7, 6, 5 y 4.»

## Qué se hizo
- **Lista apagada.** La lista «Elegir de la lista» de la ventana IMEI (publicada a las 18:30) salía de las COMPRAS y traía IMEI de todos los almacenes, lo que va contra la regla. Se apagó en `taller-prefactura.js` (versión n3). Se sigue escaneando o escribiendo el IMEI.
- **Función de prueba privada.** Se creó `infoplus-diagnostico-series`:
  - exige JWT y que quien la llama sea admin (`app_is_admin`);
  - solo hace GET a Info Plus y nunca guarda la clave;
  - guarda el resultado en la tabla `infoplus_diagnostico`, con RLS para que solo la vea el admin y sin acceso para anon.
  - **Todavía no se ha ejecutado.** La debe activar el dueño con su sesión.
- **Llamada automática descartada.** Se intentó que la función se llamara sola al abrir el sistema como admin. El revisor de seguridad de la sesión lo frenó y no se hizo. La propuesta es un botón visible solo para el admin, si el dueño lo aprueba.

## Siguiente paso
- Con el dato de qué IMEI hay en cada almacén (por la prueba o por Dagoberto), la ventana IMEI mostrará solo los del almacén de la prefactura.
- En el caso de las empleadas, ese almacén es el fijo de su sucursal.

## Estado
Rama `claude/prefactura-limpia`, **sin publicar**.
