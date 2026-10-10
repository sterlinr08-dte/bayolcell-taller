# 2026-10-10 22:56 UTC — Claude · Reel del Redmi 17 publicado en @bayolcell

**Pedido del dueño:**
1. Mandó un video de la vitrina (Redmi 17 de 128 GB, morado y verde, RD$10,500) y pidió «video promocional al estilo de Redmi».
2. Luego pidió «hazlo con Buzzy… espacial».
3. Luego pidió poner un dembow dominicano.
4. Al final: «Publícalo al de bayol cell», y aprobó el texto con «Publícalo».

## Video
- **Versión 1:** HyperFrames con la toma real, fondo claro estilo Redmi.
- **Versión final:** espacial y con dembow.
  - **Imágenes:** 5 imágenes con Buzzy (Nano Banana 2, 2K, 9:16) hechas desde fotos del equipo. Antes de subir las fotos se **taparon las etiquetas (el IMEI completo del morado) y la base de la tienda**.
  - **Animación:** 5 clips con Kling 3.0 (1080p, 5 s). Se usaron solo los tramos limpios: el clip del verde se ensucia después de 2 s y el de los dos celulares se deforma después de 2.5 s.
  - **Proyecto en Buzzy:** «Bayol Cell — Redmi 17 espacial».
  - **Textos en el video:** exactos, puestos encima con HyperFrames. Datos de la caja y de la cámara: 7500 mAh, 45 W, 6.9" a 120 Hz, 50 MP AI Camera, 8 GB de RAM (4+4 de extensión), 128 GB y RD$10,500 de la etiqueta.
  - **Música:** dembow ORIGINAL sintetizado localmente (sin canciones de terceros), cuadrado con los cortes; −14.2 LUFS.
  - **Buzzy y la música:** `RegenerateBGMWorkflow` no aceptó un video subido desde afuera (pide un nodeId interno).
- Duración 16 s, 1080×1920.

## Publicación (Instagram @bayolcell, por Zernio)
- **Cuenta:** `instagram_cuentas` → zernio_account_id `6aa5824b726ebfe037e0959b` (@bayolcell).
- **Video:** subido al CDN público de Buzzy (`res-prod.buzzy.now/file-service/82080ee3-….mp4`).
- **Edge Function `publicar-reel-redmi17`, v1 (un solo uso, verify_jwt=false):**
  - no recibe datos; el video, el texto aprobado y la cuenta están fijos;
  - usa `Idempotency-Key` fija, así que aunque se llame más veces crea una sola publicación;
  - nunca devuelve la llave;
  - se llamó **una vez**.
- **Respuesta:** 201 «Post published successfully» → post Zernio `6acac2539179d7dba1f013e9`, publicado como Reel y compartido en el perfil.
- **Enlace:** https://www.instagram.com/reel/DeVNIi-EowT/
- **Inmediatamente se desplegó la v2 APAGADA:**
  - POST → 410;
  - GET solo lee el estado de esa publicación.
  - El código de la v2 está en `supabase/functions/publicar-reel-redmi17/index.ts`.
- **Texto publicado:**
  - «¡Ya llegó el Redmi 17 a Bayol Cell!», los 5 datos con emojis, «Disponible en morado y verde», «RD$10,500»;
  - «Escríbenos por mensaje o visítanos en la tienda»;
  - la nota «*4 GB + 4 GB de RAM extendida»;
  - #Redmi17 #Redmi #Xiaomi #BayolCell #CelularesRD #SantiagoRD #RepúblicaDominicana.

## Pendientes / notas
- Si no se van a publicar más Reels así, se puede borrar la función desde el panel de Supabase (Edge Functions). Hoy no publica nada.
- Para futuros posts, valorar una función permanente con permiso de administrador y aprobación previa del dueño (no hacerla sin pedirlo).
