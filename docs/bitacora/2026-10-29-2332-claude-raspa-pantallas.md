# Raspa y gana: pantallas (página pública, cupón impreso y canje en la Prefactura)

Sigue a `2026-10-29-2312-claude-raspa-base-probada.md`. Rama `claude/raspa-y-gana`. **Sin publicar, sin PR y sin aplicar la
migración.** No se escribió nada en Info Plus ni en la base.

## Pedido
Construir las pantallas del «Raspa y gana» con el diseño «hoja impresa» que eligió el dueño, sobre las funciones de la migración
`20261029200000_raspa_y_gana.sql` (sin aplicar).

## Qué se hizo
| Pieza | Archivo | Qué hace |
|---|---|---|
| Página del cliente | `raspa.html` (nuevo) | Abre el QR (`?t=`). Estados: pendiente («Su premio se activa cuando la compra se pague en caja…» + código), activo (pide WhatsApp de 10 dígitos → zona plateada que se raspa con el dedo o el ratón), jugado (premio, código, vence, dónde vale y dónde no, «Dejar reseña en Google»), usado, vencido, anulado y no existe. Claro y oscuro. |
| Cupón en la hoja | `bc-prefactura-imprimir.js` | Al imprimir una compra de RD$500 o más pide `raspa_emitir(Nº)` y pone al pie el cupón: línea de tijera «Recorte por aquí», borde perforado, QR, código, zona plateada y «Se activa al pagar esta compra en caja · un juego por compra · vence a los 30 días». En blanco y negro. Sale en ticket, hoja carta, PDF y el PDF que va por WhatsApp. |
| Canje | `bc-raspa.js` + `bc-raspa.css` (nuevos), cargados después de `taller-prefactura.js` | Píldora «Premio Raspa y gana» en la barra de acciones de la Prefactura. Ventana con «Código, QR o teléfono» → `raspa_buscar`. Muestra el premio y, línea por línea, el % que aplica (mínimo entre el premio y `raspa_topes`) o «No aplica». «Aplicar a esta prefactura» pone el % en esas líneas, o agrega el templado 1582 o el cable 1021 (el cliente escoge) con 100 %. Avisa «Ya usado» (Nº, fecha, cajera), «Vencido», «Es de esta misma compra», «Sin raspar» y «Pendiente de pago» con «Activar con factura» (`raspa_activar`). El administrador ve «Deshacer canje». |
| Al guardar | `bc-raspa.js` | Si Info Plus guarda la prefactura, llama `raspa_canjear(código, Nº)`. Si el servidor lo rechaza, sale un aviso que no se cierra solo y dice qué hacer. |
| Inclusión | `taller.html` | `bc-raspa.css?v=20261029-r1`, `bc-raspa.js?v=20261029-r1`, `bc-prefactura-imprimir.js?v=20261029-i12`. `taller-app.js` no se tocó (no hubo que minificar). |
| Pruebas | `scripts/pruebas/raspa-y-gana.cjs` (nuevo), `supabase-stub.js` (RPC `raspa_*` simuladas), `README.md` | Ver abajo. |

## Decisiones técnicas
- **El premio lo decide el servidor antes de raspar.** `raspa_jugar` se llama al tocar «Jugar»; raspar solo lo descubre. Se revela al
  raspar la mitad o con el botón «Descubrir premio» (teclado y lectores de pantalla; aviso con `aria-live`). Con «reducir movimiento»
  no hay animación.
- **La página pública** usa la clave publicable (la misma del taller) con `fetch` a `/rest/v1/rpc/raspa_ver` y `raspa_jugar`.
  Nunca service_role. No carga librerías.
- **Impresión sin bloqueo:** la ventana de impresión se abre al momento (para que el navegador no la bloquee) y se llena cuando llega el
  cupón. Si el servidor falla, no hay red o tarda más de 3.5 s, se imprime sin cupón. Con QZ Tray, igual. El QR se dibuja con qrcodejs
  fuera de pantalla y se inserta como imagen.
- **Tope de descuento:** `_rpProblemasFactura` rechazaba un descuento mayor que el máximo general (`_rpDescMaxPct`, 10 % por defecto).
  Se envuelve para que el descuento **del premio** no cuente en ese tope. El resto del descuento (por línea o en pesos) sigue con el
  tope de siempre. El premio respeta su propio tope por artículo (5 o 10).
- **Solo en una prefactura nueva.** Info Plus no cambia el descuento de una prefactura ya enviada (bitácoras del 22-oct), así que la
  ventana no deja aplicar el premio si la prefactura ya tiene Nº.
- Si se borran las líneas del premio o se cambia su % a mano, el premio deja de estar aplicado y no se canjea.
- Apagar todo: `localStorage.bc_raspa_off = '1'` o `BC_RASPA = false` (sin píldora, sin cupón y sin llamadas).

## Aviso honesto sobre Info Plus
- El sistema **no manda el % por línea** a Info Plus: desde el 22-oct todo el descuento va en la cabecera como un solo %, y las líneas
  van con 0 (`_rpArmarModelo`). El accesorio gratis llega a Info Plus como parte de ese % de cabecera, no como «100 % en la línea».
- **No se probó contra Info Plus real** (no se escribió en Info Plus). Falta confirmar con una prueba autorizada que:
  1. Info Plus acepta un % de cabecera grande cuando la compra es pequeña (por ejemplo, un cable gratis con una lámina);
  2. acepta una prefactura que queda en RD$ 0.00 si el cliente solo se lleva el accesorio gratis (la ventana avisa en ese caso);
  3. el descuento repartido en la cabecera no afecta los reportes por artículo que use el dueño.

## Pruebas (banco local, datos inventados)
`node scripts/pruebas/raspa-y-gana.cjs` → **Todo OK** (página pública a 390 claro, 390 oscuro y 1280; taller a 1280 y 390).
También `prefactura-confiable.cjs` sigue igual (T1–T8 sin errores).

| Medida | 390 px | 1280 px |
|---|---|---|
| Página: borde de la tarjeta al contenido | 24 / 16 | 48 / 40 |
| Ventana de canje: borde al contenido | 24 / 16 | 48 / 40 |
| Etiqueta → campo | 8 | 8 |
| Búsqueda → resultado (grupo) | 24 | 24 |
| Campos | 48 px, letra 16 | 48 px, letra 16 |
| Botón principal («Jugar», «Dejar reseña», «Aplicar») | 54 | 54 |
| Lo más chico que se toca | 44 (✕ y botones) | 44 |
| Letra mínima en la página | 13 | 13 |
| Desplazamiento horizontal | no | no |

Sin exclamaciones en los textos; trato de usted; etiquetas sin mayúsculas. 0 errores de consola.

Capturas (equipo de pruebas): `…/scratchpad/raspa/pantallas/` — `publica-*`, `hoja-carta-con-cupon.png/.pdf`,
`hoja-ticket-con-cupon.png`, `canje-*`.

## Riesgos y pendientes
- **Aplicar la migración** `20261029200000_raspa_y_gana.sql` (con el `cron` de activación cada hora) solo con «publícalo».
- Prueba real de punta a punta tras aplicarla: imprimir una prefactura de RD$500+, escanear, raspar, canjear en otra compra.
- Prueba autorizada en Info Plus del descuento de cabecera con accesorio gratis (ver arriba).
- El canje se marca **al guardar la prefactura**, no al cobrar. Si el cliente no paga, el administrador usa «Deshacer canje».
- Confirmación del dueño del reparto 80 / 15 / 5 y del tope de 3 accesorios gratis por día (sigue pendiente de su OK explícito).
- Medir en un iPhone real (la raspa con el dedo y el teclado numérico).
- Los artículos que nunca se han vendido no tienen categoría en `infoplus_ventas`: la base les da tope 0 («No aplica»).
