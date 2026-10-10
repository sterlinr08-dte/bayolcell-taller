# Recon map: REFOX BITMAP (Windows, escritorio)

Alcance: el visor de placas (bitmap) y lo que lo rodea: buscar componente/red, valores de diodo y voltaje por pin, vistas múltiples, favoritos, casos de reparación. NO: la base de datos de diagramas de REFOX (es de ellos), esquemáticos, cuentas/suscripción.
Para: el AI BOARD (Diagnóstico) del taller BAYOL CELL — mejorar el BITMAP que usan los técnicos.
Fecha: 2026-10-10

## Reglas que siguen vigentes (del dueño)
- No inventar valores eléctricos. Un valor de diodo/voltaje solo existe si un técnico lo midió y queda con autor, fecha, equipo y multímetro.
- No mostrar mapas sin procedencia. Las fotos IA siguen marcadas «NO ES LA PLACA REAL».
- Nada de copiar sus archivos .lef/.lrf, sus imágenes ni su base de datos.

## Fuentes

| # | fuente | URL | notas |
| --- | --- | --- | --- |
| 1 | página del producto | https://refoxtech.com/es/products/mapa-de-bits-refox | 6 funciones + 4 tipos de diagrama, marcas |
| 2 | preguntas frecuentes | https://refoxtech.com/es/pages/preguntas-frecuentes-bitmap | precios, solo Windows, 3 equipos |
| 3 | manual: introducción | https://refoxtech.com/a/docs/bitmap/introduction | funciones clave |
| 4 | manual: primeros pasos | https://refoxtech.com/a/docs/bitmap/getting-started | vista dividida, flujo de circuito, mapas, guías |
| 5 | reseña de REWA (distribuidor) | https://shop.rewa.tech/blog/detail/refox-subscribed-version-bitmap-the-best-repair-assistant.html | +2000 modelos, multi-pestaña, color, casos/feedback |
| 6 | capturas públicas | replica/screens/ (S00–S07) | solo referencia, no se publican |

Precio: US$6/mes · US$56/año · US$99/año para 3 equipos. Solo Windows, necesita internet.

## Ciclo principal
El técnico busca el modelo, abre la placa, toca un componente o pin y ve su red, su valor de diodo y su voltaje, y compara con lo que mide.

## Pantallas

| ID | pantalla | cómo se llega | para qué | componentes clave | estados vistos |
| --- | --- | --- | --- | --- | --- |
| S00 | Árbol de modelos + búsqueda | barra izquierda (Phone/Laptop/…) | elegir marca → modelo → documento | árbol de carpetas, buscador «search file name», favoritos | lleno, filtrado |
| S01 | Visor bitmap | doble clic a un documento | ver la placa (varias piezas lado a lado), capas | lienzo con zoom/arrastre, barra de capas (AB, TT, 1–8, ALL), nombres grandes de chips (U2900, U1000) | lleno |
| S02 | Detalle de pin (zoom) | acercar y tocar un pin | ver número de pin, nombre de red, valor | círculos de pin con color por red (rojo PP_VDD_MAIN, amarillo PP1V2…), aviso «espacio para saltar» | seleccionado |
| S03 | Editar diodo y voltaje | menú del pin | guardar valores medidos | modal con Diodo (Victory), Voltaje (Victory), Diodo (Fluke), Voltaje (Fluke) | vacío, editando |
| S04 | Multivista / pestañas | barra de pestañas arriba, botón Double View | varias placas abiertas, bitmap + esquemático a la vez | pestañas con cerrar, vista dividida | 1 a 10 pestañas |
| S05 | Distribución de componentes | documento «Component_Distribution» | foto real de la placa con chips | foto | lleno |
| S06 | Diagrama de partes / bloques | documento «PartNumber_Diagram» / bloques | contorno con designadores, bloques funcionales | dibujo vectorial, páginas 1/2 | lleno |
| S07 | Casos de reparación + feedback | REPAIR CASES / FEEDBACK | leer/compartir casos, reportar error de un mapa | lista, formulario con ruta del archivo + texto + imagen | vacío, enviando |
| S08 | Ajustes de color | SETTING | colores por tipo (red, GND, pin) | paleta | — |

Barra de abajo en todas: «Buscar número de red» + nombre del elemento seleccionado (ej. «noEquName-235», «LATTUN_K-A1»).
Barra de arriba: zoom, rotar, voltear, anterior/siguiente pin, casilla «Diode Value», «Voltage Value», buscar «equ name or detail».
Documentos por modelo (iPhone 13 Pro): Double_View, bitmap, bitmap-RF, Schematic, Boot_Trigger_Pin, Component_Distribution, Connector_Diode_value, Malfunction_Map, Repair_Cases.

## Flujos

```
F01 Medir una línea sospechosa
    S00 buscar «13 Pro» -> abrir bitmap -> S01 buscar «PP_VDD_MAIN» -> S02 resaltan todos sus pines -> leer diodo
    clics: ~5
    borde: red sin valor, valor de otro multímetro, placa por la otra cara
F02 Encontrar un componente
    S01 escribir «U2900» -> salta y lo centra
    clics: 2
F03 Guardar una medición propia
    S02 pin -> S03 escribir diodo/voltaje -> Confirmar
    clics: 4
F04 Comparar dos cosas a la vez
    S04 Double View: bitmap + esquemático, o dos modelos en pestañas
F05 Reportar un error del mapa
    S07 Feedback: ruta del archivo ya puesta + texto + foto -> Enviar
F06 Volver rápido a lo de siempre
    S00 Favoritos
```

## Componentes

| componente | variantes | estados | dónde |
| --- | --- | --- | --- |
| Lienzo de placa | bitmap, foto, vectorial | zoom, arrastre, rotar, voltear, capa | S01 S05 S06 |
| Pin | por color de red, GND gris | normal, resaltado (misma red), seleccionado | S01 S02 |
| Barra de capas | AB, TT, 1–8, ALL | activa | S01 |
| Búsqueda | archivo, componente/red, nº de red | con/sin resultados | S00 S01 barra inferior |
| Modal de valores | diodo/voltaje × 2 multímetros | vacío, editando | S03 |
| Pestañas | — | activa, cerrar | S04 |
| Árbol | marca → modelo → documento | abierto/cerrado, favorito | S00 |

## Modelo de datos (deducido)

```
Placa      modelo, revisión, cara, documento(tipo: bitmap|foto|partes|bloques|esquema), piezas[]
           evidencia: S00 árbol, títulos «iPhone13Pro-RF.lef»   confianza: alta
Componente designador (U2900), cara, contorno, pines[]            evidencia: S01 S06   alta
Pin        id (A1, 235), red, x, y                               evidencia: S02 barra inferior   alta
Red        nombre (PP_VDD_MAIN), nº de red (341#)               evidencia: S02 «341#»   alta
Medición   pin/red, diodo, voltaje, multímetro (Victory|Fluke), (autor/fecha: suposición)
           evidencia: S03 modal   media
Favorito   usuario, documento                                    evidencia: S00   alta
Caso       modelo, falla, solución, imágenes, autor              evidencia: S07   media
Reporte    ruta del documento, texto, imagen, usuario            evidencia: S07   alta
```

## Lo que ya tiene nuestro AI BOARD (no se repite)
- Elegir modelo (32 iPhone), foto ilustrativa IA por diseño y por cara A/B, zoom con 4K al acercar, centrar.
- Importar boardview JSON propio: componentes, pines, redes; buscar designador o red; mostrar designadores/pines.
- Carpeta de foto HD (mosaicos) y catálogo compartido de fotos reales con procedencia (bucket privado `placas`).
- «Consultar componente con IA», chat de diagnóstico, biblioteca de casos.

## Lo que falta (lo valioso para BAYOL)
1. Resaltar TODOS los pines de la misma red al tocar uno, y saltar pin anterior/siguiente.
2. Mediciones propias por pin/red (diodo y voltaje), con autor, fecha, multímetro y modelo — guardadas en Supabase y compartidas entre técnicos. Esto es lo que más valor tiene y respeta «no inventar».
3. Favoritos por técnico.
4. Vista dividida: foto real o IA + boardview, o cara A y B a la vez.
5. Documentos por modelo en un solo árbol (boardview, fotos, pines de arranque, valores de conectores, mapa de fallas, casos).
6. «Reportar error del mapa» con ruta ya puesta.
7. Capas / colores por tipo de red (GND gris, energía rojo).

## Lo que no se puede copiar (skip)
- La base de datos de diagramas de +2000 modelos (es de REFOX; se hizo con placas reales y licencias).
- Esquemáticos (son de Apple/fabricantes).
- Sus archivos .lef/.lrf y sus imágenes.
- Valores de diodo de fábrica: solo los nuestros, medidos.

## Tamaño
Pantallas 8 · flujos 6 · entidades 8. Lo difícil: (1) tener datos de placa reales con procedencia (boardview), (2) resaltar redes rápido en el celular con miles de pines, (3) que las mediciones sean confiables (multímetro, revisión, quién). Tamaño: **M** (unas semanas), por fases: 1) resaltar red + anterior/siguiente + favoritos; 2) mediciones compartidas; 3) vista dividida y árbol de documentos.

Siguiente paso: `/replica-architect`.
