# Raspa y gana — PUBLICADO (30-oct-2026, 16:40 RD)

**Dueño:** autorizó publicar (29/30-oct) y hoy dijo «intenta de nuevo» y tocó Permitir.

- **Base:** migración `20261029200000_raspa_y_gana` aplicada en `vkhwdvjtowrhkhqavnvk`. Verificado: 14 funciones `raspa_*`, cron `raspa_auto_activar` (minuto 17 de cada hora), `anon` puede `raspa_ver`/`raspa_jugar` y NO `raspa_emitir`.
- **Pantallas:** PR #147 fusionado con `main` (conflictos solo en `taller.html` y `MEMORIA.md`: se conservan las capas de hoy —prefactura pro, etiquetas— y se agregan `bc-raspa.css/js` r1 y `bc-prefactura-imprimir.js` i12).
- **Pruebas sobre la mezcla:** `raspa-y-gana.cjs` pasa todo menos el QR y «sin errores de consola»: el Chromium del banco no puede bajar `qrcodejs` de cdnjs (certificado del proxy). Con `ignoreHTTPSErrors` el mismo `QRCode` genera la imagen (5 990 caracteres). `prefactura-confiable` sin errores; `ui-global` «Todo bien».
- **Pendiente:** prueba real (prefactura de RD$500+ → imprimir → escanear QR → raspar → canjear en otra compra) y la prueba autorizada en Info Plus del descuento de cabecera con accesorio gratis.
