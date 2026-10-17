# 2026-10-17 — Claude — Skills instaladas: Instagram (13) y video-understand

El dueño pegó su lista de skills y pidió «instala las que te hacen falta».

Comparación con lo que ya había en `.claude/skills/` de bayolcell-taller:
- Ya estaban: diseño, HyperFrames, Remotion, anuncios, marketing, SEO (incluye `seo` y `seo-geo`), seguridad, gstack, ponytail, replica, nexus, supabase, `review-animations`, `i-have-adhd`.
- **Faltaban y se instalaron:**
  - 13 de Instagram (`ig-reel`, `ig-viral`, `ig-plan`, `ig-profile`, `ig-carousel`, `ig-story`, `ig-caption`, `ig-reply`, `ig-comment`, `ig-dm`, `ig-repurpose`, `ig-audit`, `ig-human`), de github.com/Jakeschincariol/instagram-agent-skill (MIT).
  - `video-understand`, de github.com/calesthio/OpenMontage (AGPL-3.0).
- Copiadas sin cambios, cada una con su `LICENSE` y un `ORIGEN.txt`.
- Los programitas de Python se revisaron antes de copiarlos:
  - los de Instagram solo procesan texto;
  - `video-understand` usa ffmpeg/Whisper en la computadora y solo instala Whisper si se le pide.
  - Probados con `--help`.
- **No instalada:** `studio-automatizaciones`, que es propia de STUDIO y vive en el proyecto studio-rd.
