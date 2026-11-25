# Ajuste de inventario al estilo Info Plus + microcopy de inventario (25-nov-2026)

## Pedido del dueño

> «Recuerda que hicimos un reglamento sobre lo que es microcopy… Eso es un sistema, no un tutorial. Todas esas informaciones pueden tener el signo de la I de información.»

> «Para agregar o quitar inventario… como Info Plus: consulto el artículo, selecciono el teléfono, busco la ventana donde están todos los IMEI de ese artículo y voy agregando y quitando con el signo de más o el signo de menos. Te lo pedí y no lo has hecho.»

- No se encontró ese pedido anterior en la bitácora ni en `PENDIENTES.md` del taller; probablemente fue en otro chat.
- **Regla desde hoy:** el inventario de celulares se ajusta desde la ventana del artículo, con − y +.

Decisiones del dueño:
- **opción A**, la ventana del artículo;
- microcopy en **todo el taller**, por partes. Esta es la **parte 1** (inventario).

## Ajuste de inventario (`taller-app.js`)

- Se reemplazó «Ajuste rápido». Antes tenía dos botones, «Agregar salida» y «Agregar entrada», y una caja para escribir los IMEI.
- Ahora:
  - **Localidad** y **Buscar artículo**.
  - Al elegir un celular se abre su ventana con los IMEI que Info Plus tiene en esa localidad. Se leen con `almacen_todo` y se filtran por código. La consulta por artículo no sirve: esconde la lista cuando no cuadra con la existencia.
  - **−** marca la salida y la fila queda tachada en rojo con «Sale». **↩** deshace.
  - Campo «IMEI nuevo» + **+** (Enter también sirve; se pueden pegar varios) agrega la entrada en verde con «Entra». **×** la quita.
  - Avisos al escribir: «Ya está: …», «No parece IMEI: …».
  - Artículos sin IMEI: **− cantidad +**.
  - Cada artículo muestra `existencia → queda`.
  - Un solo botón **«Ajustar −N +N»**, apagado si no hay cambios. Al cambiar de localidad se desmarcan las salidas.
- Se conserva la seguridad:
  - antes se revisa en Info Plus dónde está cada IMEI (entrada: que no exista; salida: que esté en esa localidad);
  - primero van las salidas y luego las entradas;
  - después se confirma que el IMEI se movió;
  - si Info Plus dice «creado» y no lo mueve, sale un aviso y no se reenvía solo.
  - Lo hecho se desmarca y la lista se vuelve a leer.
- **Candado nuevo:** dos toques rápidos abrían dos preguntas. A Info Plus llegaba un solo ajuste, pero ahora el botón queda bloqueado desde el primer toque.
- Ayudas nuevas detrás de la ⓘ (`_iAyuda` → `ayudaModulo`): `ajuste`, `traerTaller`, `corregirImei` y `rexIp`.

## Microcopy: antes → después

| Pantalla | Antes | Después |
|---|---|---|
| Despacho | «Ajuste rápido (entrada / salida)» | «Ajuste de inventario» |
| Despacho | «Corregir IMEI o artículo» | «Corregir IMEI» |
| Despacho | párrafo «Traspasa mercancía de una localidad a otra…» | quitado (ya tiene ⓘ) |
| Ajuste | «Motivo (sale en el ajuste de Info Plus)» | «Motivo» + ⓘ |
| Ajuste | «Agregue la salida y/o la entrada.» | «Busque un artículo» |
| Ajuste | «Hacer ajuste» | «Ajustar −1 +1» |
| Ajuste | «¿Hacer este ajuste en Info Plus…? … Esto modifica el inventario real.» | «Ajustar en Info Plus · Localidad» + líneas «−1 artículo» |
| Traer | «Están en el almacén Taller de Info Plus y no en ningún lote: 4. Con los marcados se crea el lote nuevo X.» | «Sin lote 4 · Lote nuevo X» + ⓘ |
| Traer | «Buscar por IMEI, modelo o código» | «IMEI, modelo o código» |
| Traer | «Marcar los que se ven» / «Desmarcar todos» | «Marcar visibles» / «Desmarcar» |
| Traer | «Marcados: 3 (2 no se ven por la búsqueda)» | «3 marcados · 2 ocultos» |
| Traer | «Ningún equipo coincide con la búsqueda.» | «Sin resultados» |
| Traer | «No se encontró el artículo en el catálogo: sincronice o agréguelo a mano.» | «Sin artículo en el catálogo» |
| Traer | «Varios artículos con ese nombre (…): agréguelo a mano.» | «Varios códigos: …» |
| Traer | «No hay equipos nuevos… Info Plus tiene N IMEI allí; todos ya están en algún lote.» | «Todo el Taller ya está en lotes · N IMEI en Info Plus» |
| Traer | «Comentario del lote» | «Comentario» |
| Traer | «Marque al menos un equipo.» / «Escriba un comentario para el lote.» | «Marque un equipo» / «Falta el comentario» |
| Corregir | párrafo «Para corregir un IMEI mal escrito, para pasar…» | quitado → ⓘ |
| Corregir | «Almacén donde está el teléfono» / «IMEI que está hoy en Info Plus» | «Almacén» / «IMEI actual» |
| Corregir | «Escriba el IMEI y toque Buscar: se revisa en Info Plus en vivo.» | quitado → ⓘ |
| Corregir | «IMEI correcto (déjelo igual si…)» / «Artículo (cámbielo para…)» | «IMEI correcto» / «Artículo» |
| Corregir | «Cambiar artículo» / «Corregir en Info Plus» / «Reintentar el paso que falta» | «Cambiar» / «Corregir» / «Reintentar» |
| Corregir | avisos largos («Ese IMEI no está en X: está en Y. Cambie el almacén.», etc.) | «Está en Y. Cambie el almacén.», «No está en Info Plus», «Sin cambios», «IMEI incompleto» |
| Registrar | «Darle entrada en Info Plus (almacén Taller) con este IMEI» + frase de ayuda | «Entrada en Info Plus · Taller» + ⓘ |
| Registrar | «Ese IMEI ya está en Info Plus (X). Quite la casilla: no hace falta darle entrada.» | «Ya está en X. Quite la casilla.» |

## Pruebas

Playwright, con Info Plus simulado, a 1280 y 390 px.

**Ajuste de inventario**
- Abre con los 2 IMEI del artículo.
- Marcar − y agregar + deja el botón en «Ajustar −1 +1».
- Se envían una salida (`codminventario` 2, serial `IMEI/3082`) y una entrada (1) en la localidad 1.
- Después la lista queda bien y el botón se apaga.
- Un IMEI que ya está en Taller: no se envía nada y sale «… ya está en Taller».
- Info Plus no guarda: aviso «Info Plus no movió…» y no se reenvía.
- Pantalla −2: una salida de cantidad 2 sin seriales.
- Ningún control mide menos de 44 px.

**Traer del Taller**
- El buscador y el lote siguen igual: el lote lleva solo el IMEI buscado, con 1 llamada.

**Registrar equipo**
- B1: da entrada.
- B2: «Ya está en Oficina Santiago. Quite la casilla.» y no envía nada.
- B3: sin casilla.

**Corregir IMEI**
- Busca y muestra «Taller · 3082 · CELULAR IPHONE XS MAX».

Sin errores de consola.

## Estado

- Rama `claude/ajuste-imei-ventana`. Versión `?v=20261125-ajv1`. Sin publicar.
- Siguiente: microcopy del resto del taller, por pantallas.
