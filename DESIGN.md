# DESIGN.md — estilo NEXUS (NEXUS PRO · Bayol Cell · STUDIO)

Guía de diseño que toda IA debe leer **antes de crear o cambiar una pantalla** en cualquiera de los 3 proyectos.
Idea tomada de Awesome DESIGN.md (formato Google Stitch), escrita con los valores reales de NEXUS PRO y con las
decisiones del dueño. Va igual en los 3 repos; lo que cambia por proyecto está en «Acento por proyecto».
Creado el 20-oct-2026. Si el dueño decide algo nuevo de diseño, se agrega aquí y en la bitácora.

## 1. Ambiente
- **Claro, ordenado y elegante**, con estilo Apple y vidrio esmerilado. Superficies blancas translúcidas sobre un fondo suave.
- **Denso pero aireado.** Las pantallas son de trabajo: hay que ver más datos con menos desplazamiento, sin apretar.
- **Nada de adornos que no ayuden.** Las ayudas largas van detrás de una ⓘ, nunca como avisos grandes en la pantalla.
- **Una sola entrada por función.** Nunca dos botones que hagan lo mismo. Revisar antes de agregar uno.

## 2. Color
| Rol | Valor | Uso |
|---|---|---|
| Tinta | `#0f172a` | Texto principal |
| Texto secundario | `#475569` / `#64748b` | Subtítulos, etiquetas |
| Texto apagado | `#94a3b8` | Encabezados de tabla en mayúscula, ayudas |
| Borde | `rgba(15,23,42,.08)` | Líneas finas, tarjetas |
| Vidrio | `rgba(255,255,255,.86)`; fuerte `.94` + `blur(24px) saturate(180%)` | Ventanas, tarjetas flotantes |
| Fondo de modal | `rgba(15,23,42,.35)` + `blur(6px)` | Detrás de ventanas emergentes |
| Azul NEXUS (acción, foco) | `#2563eb` / `#1d4ed8`; suave `rgba(59,130,246,.07–.16)` | Enlaces, foco, selección, consultas |
| Éxito / disponible | `#15803d` sobre `#f0fdf4`; punto `#22c55e` | «Disponible», «En Info Plus», pagado |
| Aviso | `#b45309` sobre `#fef3c7`; punto `#f59e0b` | «Crear», pendientes |
| Error / sin stock | `#b91c1c` sobre `#fef2f2` | «Sin stock», errores. **El rojo solo para problemas** |
| Sin leer (como WhatsApp) | `#25d366`, texto blanco | Círculos de conteo |
| Almacén / existencia | `#0e7490` sobre `#ecfeff` | Píldoras de almacén |

### Acento por proyecto
- **NEXUS PRO:** azul NEXUS. Menú con riel azul en el modo claro.
- **Bayol Cell:** naranja `#e4572e` / `#FF6B35` para acciones principales (Guardar, +). Barra superior azul noche. Las consultas y ventanas emergentes usan el azul NEXUS.
- **STUDIO:** su propio acento, sobre la misma base. Revisar el repo antes de cambiarlo.

## 3. Tipografía
- **Letra del sistema** en todo, números incluidos: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui`. Bayol puede usar «Plus Jakarta Sans».
  - **No usar letra de máquina de escribir** (monospace) para fechas, totales ni precios. El dueño la rechazó.
  - Para que las cifras se alineen: `font-variant-numeric: tabular-nums`.
- **Escala NEXUS:**
  - grande 28;
  - título 1: 24;
  - título 2: 20;
  - título 3: 17;
  - texto 15;
  - destacado 14;
  - subtítulo 13;
  - nota 12;
  - leyenda 11.
- **Campos de escribir:** 16 px mínimo, para que el iPhone no haga zoom.
- **Encabezados de columna:** 12 px, mayúscula, `letter-spacing .04–.06em`, color apagado.
- **Dinero:** siempre `RD$ 1,250.00`, con dos decimales y separador de miles.

## 4. Componentes
- **Botones:**
  - toque mínimo de 44 px;
  - forma de píldora (`border-radius: 999px`) o 10–14 px;
  - al presionar, `scale(.94–.97)`.
  - El texto es corto y dice la acción («Consulta», «Servicio», «Guardar»). Nada de palabras de relleno como «Elegir —».
- **Botón de solo ícono:** 36–44 px, redondo, con `aria-label`. Usarlo solo si el ícono se entiende solo: ✕, lupa, copiar.
- **Campos:**
  - alto 48 px, letra 16 px, radio 12–14 px;
  - al enfocar: borde azul `rgba(59,130,246,.6)` y anillo `0 0 0 4px rgba(59,130,246,.16)`.
  - Lo que no se puede editar se muestra como texto, nunca como una caja que parezca campo.
- **Etiqueta de estado:** píldora pequeña de 26 px con un punto de color y una palabra («Crear», «En Info Plus», «Error»). Nada de frases largas.
- **Ventana emergente (consultas, buscadores):**
  - vidrio fuerte, radio 20 y sombra suave por capas;
  - barra de título clara: ícono azul, título de 17 px y ✕ redonda gris de 36 px;
  - en la PC se arrastra desde la barra; en el celular ocupa la pantalla y sube desde abajo.
- **Listas y tablas:**
  - fila de 52 px o más;
  - al pasar el ratón, `rgba(59,130,246,.07)`;
  - al tocar, se abre el detalle debajo de la fila.
  - El mismo dato no se repite en dos lugares.
- **Ayudas:** detrás de una ⓘ junto a la etiqueta. No van en cajas amarillas grandes.

## 4b. Orden de formularios y ventanas (dueño, 24-oct-2026) — igual en los 3 proyectos
Nació de la ventana «Solicitud de financiamiento» del CRM de Bayol: las etiquetas salían en MAYÚSCULAS y las casillas quedaban
sueltas arriba del texto. El dueño pidió textos formales y todo alineado, y que sea regla para todo el sistema.
- **Etiquetas** de los campos en minúscula normal (solo la primera letra en mayúscula), 13 px, gris `#475569`, encima del campo.
  Nunca en MAYÚSCULAS ni con `letter-spacing`. Las MAYÚSCULAS quedan solo para encabezados de tabla (12 px) y KPI.
- **Textos formales y cortos, en usted.** Ejemplo: «Confirmo que informé al cliente el equipo y el precio.» Sin paréntesis
  explicativos, sin referencias a reglas internas («regla del dueño…») y sin frases de relleno. Ayuda de la ventana: una o dos
  frases arriba, o detrás de una ⓘ.
- **Casillas (checkbox) siempre en fila con su texto:** cuadrito de 22 px a la izquierda, texto a la derecha, alineados al
  centro, dentro de una tarjeta clara de 48 px de alto con borde `#e2e8f0` y radio 12. Nunca la casilla sola arriba del texto.
- **Selectores y campos** iguales: 48 px de alto, letra 16 px, radio 12, foco azul NEXUS. El selector dice opciones completas
  («Enlace a la página de Bayol Cell»), no abreviaturas ni «(recomendado)» dentro de la opción.
- **Botón principal** 54 px con la acción en dos o tres palabras («Enviar al cliente», «Guardar»).
- **Cascada:** si la ventana hereda estilos de la pantalla (mayúsculas, `display:block`, casillas sueltas), la capa debe ganar
  con selectores de más peso (`#idDeLaVentana …`) y **probarse a 390 px antes de entregar**, porque en el celular es donde se nota.
- Las ventanas nuevas nacen así; las existentes se van corrigiendo al tocarlas, sin rediseños masivos (regla anti-FOUC).

## 5. Medidas y espacio
- Espacios de 4, 8, 12, 16, 24 px.
- Margen lateral de 16 px en el celular.
- **Radios:**
  - píldoras 999;
  - tarjetas y ventanas 16–20;
  - campos 12–14;
  - chips 6–8.
- En la PC, lo que es una sola cosa va **en una línea**, aprovechando el ancho.
- En el celular, lo esencial va arriba y lo opcional en desplegables («Equipo, falla y más datos (opcional)»).
- **No poner barra inferior fija** si repite funciones.

## 6. Profundidad
- **Sombras suaves por capas:**
  `0 1px 0 rgba(255,255,255,.8) inset, 0 0 0 1px rgba(15,23,42,.06), 0 30px 70px -24px rgba(15,23,42,.45), 0 12px 24px -12px rgba(15,23,42,.18)`.
- **Niveles:** fondo → tarjeta de vidrio → ventana emergente (con fondo oscurecido y desenfocado).

## 7. Movimiento (rápido y fluido)
- **Curva base:** `cubic-bezier(.22,1,.36,1)`. Rápido 160 ms, base 220 ms, cajón 360 ms.
- **Abrir ventana:** resorte `nxPopIn .26s cubic-bezier(.34,1.56,.64,1)`, desde `translateY(10px) scale(.96)`. Cerrar en 140 ms.
- **Listas:** las filas entran en cascada (8 px, 18 ms entre filas, máximo 90 ms) **solo al escribir**. Con las flechas o al tocar una fila, no se repite.
- **Solo animar `transform` y `opacity`.**
- Respetar `prefers-reduced-motion`: con esa opción, todo instantáneo.
- **Nunca** causar parpadeo al cargar (FOUC). Fue la causa del rollback del rediseño (#311).

## 8. Reglas técnicas del dueño
- **Cambios visuales en capas aisladas** (un archivo o bloque por módulo), reversibles y con versión `?v=`.
  - No acumular CSS contradictorio: antes de agregar un override, ver qué regla gana hoy.
- **Probar a 390–440 px (iPhone) y a 1280 px**, con capturas, antes de entregar.
- **Español sencillo, trato de «usted».** Nombres que dicen lo que hacen.
- **No publicar** sin «publícalo» del dueño.

## 9. Guía rápida para pedir pantallas a una IA
«Usa el DESIGN.md del proyecto:
- vidrio claro y radio 16–20;
- azul NEXUS para foco y consultas;
- botones de 44 px, campos de 48 px con letra de 16 px;
- letra del sistema y dinero en RD$ con dos decimales;
- estados en píldora con punto de color;
- ayudas detrás de una ⓘ;
- una sola entrada por función;
- animación de 160–260 ms con la curva `(.22,1,.36,1)`;
- probar a 390 y 1280.»

## Espaciado de formularios (dueño, 29-oct-2026) — igual en los 3 proyectos
Viene del reel «Stop guessing your UI form spacing» (`DfFFnkBOllG`). El dueño pidió volverlo regla.
Idea: **lo que va junto queda pegado; lo que es de otro grupo se separa más.** No se adivinan espacios.

| Entre… | Espacio |
|---|---|
| Título de la ventana o tarjeta y su texto de ayuda | 8 px |
| Nombre del campo (etiqueta) y la cajita | 8 px |
| La cajita y su texto de ayuda o error debajo | 4 px |
| Un campo y el siguiente | 20 px |
| Un grupo y otro (encabezado → campos → botón principal → otras opciones) | 24 px |
| Botones o filas de una misma lista (por ejemplo «Continuar con…») | 8 px |
| Borde de la tarjeta a su contenido, en la PC | 48 px arriba y abajo · 40 px a los lados |
| Borde de la tarjeta a su contenido, en el celular (390 px) | 24 px arriba y abajo · 16 px a los lados |

- Se suma a las otras medidas: campos de 48 px de alto con letra de 16 px, botón principal de 54 px y todo lo que se toca de 44 px o más.
- Los formularios nuevos nacen así. Los que ya existen se corrigen cuando se tocan, sin rediseños masivos (regla anti-FOUC).
- Al entregar, se miden los espacios con Playwright a 390 y 1280 px y se anotan en la bitácora.

## Regla del dueño: todo «smart» (30-oct-2026)
> «Recuerda siempre poner todo smart.»

Toda pantalla, ventana o función nueva, y toda la que se toque, se entrega **smart**. El dueño lo definió así:
1. **Que piense por el usuario.** Valores ya puestos, autocompletar, formatos que se arman solos (cédula, teléfono, dinero), avisos antes de que algo falle y lo más usado a un toque.
2. **Que se vea elegante y moderno.** Acabado fino: vidrio, la regla de espaciado, movimientos suaves; nada que se vea viejo ni amontonado.
3. **Que funcione igual de bien en iPhone y en PC.** Diseñado primero para el celular, sin nada cortado ni que se salga, y aprovechando el ancho de la PC.

Antes de entregar, revisar los 3 puntos y anotarlo en la bitácora. Si algo no puede ser smart, decirlo y por qué.
