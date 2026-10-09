# AI BOARD — comprobaciones en GitHub

El propietario seleccionó el plugin GitHub para continuar. El acceso navegador a Supabase quedó pendiente en la verificación en dos pasos de Google; no se ha verificado acceso autenticado al panel, obtenido coste ni creado staging. No guardar datos de autenticación en GitHub ni en la bitácora.

Se añadió `.github/workflows/ai-board-tests.yml`: pruebas de endpoint/PostgreSQL, ingestores y bloqueo de producción; Python para pirámides; navegador Chromium y WebKit. Acciones oficiales fijadas por SHA (refs v6 verificadas con GitHub), Node 24, Python 3.12, Ubuntu 24.04 y dependencias del lockfile. Token contents:read, checkout sin conservar credenciales, sin secretos Supabase/Anthropic y sin pasos de despliegue. Se ejecuta para cambios AI BOARD en PR a main y push a la rama feature; no usa pull_request_target.

La suite de navegador acepta AI_BOARD_BROWSER_ENGINE=chromium|webkit. Chromium local: 9/9. Suite Node total local: 39/39; Python: 2/2. WebKit se comprobará mediante el job remoto y no equivale a probar Safari/iPhone físico. La configuración de CI por sí sola no demuestra un resultado remoto: revisar el run del commit antes de marcarlo aprobado.
