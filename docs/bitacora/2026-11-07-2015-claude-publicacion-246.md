# Publicación del PR #246 y falla de GitHub Pages (07-nov-2026)

- El dueño dijo «Publícalo». El PR #246 (ranking de vendedores con ritmo, nombres de Info Plus y animaciones suaves) se unió a `main` (5ee0764).
- El paso «Deploy to GitHub Pages» de la publicación (run 42421701958) se canceló **3 veces** por tiempo: quedaba en «Current status:» vacío durante 10 minutos.
- En githubstatus.com, Pages figuraba «operational». El build con Jekyll y la subida del artefacto sí salieron bien.
- Ya había pasado antes (#239 y #240): se resolvió con otro intento o con una publicación nueva.
- **Solución:** este commit de bitácora arranca una publicación nueva desde cero.
