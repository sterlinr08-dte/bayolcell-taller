# 21-oct-2026 · Velocidad del taller: modo ligero y efectos que gastaban procesador

## Pedido del dueño
«Corregir la estabilidad y la velocidad del sistema del taller: en mi PC funciona bien, pero en la de Servicio al Cliente se pone lento; otro sistema funciona bien.»
Respuestas del dueño:
- lento **desde que abre**;
- en **todo el sistema**;
- navegador **Google Chrome**.

## Diagnóstico
Auditoría de solo lectura, con un banco de Playwright, el procesador frenado 4x y gráficos por software (como Chrome sin aceleración):
- Aviso «Sin conexión en tiempo real» (`#rtAviso`): 6 animaciones sin fin (una anima `content`) más difuminado. Con el aviso a la vista, el procesador estaba ocupado **14.7 s de cada 20 s**.
- Si la conexión en tiempo real se corta y vuelve, cada reconexión recargaba todo: `loadAll`, 17 consultas.
- Esferas de fondo (`taller-ambient-orb-safe.js`): 3 círculos de 520–870 px con `blur(44px)` que se mueven sin parar, más 11 capas de vidrio que hay que re-difuminar en cada cuadro.
- `bc-reflector.js` recorría y medía toda la página cada 2 s.
- El cargador y la línea de carga seguían animándose estando ocultos.

## Cambios (rama `claude/prefactura-limpia`, sin publicar)
- `taller.html`: **modo ligero** decidido en el `<head>`, antes de pintar.
  - Se enciende solo si el equipo tiene ≤4 núcleos o ≤4 GB, o si los gráficos van por software (SwiftShader, Basic Render, llvmpipe).
  - Se fuerza con `?ligero=1`, se quita con `?ligero=0` y vuelve a automático con `?ligero=auto`; se recuerda en el equipo (`bc_ligero`).
  - En ligero: sin esferas, sin `backdrop-filter` y sin marcas del reflector.
  - Para todos: el cargador oculto y la línea de carga apagada no se animan.
- `taller-app.js` (`?v=20261021-l1`):
  - el aviso de tiempo real queda quieto, sin animaciones sin fin ni difuminado;
  - `_rtRecuperarDatosPerdidos` recarga como máximo una vez por minuto.
- `bc-reflector.js` (`?v=20261021r3`, en `crm-marketing-consent.js`): sin el repaso cada 2 s.
- Versión: `crm-marketing-consent.js?v=20261021-u4`.
- `docs/MEMORIA.md`: modo ligero anotado.

## Pruebas
- Mismo banco y mismos datos (3000 clientes, 400 órdenes):
  - **antes** (main), procesador ocupado 14.73 s de 20 s y 2.17 s en estilos;
  - **después**, 1.09 s y 0.03 s.
- Capturas a 1366 px: el diseño es igual; solo desaparecen las manchas azul y naranja del fondo.
- `node --check` en `taller-app.js` y `bc-reflector.js`.

## Pendiente (siguiente paso, si el dueño quiere)
- Cargar al usarlas las librerías de imprimir y gráficas (jsrsasign, qz, html2canvas, Chart, qrcode; unos 900 KB).
- Esconder el cargador al terminar el primer pintado.
- Paginar las tarjetas de órdenes (hoy se pintan todas).
- Suscripción de mensajes de WhatsApp sin filtro por línea.
- En la PC de Servicio al Cliente:
  - si sale el aviso «Sin conexión en tiempo real», permitir `*.supabase.co` en el antivirus o proxy;
  - revisar la aceleración de gráficos en `chrome://settings/system`.
