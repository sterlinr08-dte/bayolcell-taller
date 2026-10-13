# 2026-10-13 00:30 — Claude · Kit de catálogo y herramientas para el chat del taller

## Pedido del dueño
> «Ya publicamos los precios. Ahora deja todas las herramientas para que el otro chat haga un catálogo con todas las herramientas y conocimientos que tú tienes»

Se escribió desde el chat de NEXUS PRO.

## Qué se dejó
1. **Skills:** se copiaron a `.claude/skills/` **102 skills** de NEXUS PRO que faltaban aquí (diseño, marketing, anuncios, SEO, video con HyperFrames y Remotion, revisión de código y seguridad), más `LICENCIAS-TERCEROS.md`.
   - No se duplicaron `apple-design` ni `security-audit`, que ya estaban.
   - Son solo instrucciones y los scripts que traen las propias skills, sin claves. Se buscaron patrones de claves y no apareció ninguna real.
2. **`herramientas/kit-catalogo/`:**
   - `catalogo/`: plantilla del catálogo de precios (portada + páginas por grupo, 1080×1350) y `render.js`, que saca un PNG por página y el PDF. Tiene un **candado**: se para si un artículo trae costo o un campo que no sea nombre, precio o código.
     - Se probó con `ejemplo-datos.json`: 3 páginas y el PDF salieron bien.
     - `catalogo.json` (datos reales) y `salida/` quedan fuera del repo con `.gitignore`.
   - `flyer-pantallas/`: el flyer publicado («Pantallas desde RD$1,000»), con sus letras y su textura. Ahora toma el logo de `assets/logo.png` y la ruta de Chromium puede cambiarse con `CHROMIUM_PATH`.
   - `README.md`: cómo usar todo, las reglas del dueño (solo nivel 1, nada de costos, OK antes de publicar), las recetas que funcionaron (HTML + Playwright, reels cuadro a cuadro, Buzzy para imágenes y música, subtítulos exactos con HyperFrames `transcribe`, −14 LUFS, zonas seguras) y lo que falla.
3. **`HERRAMIENTAS.md`:** una sección que apunta al kit, y HyperFrames marcado como instalado también en este repo.

## Qué no cambia
- La app, la base, Info Plus y la web quedan igual.
- No se subió ningún precio real ni ningún costo.

## Siguiente paso (otro chat)
Cuando el dueño pida el catálogo:
1. leer los precios de nivel 1 en vivo;
2. armar `catalogo.json` con nombres limpios;
3. renderizar y revisar cada página;
4. enseñarlo al dueño antes de publicarlo.
