# 2026-10-23 16:15 (RD) — Prefactura: textos de garantía «smart» (celular / pieza)

## Pedido del dueño
«Cuando el sistema prefacture un celular, salga un texto de garantía del celular; cuando sea pantalla, el texto de eso; y si hay
de los dos, salgan los dos. Como algo smart.» Se le dieron 3 opciones; se hizo la **A (automático, sin casillas)**. El texto de
celulares lo redactó el dueño; el de piezas es un borrador de Claude que puede corregir en Configuración.

## Cómo decide
Por cada línea de la prefactura (`bc-prefactura-imprimir.js`, `garantias()`):
- **Celular:** la línea tiene IMEI, o el nombre empieza por CELULAR, TELÉFONO, SMARTPHONE, IPHONE, SAMSUNG, XIAOMI, REDMI, MOTOROLA, HUAWEI, HONOR, TECNO, INFINIX, REALME, OPPO, VIVO, ONEPLUS, PIXEL, NOKIA, ALCATEL, ZTE, BLU, TCL.
- **Pieza / reparación:** el nombre contiene pantalla, display, LCD, touch, batería, flex, conector, pin de carga, cámara, bocina, micrófono, tapa, carcasa, marco, bandeja, botón, vibrador, antena, sensor, reparación, cambio de, instalación, servicio o mano de obra.
- Accesorios (cargador, cable, cristal, protector) no llevan texto.
- Sale el texto de celular, el de pieza, los dos o ninguno. El mismo criterio para el ticket y la hoja carta.

## Archivos
- `supabase/migrations/20261023160000_config_garantias.sql`: columnas `garantia_celular` y `garantia_pieza` en `config_taller` (**ya aplicadas** en el proyecto `vkhwdvjtowrhkhqavnvk` con el conector; vacías = texto estándar).
- `taller.html`: dos cuadros nuevos en Configuración → Datos del taller; versiones `taller-app.min.js p34`, `bc-prefactura-imprimir.js i9`.
- `taller-app.js` → `cargarDatosTallerEnForm()` / `guardarDatosTaller()` leen y guardan los dos textos (minificado con `scripts/minificar.sh`).
- `bc-prefactura-imprimir.js`: textos estándar `GAR_CEL` y `GAR_PZA`, detección `garantias()`, bloque `.gar` en el ticket (antes del pie) y tarjetas `.garc` en la hoja carta (antes de «Gracias»).

## Pruebas (banco local, `pf-pc/garantia.cjs`)
| Caso | Celular | Pieza |
|---|---|---|
| IPHONE 12 PRO con IMEI | sí | no |
| CELULAR SAMSUNG A15 sin IMEI | sí | no |
| PANTALLA IPHONE 12 PRO | no | sí |
| REDMI NOTE 13 (IMEI) + BATERIA IPHONE 11 | sí | sí |
| CARGADOR + CRISTAL TEMPLADO | no | no |
| TAPA TRASERA PHONE 12 PRO | no | sí |
0 errores JS. Capturas: `garantia-ticket.png`, `garantia-carta.png` (scratchpad de la sesión).

## Publicación
Rama `claude/garantia-prefactura`, **sin publicar**. Falta el «publícalo» del dueño.

## Pendientes
- El dueño revisa/corrige el texto de piezas (Configuración → Datos del taller).
- Si aparece un celular con nombre raro y sin IMEI, agregar la marca a la lista (`RE_CEL`).

## Añadido 16:25 — texto de piezas del dueño
El dueño mandó su propia redacción de «GARANTÍA DE LA PIEZA»; reemplaza el borrador como texto estándar (`GAR_PZA`).
