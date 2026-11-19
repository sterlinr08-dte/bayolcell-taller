# 19-Nov-2026 14:06 (RD) — Claude — Menú estilo 5 «Expanding» (pulido de la PC)

## Pedido
- Reel `Df5TYQDoAQ3`: el dueño eligió el estilo 5 para el taller.
- Después: «Sigue con el menú 5 del taller».

## Lo que había
- Desde el 9-oct-2026 (`taller-sidebar-mini.css/.js`, clase `html.bcm-mini`), en la PC (≥1025 px) el menú ya es una columna de iconos de 76 px.
  - Se abre flotando con los nombres al pasar el ratón: es el estilo 5.
  - La chincheta «Fijar menú» lo deja abierto (`bc_menu_fijo`).
  - En la captura del dueño se veía abierto: probablemente estaba fijado.
- Celular: cajón con ☰ (sin cambios).

## Decisión del dueño
- Se le ofreció:
  - «Pulir PC»;
  - «Pulir PC + riel en celular»;
  - «Dejarlo como está».
- Eligió **«Pulir PC»**.

## Cambios
- `taller-sidebar-mini.css`, solo ≥1025 px. Se puede apagar en un equipo con `localStorage.bc_menu5_off='1'` (clase `html.bcm5-off`).
  - La píldora que marca la opción elegida (`.bc-motion-pill`) deja el degradado naranja lleno.
  - Pasa a fondo blanco al 10 % con un filo naranja `#FF6B35` de 3 px a la izquierda, como en la referencia.
  - El nombre de la opción elegida va en blanco y negrita, y su icono en naranja `#FF8D69`.
  - Al pasar sobre las demás opciones: fondo blanco al 6 %.
  - Al abrirse la columna, los nombres, títulos, marca y usuario entran con un desvanecido de 0,2 s; sin animación si el equipo pide menos movimiento.
- `taller-sidebar-mini.js`: lee `bc_menu5_off`.
- Versiones:
  - `taller.html`: `taller-sidebar-mini.css?v=20261119m5`;
  - `crm-marketing-consent.js`: `taller-sidebar-mini.js?v=20261119m5`.

## Pruebas
- Taller servido en local con sesión de administrador de prueba y base vacía simulada, a 1280 px:
  - cerrado: iconos, con la opción elegida en píldora suave y filo naranja;
  - abierto al pasar el ratón: nombres con el mismo estilo;
  - botones de 44 px de alto.
- 390 px: cajón del celular sin cambios (captura comparada).
- Sin errores de consola.
- No verificado con datos reales ni con la sesión del dueño.

## Estado
- Rama `claude/menu-expanding`. Espera el «Publícalo».
- Para verlo en la PC del dueño: si el menú sale abierto, tocar la chincheta para dejarlo en iconos.
