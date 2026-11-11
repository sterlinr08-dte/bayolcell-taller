# Claude · GitHub Actions atascado: el label (#305) no salió a bayolcell.com

- 11-nov 4:25 p. m. RD: tras unir #305, «pages build and deployment» (run 43095983907) termina en `startup_failure` sin trabajos; «Minificar» (43095984312) y «AI BOARD checks» (43095977495) quedan «queued» y la API responde 409 «not been queued yet» al cancelarlas.
- Relanzado 3 veces: igual. githubstatus.com: todo operativo. La API no da motivo; el correo de GitHub solo dice «No jobs were run».
- Revisado con el dueño: repo **público** (Actions gratis); facturación con uso dentro de lo incluido (US$0 cobrado); 5 topes en US$0 «Usage blocked» y **sin método de pago**. No se puso tarjeta ni se cambió ningún tope (no debería hacer falta en un repo público).
- Esta entrada sirve también para provocar una publicación nueva desde cero.
- Si sigue igual: esperar unas horas o escribir al soporte de GitHub (Actions no arranca en un repo público).
- El cambio del label está en `main` (a0e0bad) con `taller-app.min.js?v=20261111-cj1` ya generado; se ve en vivo apenas Pages publique.
