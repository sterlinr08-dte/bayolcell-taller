# Formato de intercambio de placa AI BOARD v1

El visor lee geometría vectorial y pines suministrados por el técnico, con procedencia declarada. No convierte esquemas privados ni `.brd` propietarios, no deduce conexiones y no acepta SVG/HTML ejecutable. Todos los mapas importados quedan **pendientes de validación técnica**; la declaración de una licencia no demuestra por sí sola su validez.

Archivo JSON máximo 3 MB. Campos obligatorios: `schema: "bayol-boardview/1"`, `model` (igual al iPhone seleccionado), `revision`, `width`, `height`, `source: {title, license, reference}`, `components`.

Cada componente contiene `ref`, `side` (`top` o `bottom`), `x`, `y`, `width`, `height`. Las coordenadas de componentes son absolutas en el sistema del mapa. Los pines opcionales contienen `id`, `x`, `y`, `net`; sus coordenadas son relativas a la esquina superior izquierda del componente, en las mismas unidades. Todas las coordenadas deben provenir del archivo técnico original. No agregar pines o nombres de redes por deducción.

Se aceptan hasta 10,000 componentes y 50,000 pines totales (máximo 500 por componente), dentro de los límites geométricos del mapa. Designadores y IDs de pin deben ser únicos en su ámbito. Se rechazan números inválidos, geometrías fuera de la placa, modelo distinto, revisión ausente o fuente incompleta. Campos desconocidos se descartan. La búsqueda resalta designadores o redes aportadas; no traza conexiones físicas que no existan en el archivo.

No hay placas reales incluidas en este PR. La única geometría sintética vive en los tests, con la revisión `QA-NOT-A-REAL-BOARD`/`TEST-FIXTURE-NOT-REAL`, y no se carga en el producto.

Las fotografías locales se decodifican antes de sustituir el asset anterior, se muestran con resolución original declarada y se desvinculan al cambiar de modelo o usuario. No se suben ni se guardan. El visor también abre carpetas locales de tiles multirresolución con el formato descrito en `AI_BOARD_PHOTO_PYRAMID.md`; necesita originales legítimos de alta resolución. El zoom 50–2400% del visor es una escala de visualización, no una promesa de detalle fotográfico recuperado.

Pendiente para uso eléctrico: validar una fuente legítima para cada modelo/revisión, confrontar con la placa física y mediciones de referencia, realizar la revisión humana del mapa y habilitar carga desde un catálogo verificado. El selector iPhone X+ indica alcance del catálogo, no cobertura eléctrica disponible.
