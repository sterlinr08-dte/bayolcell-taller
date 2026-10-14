# HERRAMIENTAS.md — qué tenemos disponible y para qué

**Regla del dueño (08-oct-2026):** antes de empezar cualquier pedido, la IA lee este archivo y usa de una vez la herramienta que corresponda, sin esperar a que el dueño la nombre.

- Este archivo vale para los 3 negocios: NEXUS PRO, STUDIO y BAYOL CELL.
- Si se instala o conecta algo nuevo, se agrega aquí y se deja la entrada en la bitácora.

## Kit de catálogo y skills copiadas (13-oct-2026)
- **`herramientas/kit-catalogo/README.md`**: cómo hacer el catálogo de precios (plantilla HTML → páginas PNG + PDF), el flyer de pantallas, las recetas probadas (Buzzy para imágenes y música, reels cuadro a cuadro, subtítulos exactos, volumen −14 LUFS) y lo que falla.
- Se copiaron a `.claude/skills/` las skills de NEXUS PRO que faltaban aquí: diseño, marketing, anuncios, SEO, video (HyperFrames y Remotion), revisión de código y seguridad. Licencias en `.claude/skills/LICENCIAS-TERCEROS.md`.

## Reglas que siempre aplican

**Cuentas, claves y pagos**
- No conectar cuentas, iniciar sesión ni gastar en servicios de pago sin el OK del dueño.
- El dueño escribe sus claves él mismo en el panel. Nunca se pegan en el chat ni en el repo.

**Redes sociales y mensajes**
- **Publicar, comentar o mandar mensajes** (Instagram, Facebook, WhatsApp, anuncios) se hace solo si el dueño lo pide y aprueba cada publicación.
- Mirar, leer o analizar sí se puede hacer libremente.

**Videos con IA**
- Revisar cuadro por cuadro antes de entregar:
  - el iPhone tiene **un solo** módulo de cámara arriba a la izquierda;
  - las manos tienen 5 dedos;
  - no hay letreros con letras inventadas;
  - nada cambia de forma de un cuadro a otro.
- No usar la cara de personas reales famosas con fines comerciales.

**HyperFrames**
- Siempre con la telemetría apagada (`HYPERFRAMES_NO_TELEMETRY=1`, `DO_NOT_TRACK=1`).
- Nunca usar `npx hyperframes usage`.

## Por necesidad

### Videos, reels y anuncios en video
| Herramienta | Para qué | Estado |
|---|---|---|
| **HyperFrames** (skills `hyperframes`, `general-video`, `motion-graphics`, `product-launch-video`, `music-to-video`, `embedded-captions`, `talking-head-recut`, `slideshow`, `faceless-explainer`, `media-use`, `hyperframes-*`) | Armar el video final en esta máquina: textos animados, transiciones, logo, música y cierre. | Instalado (nexus-pro y, desde el 13-oct-2026, también en este repo). Gratis. |
| **Buzzy** (MCP) | Generar imágenes y clips de video con IA: escenas, manos reparando, productos. Modelos probados: MiniMax-H3 (video) y Nano Banana (imagen). Seedance falla con personas reales. | Conectado. Usa créditos; el dueño autorizó usarlos para los videos de BAYOL. |
| **Higgsfield** (MCP) | Otra opción de video e imagen con IA, avatares, anuncios y publicar en TikTok. | Conectado. Pedir OK antes de gastar créditos o publicar. |
| **Remotion** (skills `remotion-*`) | Videos hechos con código, como el de la web de BAYOL (`videos-remotion/`). | Instalado. |
| **ffmpeg / yt-dlp** | Cortar, unir, poner audio y revisar cuadros. Bajar videos públicos. | En la sesión (scratchpad). |

### Redes sociales e Instagram
| Herramienta | Para qué | Estado |
|---|---|---|
| **`ver-video-redes`** (skill) | Pasar un enlace de Instagram, TikTok, Facebook o YouTube: baja el video, saca los cuadros y el audio, y compara canciones. | Instalada (nexus-pro). Funciona con publicaciones públicas. |
| **`analizar-instagram`** (skill, BAYOL) | Leer el perfil completo, ver qué publicación funcionó mejor, sacar los precios de los flyers y guardar la guía de marca. | Creada en bayolcell-taller. Para el perfil completo hace falta Supermetrics autorizado. |
| **`replica-*`** (11 skills, Jakeschincariol/replica-skill, MIT) | Copiar las FUNCIONES de una app o página (no su código ni su marca): `/replica-recon` (estudiarla) → architect → design → build → backend → test → diff → entrepreneur → brand → launch → deploy. | Instaladas el 10-oct-2026 en `.claude/skills/` de bayolcell-taller, nexus-pro y studio-rd. Solo las instrucciones: los programitas de Python del autor NO se copiaron (la seguridad de la sesión bloquea código de terceros); esos pasos se hacen a mano. |
| **Supermetrics** (MCP) | Datos de Instagram y Facebook: publicaciones, likes, vistas, alcance, mejores Reels, seguidores y **perfiles públicos de la competencia** (`IGPD2`, vía oficial de Meta). | **Conectado (09-oct-2026)** con la cuenta bayolcellsrl@gmail.com, «Team bayolcellsrl», Facebook «Bayol Cell RD». Prueba gratis hasta ~21-oct. |
| **`precios-competencia`** (skill, BAYOL) | «Mira el perfil de X y mándame los precios»: lee Instagram por Supermetrics (respaldo: TikTok público) y compara con el catálogo y los flyers de BAYOL. | Creada en bayolcell-taller. |
| **Windsor.ai** (MCP) | Datos de redes y anuncios. También puede publicar imágenes en Instagram o responder comentarios, solo con aprobación. | Conectado. Requiere conectar cada cuenta. |
| **Meta Ads** (MCP) | Biblioteca de anuncios (ver qué anuncios corre la competencia en RD), campañas, públicos y promocionar publicaciones. | Conectado. Crear o pausar anuncios solo con orden del dueño. |
| **Zernio** | Bandeja de mensajes de WhatsApp, Instagram y Messenger de los CRM (BAYOL, STUDIO). | En uso por los CRM. |
| **Firecrawl** (MCP) | Buscar en la web y leer páginas: competencia, tendencias, precios públicos. | Conectado. |

### Diseño de pantallas y páginas
`apple-design`, `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`, `emil-design-eng`, `review-animations`, `animation-vocabulary`, `canvas-design`.

En bayolcell-taller y studio-rd también está `impeccable`. **Figma** (MCP) está conectado para diseños.

### Referencias de diseño que mandó el dueño (11-oct-2026)
**Regla del dueño:** «Ese link que te envié es para tomarlo como referencia para cuando queramos algo; tú lo tomas de ahí.» Cuando pida un efecto, una animación o algo «más bonito», **mirar primero estas referencias** y proponer la pieza que encaje.

**Cómo se usan:**
- Están hechas en React o Framer, y nuestras apps usan HTML y JavaScript normal. Se **rehacen** en nuestro código, como la isla de avisos de NEXUS 59.20. No se pega su código sin revisar antes la licencia de esa pieza.
- No se conecta su MCP ni se crean cuentas en esas páginas sin el OK del dueño.
- Los efectos pesados (3D, partículas, fondos animados) van solo en portadas, logins o páginas públicas, nunca en pantallas de trabajo. Por eso el dueño quitó la rueda de las listas en NEXUS 59.19.
- Siempre con «reducir movimiento», con la línea gráfica de cada negocio y probado en iPhone.

| Referencia | Qué trae | Ideas ya vistas para nosotros |
|---|---|---|
| **The Kitchen**: https://www.dqnamo.com/kitchen (estudio dqnamo, Londres; reel de @adrien.ninet `DeO7DugISSR`) | Piezas que parecen objetos reales. Cada una tiene su página `/experiments/<nombre>` con el código: Receipt Printer, Hold to Confirm, Dynamic Button, Ticket, Stamp, Tactile Button, Scramble Text, Cassette Player, Magnetic Drop Zone, Playing Cards, Scroll Fade List, Animated Signature, Logo Trace Loader, Iridescent Foil, Model Selector. | **Impresora de recibos** para `nxReciboAnimado` (Seguros, Financiamiento y POS): impresora con «Imprimiendo recibo…» que pasa a «Pago completo ✓», y el papel sale a tirones. **Mantén presionado para confirmar**: anular o reversar pagos y eliminar abonos, en NEXUS y STUDIO. **Boleto perforado**: rifas de NEXUS y rifa de Bayol. **Botón que cambia**: «Registrar pago» → «Registrando…» → «Listo ✓». **Firma que se dibuja sola**: firma del financiamiento. |
| **Originkit**: https://www.originkit.dev (beta, ~590 efectos gratis; reel de @aiboy.ai `DayD735y1oB`) | Fondos, textos, cursores, galerías, botones, cargadores y 3D. Se puede copiar el código, usar en Framer o conectar por MCP (pide cuenta y clave). | Para logins y portadas: Kinetic Grid (malla que sigue el dedo), Particle Sphere (esfera de puntitos), Text Morph (texto que se transforma) y Proximity Orbit (círculo de fotos de clientes). |
| **GetLayers AI**: https://www.getlayers.ai (agencia Textura; reel de @textura.us `DeMmzkxMpFZ`) | Instrucciones listas («prompts») para que la IA haga páginas web de cine: 54 plantillas de página completa, escenas 3D, secciones, fondos y degradados. Se copia la instrucción y se le pasa a Claude. **Muchas son Premium, de pago.** | Para portadas públicas: la tienda STUDIO, la web de Bayol Cell o una portada de NEXUS PRO. La cafetería «Brewns» tiene una impresora térmica que saca el recibo, la misma idea que la de Kitchen. Las de pago, solo con el OK del dueño. |
| **MotionSites AI**: https://motionsites.ai (reel de @fitoroblesai `DeadagNJn58`, 12-oct; ese reel también recomienda GetLayers) | Biblioteca de **secciones de web animadas** con su instrucción («prompt») lista para copiar y pasarle a Claude: portadas (hero), pies de página, precios, llamados a la acción y fondos animados, filtradas por Gratis/Premium y por tipo (Landing, SaaS, Agencia, Portafolio, 3D). Cada diseño tiene «Copy full prompt». Tiene servidor MCP (pide cuenta). Muchas son **Premium, de pago**; el curso Design Rocket es aparte. | Para la web de Bayol Cell: una **portada con fondo animado** (estilo «Impressive Hero» o «Digital Epoch») detrás de «Reparamos tu pantalla», una **sección de precios animada** (estilo «What Package Fits You») para pantallas, baterías y cristal, y un **pie de página animado** con las 3 sucursales. Las de pago, solo con el OK del dueño. |
| **beUI**: https://beui.dev (reel de @sin_bugs `DdmIJekIuo0`, 22-sep) | Más de 120 **piezas de pantalla animadas** gratis y de código abierto (React + Motion + Tailwind, se copian o se instalan con shadcn): lista que se desliza para borrar o archivar, número que cambia dígito por dígito, botón que pasa de «Guardar» a «Listo ✓», contador + / −, menú lateral animado, ventana que sube desde abajo, cargadores, interruptores, selector de opciones y menú en flor. **Nuestro taller y la web no usan React**: hay que rehacerlas en JavaScript normal (como hicimos con Originkit y The Kitchen). | Para el taller: **números de los KPI que cambian dígito por dígito** (Dashboard, Incentivos, Financiamiento), **botón Guardar → Guardando… → Listo ✓** en Recepción y pagos, **deslizar una orden o un chat** en el celular para marcarlo o archivarlo, **contador + / −** para la cantidad de piezas. Para la web: el número que cambia en los precios del catálogo. |
| **Stage**: https://getstage.co (de @adrien.ninet; reel `Dds6cC0Iz37`). **Es un método, no efectos.** | Antes de que la IA programe, ordena el trabajo: investigar la competencia, definir la estrategia, juntar referencias, armar la guía de estilo, dibujar el recorrido de las pantallas y exportar todo en un `AGENTS.md`. Es una app para Mac de pago (29 dólares al mes, 14 días gratis). | No hace falta comprarla: ya lo hacemos con `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, las skills (`competitor-profiling`, `ui-ux-pro-max`, `product-marketing`) y estas referencias. Para una pantalla o un sistema nuevo grande se sigue ese orden y se le muestra al dueño una maqueta para tocar antes de programar, como la de «Mejoras del Buzón» (11-oct). |
| **Raylight**: https://www.raylight.app (captura del dueño de un reel de Instagram, 11-oct). **Es para videos, no para pantallas.** | Arma videos de presentación de una app con capturas de pantalla y clips: movimientos de cámara en 3D, desenfoque de fondo y transiciones, con un agente de IA. Plan gratis con marca de agua «Made in Raylight» a 1080p. Los de pago van de 12 a 49 dólares al mes (o desde 9 al año); el de 12 quita la marca y exporta en 4K. Pide crear una cuenta. | Referencia de estilo para videos de NEXUS PRO, STUDIO o Bayol hechos con capturas (por ejemplo, presentar la isla de avisos o el Buzón). Lo mismo se hace sin pagar con `product-launch-video` (HyperFrames) o Remotion. La cuenta y los planes, solo con el OK del dueño. |
| **Avisos «Dynamic Island»**: reel de @adrien.ninet `DeWaJ8PgQK8` (proyecto `rit3zh/expo-dynamic-notifications`, React Native) | Avisos que salen de la isla del iPhone. | **Hecho** en NEXUS PRO 59.20 (`parches-isla-avisos.js`, rama `claude/isla-avisos`), pendiente de publicar. |

### Seguridad
- `security-audit`, de Cloudflare. La auditoría completa se hace solo si se pide.
- `penetration-testing-with-strix`, `fix-security-vulnerabilities-with-strix`, `ci-security-scanning-with-strix`, `managed-pentesting-with-strix`, `gstack-cso`.

### Código, revisión y base de datos
- **Revisión y depuración:** `gstack-review`, `gstack-investigate`, `gstack-plan-eng-review`, `gstack-spec`, `gstack-health`.
- **Simplificar y arquitectura:** `ponytail*` (simplificar), `senior-architect`.
- **Pruebas:** `webapp-testing`.
- **Seguridad al editar:** `gstack-careful`, `gstack-guard`, `gstack-freeze`.
- **Base de datos:** **Supabase** (MCP), para consultar, migraciones y Edge Functions de los 3 proyectos, siempre con cuidado en producción. En bayolcell-taller también `supabase` y `supabase-postgres-best-practices`.
- **Plataformas:** **Cloudflare** (MCP), **Sentry** (MCP, errores), **GitHub**.

### Negocio, correo y documentos
- `lead-research-assistant` (buscar clientes o empresas), `invoice-organizer` (facturas), `gstack-plan-ceo-review`, `gstack-retro`.
- **Gmail** (MCP): leer y redactar. Enviar solo con OK.
- **GoDaddy** (MCP): dominios.
- **WhatsApp Business Tools** (MCP): números y plantillas de Meta. Nada se envía sin OK.
- **Docs y páginas:** documentos y páginas para compartir.

## Atajos: «quiero…» → herramienta

| El dueño dice | Se usa |
|---|---|
| «Hazme un video o reel» | `hyperframes` + Buzzy para escenas + revisión cuadro por cuadro |
| «Mira este video de Instagram/TikTok» | `ver-video-redes` |
| «Qué está funcionando en mi Instagram» | `analizar-instagram` + Supermetrics |
| «Qué hace la competencia» | Biblioteca de anuncios de Meta + Firecrawl + Supermetrics (perfiles públicos) |
| «Mejora esta pantalla» | `apple-design` / `impeccable` / `ui-ux-pro-max` |
| «Quiero un efecto, una animación o algo más bonito» | Primero las **Referencias de diseño** (Kitchen, Originkit, GetLayers, MotionSites, beUI) + `apple-design` |
| «Revisa la seguridad» | `security-audit` |
| «Algo falla» | `gstack-investigate` + Sentry + Supabase logs |
| «Haz una campaña» | Meta Ads (con aprobación) + video con HyperFrames |
