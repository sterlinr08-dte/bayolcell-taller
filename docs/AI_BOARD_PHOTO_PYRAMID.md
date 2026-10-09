# Foto HD local por mosaicos

El importador usa fotografías propias o con permiso acreditado. No incluye fotografías reales de placas ni inventa detalle. La carpeta queda en el dispositivo y se libera al cambiar de modelo, imagen o identidad.

Desde la raíz del repositorio:

```sh
python -m pip install -r tools/ai-board/requirements.txt
python tools/ai-board/build_photo_pyramid.py foto-original.jpg carpeta-hd \
  --model 'iPhone X' --revision 'REVISION-REAL' \
  --title 'Fotografía propia de placa' --license 'Derechos propios' \
  --reference 'Registro de procedencia del taller'
```

El destino debe ser nuevo. Abrir BITMAP, seleccionar el mismo modelo y pulsar **Abrir carpeta de foto HD**. Seleccionar la carpeta completa. La selección de carpetas depende del navegador; usar **Abrir foto local** si no está disponible. Safari/iPhone físico todavía necesita QA.

`manifest.json` usa `schema: bayol-photo-pyramid/1`, modelo, revisión, procedencia, dimensiones, `tileSize` 256 o 512, `format: png`, `maxLevel: ceil(log2(max(width,height)))` y SHA-256 del original. Archivos: `tiles/{nivel}/{columna}_{fila}.png`. El nivel máximo conserva los píxeles RGB del original orientado por EXIF; niveles inferiores se reducen con Lanczos. No se preservan metadatos EXIF ni canales alfa. El SHA registra identidad del original, no certifica que los tiles o la placa hayan sido verificados por otra persona.

Límites: original hasta 80 MP; carpeta hasta 30,000 archivos / 800 MB; tile hasta 5 MB; hasta 64 tiles visibles y una previsualización en caché. Solo se solicitan niveles existentes. El zoom posterior al nivel original agranda píxeles, sin recuperar detalle. Tiles corruptos pueden dejar zonas con la previsualización; validar visualmente toda la placa antes de cualquier uso técnico.

La foto y el mapa vectorial son modos independientes; no hay calibración ni superposición automática. Una fotografía por sí sola no establece nombres de componentes, pines, redes ni voltajes. Cada revisión real debe contrastarse con documentación legítima y la placa física.
