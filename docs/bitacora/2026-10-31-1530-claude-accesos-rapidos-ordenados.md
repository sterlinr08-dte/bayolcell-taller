# 2026-10-31 15:30 — Claude — Accesos rápidos de la Prefactura ordenados (Delivery · Servicio · Activar · Recarga)

## Dueño
«Vamos a organizar los íconos que hiciste nuevo en prefactura. Me gustaría que siempre veas que lo haces.»

## Lo que se vio (captura con la fuente de íconos real cargada)
1. **«Activar» no tenía ícono**: `ti-sim` no existe en Tabler 2.47 (salía vacío en producción desde el 31-oct).
   El banco de pruebas bloqueaba la fuente de íconos, por eso no se notó.
2. Cada botón tenía distinta estructura (Servicio sin segunda línea, Activar sin ícono): no quedaban alineados.
3. La fila estaba pegada al campo WhatsApp.
4. En PC eran botones de 140 px a la izquierda, sin cuadrar con «Buscar artículo».
5. Íconos de 4 colores sueltos, sin fondo; Recarga con moneda (se confunde con un pago).

## Cambio
- `taller-prefactura.js` **i32**: íconos `ti-truck-delivery`, `ti-tool`, `ti-device-sim`, `ti-device-mobile-up` dentro de `.ic`;
  nombre en `.nm` y segunda línea `.rp` siempre presente (Servicio: «Precio libre»).
- `taller-prefactura.css` **n19**: los 4 con la misma estructura y altura; ícono en cuadrito de su color (Delivery turquesa,
  Servicio naranja, Activar violeta, Recarga verde); 14 px de separación arriba. Celular: ícono arriba, texto abajo. PC (≥ 900 px):
  4 columnas iguales a lo ancho de «Buscar artículo», ícono a la izquierda. «✓ Agregado» más compacto en celular para que quepa.
- Estados intactos: «✓ Agregado» (verde) y punto naranja de sugerencia.
- Prueba `prefactura-delivery.cjs` actualizada a la nueva estructura (`.nm`, «Precio libre»).

## Pruebas (mirado, no solo medido)
- Capturas antes/después a 390 y 1280 con la fuente Tabler real; estados (sugerido + agregado) a 390 y 1280; ningún texto cortado.
- `prefactura-delivery`, `prefactura-boton-precio`, `prefactura-confiable`, `buscador-motion`: todo bien.

## Lección
El banco de pruebas bloquea la fuente de íconos (CDN): un nombre de ícono inexistente no se ve. A partir de hoy las capturas de
entrega se hacen con la fuente Tabler cargada y se revisan a ojo (regla del dueño: «siempre veas que lo haces»).

## Estado
Rama `claude/rapidos-ordenados`, sin publicar. Falta el «Publícalo» del dueño.
