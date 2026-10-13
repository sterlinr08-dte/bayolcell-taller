# Kit para hacer catálogos (y piezas de marketing) — Bayol Cell

Lo dejó el chat de NEXUS PRO el 13 de octubre de 2026, a pedido del dueño:
> «Ahora deja todas las herramientas para que el otro chat haga un catálogo con todas las herramientas y conocimientos que tú tienes».

Aquí está **todo lo que hace falta** para armar un catálogo de precios (y flyers, reels o imágenes para redes) sin depender del otro chat.

---

## 1. Qué hay en esta carpeta

| Ruta | Qué es |
|---|---|
| `catalogo/catalogo.html` | **Plantilla del catálogo.** Una portada («Precios de pantallas · Desde RD$…») y páginas de lista por grupo, en 1080×1350 (carrusel de Instagram o WhatsApp). Usa el mismo estilo del flyer de pantallas ya publicado: fondo negro, rojo `#E31E24`, letras Barlow Condensed + Inter. |
| `catalogo/render.js` | Genera `salida/pagina-01.png`, `pagina-02.png`… y `salida/catalogo.pdf`. **Se para si un artículo trae costo o un campo distinto de nombre, precio y código**: el catálogo es público. |
| `catalogo/ejemplo-datos.json` | Formato de los datos. Los precios del ejemplo **no** son los reales. |
| `flyer-pantallas/` | El flyer «Pantallas desde RD$1,000» que está publicado en bayolcell.com: `flyer.html`, `render.js`, letras y textura. Saca la versión feed (1080×1350) y la historia (1080×1920). |

El logo se toma de `assets/logo.png` del repo.

### Cómo usar la plantilla del catálogo
1. **Leer los precios EN VIVO de Info Plus, nivel 1** (`listaarticulos … detallado=true&todos=true`). No usar la tabla `infoplus_articulos` sin comprobarla: puede tener descripciones viejas (ver el hallazgo del código 1500 en `CLAUDE.md`).
2. Armar `catalogo/catalogo.json` (no se sube al repo: está en `.gitignore`) con el formato de `ejemplo-datos.json`:
   - `grupos` → cada grupo trae `nombre`, `subtitulo`, `nota` e `items: [{nombre, precio}]`;
   - nombres **limpios para el cliente**: «iPhone 11 Pro Max», no «PANTALLA IPHONE 11 PRO MAX ZY INCELL…»;
   - ordenar por marca y modelo.
3. Renderizar: `cd herramientas/kit-catalogo/catalogo && node render.js`.
   - Si Playwright no encuentra Chromium: `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node render.js`.
   - Si `require('playwright')` falla: `NODE_PATH=/opt/node22/lib/node_modules node render.js`.
4. **Mirar cada página** antes de entregar: que ningún nombre se corte, que no falten precios y que se lea en el celular.
5. **Enseñarle las páginas al dueño.** No se publica ni se manda a clientes sin su OK.

`porPagina` (20 por defecto) dice cuántos artículos van en cada página. Con más de 20, la página se parte («Android · 1/3»).

---

## 2. Reglas del dueño que aplican

- **Precios:** solo **nivel 1** (cliente final). **Nunca** poner costos, nivel 2 (por mayor) ni nivel 3 en nada público. Este repo es **público**: tampoco se suben costos aquí.
- **Pantallas iPhone:** los precios publicados son de la calidad que internamente es Incell. **Al cliente NUNCA se le dice «Incell»: se le dice «Calidad certificada»** (regla del dueño, 13-oct-2026). Si el cliente **pide** otra calidad, se le ofrece **OLED, calidad parecida a la original**. No se ofrece sola. **Android:** los precios nuevos ya están publicados en Info Plus. Leerlos en vivo; no copiar listas viejas.
- **Antes de cambiar precios en Info Plus:** tabla «precio de hoy → precio nuevo», OK del dueño por escrito, solo el nivel 1 (contado = crédito = mínimo) y verificar después.
- **No publicar ni mandar nada** a redes, clientes o anuncios sin que el dueño lo apruebe.
- **Anuncios pagados de Meta:** nada de fotos de antes y después, ni promesas de salud.
- **IA:** no presentar personas creadas con IA como clientes reales.

---

## 3. Herramientas (todas quedan en `.claude/skills/` de este repo)

Se copiaron del repo NEXUS PRO las skills que el taller no tenía. Las licencias de terceros están en `.claude/skills/LICENCIAS-TERCEROS.md`.

| Necesidad | Skills |
|---|---|
| **Diseño de piezas y pantallas** | `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`, `emil-design-eng`, `canvas-design` (pósters e imágenes), `apple-design`, `impeccable`, `review-animations`, `animation-vocabulary` |
| **Textos que venden** | `copywriting`, `copy-editing`, `offers`, `marketing-psychology`, `product-marketing`, `content-strategy`, `social`, `image`, `sms`, `referrals`, `influencer-marketing`, `cro`, `analytics`, `marketing-plan`, `competitor-profiling` |
| **Anuncios** | `ads`, `ads-meta`, `ads-creative`, `ad-creative`, `ads-competitor`, `ads-plan`, `ads-create`, `ads-math`, `ads-budget`. Solo para leer y planificar: crear o gastar en campañas pide el OK del dueño en cada paso. |
| **SEO (bayolcell.com)** | `seo`, `seo-local`, `seo-maps`, `seo-technical`, `seo-page`, `seo-schema`, `seo-sitemap`, `seo-images`, `seo-content`, `seo-plan`, `seo-geo` |
| **Video y reels** | `hyperframes` (entrada) → `general-video`, `motion-graphics`, `product-launch-video`, `music-to-video`, `slideshow`, `faceless-explainer`, `talking-head-recut`, `embedded-captions`, `media-use`, `hyperframes-*`; también `remotion-*` y `ver-video-redes` (bajar y analizar reels por enlace) |
| **Código y revisión** | `gstack-review`, `gstack-investigate`, `gstack-plan-eng-review`, `gstack-spec`, `gstack-health`, `gstack-careful`, `gstack-guard`, `gstack-freeze`, `ponytail*`, `senior-architect`, `webapp-testing` |
| **Seguridad** | `security-audit`, `gstack-cso`, `*-with-strix` (pentest solo si el dueño lo pide) |
| **Negocio** | `lead-research-assistant`, `invoice-organizer`, `gstack-plan-ceo-review`, `gstack-retro` |

**HyperFrames:** siempre con `HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1`. Nunca correr `npx hyperframes usage`.

---

## 4. Recetas probadas (lo que funcionó de verdad)

### a) Piezas fijas (catálogo, flyer, post): HTML + Playwright
- Diseñar en HTML a tamaño real (1080×1350 feed, 1080×1920 historia o reel).
- Las letras van **dentro del proyecto** como `.woff2` con `@font-face`. Si se cargan de Google Fonts, Chromium a veces cae en Arial sin avisar.
- Esperar `document.fonts.ready` y una marca `body[data-ready="1"]` antes de la captura.
- Para que se vea más nítido: capturar con `deviceScaleFactor: 2` y reducir (así lo hace `flyer-pantallas/render.js`).

### b) Reels con animación: HTML + Playwright cuadro a cuadro + ffmpeg
- La página expone `render(t)`, que pone cada elemento en su estado del segundo `t`. Se captura cada cuadro a 30 fps (`omitBackground:true` para capas transparentes) y ffmpeg une los PNG con el video y el audio.
- **Trabajar por partes**: (1) video base acercado o recortado con `-preset ultrafast`, (2) mezcla del audio a WAV, (3) unir capas y audio. Hacerlo todo en un solo comando puede colgarse: un `apad` sin `whole_dur=` genera audio infinito.
- **Volumen final:** −14 LUFS para Reels. Medir con `ebur128`, aplicar una ganancia fija y `alimiter`. No usar `loudnorm` sobre una pista corta: corta la cola.
- **Zonas seguras de Reels:** texto entre el 14 % y el 65 % de la altura. Arriba están el encabezado de Instagram y abajo el nombre, la descripción y los botones.

### c) Buzzy (IA de imagen, video y música)
- **Imágenes:** `GenerateImage` con `gpt-image-2` (1:1, 2k). Dio ilustraciones 3D limpias y en serie (diente con carilla, corona, puente) usando la misma frase de estilo en las tres: «Apple-style product render, pure white seamless background, soft contact shadow, subtle gold rim light».
- **Video:** `Seedance 2.5` permite 1080p y de 4 a 30 s. Primero `list_model` y copiar los valores tal cual. `GenerateVideo` devuelve un `task_id`; se consulta con `get_task` cada 1–2 minutos, sin volver a mandar el pedido (cobraría dos veces).
- **Música (truco que funcionó):** `GenerateVideo` con `Seedance 2.5`, 480p y la duración necesaria. El prompt pide una toma neutra (luces desenfocadas) y «soundtrack ONLY instrumental music… no vocals, no sound effects». Del resultado se usa **solo el audio**.
  - **No** darle de referencia un video con ruidos: los copia.
  - Revisar el espectrograma (`showspectrumpic`): rayas horizontales son música; manchas anchas son ruido.
- **Lo que falla:** `ExecutePromptWorkflow` (guion automático), `VideoMergeWorkflow` y `RegenerateBGMWorkflow` se cortan a los 60 s o piden un `nodeId`. Mejor unir con ffmpeg.
- Subir archivos a Buzzy: `UploadFile` → `curl -X PUT -H 'If-None-Match: *' -H 'Content-Type: …' --upload-file` → `ConfirmFileUpload`.
- Gasta créditos: el dueño autorizó usarlos para los videos de BAYOL. Para otras cosas, preguntar.

### d) Subtítulos exactos
- `npx hyperframes@0.8.150 transcribe audio.wav -m large-v3 -l es -d . --json` da cada palabra con su segundo exacto (con la telemetría apagada).
- Necesita `ffmpeg` en el PATH.
- La primera vez baja el modelo, unos 3 GB.

### e) Videos que manda el dueño
- **Si pesan más de 30 MB:** que los suba a Google Drive con acceso «Cualquier persona con el enlace». Se bajan con `curl -L "https://drive.usercontent.google.com/download?id=<ID>&export=download"`. Si devuelve una página «Sign-in», el archivo sigue privado.
- **Reels públicos:** con la skill `ver-video-redes` (yt-dlp).

---

## 5. Ideas para el catálogo (cuando el dueño lo pida)
- **Carrusel de Instagram:** portada + una página por marca (iPhone · calidad certificada, Samsung, Motorola, Xiaomi/Redmi, etc.) + la última página con las sucursales y el WhatsApp.
- **PDF para WhatsApp:** el mismo `salida/catalogo.pdf`, para mandarlo directo a los clientes.
- **Web:** el «Catálogo Web» del sistema (`catalogo-publico`, precio en vivo de nivel 1) ya existe para celulares y se puede extender a pantallas con `categoria='pantalla'` (ver `CLAUDE.md`, «Catálogo Web público»). Así el precio se actualiza solo.
- **Reel corto:** «Pantallas desde RD$1,000» con los modelos pasando y la llamada a WhatsApp (receta b).
