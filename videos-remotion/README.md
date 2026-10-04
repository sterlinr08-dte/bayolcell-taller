# Videos de Bayol Cell con Remotion

Aquí vive el código del video de motion graphics de Bayol Cell (el que sale en la web, sección «En video»).
Remotion arma videos escribiendo código: se cambia el texto o los colores en `src/Promo.tsx` y se vuelve a sacar el video.

## Cómo sacar el video

```bash
cd videos-remotion
npm install
# Horizontal 1920x1080 (o Vertical 1080x1920 para historias/reels)
npx remotion render src/index.ts Horizontal salida.mp4
# Versión ligera para la web (1280x720)
npx remotion render src/index.ts Horizontal web.mp4 --scale=0.6666666666666666 --crf=26
```

En la nube de Claude Code se usa el Chromium ya instalado:
`--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`

## Notas
- Las letras (Inter, JetBrains Mono, Archivo Black) están en `public/` para no depender de internet.
- El color de acento está en `src/Promo.tsx` (`#FF3B30`, rojo de marca).
- El video que usa la web está en `assets/video/bayolcell-motion.mp4` (+ su portada `.webp`).
