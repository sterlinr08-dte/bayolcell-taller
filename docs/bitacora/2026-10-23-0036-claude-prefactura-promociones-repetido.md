# 2026-10-23 00:36 (RD) — Prefactura: el interruptor «Recibir promociones por WhatsApp» salía dos veces

## Pedido del dueño
Captura del interruptor «Recibir promociones por WhatsApp» en la Prefactura: «Eso se repite dos veces».

## Diagnóstico (fuente de verdad)
- El interruptor lo monta `crm-marketing-consent-legacy.js` (`attach()`) junto a **cada** campo de teléfono marcado:
  - `#c_whatsapp` (WhatsApp del cliente, ahora debajo de la franja Cliente · Nivel · Almacén · Vendedor);
  - `#resenaWa` (`data-marketing-consent-phone`), el WhatsApp de la tarjeta «Pedir reseña a un cliente (sin orden)».
- La capa de la prefactura (`taller-prefactura.js`) mete esa tarjeta en el plegable `.bcpf-resena`, que se abre con la
  píldora «Pedir reseña». Al abrirlo aparecía el **segundo** interruptor, igual al de arriba.
- Reproducido en el banco local (Supabase simulado, `taller.html` servido desde el repo) a 390 px: con «Pedir reseña»
  abierto había 2 cuadros `.bc-mkt-consent` visibles (alturas 151 y 152 px). No hay copias del DOM ni doble `attach`.

## Cambio
- `taller-prefactura.css` (n5): `html.bc-pf #v-recepcion .bcpf-resena .bc-mkt-consent { display: none !important; }`.
  El consentimiento se registra una sola vez, con el WhatsApp del cliente de la prefactura.
- `taller.html`: `taller-prefactura.css?v=20261023-n5`.
- Reversible con la capa (`bc_pf_off`). No toca `crm-marketing-consent-legacy.js`, Supabase ni la Recepción clásica.

## Pruebas
- Banco local, 390 px, «Pedir reseña» abierto: WhatsApp del cliente → 1 interruptor visible; tarjeta de reseña → 0.
- Llaves del CSS balanceadas (501/501).

## Publicación
- Arreglo directo en `main` (corrección de algo ya publicado hoy), verificado en vivo tras el deploy.

## Pendiente
- Si el dueño quiere pedir consentimiento a un cliente que **solo** pide reseña (sin prefactura), decirlo: hoy esa
  tarjeta queda sin interruptor dentro de la Prefactura.
