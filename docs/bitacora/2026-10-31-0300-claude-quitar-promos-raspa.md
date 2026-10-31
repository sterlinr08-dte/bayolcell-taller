# Prefactura: se quitan «Recibir promociones por WhatsApp» y Raspa y gana (31-oct-2026, 03:00 RD) — rama, SIN publicar

**Dueño (captura de la tarjeta de promociones):** «Ese ícono vamos a quitar, aún no funciona, y también el de Raspa y gana quitar y el QR en la prefactura».

**Qué se hizo (reversible, sin borrar código ni datos):**
- `taller.html`: `<script>var BC_RASPA=false;</script>` → no sale la píldora «Premio Raspa y gana» ni el cupón con QR al imprimir la prefactura (`bc-raspa.js` y `bc-prefactura-imprimir.js` ya respetaban ese interruptor). La base `raspa_juegos`, la página `raspa.html` y el cron siguen igual (sin juegos nuevos no hacen nada). Volver a encender: borrar esa línea.
- `taller-prefactura.css` n18: `.bc-mkt-consent` oculta dentro de la Prefactura (tarjeta del celular y píldora «Promos» de la PC). El resto del sistema no cambia.

**Pruebas (banco, 390 y 1280):** `BC_RASPA=false`, sin píldora Raspa, tarjeta de promociones oculta, campo WhatsApp sigue visible, 0 errores.
