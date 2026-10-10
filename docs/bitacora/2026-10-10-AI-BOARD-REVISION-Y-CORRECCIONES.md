# AI BOARD — Revisión, correcciones y respuestas A–J (10 oct 2026)

Rama: `claude/bayol-cell-taller-WHlam` (no publicada en `main`). Base de datos de producción: **solo lectura**, nada aplicado.

## 1. Estado real verificado

**GitHub**
- Los PR #108, #109 y #110 **ya están fusionados en `main`**. El informe de traspaso decía que el #110 estaba en borrador; ya no es así.
- El AI BOARD **está en producción** (bayolcell.com) desde esa fusión.

**Supabase en vivo (consultas de lectura del 10 oct)**
- Tablas `ai_board_*`: 0. Funciones `ai_board_*`: 0. Edge `ai-board-chat`: no existe.
- Tablas del módulo Diagnóstico, todas en **0 filas**:
  - `diagnosticos`
  - `panic_logs`
  - `diagnosticos_tecnicos`
  - `conocimiento_casos`
  - `placas_mapas`
  - `placas_puntos`
- Bucket `placas`: privado, 0 archivos.
- El taller **nunca ha guardado un diagnóstico, un caso resuelto ni una foto**. No hay datos ni usuarios que migrar.
- `bde-diagnostico` v22 está activo y es el único motor que funciona hoy.
  - No comprueba permisos: le basta cualquier sesión.
  - Tiene CORS `*`.
  - Pide «% de probabilidad», que contradice las reglas del AI BOARD.

**Pruebas automáticas (ejecutadas aquí)**

| Grupo | Resultado |
|---|---|
| Unitarias y base de datos (PGlite) | 37/37 ✅ |
| Navegador Chromium | 17/17 ✅ |
| Navegador WebKit | No hay WebKit en este equipo; lo corre GitHub Actions |

Limitación de esas pruebas:
- Las de navegador montan **solo** `#v-diagnostico` con un Supabase simulado.
- No cargan `taller-app.js` ni las capas del taller.
- Por eso se hizo además una prueba con el **taller completo** (ver abajo).

## 2. Fallos encontrados y corregidos en esta rama

### 1. Regresión en producción: «Guardar como caso resuelto» dejó de guardar

**Qué pasaba**
- `diagnostico-ai-library.js`, al cargar, le quitaba el `onclick="guardarCasoConocimiento()"` a ese botón.
- Lo renombraba a «Proponer solución para revisión».
- Esa revisión depende de la Biblioteca nueva, que no tiene servidor.

**Resultado:** el técnico no podía guardar casos. Era el mismo tipo de fallo que el #110 corrigió en «Diagnosticar con IA».

**Corrección:** el botón solo se cambia si el servidor de la Biblioteca existe.

### 2. Errores rojos y 11 botones que no hacen nada

**Qué pasaba**
- La pestaña Diagnóstico IA mostraba «Servicio de historial no disponible en este entorno».
- Además mostraba 2 listas y 9 botones sin efecto.
- La Biblioteca mostraba «Biblioteca protegida no disponible».

**Corrección**
- Nuevo `window.BayolAIBoardBackend.disponible()` en `diagnostico-ai-board.js`.
  - Consulta `ai_board_cases` **una sola vez**, solo al abrir esas pestañas.
  - Responde «falta» solo si el servidor dice `PGRST202` (función inexistente); otros errores no cuentan como «falta».
- Si falta el servidor:
  - el chat muestra un aviso tranquilo y el «Diagnosticar con IA» de siempre queda debajo;
  - la Biblioteca revisada se oculta y la tabla de casos de siempre sigue.

### 3. El filtro de privacidad borraba las mediciones eléctricas

**Qué pasaba**
- `minimize()` (servidor) y `ai_board_minimize()` (SQL) consideraban «identificador» cualquier grupo de 9 o más dígitos, aunque estuvieran separados por puntos.
- `Diodo PP_VDD_MAIN 0.412 0.389 0.401` → `Diodo PP_VDD_MAIN [IDENTIFICADOR OMITIDO]`.
- `Voltajes: 3.8 1.8 1.2 0.9 0.75` → `[IDENTIFICADOR OMITIDO]`.
- Es decir, la IA no habría recibido justo lo que necesita para diagnosticar.

**Corrección**
- El punto ya no cuenta como separador.
- Teléfonos, IMEI y series (dígitos con espacios, guiones o paréntesis) se siguen ocultando.
- Se agregaron pruebas en JS y SQL.

### 4. Permisos amplios en las fotos de placas

**Qué pasaba:** cualquiera con permiso de Diagnóstico podía editar o borrar fotos ajenas.

**Corrección preparada (NO aplicada):** `supabase/migrations/20261010000000_placas_solo_dueno.sql`.
- Todos los autorizados siguen **viendo** las fotos.
- Solo el autor o un admin **edita o borra**.
- Los archivos solo se suben a `ai-board/<id>/`.

**Por qué es seguro aplicarla:**
- Se verificó en vivo que las tablas y el bucket están vacíos.
- Ningún otro módulo los usa (`taller-app.js` no los nombra). Nacieron con `20261009000000_placas_mapas.sql`.

**Prueba local** (`tests/ai-board/placas-permisos.test.mjs`, PGlite): 2/2.

### Prueba con el taller completo

**Cómo se probó**
- `taller.html` real con un Supabase simulado que, como producción, **no tiene** `ai_board_*`.
- Anchos de 1366 px y 390 px.

**Antes de la corrección**
- El botón decía «Proponer solución para revisión» y no tenía `onclick`.
- El chat mostraba el error rojo.

**Después de la corrección**
- El botón dice «Guardar como caso resuelto» con `guardarCasoConocimiento()`.
- «Diagnosticar con IA» conserva `diagnosticarIA()`.
- Aparece el aviso tranquilo y no queda ningún error rojo.
- Se hace una sola consulta al servidor y hay 0 errores de JavaScript.

## 3. Respuestas A–J

### A. Porcentaje completado: ≈ 35 % del producto final; ≈ 10 % usable hoy

| Parte | Peso | Avance | Aporta |
|---|---|---|---|
| Interfaz de las 3 pestañas, visor, gestos, catálogo, chat y Biblioteca | 20 % | 85 % (falta simplificar) | 17 % |
| Servidor del chat (SQL + Edge, probado en PGlite y con simulaciones; no instalado ni conectado a la IA real) | 25 % | 40 % | 10 % |
| Servidor de la Biblioteca (mismo estado) | 10 % | 40 % | 4 % |
| BITMAP con datos reales (motor listo; 0 de 32 modelos con mapa verificado) | 30 % | 15 % | 4,5 % |
| Seguridad y permisos aplicados | 5 % | 40 % | 2 % |
| Pruebas reales con técnicos y placas | 10 % | 0 % | 0 % |
| **Total** | | | **≈ 37 %** |

Lo que un técnico puede usar hoy en producción:
- abrir fotos locales con zoom;
- el «Diagnosticar con IA» de siempre.

Ni el chat con historial ni la Biblioteca revisada funcionan todavía.

### B. Errores importantes

**Corregidos en esta rama**
- Los fallos 1, 2 y 3 de la sección 2.

**Pendientes**
- **Chat difícil de usar.** Hay que elegir «diagnóstico guardado» y «conversación» en 2 listas, con 6 botones de paginación. Como no existe ningún diagnóstico guardado, el técnico arranca siempre con «Crear diagnóstico del modelo», y eso no se entiende.
- **Modelo de IA desactualizado.** El modelo por defecto es `claude-sonnet-4-6` (lo mismo en `bde-diagnostico`). Hay que fijarlo con `AI_BOARD_CLAUDE_MODEL` a un modelo actual.
- **El límite diario se reinicia de noche.** Usa la fecha UTC: en RD se reinicia a las 8:00 p. m.
- **Las pruebas no cubren el taller completo.** No cargan `taller-app.js` ni las capas `bc-busqueda`, `taller-iconos` y `taller-afinado`.

### C. Seguridad

1. **`bde-diagnostico`, que está en producción, no comprueba permisos.**
   - Cualquier cuenta con sesión (aunque no tenga permiso de Diagnóstico) puede gastar crédito de la IA.
   - Tiene CORS `*` y no limita cuántas consultas se hacen.
   - Corregirlo es desplegar una función en producción, así que requiere aprobación.
2. **Fotos.** Las reglas amplias del punto 4 siguen. Riesgo actual nulo, porque hay 0 fotos, pero hay que aplicar la migración antes de subir la primera.
3. **`diagnosticos` y `conocimiento_casos`.** Tienen RLS «todo para quien tenga permiso de Diagnóstico». Un técnico puede borrar casos de otros. Hoy no hay datos.
4. **Nuevo servidor (`ai-board-chat`).** El diseño es correcto:
   - verifica la sesión con `auth/v1/user`;
   - comprueba `app_puede_diagnostico`;
   - aplica RLS por dueño y caso;
   - usa reservas idempotentes, límite de 8 KB, cuotas y CORS con lista blanca;
   - `ai_board_finish` solo lo puede llamar el servidor.

### D. Arquitectura del servidor

Es adecuada en lo esencial: RLS, turnos con `request_id`, reserva y cierre atómicos, y control de acceso dentro del servidor.

Ajustes que conviene hacer:
- **Una conversación por orden o caso, creada sola.** Abrir el caso desde la orden de reparación, con el `diagnosticos` creado automáticamente, en lugar de 2 listas y paginación.
- **Modelo y orígenes por variables de entorno.** `AI_BOARD_CLAUDE_MODEL` con un modelo actual y `AI_BOARD_ALLOWED_ORIGINS=https://bayolcell.com`.
- **Límite diario en hora de RD.**
- **Un solo motor de IA.** Unir `bde-diagnostico` dentro del mismo servidor con permisos, en vez de tener dos motores con reglas distintas.

### E. Qué falta para que el chat funcione de verdad

1. Instalar `schema.sql`, `library.sql` y `maintenance.sql`, y desplegar `ai-board-chat` con sus secretos. Requiere aprobación.
2. Simplificar la pantalla: un chat por caso, sin paginación visible, que cargue el historial solo.
3. Una prueba real con 2 cuentas: un técnico no puede ver el chat de otro.
4. Formato de respuesta con títulos (Evidencia / Hipótesis / Próxima prueba), en texto seguro.
5. Que use los casos aprobados de la Biblioteca como contexto, como ya hace `bde-diagnostico` con `conocimiento_casos`.

### F. Qué falta para tener mapas BITMAP reales (iPhone X en adelante)

- **Datos de cada revisión de placa con permiso de uso:** posiciones de componentes, pines y redes. Sin eso, el visor solo muestra fotos.
- **No se pueden copiar los mapas de REFOX ni los esquemas filtrados** (ya decidido).
- Fuentes legítimas posibles:
  - mapas hechos por el propio taller (foto propia de alta resolución + marcado manual de puntos medidos en `placas_puntos`);
  - una licencia comercial que permita exportar los datos.
- **Recomendación:** empezar con 1–2 modelos que más llegan al taller, con fotos propias y puntos medidos por los técnicos (valores reales anotados), no con un catálogo completo.

### G. Qué eliminar, simplificar o rediseñar

- **Chat:** quitar las 2 listas y los 6 botones de paginación; queda un chat por caso.
- **BITMAP:** «Importar boardview JSON» y «Abrir carpeta de foto HD» son herramientas de desarrollador. Moverlas a «Más opciones» o dejarlas solo para admin.
- **Formulario de fotos:** pide «Permiso de uso» y «Procedencia» como texto libre. Para fotos propias, poner una casilla «Foto tomada en el taller».
- **Etiqueta «AI BOARD · Versión de prueba»:** se mantiene mientras no haya servidor (es honesta).

### H. Qué ya se programó y probó (esta rama)

- Las 3 correcciones del frente (fallos 1, 2 y 3).
- La migración de permisos de fotos, con su prueba.
- Las pruebas nuevas:
  - 1 de navegador sin servidor;
  - 1 del filtro de privacidad en JS;
  - 1 del filtro de privacidad en SQL;
  - 2 de permisos de fotos.

Lo que sigue, sin tocar producción:
- simplificar el chat (punto G);
- unir y proteger `bde-diagnostico` (punto C1);
- reloj del límite en hora de RD.

### I. Lo que necesita aprobación antes de tocar producción

1. Publicar esta rama en `main`.
2. Aplicar `20261010000000_placas_solo_dueno.sql`.
3. Instalar las tablas y funciones del AI BOARD (`schema`, `library`, `maintenance`) en la base de producción. No existe base de pruebas: `list_branches` = [], y una rama de Supabase cuesta dinero.
4. Desplegar `ai-board-chat` y configurar `AI_BOARD_ALLOWED_ORIGINS` y `AI_BOARD_CLAUDE_MODEL`.
5. Cambiar `bde-diagnostico` para que exija permiso.

### J. Condiciones para declarar AI BOARD terminado

- **Chat**
  - Instalado y probado con al menos 2 técnicos reales.
  - Historial que se recupera al recargar.
  - Un técnico no ve chats ajenos.
  - Respuestas en menos de 30 s.
- **Biblioteca**
  - Probado el flujo proponer → aprobar por otra persona → aparece como aprobada.
  - Comprobado que nadie se aprueba a sí mismo.
- **BITMAP**
  - Al menos 1 modelo con foto propia de alta resolución y puntos medidos, marcado como «verificado por el taller».
  - Los demás modelos dicen claramente «sin mapa».
- **Seguridad**
  - Migración de fotos aplicada.
  - `bde-diagnostico` con permisos.
  - Sin errores nuevos en `get_advisors`.
- **Regresiones**
  - «Diagnosticar con IA», «Guardar como caso resuelto», panic logs y el resto del taller siguen funcionando, en celular y en PC.

## 4. Segunda parte (10 oct 2026) — con permiso del dueño: instalado, protegido y simplificado

### Servidor instalado en producción
- **Tablas y funciones:** `supabase/migrations/20261010010000_ai_board_servidor.sql`, aplicado en 9 partes (`ai_board_1_tablas` … `ai_board_8_ajustes`).
  - Aplicado en una sola pieza, la herramienta se quedaba esperando (60 s).
- **Falta solo la limpieza automática del historial** (`ai_board_purge_history` + tarea programada).
  - La herramienta exige una confirmación extra cuando hay `delete`, y esa confirmación no llega desde el chat.
  - Queda en `supabase/PEGAR-EN-SUPABASE-2026-10-10.sql`.
- **Prueba con usuarios reales** (Francis y Loribel, dentro de una transacción deshecha; no quedó nada guardado):
  - un técnico crea su caso y su conversación;
  - no puede falsificar respuestas: `update` y `ai_board_finish` le son denegados;
  - el otro técnico no ve la sesión, los turnos ni los casos de ese técnico, y no puede reservar ni crear sesiones en ellos;
  - un usuario sin permiso de Diagnóstico (Josiel) no puede crear casos.
- **`ai-board-chat` (v3, verify_jwt):**
  - modelo `claude-opus-5-5`, esfuerzo `medium`;
  - `fallbacks:"default"` y aviso claro si la IA rechaza la consulta;
  - **red de seguridad:** si el modelo nuevo da 400/404, reintenta con `claude-sonnet-4-6`;
  - CORS por defecto: `bayolcell.com` y `www.bayolcell.com`;
  - respuestas en texto plano.
  - **Probado:** sin sesión → 401.
- **`bde-diagnostico` (v23):**
  - ahora exige `app_puede_diagnostico` en el servidor; sin permiso, mensaje claro y nunca llama a la IA;
  - modelo nuevo con la misma red de seguridad;
  - `max_tokens` 8000.
  - **Probado:** con la llave anónima responde «sin permiso».
  - El código está ahora en el repo: `supabase/functions/bde-diagnostico/`.
- **Fotos de placas:** la migración `20261010000000_placas_solo_dueno.sql` también quedó retenida por la misma confirmación (`drop policy`).
  - Está dentro del mismo archivo para pegar.
  - Ese archivo se probó dos veces seguidas en PGlite sin errores.
- **No probado de punta a punta:** una pregunta real a la IA con la sesión de un técnico.
  - Desde aquí no hay credenciales de usuario.
  - Lo prueba el dueño (pasos en «Para probarlo»).

### Pantalla más fácil para el técnico
- **Diagnóstico IA**
  - Tres pasos visibles: elegir modelo → escribir → la IA dice qué medir.
  - Un solo selector de modelo, sincronizado con el del BITMAP.
  - Botones de preguntas rápidas con plantilla para completar con lo medido: No enciende, No carga, Sin imagen, Se reinicia, Se calienta.
  - «Nueva consulta» en rojo.
  - **La primera pregunta crea sola el caso y la conversación** (`crearCasoYSesion`).
  - Al entrar se abre sola la última conversación del modelo elegido (`autoAbrir`).
  - El consentimiento se recuerda por usuario en el navegador (`bayol_ai_board_consent_v1`).
  - Listas de casos, conversaciones y páginas plegadas en «Consultas anteriores».
  - La opción «componente del mapa» solo aparece cuando hay uno seleccionado.
- **BITMAP**
  - Foto ilustrativa por generación de placa, generada con **Buzzy (Nano Banana Pro, 4K 3584×4800)**: `assets/ai-board/placas/placa-{x,xr,11,12-13,14-16}.webp` + `-mini.webp`.
    - Se muestra como fondo (no como `<img>`) con la marca «ILUSTRACIÓN CON IA · NO ES LA PLACA REAL · NO USAR PARA MEDIR».
    - La 4K se carga solo al acercar (zoom ≥ 1.6).
    - La primera versión del iPhone 11 traía un conector micro-USB; se volvió a generar.
  - Herramientas de desarrollador (importar mapa, carpeta HD, buscar componente, designadores, pines) plegadas en «Herramientas avanzadas». Se abren solas al cargar un mapa.
  - Textos más simples.
- **Pruebas:**
  - unitarias y base: 38/38, con nuevas pruebas de modelo, red de seguridad y rechazo;
  - navegador Chromium: 19/19, con dos nuevas: flujo simple y apertura automática;
  - pantallas revisadas en el taller completo a 1366 px y 390 px, con 0 errores de JavaScript.

## 5. Placas por modelo y por cara (10 oct 2026)

**Pedido del dueño:** placas «lo más reales posible», una por modelo, cara A y cara B, empezando por los modelos que más llegan.

**Modelos que más llegan** (según órdenes y reacondicionados, en este orden):
14/14 Plus, 12 Pro Max, 13 Pro Max, 12, XR, 15/15 Plus, 11, 15 Pro Max, 11 Pro Max, 14 Pro Max.

**Diseños de placa** — 16 grupos de modelos que comparten placa (`familiaPlaca` en `diagnostico-ai-board.js`):

| Grupo | Modelos |
|---|---|
| `x` | X, XS, XS Max |
| `xr` | XR |
| `11` | 11 |
| `11pro` | 11 Pro, 11 Pro Max |
| `12` | 12, 12 Pro |
| `12mini` | 12 mini |
| `12promax` | 12 Pro Max |
| `13` | 13, 13 mini |
| `13pro` | 13 Pro, 13 Pro Max |
| `14` | 14, 14 Plus |
| `14pro` | 14 Pro, 14 Pro Max |
| `15` | 15, 15 Plus |
| `15pro` | 15 Pro, 15 Pro Max |
| `16` | 16, 16 Plus, 16e |
| `16pro` | 16 Pro, 16 Pro Max |
| `17` | 17, Air, 17 Pro |

**Archivos:** `assets/ai-board/placas/placa-<diseño>-<a|b>.webp` (4K, 3584×4800) más `-mini.webp` (900 px).
- Cara A = placa superior (lado del procesador).
- Cara B = placa inferior (lado de la radio y la SIM).
- El selector «Vista» cambia de cara.

**Generación** (Buzzy, Nano Banana Pro 4K): 32 iniciales y 21 repetidas.
- **Motivo de las repeticiones:** varias salieron con forma de teléfono entero y hueco de cámara, otra con el anillo MagSafe, y otras torcidas o en verde.
- **Lo que funcionó en el prompt:** pedir «placa angosta, unas 2,2 veces más alta que ancha, derecha, completa, sin hueco de cámara, sin MagSafe, sin puerto».
- **Para el 17** se quedó la primera versión: la repetición salió peor.
- Se borraron las 5 fotos por familia de la versión anterior.

**Siguen siendo ilustraciones:** la marca «NO ES LA PLACA REAL · NO USAR PARA MEDIR» se mantiene.

**Pruebas:** 38/38 y 19/19. Cambio de modelo y de cara probado en el taller completo, con 0 errores.
