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

## Reels con persona hablando (desde el 13 oct 2026)

Herramientas: **Silero** (encuentra la voz y corta silencios), **FFmpeg** (corta, pone vertical 1080x1920 y deja el volumen en −14 LUFS, el de Instagram), **Whisper** (cada palabra con su segundo) y **Remotion** (subtítulos animados, logo, título y cierre con WhatsApp).

```bash
cd videos-remotion
bash herramientas/preparar.sh                      # una vez por sesión
python3 herramientas/procesar.py VIDEO.mp4 oferta1 # deja public/oferta1/video.mp4 + palabras.json
npx remotion render src/index.ts Reel oferta1.mp4 \
  --props='{"carpeta":"oferta1","titulo":"¿Se rompió tu cristal?"}' \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

- Revisar `palabras.json` antes de sacar el video (Whisper puede escribir mal un nombre; las correcciones fijas están en `ARREGLOS` de `procesar.py`).
- `--pausa 0.35` = silencio máximo que se deja (en segundos). `--modelo medium` = más preciso, más lento.
- Los videos del dueño (`public/<carpeta>/`) **no se suben al repo** (el repo es público).

### Estándar «nivel profesional» para todo video de Bayol
1. Gancho en los primeros 2 segundos (pregunta o problema), texto grande.
2. Vertical 1080x1920 a 30 fps; volumen −14 LUFS; sin silencios largos.
3. Subtítulos siempre (la mayoría ve sin sonido), máx. 3 palabras a la vez, precios y «WhatsApp» en rojo.
4. Precios y teléfonos revisados cuadro por cuadro antes de entregar.
5. Cierre con logo, «¡Agenda ahora!», WhatsApp y los 3 teléfonos.
6. Entregar sin música fija: el sonido de moda se pone al subirlo a Instagram/TikTok.
