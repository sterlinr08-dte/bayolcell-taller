# Rendimiento de bayolcell.com (página de inicio)

## Pedido del dueño (05-nov-2026)
«Haz la B, sube el rendimiento de Bayol.»

## Diagnóstico (Lighthouse 12, celular simulado)
Lo que más pesaba:
- La fuente completa de **Tabler Icons** desde jsDelivr: 825 KB, más su CSS que frenaba el primer dibujo. La página solo usa 36 íconos.
- La letra de Google Fonts, que también frenaba el primer dibujo.
- El **logo.png** de 700×700 (226 KB) para mostrarlo a 136 px. Se usaba también como ícono de la pestaña.
- Las fotos del catálogo, de 900 px, aunque en el celular se ven a unos 150 px: 640 KB de más.
- La foto principal se bajaba 2 veces: sin `?v=2` en el HTML y con `?v=2` desde los datos.

## Qué se hizo (solo `index.html` y archivos nuevos; nada cambia a la vista)
1. **Íconos:** se recorta la fuente a los 36 íconos de la página. Queda `assets/iconos/tabler-bc.woff2` (7 KB). Su CSS va dentro de `index.html` y la fuente se pide primero (`preload`).
   - **Si se agrega un ícono nuevo a `index.html`, hay que volver a correr `scripts/rendimiento/recortar-iconos.py`.** Si no se corre, el ícono nuevo sale vacío.
   - Las demás páginas (catálogo, tienda…) siguen con la fuente completa.
2. **Letra:** Google Fonts ahora carga sin frenar el primer dibujo (`preload` + `media=print onload`, y `noscript`).
3. **Logo:** `assets/logo-272.webp` (7,6 KB) en la página y `assets/logo-64.png` (3,6 KB) para la pestaña. `logo.png` sigue igual para los datos de Google (JSON-LD).
4. **Fotos del catálogo:** cada foto tiene una copia de 480 px (`assets/catalogo/<nombre>-480.webp`, 53 fotos: 2,7 MB → 0,8 MB).
   - Las tarjetas usan `srcset`: el navegador elige la copia que corresponde a la pantalla.
   - Si una foto nueva no tiene su copia de 480 px, `onerror` quita el `srcset` y se muestra la original.
   - Las fotos de batería y pantalla de la sección de reparaciones también tienen su copia de 480 px.
5. La foto principal en el HTML ya trae `?v=2`, así que se baja una sola vez.

## Resultado (mismo servidor local, 2 mediciones cada uno)
| | Antes | Después |
|---|---|---|
| Rendimiento | 55–57 | **81–82** |
| Primer dibujo (FCP) | 7,7 s | **1,7 s** |
| Foto principal (LCP) | 10,5 s | **4,6 s** |
| Peso total | 2,06 MB | **0,66 MB** |

Accesibilidad 93, buenas prácticas 100 y SEO 100: sin cambios.

En vivo debería dar un poco más, porque GitHub Pages comprime los archivos y el servidor de prueba no.

## Pruebas
- Playwright a 390 px (densidad 3) y a 1280 px, recorriendo toda la página:
  - los 230 íconos tienen su dibujo;
  - las letras Inter e íconos cargan;
  - no hay imágenes rotas ni respuestas 404, ni errores en la página;
  - el logo y las fotos usan la copia liviana cuando corresponde.
  - **6/6 PASS.**
- Captura antes y después a 390 px: se ven iguales.

## Lo que queda (no se tocó)
- `motion.js` (animaciones) sigue ocupando unos 1,4 s del procesador.
- `bc-form-espaciado*.css` todavía frena unos 0,3 s el primer dibujo.
- En los iPhone con pantalla de alta densidad, las tarjetas siguen usando la foto de 900 px, porque se ven nítidas así.

## Estado
Rama `claude/rendimiento-inicio`. **Sin publicar.**
