# Regla «Espaciado de formularios» en el resto de formularios de Bayol Cell (30-oct-2026, 09:46 RD)

**Rama:** `claude/espaciado-todos` (desde `origin/main` `bc300eb`). **Sin publicar, sin PR.** No se tocó la base, Info Plus ni la lógica JS.
Sigue al piloto de 5 formularios (bitácora 2026-10-30-0802, PR #145). El dueño dijo «sí» a pasar la regla a los demás.

## Qué se hizo
- Se **amplió la misma capa** `bc-form-espaciado.css` (sube a `?v=20261030-e2`), con el mismo interruptor `BC_FESP` / `localStorage.bc_fesp_off='1'`.
  Secciones nuevas: **6** todas las ventanas estándar (`.modal-backdrop > .modal-box > .modal-header/.modal-body/.modal-footer`, `.form-row`,
  etiquetas, rejillas en línea, casillas §4b, pie transparente a 24 del último contenido, botones del pie 44/54 y 8 entre ellos, cajones vacíos sin
  hueco); **7** ventanas con cuerpo propio (buscadores, Asiento/Apertura, Generar asientos, Rol, Asignar, MDM, Catálogo web, Despachar teléfonos,
  Nuevo empleado RRHH); **8** pantallas del taller con formulario en tarjeta (Etiquetas, Configuración general, Despachos, Inventario físico,
  Liquidación, Rifa por factura, Impresora, Incentivos, Mis incentivos, Financiamientos consulta y configuración); **9** páginas públicas
  (catálogo, tienda, campañas del CRM, autoevaluación, inicio «Consulta tu boleto», solicitud web), cada una con su clase `bc-pag-*` para que
  ninguna regla se cuele en el taller.
- La hoja se carga ahora también en `index.html`, `catalogo.html`, `tienda.html`, `solicitud.html`, `autoeval.html` y `crm-campanas.html`
  (mismo `<script>` del interruptor + `<link>` al final del `<head>`).
- **Mismas interpretaciones del piloto:** barra de título de color = barra (el relleno se mide debajo); pie transparente a 24 px del último
  contenido; casillas en fila dentro de tarjeta de 48 (la lista de permisos de «Nuevo rol» se queda como lista, con filas de 44); interruptores = zona de
  toque 44. Solo espacios, altos y letras: nada de colores de marca ni lógica.
- **«Todo smart», solo lo que es CSS/atributo seguro.** En `taller.html` estático se agregó `inputmode` (teclado correcto en el iPhone), sin tocar JS:
  `inputmode="tel" autocomplete="tel"` en `rf_whatsapp`, `c_whatsapp`, `cfgTallerTel`, `mod_tec_telefono`, `waContactoTelefono`, `mod_prov_whatsapp`,
  `rifaTelefono`; `inputmode="decimal"` en `rgto_monto`, `gs_monto`, `mef_monto`, `rex_costo`, `mod_art_precio`, `mod_art_precio_especial`,
  `mod_art_costo`, `eq_costo`. No se tocaron cédula/RNC (llevan guiones) ni IMEI/serial (pueden ser letras).
- Extra de «sin nada cortado»: en Liquidación de aduana la rejilla de 4 campos pasa a 2 columnas en el celular; los encabezados ordenables de la tabla miden 44.

## Qué quedó fuera (marcado)
- **Chat de WhatsApp del CRM** (`#waWrap` y sus ventanas Reenviar mensaje, Enviar adjunto, Compartir contacto).
- **Diagnóstico** (visor de placa con IA: herramienta, no formulario) y **Evaluando equipo** (ventana de proceso con pestañas de la capa de
  reacondicionados; solo se le ajustó el pie).
- No hay pantallas de dinero sin datos de prueba: todas las ventanas de contabilidad, cuentas por pagar y compras abrieron con el banco simulado.

## Medición (Playwright, Supabase simulado, 390 y 1280 px, tolerancia ±2; 74 formularios de la auditoría del 29-oct)
Medidor: el de la auditoría más los ajustes del piloto y tres afinaciones documentadas: (1) el botón principal de una ventana con pie es el de color
(`btn-blue/success/teal`); (2) «grupo → botón» se mide desde el **último contenido** del cuerpo (una casilla o un aviso también son contenido), no solo
desde la última cajita; (3) la ⓘ del título (margen negativo) y los adornos absolutos no cuentan como contenido, y las etiquetas que llevan la ⓘ sí
cuentan como etiquetas; en `index.html` la tarjeta medida es `#rifa` (la auditoría tomaba la sección entera).

| | cumple | casi | no cumple | no medible |
|---|---:|---:|---:|---:|
| **Antes** (`origin/main`, con el piloto) | 6 | 0 | 68 | 0 |
| **Después** (rama) | **55** | 1 | 18 | 0 |
| **Capa apagada** (`bc_fesp_off=1`) | 1 | 0 | 73 | 0 |

Con la capa apagada queda el estado sin ninguna capa de espaciado (igual que la auditoría del 29-oct: 1 cumple, 73 no); el interruptor apaga también el piloto.

### Los 19 que no llegan a «cumple», con motivo
| Formulario | Antes | Después | Motivo |
|---|---|---|---|
| Reenviar mensaje / Enviar adjunto / Compartir contacto (WhatsApp) | no cumple | no cumple | excluidos: chat de WhatsApp del CRM |
| Diagnóstico | no cumple (8) | no cumple (8) | excluido: herramienta (visor de placa), no formulario |
| Evaluando equipo (reacondicionados) | no cumple (10) | no cumple (6) | excluido: ventana de proceso con paneles propios; pie ajustado |
| Vista previa del label (diagnóstico) | no cumple (12) | no cumple (5) | panel de calibración anidado dentro del cuerpo gris |
| Asiento de apertura | no cumple (10) | no cumple (4) | títulos de grupo «Activos/Pasivos» detectados como etiquetas; los espacios ya cumplen |
| Registrar equipo existente | no cumple (12) | no cumple (2) | falso positivo: la etiqueta «IMEI» (sigla) se toma por MAYÚSCULAS |
| Importar compra de Info Plus | no cumple (7) | no cumple (3) | «Buscar» va en línea con las cajitas de 48 (54 lo desalinearía) |
| Ajuste rápido de inventario | no cumple (9) | no cumple (1) | en PC hay una lista entre dos campos (contenido, no hueco) |
| Despachar teléfonos | no cumple (10) | casi (2) | entre campos hay buscador, barra y lista (mediana 21) |
| Validar tickets | no cumple (4) | no cumple (2) | falso positivo: adorno de 3×14 en la píldora de filtro |
| Label rápido del equipo | no cumple (10) | no cumple (2) | falso positivo: el número de tamaño entre − y + |
| Liquidación de aduana | no cumple (14) | no cumple (7) | pantalla de tabla con barra de botones; «Guardar» es un botón chico más |
| Incentivos / Mis incentivos | no cumple (10/10) | no cumple (2/1) | rótulo de grupo «Servicios» entre dos filas (20 + rótulo + 8) |
| Financiamientos · Consulta | no cumple (8) | no cumple (6) | título junto a ícono de 38 px; caja «Monto a financiar» entre campos |
| Solicitud de financiamiento (web) | no cumple (8) | no cumple (4) | campos de 58/20 a propósito (página para el cliente); casilla de permiso entre campos |
| Consulta de boletos (inicio) | no cumple (8) | no cumple (5) | página oscura: la frase de ayuda hace de etiqueta (15 px, gris claro); en PC la tarjeta se estira a la altura de la vecina |

## Comprobaciones
- 15 ventanas representativas: se desplazan por dentro cuando hace falta, caben en la pantalla y el botón principal (54 px) queda visible al llegar abajo, a 390 y 1280.
- Sin desplazamiento horizontal en las 15 ventanas, en las 10 pantallas con formulario ni en las 6 páginas públicas (la fila de pestañas de
  Financiamientos ya desbordaba dentro de su vista en `main`; no cambia con esta capa).
- Banco de pruebas (todas en verde): `prefactura-confiable` 8/8, `ui-global`, `app-movil`, `codigo-vendedor`, `diagnosticos-lote`,
  `flow-financiamiento`, `label-sin-color`, `reacond-fase2`, `reacond-flujo-completo`, `reacond-proceso`, `reacond-ui`, `solicitud-web`, `solicitudes-crm`.
- Capturas antes/después de los 74 (390 y 1280) y comparativas lado a lado de 10 representativos (Cambiar contraseña, Crear artículo, Registrar gasto,
  Nuevo rol, Nuevo empleado RRHH, Deuda manual, Catálogo web, Etiquetas, Nuevo despacho, Campañas) en
  `/tmp/claude-0/-home-user-nexus-pro/93030ade-f60e-5c69-95e5-b8cd3ec95121/scratchpad/espaciado-bayol-todos/` (`antes-*.png`, `despues-*.png`,
  `comparativa-*.png`, `antes.json`, `despues.json`, `apagado.json`, `estado-formularios.json`, `scroll.json`, programas `medir-todos.cjs`,
  `scroll-todos.cjs`, `comparar-todos.cjs`).

## Revisión «todo smart»
1. Piensa por el usuario: teclado de teléfono y de decimales en 15 campos; lo demás (autocompletar, formatos) es JS y no se tocó.
2. Elegante: la regla de espaciado en 55 formularios; pie sin franja gris; casillas en tarjeta.
3. iPhone y PC: medido a 390 y 1280; rejilla de aduana a 2 columnas en el celular.

## Riesgos / pendientes
- Las ventanas crecen (relleno 48/40 en PC y pie de 24 + 48): más desplazamiento en el celular en Crear artículo, Nuevo empleado RRHH, Label de venta.
- Las casillas en tarjeta cambian el aspecto de «Activa», «Mostrar en el catálogo», ITBIS, etc. (igual que el piloto); el dueño decide si le gusta.
- No probado en iPhone real ni con los íconos Tabler (no cargan en el banco).
- Los 19 de la tabla quedan como están o necesitan cambio de HTML/JS (no CSS): se deja a decisión del dueño.

## Cómo apagarlo
Un equipo: `localStorage.bc_fesp_off='1'` y recargar. Todos: `BC_FESP=false` en cada HTML (o quitar el `<link>`).

## Siguiente paso
Que el dueño vea las comparativas y diga si publica, y qué hacer con los 19 de la tabla.
