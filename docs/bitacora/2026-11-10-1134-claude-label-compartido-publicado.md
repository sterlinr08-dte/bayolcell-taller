# Claude · «Imprimir label» con accesos compartidos: publicado

## Autorización
El dueño contestó «Sí, aplícalo y publícalo» (10-nov-2026).

## Qué se hizo
- **Base** (proyecto del taller): migración `config_label_estados` aplicada. Columna nueva `config_taller.label_estados jsonb` (vacía) y candado `config_taller_label_estados_lista` (lista ≤ 10). Sin tocar datos existentes.
- **Sistema:** PR #289 → `main`, commit `50d1c468aed43cb206fdef59513758f7e41a1960`.
- Antes, el mismo día: PR #288 (ventana ajustada y texto de estado smart, `4864091…`).

## Verificación en vivo (solo lectura de archivos)
`bayolcell.com/taller.html` trae `taller-app.min.js?v=20261110-ab5` y ese archivo contiene `label_estados`.

## Para deshacer
- Lo smart, en un equipo: `localStorage.bc_lr_smart_off='1'`.
- La lista compartida: `alter table public.config_taller drop column label_estados;` (el sistema vuelve a la lista de cada equipo).

## Pendiente
- Prueba del dueño con la impresora real y en iPhone.
- La lista compartida se refresca en otra computadora al entrar o actualizar, no al instante.
