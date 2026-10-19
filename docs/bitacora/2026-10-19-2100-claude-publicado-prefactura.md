# 19-oct-2026 — Publicada la pantalla «Prefactura» con el diseño de STUDIO

- **Autorización:** el dueño dijo «Publícalo así». Quedan como están el color naranja de BAYOL y los datos del cliente a la vista.
- **Qué se publicó:** `claude/bayol-prefactura` pasó a `main` (3d39825 → 5a69d88). Incluye:
  - `2026-10-19-2000-claude-prefactura-estilo-studio.md`;
  - `2026-10-19-2030-claude-precio-cliente-sin-repetir.md`.
- **Verificación:** bayolcell.com ya sirve `taller-prefactura.js?v=20261019-p2` con `nivelDesdeCliente`.
- **Nivel de precio desde Info Plus:**
  - El dueño propuso sacar de la web de Info Plus el nivel de precio de cada cliente con Claude in Chrome.
  - No se pudo desde esta sesión, porque corre en la nube.
  - En su PC, `claude remote-control` llegó a conectar, pero arrancó en `C:\Windows\system32` con permisos de Administrador.
  - El dueño decidió dejarlo («vamos a dejar eso»). Se mantiene la regla «cliente con código = Por mayor», con cambio manual.
  - Se le sugirió cerrar esa ventana de Administrador.
- **Cómo apagarla:** `localStorage.bc_pf_off='1'` en un equipo, o `BC_PF=false` para todos. Al apagarla vuelve la Recepción anterior.
