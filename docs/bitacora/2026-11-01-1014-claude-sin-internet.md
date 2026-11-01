# 1-nov-2026 · Claude · Animación «Sin conexión» en el taller

## Pedido del dueño
- «Ponlo en taller cuando no haya internet». Se refiere a la animación del wifi tachado que se hizo en el chat (bucle de 4 s: escanea, raya roja con sacudida, «No connection», vuelve a buscar).

## Lo que ya había
- `taller-rapidez.js` ya muestra un aviso pequeño rojo arriba: «Sin internet. Lo que guardes ahora no se guardará.» y «Conexión de vuelta» al volver. **No se tocó.**

## Qué se hizo (capa nueva, reversible)
- `bc-sin-internet.js` + `bc-sin-internet.css` (`?v=20261101-sin1`), activa con `html.bc-sin`.
- Para apagarla: `BC_SIN=false` en `taller.html`, o en un equipo `localStorage.bc_sin_off='1'`.
- Al quedarse sin internet (evento `offline`, o `navigator.onLine=false` al abrir) aparece una ventana centrada con la animación, en español:
  - dice «Buscando…» y luego «Sin conexión»;
  - debajo, «Se quita sola al volver el internet.» y el botón «Seguir trabajando» (44 px; también cierra con Esc).
- La ventana se quita sola al volver el internet. Si se cierra y se vuelve a ir el internet, sale otra vez.
- Con «reducir movimiento» se ve quieta, en el cuadro de «Sin conexión».
- No toca guardar, datos ni Supabase. Solo avisa.
- El aviso es solo para cuando **no hay internet**. Cuando el servidor no contesta, sigue el aviso pequeño de siempre.

## Pruebas
- `scripts/pruebas/sin-internet.cjs`: **19/19 OK** a 390 y 1280 px. Revisa:
  - no aparece con internet;
  - aparece sin internet y cabe sin desborde;
  - el botón mide 44 px y la animación se mueve;
  - «Seguir trabajando» la cierra y vuelve a salir si el internet se va otra vez;
  - se quita al volver el internet;
  - no hay errores;
  - con reducir movimiento se ve quieta.
- Capturas: `img/2026-11-01-sin-internet/`.

## Estado
- Rama `claude/sin-internet`, **sin publicar**.
