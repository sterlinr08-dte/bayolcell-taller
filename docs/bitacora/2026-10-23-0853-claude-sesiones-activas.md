# 2026-10-23 08:53 (RD) — Sesiones activas en Configuración › General (rama `claude/sesiones-activas`)

## Pedido del dueño
Referencia Moxen «Quién entra a tu cuenta» → «Bayol Cell, pero por el momento no es necesario que llegue un mensaje al
WhatsApp de que iniciaron sesión».

## Diseño
- No se creó ninguna tabla: Supabase ya guarda cada sesión en `auth.sessions` con navegador (`user_agent`), IP y
  última actividad (`refreshed_at`). Se leen por RPC con `security definer`.
- Tarjeta **Sesiones activas** arriba de «Datos del Taller» (Configuración › General, pantalla de administradores):
  escudo verde (ámbar si hay sesiones sin usar hace más de una semana), contador grande, botones «Actualizar» y «Cerrar
  mis otras sesiones», y una fila por sesión: ícono según el aparato, nombre de la persona (el admin ve a todos),
  tipo de equipo (Teléfono iPhone, Computadora Windows…), navegador, IP, «hace 2 h», etiqueta «Este dispositivo» y botón
  «Cerrar sesión» (44 px). Al cerrar, la fila se desliza y el contador baja.
- El aparato cerrado desde otro lado pregunta cada minuto (y al volver a la pestaña) si su sesión sigue viva
  (`app_sesion_vigente`); si no, avisa y sale solo. Además su token no se puede renovar.
- **Sin aviso por WhatsApp** (decisión del dueño). Sin ciudad: no se manda la IP a servicios externos.

## Base de datos (`supabase/migrations/20261023130000_sesiones_activas.sql`)
| Función | Estado |
|---|---|
| `app_sesiones_listar()` | aplicada y probada: el admin ve 44 sesiones de 8 personas; identidad y `app_is_admin` correctos |
| `app_sesion_vigente()` | aplicada |
| `app_sesion_cerrar(uuid)` | **pendiente: el dueño la pega en el SQL Editor** (`docs/sql/2026-10-23-sesiones-cerrar.sql`) |
| `app_sesiones_cerrar_otras()` | **pendiente, mismo archivo** |
El conector de Claude retiene las sentencias que borran filas (regla conocida), por eso esas dos no entraron.

## Frontend
- `taller.html`: tarjeta + CSS; `taller-app.js` (p24): `_sesCargar/_sesPintar/_sesCerrar/_sesCerrarOtras/_sesComprobarVigente`,
  detector de aparato y navegador por `user_agent`; se carga al abrir la pestaña General.
- Banco local con datos simulados, 390 y 1280 px: 18/18 (4 filas, actual sin botón, botones 44 px, letra ≥13, aviso
  de sesión vieja, iPhone/Android/Edge detectados, al cerrar queda 3). Captura `ses-390.png`.

## Qué falta
1. El dueño pega `docs/sql/2026-10-23-sesiones-cerrar.sql` en Supabase → SQL Editor (sin eso, «Cerrar sesión» da error).
2. «Publícalo».
