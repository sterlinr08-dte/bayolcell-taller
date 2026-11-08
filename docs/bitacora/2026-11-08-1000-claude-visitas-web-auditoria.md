# Publicación del PR #253 y auditoría del contador de visitas de la web (08-nov-2026, ~10:00 RD)

## Publicación
- El dueño dijo «Publícalo». PR #253 (limpieza C10) unido a `main` (commit `2b191c8`). En vivo `conta-equilibrio.js?v=20261108-pe20` (verificado con curl).

## Pregunta del dueño
«El sistema dice que hoy nos visitaron 66 personas en mi página web, ¿es verdad?» → **No.**

## Fuente de verdad
- `index.html` inserta una fila en `web_visitas` por sesión del navegador (`sessionStorage bc_visit`). Las visitas internas se marcan con `interno`.
- El tablero lee `web_visitas_resumen()`. «Hoy» = `created_at >= date_trunc('day', now())`, y la base está en **UTC**: el «hoy» empieza a las 8:00 p. m. de RD del día anterior.

## Lo que se encontró (consulta del 08-nov, 09:50 RD)
- Las 67 visitas que cuenta «hoy» son **todas de navegadores automáticos (HeadlessChrome)**. Son las pruebas con Playwright que Claude hizo contra bayolcell.com para la Navidad: cada prueba abre un navegador nuevo y cuenta como visitante nuevo.
- 43 de esas 67 son del 7-nov por la noche (hora RD), contadas como «hoy» por el corte en UTC.
- Personas reales del 8-nov (hora RD) hasta las 9:50 a. m.: **0**.
- Días normales (24-oct al 6-nov): entre 5 y 21 visitas de personas por día, de 5 a 18 únicas.
- El 7-nov el sistema contó 59, pero eran 10 personas y 44 robots.
- `web_visitas_por_dia` también corta el día en UTC.

## Corrección propuesta (pendiente del OK del dueño)
1. `index.html`: no registrar navegadores automáticos (`navigator.webdriver`, `HeadlessChrome` o bots conocidos).
2. `web_visitas_resumen` y `web_visitas_por_dia`: contar «hoy» y los días con hora de RD (`America/Santo_Domingo`), y dejar fuera los robots que ya están guardados.
3. Claude no vuelve a probar contra bayolcell.com sin evitar el registro; usa el servidor local o `?navidad=1` en local.
