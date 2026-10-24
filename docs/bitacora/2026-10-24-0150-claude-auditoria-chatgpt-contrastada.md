# 2026-10-24 01:50 (RD) — Auditoría de ChatGPT sobre la Prefactura, contrastada con el código real (solo lectura)

## Pedido del dueño
ChatGPT auditó el taller y pidió corregir 17 hallazgos. Por la regla de puntos de control, primero se contrastó cada uno con
`main` (398ba9e) con tres revisores en paralelo. **No se cambió código.** El dueño decide qué se corrige.

## Resultado
| # | Hallazgo | Veredicto | Evidencia |
|---|---|---|---|
| A1 | Dice «✅ creada» y limpia la pantalla aunque falle el guardado del historial | **Cierto** | `taller-app.js` ~20729-20737: el `catch` solo hace `logError`; el toast sale igual; con equipo sigue `guardarRecepcion` → `limpiarRecepcion` |
| A2 | Doble clic / reintento crea prefacturas duplicadas en Info Plus | **Cierto** | `_rpCrearPrefactura` no revisa `estado==='actualizando'`; botones sin `disabled`; `codprefactura` se asigna tras la respuesta |
| A3 | Enviar, guardar e imprimir no usan el mismo documento | **Parcial** | Impreso/WhatsApp usan el `model` capturado (`_rpUltima`); el historial y el teléfono se leen de pantalla después del `await` |
| A4 | Sin recuperación de operaciones a medias | **Cierto** | Tras error no queda rastro local del Nº creado; el siguiente intento crea otra |
| B1 | `imprimirPrefactura('blob')` imprime o devuelve booleano | **Cierto y grave** | `bc-prefactura-imprimir.js` pisa `imprimirPrefactura` y no conoce `'blob'`: imprime ticket/carta y devuelve true/false. Con chat abierto, el envío automático adjunta un archivo que no es PDF |
| B2 | No se comprueba que el adjunto sea PDF | **Cierto** | `if(blob)` deja pasar `true`; `_waSubirAdjunto` no valida tipo ni tamaño |
| B3 | Al cargar otra prefactura quedan datos del cliente anterior | **Parcial** | `set()` ignora vacíos y nada limpia `c_*`/`e_*` al cargar del historial |
| B4 | Destinatario del WhatsApp tomado de pantalla, no del documento | **Cierto** | `_rpEnviarWhatsApp` lee `c_whatsapp` del DOM |
| C1 | IMEI validado solo en el navegador | **Cierto** | Edge `infoplus-prefactura-crear` (fuera del repo, v15) reenvía el modelo tal cual |
| C2 | Al cambiar almacén no se revalidan IMEIs | **Cierto (solo admin)** | `rxAlmacen onchange` solo re-renderiza; para empleados el almacén está fijo |
| C3 | Tope de descuento se salta al cambiar precio/cantidad/artículos | **Parcial** | El % por línea siempre ≤ tope; el descuento en pesos puede quedar por encima si baja el subtotal; no hay recheck al guardar |
| C4 | Descuentos mal guardados | **Falso** | Diseño decidido (REGLAMENTOS §2.2): un solo % de cabecera + pesos; historial guarda `descPct` y `descuento_monto`. Menor: columna `descuento` sin llenar |
| C5 | Se muestra «sincronizado» un comentario que Info Plus no aplicó | **Parcial / decisión del dueño** | El dueño pidió bloquear «solo el descuento» (22-oct); hay banner ámbar permanente, pero el toast dice «actualizada» |
| D1 | Técnico no se guarda; no se espera la orden | **Cierto** | `rxTecnico` nunca se lee para el insert; `guardarRecepcion(false)` sin `await` |
| D2 | Reimprimir imprime la última, no la seleccionada | **Cierto** | `_rpImprimir` usa `_rpUltima`; cargar del historial no la actualiza |
| D3 | No se detecta cuándo caja la facturó | **Cierto (pendiente conocido)** | Nada escribe `estado='facturada'`; Info Plus no expone facturas → Dagoberto |
| D4 | Permisos por sucursal solo en pantalla | **Parcial** | Almacén fijo solo con `disabled`; sin RLS por sucursal; admins libres y técnicos sin prefactura son decisiones del dueño |

Total: 10 ciertos, 5 parciales, 1 falso, 1 pendiente externo.

## Propuesta (el dueño elige)
1. **Urgente (hoy):** B1+B2 (PDF por WhatsApp), A1+A2 (sin éxito falso, candado de doble clic), B3 (limpiar al cargar), D2 (reimprimir la elegida), C3 (tope al guardar). Todo en el navegador, se prueba en el banco local.
2. **Siguiente:** D1 (técnico + esperar orden), A3/A4/B4 (documento único y recuperación), B4.
3. **Servidor:** C1 y D4 en la Edge `infoplus-prefactura-crear` (hay que traerla al repo primero), C2.
4. **Depende de Dagoberto:** D3. **Decisión del dueño:** C5.
