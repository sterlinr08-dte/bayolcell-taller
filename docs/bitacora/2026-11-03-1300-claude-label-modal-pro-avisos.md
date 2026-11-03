# 3-nov-2026 13:00 RD — Ventana «Imprimir label» pro + avisos animados (Claude)

## Solicitud del dueño
Captura de la ventana «Vista Previa del Label»: «mejorar la interfaz de esa pantalla y las notificaciones que salen abajo,
ponerle animación». Se le dieron opciones (puntos de control) y eligió: **ventana A «Pro»** y **avisos «isla» abajo al centro**.

## Cambio (rama `claude/label-modal-pro`, sin publicar) — capa nueva `bc-label-modal-pro.js?v=20261103-lp1`
### Ventana (#modalLabelDiag)
- Encabezado blanco, título corto «Imprimir label» / «Imprimir N labels» (antes «VISTA PREVIA DEL LABEL»), cerrar 46 px.
- La etiqueta se ve grande y real (papel con sombra): zoom calculado al ancho (≈486 px en PC, ≈337 px en 390).
  **Lo impreso no cambia** (se arma aparte: 51 mm ≈ 193 px, verificado).
- «Ajustar medidas» plegado (con «51 × 25 mm · letra 9 px» a la vista); dentro, campos 48 px / letra 16 en 3 columnas.
- Copias con − y + (46×50 px); botón «Imprimir» 57 px naranja Bayol; Enter imprime. En celular: copias y botón en una fila.
- Entrada suave de la ventana (260 ms, curva (.22,1,.36,1)).
### Avisos (#toast, todo el sistema)
- Isla abajo al centro (no la tapa el botón del PDF de la esquina), vidrio oscuro, ícono por tipo (✓ verde, ⚠ rojo, ℹ azul),
  barrita del tiempo restante, pausa con el ratón, un toque la cierra; sube suave y baja suave. Error en rojo y con
  `role=alert`. Quita el emoji inicial repetido. Errores largos duran 6.5 s.
- Envuelve `toast()` sin reemplazarla (sigue funcionando el «Guardando… → Listo ✓» de taller-animaciones).
- Microcopy: «Enviado a la impresora.» (antes «… (igual a la vista previa).»).
- Apagar: `bc_label_pro_off` (ventana) y `bc_avisos_pro_off` (avisos). «Reducir movimiento» = sin deslizar.

## Pruebas
- `scripts/pruebas/label-modal-pro.cjs` 13/13 a 1280 y 390 (título, tamaño, impreso 193 px, plegado, 57/46/≥44 px,
  copias − +, campos 48/16, aviso centrado con ícono, error rojo, toque cierra, sin errores JS).
- label-diag-grande, imprimir-rapido, impresora-estado, diagnosticos-lote, label-sin-color, impresion-facil, ui-global,
  prefactura-confiable, crm-editar-mensaje: bien.
- Capturas: `docs/bitacora/img/2026-11-03-label-modal-pro-1280.png`, `…-390.png`, `2026-11-03-aviso-isla-error.png`.

## Smart (DESIGN.md)
1. Piensa por el usuario: medidas a la vista sin abrir, Enter imprime, copias con un toque. 2. Elegante: vidrio, sombra
de papel, animaciones cortas. 3. iPhone y PC: probado a 390 y 1280.
