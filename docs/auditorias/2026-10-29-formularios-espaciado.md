# Bayol Cell: auditoría de formularios (29-oct-2026)

Revisé `origin/main` (commit `d15daa0`) en una copia aparte. No toqué ningún archivo ni ninguna rama del repo.
Las reglas vienen de DESIGN.md: «Espaciado de formularios» (rama `claude/regla-espaciado`), §4b y §5. Acepté una diferencia de ±2 px.

## Resultado
- **74 formularios revisados.** Los 74 se midieron con Playwright a 390 y 1280 px, usando el banco de pruebas con Supabase simulado. Ninguno quedó solo «por código».
- **Cumple: 1.** El buscador de `pantallas.html`.
- **Casi: 2.** «Reenviar mensaje (WhatsApp)» e «Importar manifiesto (Excel)». En los dos solo falla el relleno interior de la ventana.
- **No cumple: 71.**

Así estaban hechas las ventanas casi siempre (valor más común, que se repite en ambos anchos):

| Medida | Regla | Real |
|---|---|---|
| Etiqueta → cajita | 8 px | **5 px** |
| Campo → campo | 20 px | **16 px** |
| Botón principal | 54 px | **44 px** (36 de 49 ventanas) |
| Relleno de arriba | 24 px (celular) / 48 px (PC) | **30 px** en los dos anchos (es el alto de la barra de color del título) |
| Relleno de los lados | 16 px / 40 px | **16 px / 20 px** |
| Último campo → botón | 24 px | **65–73 px** (el pie queda lejos de los campos) |

## Las 5 fallas que más se repiten (número de formularios)
1. **Relleno interior de la ventana o tarjeta: 70.** En PC tiene 20 px a los lados en vez de 40, y arriba y abajo no llega a 48.
2. **Etiqueta → cajita: 56.** Mide 2–5 px; la regla pide 8.
3. **Último campo → botón principal: 52.** Mide de 60 a más de 100 px; la regla pide 24.
4. **Campo → campo: 46.** Mide 14–17 px; la regla pide 20. En las rejillas de 2 columnas a veces sube a 26–59 px.
5. **Botón principal: 46.** Mide 42–44 px; la regla pide 54.

Le siguen:
- letra menor de 13 px (21): «Activa», «Agregar línea», «Previsualizar», a 11–12 px;
- cosas que se tocan de menos de 44 px (11);
- etiquetas que no usan el gris #475569 (9).

## Casos que más se notan
- **Login del taller:**
  - campos de 44 px;
  - letra de los campos de 13 px en PC (el iPhone hace zoom con menos de 16);
  - etiquetas de 11 px en color #1e293b;
  - botón de 42 px;
  - «Volver a la página principal» de 39 px de alto.
- **Campañas (CRM) · entrada:** etiquetas en MAYÚSCULAS de 12 px, campos de 44 px con letra de 15 px.
- **Prefactura / Recepción:**
  - etiqueta → cajita de 2–4 px;
  - etiquetas en color #5b5951 o #64748b;
  - una casilla suelta, separada de su texto;
  - un control de 38 × 44 px.
- **Nuevo empleado (RRHH):** las casillas sí están en fila con su texto (44 px de alto). Fallan la etiqueta → cajita (5 px), la separación campo → campo (26 px de mediana en la rejilla de 2 columnas, con saltos de hasta 59), y «Agregar cuenta» y «Agregar referencia» a 12 px; además, una etiqueta va en color #0e7490.
- **Tienda:** la casilla «Solo disponibles» mide 17 px de alto.
- **Solicitud de financiamiento (web):** está casi bien. Sus campos miden 58 px y tienen letra de 20 px, a propósito: es una página de pantalla completa sin tarjeta, así que no medí el relleno. Las etiquetas van en #64748b. En el paso de la dirección, la separación campo → campo es de 40 px.

## Arreglo sugerido (sin rediseño masivo)
Casi todas las ventanas del taller usan la misma estructura, `.modal-box > .modal-header / .modal-body / .modal-footer` con `.form-row`. Por eso **una sola capa CSS reversible**, por ejemplo dentro de `taller-ui-global.css`, arreglaría unas 50 ventanas de una vez:
- `label { margin-bottom: 8px }`;
- `.form-row + .form-row { margin-top: 20px }`;
- relleno del cuerpo de 24 / 16 px en el celular y de 48 / 40 px en la PC;
- un pie a 24 px del último campo;
- botón principal con `min-height: 54px`;
- casillas y botones chicos a 13 px y 44 px.

El Login, Campañas, la Prefactura y la tienda necesitan retoques propios. Por la regla anti-FOUC, conviene hacerlo por partes y medir antes y después.

## Qué no se pudo medir bien
- **Los íconos no cargan en el banco de pruebas**, porque tienen la fuente Tabler bloqueada sin Internet. Los botones de solo ícono pueden medir un poco distinto en vivo.
- **Las ventanas que se desplazan por dentro** (Nuevo empleado, Crear artículo y otras): no medí el relleno de abajo ni el espacio campo → botón, porque cambian con el desplazamiento.
- **Algunas ventanas se abrieron con datos inventados** (equipo, lote, deuda, artículo), así que pueden mostrar menos filas que con datos reales.
- **«Relleno de arriba = 30 px»** es la distancia del borde al texto del título dentro de la barra de color. Si el dueño entiende la regla como relleno del cuerpo debajo de la barra, ese número cambia.
- **Quedaron fuera las pantallas que son tablas o informes sin campos de escribir**: Ubicación, Plantillas, Comparar con Info Plus, Historial, Perfiles, Financiamientos · Cobros y otras. También el CRM completo de WhatsApp, que es chat y no formulario.

## Archivos
- Resultado por formulario: `bayol.json`
- Mediciones sin procesar: `bayol-crudo.json`
- Capturas:
  - `bayol-nuevo-empleado-390.png`
  - `bayol-crear-articulo-390.png`
  - `bayol-login-390.png`
  - `bayol-prefactura-1280.png`
- Programas para repetir la medición: `auditar.cjs`, `medir.js`, `evaluar.cjs`, `base.cjs` y `final.cjs`
