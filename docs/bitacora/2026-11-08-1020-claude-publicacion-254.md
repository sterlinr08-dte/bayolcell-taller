# Publicación del PR #254: visitas sin robots (08-nov-2026, 10:20 RD)

- PR #254 unido a `main` (commit `927a85d`). En vivo, verificado con curl: `index.html` ya trae el filtro `navigator.webdriver`.
- Prueba en vivo: se abrió bayolcell.com con un navegador automático y se registraron **0** inserciones en `web_visitas`.
- Las funciones de la base ya estaban aplicadas (migración `web_visitas_sin_robots_hora_rd`).
- Según la regla del dueño, se sigue con la próxima corrección de untangle: C7, números negativos.
