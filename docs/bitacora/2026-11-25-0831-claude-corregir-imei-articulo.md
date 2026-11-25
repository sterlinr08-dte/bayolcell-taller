# 25-Nov-2026 08:31 (RD) — Claude — «Corregir IMEI o artículo» en Info Plus (sin publicar)

## Pedido
- Ideas de uso del ajuste con IMEI: el dueño eligió «el 1 y 2»; la 4 queda para más adelante, anotada en PENDIENTES.md.
  - 1 = corregir un IMEI mal escrito;
  - 2 = pasar un teléfono a otro artículo.

## Cambio (`taller-app.js`, `taller.html`)
- Botón nuevo «Corregir IMEI o artículo», al lado de «Ajuste rápido». Solo administrador.
- **Pantalla:**
  - se elige el almacén;
  - se escribe el IMEI de hoy y se toca «Buscar»: se revisa en vivo que esté en ese almacén y de qué artículo es; si está en otro almacén, lo dice;
  - se escribe el IMEI correcto y/o se elige otro artículo, solo celulares;
  - motivo.
- **Orden de los dos ajustes,** para no perder nunca el teléfono:
  - si cambia el IMEI: primero **entra** el correcto y después **sale** el equivocado;
  - si solo cambia el artículo: primero **sale** y después **entra**, porque Info Plus no acepta el mismo IMEI dos veces.
- Antes de empezar se revisa que el IMEI correcto no esté en ningún almacén, y se pide confirmación.
- Después de cada paso se revisa en Info Plus que de verdad se movió.
- Si el segundo paso falla, aparece «Reintentar el paso que falta».
- Si el teléfono está en Reacondicionados, se le corrigen el IMEI y/o el artículo y el modelo, y se anota en su historial.
- Candado contra el doble toque. Campos de 48 px, letra de 16 px, botón principal de 54 px.
- Versión `taller-app.min.js?v=20261125-cimei1`.

## Pruebas (local, 1280 y 390 px; Info Plus simulado con estado)
| Caso | Resultado |
|---|---|
| C1 corregir el IMEI 3511… → 3522… | Entrada de 3522 y después salida de 3511, en el mismo artículo 3082. En el Taller queda 3522. En Reacondicionados se actualiza el imei |
| C2 pasar 3511… de 3082 a 3090 | Salida en 3082 y después entrada en 3090, con el mismo IMEI. En Reacondicionados se actualizan el artículo y el modelo |
| C3 el IMEI correcto ya existe | Bloqueado, 0 ajustes |
| C4 nada que corregir | Bloqueado |
| C5 falla la salida | Aparece «Reintentar»; al reintentar se completa y el inventario queda bien |
| C6 el IMEI está en otro almacén | «Está en Oficina Santiago. Cambie el almacén» |

- Sin errores de consola.
- **No verificado** contra el Info Plus real. Primero Muse debe confirmar la prueba real del ajuste con IMEI (PR #334).

## Estado
- Rama `claude/corregir-imei`. Espera el «Publícalo».
