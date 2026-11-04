# 4-nov-2026 01:00 RD — Prueba «iPhone en 3D + Ver en mi espacio» (AR) (Claude)

## Solicitud del dueño
Reel de Anywear (probador de ropa con IA en vivo) → «¿Puedes replicar ese código, más potente?». Se explicó que el código
de Anywear es privado y su IA corre en servidores de Decart; se dieron 3 opciones y el dueño eligió **A: celular en 3D y
«en su mesa» con la cámara, con un iPhone**.

## Cambio (rama `claude/iphone-3d`, sin publicar) — página aparte, no toca el catálogo
- `iphone-3d.html` (noindex): visor `@google/model-viewer@3.4.0` (jsdelivr). Girar, acercar, 5 colores (cambia marco y
  vidrio trasero por la API de materiales), botón «Ver en mi espacio» (AR: iPhone = Quick Look, el USDZ lo arma model-viewer
  solo; Android = Scene Viewer/WebXR), tamaño real fijo (`ar-scale="fixed"`), WhatsApp 18495644791 (el del sitio).
  En PC sin AR explica abrirlo en el celular.
- `modelos/iphone-generico.glb` (1.1 MB): **modelo propio genérico** de un iPhone 6.1" (147.6 × 71.6 × 7.8 mm), sin logo
  ni marcas de Apple; hecho con three.js; generador en `scripts/modelos3d/iphone-generico-generador.html`.

## Pruebas
- `scripts/pruebas/iphone-3d.cjs` 16/16 a 390 y 1280 (carga, materiales, tamaño real ≈73 × 147.6 mm, cambio de color,
  botón 56 px / colores 48 px, sin scroll lateral, mensaje sin AR, sin errores JS). Capturas en `docs/bitacora/img/2026-11-04-iphone-3d-*.png`.
- **No probado:** el AR real (necesita un iPhone/Android físico). Tras publicar, el dueño lo abre en su iPhone.

## Siguiente
- Si gusta: modelos de los equipos que más vende y botón «Ver en 3D» en el catálogo.
