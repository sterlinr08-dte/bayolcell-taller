# 2026-10-24 02:50 (RD) — Prefactura: guardado confiable, PDF por WhatsApp, reimpresión, técnico y barra del menú (rama, SIN publicar)

## Pedido del dueño
«Haz el 1 y el 2 de una vez, y vamos a mejorar esa barra de scroll» (sobre la auditoría contrastada en la bitácora
`2026-10-24-0150`). Rama `claude/prefactura-guardado-confiable`, PR para revisión. **No publicado.**

## Qué cambió (taller-app.js → p35→q1, bc-prefactura-imprimir.js i10→i11, taller-prefactura.js i22→i23, taller-sidebar-mini.css m1→m2)
| Hallazgo | Arreglo |
|---|---|
| A2 doble clic | Candado `_rpGuardando` puesto **antes** del primer `await`; `estado==='actualizando'` también bloquea; botones Guardar/Guardar e imprimir y la barra inferior quedan `disabled` mientras dura. Segundo clic: «Ya se está guardando». |
| A1 éxito falso | `_rpGuardarHistorial()` devuelve true/false (reintenta 1 vez). Si falla: estado nuevo `error_historial` («Creada en Info Plus, sin guardar en el taller: toque Guardar»), toast de error con el Nº, **no** se limpia la pantalla ni se crea la orden ni se envía WhatsApp. El aviso de salir de la página también protege este estado. |
| A3 un solo documento | `foto` (items clonados, teléfono, cédula, equipo, IMEI, descuento) tomada junto con el `model` antes de llamar a Info Plus; el historial y el envío automático salen de ahí, no de la pantalla. |
| A4 recuperación | El Nº creado se recuerda en `localStorage.bc_pf_pendientes`; al reintentar, el `model` ya lleva `codprefactura` (Info Plus actualiza, no crea) y el historial busca una fila con ese Nº antes de insertar. Se borra al quedar guardado. |
| B1 PDF | `bc-prefactura-imprimir.js` reconoce `'blob'` → `pdfBlob()` (hoja carta en memoria, sin imprimir ni abrir ventana); expone `window.bcPfPdfBlob`. En la app, `_rpPdfBlob()` genera el PDF aparte de imprimir. |
| B2 adjunto válido | Antes de subir: debe ser `Blob`, ≥ 1000 bytes y empezar por `%PDF-`; si no, error claro y no se manda nada. |
| B3 cliente anterior | `_rpVaciarCampos()` al cargar una prefactura u orden del historial. |
| B4 destinatario | El WhatsApp sale al teléfono del documento guardado (`_rpUltima.ref.telefono`); si en pantalla hay otro, se avisa y se usa el guardado. |
| C3 tope de descuento | `_rpProblemasFactura()` comprueba el % real del descuento total contra el tope al guardar. |
| D1 técnico y orden | El insert de `ordenes_reparacion` lleva `tecnico_asignado_id` (de `rxTecnico`); `_rpGuardar` hace `await guardarRecepcion(false)` y esta devuelve la orden o `false`. |
| D2 reimprimir | `_rpImprimir()` imprime el documento en pantalla (`_rpDocActual()`): si `_rpUltima` no coincide con el Nº actual, se rearma. |
| Barra del menú | Scrollbar fina (6 px), transparente, pulgar blanco al 18 % (34 % al pasar el ratón); en el menú mini cerrado, invisible. |

## Pruebas (`scripts/pruebas/prefactura-confiable.cjs`, banco local con Supabase simulado) — 8/8 pasan
T1 doble clic → 1 llamada, 1 fila, aviso. T2 historial caído → `error_historial`, sin «✅», Nº pendiente, botones activos; reintento → misma Nº, 1 fila nueva, pendiente borrado. T3 cambiar teléfono y agregar artículo durante la espera → historial con el teléfono y los artículos originales, WhatsApp automático 1 vez. T4 `blob` no abre ventana ni QZ; PDF falso rechazado, PDF bueno (`%PDF-`, 2009 bytes) aceptado. T5 cargar otra prefactura → teléfono y cédula vacíos. T6 reimprime la Nº cargada (222), no la última (111). T7 quitar artículo → aviso de tope. T8 orden con `tecnico_asignado_id` y función devuelve la orden. 0 errores JS.
Nota: en el banco no hay jsPDF (CDN bloqueado), por eso `imprimirPrefactura('blob')` devuelve null ahí; en producción devuelve el Blob.

## Pendiente (no incluido)
- Servidor: validar IMEI, cantidad y sucursal en la Edge `infoplus-prefactura-crear` (no está en el repo; traerla primero). C2 revalidar IMEIs al cambiar almacén (solo admin).
- D3 detectar «facturada» por caja: depende de Dagoberto. C5 aviso de comentario no sincronizado: decisión del dueño.
- Prueba real en la tienda: guardar con Internet lenta, doble clic, enviar por WhatsApp con chat abierto y comprobar que llega un PDF.

## Siguiente paso
El dueño revisa el PR; con «publícalo» pasa a `main`.
