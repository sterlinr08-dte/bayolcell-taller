# 2026-10-27 11:15 (RD) — Publicada la app del celular de los empleados

Dueño: «Publícala» (PR #129; detalle en la bitácora 2026-10-27-1030).

## Supabase (proyecto vkhwdvjtowrhkhqavnvk)
- Migración aplicada en 4 partes (`app_empleados_push_1_tablas`, `_2_rpc`, `_3_destinatarios`, `_4_trigger`), mismo SQL que
  `20261027130000_app_empleados_push.sql`. Trigger `trg_push_mensaje_entrante` activo.
- Edge `push-enviar` **v1** desplegada (verify_jwt true).
- Preparada una vez (`{preparar:true}` con el token del vault): 200, `_push_vapid` con 1 fila, clave pública de 87 caracteres.
  Las claves no pasaron por el chat.
- Prueba con el último mensaje entrante real: 200 `{ok:true, destinatarios:0, enviados:0}` (nadie suscrito todavía).

## Página
- PR #129 y #128 unidos a `main`. En bayolcell.com: `taller.html` carga `taller-app-movil.js?v=20261027-m1`; `sw.js`,
  `taller-app-movil.js/.css` y `taller.webmanifest` responden 200 e **idénticos** a los probados; `taller-app.min.js` trae `solo_movil`.
- Abierto en vivo a 390 px: carga sin errores de página y la capa queda activa. El service worker no se pudo registrar desde
  el entorno de pruebas (el proxy usa un certificado propio que Chrome no acepta para service workers); en un teléfono real no aplica.

## Le toca al dueño
1. Configuración → Roles: en el rol de las empleadas marcar «SOLO Prefactura y CRM» y «Solo ver los chats de SU sucursal».
2. En su iPhone: bayolcell.com/taller.html en Safari → Compartir → Agregar a inicio → abrir el ícono → CRM → «Activar avisos».
3. Escribir desde otro WhatsApp a una línea del taller: debe llegar el aviso. Se revisa `push_suscripciones.ultimo_ok/ultimo_error`.
