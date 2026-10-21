# MEMORIA.md — Bayol Cell (para que la IA se ponga al día tras compactar)

Borrador del 21-oct-2026. Solo hechos verificados. Si algo de aquí choca con el código, la base o una bitácora más nueva,
manda lo más nuevo. Ante la duda, volver a leer (nunca suponer).

## 1. Propósito
- Sistema interno de **Bayol Cell**: taller de reparación + venta de celulares y accesorios.
- 3 sucursales: **Santiago, Moca, Navarrete**. Almacenes de Info Plus: 1 Santiago · 3 Garantía China · 4 Moca · 5 2do nivel ·
  6 Taller · 7 Navarrete (confirmado 13-oct). Sucursal → almacén: Santiago 1, Moca 4, Navarrete 7.
- Web pública y app en **bayolcell.com** (GitHub Pages desde `main`; push a `main` = producción).
- Supabase: proyecto **`vkhwdvjtowrhkhqavnvk`** («BayolCell-taller»).
- Rama de trabajo actual: **`claude/prefactura-limpia`**.
- Sin build ni framework: HTML + JS puro. Lógica principal en `taller-app.js` (subir `?v=` en `taller.html` al cambiarlo).
  Cambios visuales en capas aisladas (`taller-*.js/.css`, `crm-*.js/.css`) con interruptor y `?v=`.

## 2. Dueño y reglas de trabajo
- Dueño: **Sterling** (Esterlin). No es programador: español sencillo, sin jerga; terminar con «Para probarlo:».
- **Trato de «usted»** en todo texto al empleado y al cliente (desde 19-oct). Rótulos con nombres, no preguntas. Sin exclamaciones.
- **Publicar solo con «publícalo»** (o equivalente explícito) para esa entrega concreta. Lo demás queda en la rama.
- **Bitácora nueva** por cada cambio/decisión/publicación: `docs/bitacora/AAAA-MM-DD-HHMM-claude-tema.md`.
  Nunca editar ni borrar una entrada anterior; corregir con otra que la cite.
- **Secretos nunca** en repo, chat ni logs: `INFOPLUS_CLAVE`, service_role, Zernio, Anthropic, Hexnode. Solo `Deno.env` en Edge.
  En el cliente solo la clave publicable + RLS.
- **No poner IDs de modelo** (ni de IA de la sesión) en los mensajes de commit.
- **Tamaño táctil:** todo lo que se toca ≥ **44 × 44 px**; campos **48 px de alto con letra de 16 px**; letra mínima de controles 13 px.
  Medir con Playwright a **390 y 1280 px** y anotarlo. Capa `taller-tactil.css` (`html.bc-tactil`, excluye `#waWrap`).
- Diseño: leer **`DESIGN.md`** (estilo NEXUS común a los 3 proyectos; Bayol con acento naranja `#e4572e`, ventanas de consulta en
  azul NEXUS) y `docs/REFERENCIAS-DISENO.md` antes de cualquier pantalla. Una sola entrada por función. Ayudas detrás de una ⓘ.
  Nada de letra monoespaciada en números (usar `tabular-nums`). Nada de FOUC.
- Usar las **skills instaladas** sin esperar a que las nombren (ver `HERRAMIENTAS.md`). Nuevas en este repo: `design-taste-frontend`
  (solo páginas públicas nuevas, pesada) y `the-architect` (plano antes de algo grande; publicada en `main`, e53c003).
- **Datos de Bayol salen solo de su Info Plus** (copia `infoplus_articulos` y funciones `infoplus-*`). STUDIO sirve solo como modelo
  de diseño, nunca como fuente de datos.
- **Escribir en Info Plus** (precios, prefacturas de prueba, ajustes) exige autorización expresa del dueño. Leer antes en vivo.
- Agente de IA de WhatsApp: seguir `.claude/rules/agente-atencion-supervisado.md` y
  `AGENTE_ATENCION_APRENDIZAJE_SUPERVISADO_2026-09-14.md`.

## 3. Qué tenemos funcionando (por módulo)
**Prefactura** (antes «Recepción»; id interno `recepcion`, tabla `recepcion_prefacturas`; capa `taller-prefactura.js/.css`,
apagar con `localStorage.bc_pf_off='1'` o `BC_PF=false`):
- Documento estilo STUDIO: franja Facturar a · Precio del cliente · Almacén; Vendedor al pie junto a «Pedir reseña».
- **Lupa arriba a la izquierda = única entrada al historial** de prefacturas.
- Estado en **píldora con punto** («Crear», «En Info Plus», «Error», «Facturada»…).
- Cliente de contado: **«CONTADO: 1»**. Precio del cliente: **CLIENTE FINAL / POR MAYOR / EXTREMO** (cliente con código ≠ 1 → Por mayor).
- Equipo, falla y más datos en plegable opcional; con equipo crea también la orden. Descuento % por línea (sin probar contra Info Plus real).
- Almacén fijo para empleadas con sucursal; el admin elige y se recuerda en su equipo (`bc_alm_admin`).
- Códigos de vendedor Info Plus en `tecnicos.infoplus_codempleado`: Michelle 748, Kenifer 1020, Yosmeiry 1192, Loribel 249; Yves sin código.
- Celulares: botón IMEI abre ventana; **lista «IMEI en <almacén>»** (vacía hoy, ver §6); se escanea o escribe.
  Covers, forros, cases, cristales y accesorios **no piden IMEI** (`_abCat`).
- Buscador de artículos como ventana emergente (vidrio NEXUS): Código · Artículo · Existencia · Precio; al tocar, niveles y existencia
  por almacén; muestra la **referencia** de Info Plus (capacidad / «Con aviso»). La línea de servicio lleva equipo · IMEI · falla
  a Info Plus (máx. 100 letras), porque la API no tiene campo Comentarios visible.

**CRM WhatsApp** (vista `v-crmLinea`):
- Botón **«Consulta»** (antes «Precios») en la cabecera del chat (`crm-consulta-precio.js/.css`): solo consulta, precio cliente final
  (nivel 1), columna Existencia con **Total** o **«Sin stock»**, detalle con línea **«Existencia»** (almacén + cantidad … Total),
  etiqueta de referencia (capacidad / «Con aviso»), **botón copiar que copia solo el precio** («RD$ 15,000.00»).
- **Etiquetas** con cantidad de chats y círculo verde de sin leer; botón «Etiquetas ▾» con total sin leer.
- **Acuses** («ok», «gracias», «perfecto», 👍…) tras la respuesta ya no dejan el chat en «Atender» (`_crmEsAcuse`).
- Fases WhatsApp 1–3 publicadas: palomitas corregidas (4,416 históricas, respaldo `respaldo_wa_palomitas_20261018`), contactos y
  ubicaciones, aviso de línea desconectada, motivo de fallo en español, reacciones (falta que el dueño marque `reaction.received`
  en el webhook de Zernio «BayolCell Navarrete WhatsApp»).
- Botón de formulario de financiamiento en usted (`crm-financiamiento-quick-reply.js`, publicado).

**Taller general:** ⓘ de ayuda en todas las pantallas (`taller-info.js`), capa táctil, texto en usted, Navarrete (almacén 7) en
listas y sincronización.

## 4. Integraciones técnicas
- **Info Plus API:** `https://apicliente.infoplusplatinum.com/api/...?basedatos=&clave=` (secrets `INFOPLUS_BASE`, `INFOPLUS_CLAVE`,
  siempre `.trim()`). `ListaArticulos` detallado da un precio por nivel (solo contado); **no** da crédito ni mínimo (el POST `Articulo`
  sí los acepta). `Compra` trae seriales de lo que entró; `Factura` no trae IMEI. `InventarioActual`, `TransaccionInventario`,
  `vendedor`, `cliente`: «Error en las credenciales». Artículos sin precio nivel 1 no salen por API.
- **Zernio:** capa sobre la Cloud API de Meta. **6 líneas** (tabla `whatsapp_lineas`): Principal 809-893-4412, Reparación 809-707-2493 y 829-670-9694, Servicio al Cliente 849-564-4791, Al por Mayor 809-679-3793 y 809-489-9145 (la sucursal de cada una está en `whatsapp_lineas.sucursal_id`). Webhook HMAC `X-Zernio-Signature`.
- **Edge Functions en el repo** (`supabase/functions/`): `whatsapp-webhook` (verify_jwt false), `whatsapp-enviar`, `whatsapp-ia-responder`
  (v31, verify_jwt false), `whatsapp-importar-historial`, `whatsapp-marketing-contactos`, `instagram-*`, `social-*`
  (incl. `social-automatizaciones`), `infoplus-sync`, `infoplus-existencia-art`, `infoplus-clientes`, `infoplus-imei-almacen` (v1),
  `infoplus-diagnostico-series` (retirada, 410), `bde-diagnostico`, `ai-board-chat`, `catalogo-publico`, `pantallas-publico`,
  `puente-rifa`, `recepcion-boleto`, `resolver-link-mapa`. Compartidos: `_shared/inbox-common.ts`, `_shared/precio-pantalla.ts`.
  Otras desplegadas fuera del repo (ver CLAUDE.md): `mdm-accion`, `abm-accion`, `infoplus-prefactura-crear`, `infoplus-ventas-sync`,
  `infoplus-seriales-sync`, `infoplus-compra/despacho/ajuste-crear`.
- **Crons (pg_cron):** `infoplus-precios-diario`; `infoplus-seriales-diario` (6:20 UTC, últimos 10 días de compras →
  `infoplus_seriales`, al día desde 19-oct); `ia-borradores-fin-credito-24oct` (job 9, 25-oct 00:05 RD, se borra solo);
  `social-automatizaciones-cada-2min`; `campanas-activar-programadas`.
- **Tablas clave:** `infoplus_articulos` (existencias jsonb por almacén, niveles), `infoplus_seriales`, `infoplus_ventas`,
  `infoplus_diagnostico` (solo admin), `recepcion_prefacturas`, `tecnicos`/`usuarios`/`roles_taller`, `sucursales`, `whatsapp_lineas`,
  `whatsapp_hilos`, `whatsapp_mensajes` (`meta`, `reacciones`), `whatsapp_estados_pendientes`, `whatsapp_ia_config`,
  `whatsapp_ia_sugerencias` (`texto_final`), `whatsapp_ia_ejemplos`, `whatsapp_ia_conocimiento`, `whatsapp_ia_uso_diario`,
  `social_webhook_eventos`, `leads`.
- Migraciones: 57 archivos en `supabase/migrations/`; la última es `20261021020000_ia_ejemplos_y_correcciones.sql`.

## 5. IA de WhatsApp (`whatsapp-ia-responder` v31, Claude Haiku 5.5)
- Tono: **usted**, saludo **«Buenas, a la orden»**, «estimado/estimada» solo si el nombre lo deja claro, **nada de «mi amor»/cariño**,
  emojis casi nunca, **interpretar** lo que escribe el cliente (faltas incluidas), una pregunta a la vez.
- **42 ejemplos limpiados** en `whatsapp_ia_ejemplos` (solo admin). Correcciones: trigger `trg_wa_ia_capturar_correccion` guarda en
  `texto_final` lo que el empleado realmente mandó tras «Editar» (30 min) y lo pasa a ejemplo (`fuente='correccion'`).
  El borrador recibe las 6 correcciones recientes + 10 ejemplos parecidos.
- Personalidad, servicios y políticas (Ademi, precios) en `whatsapp_ia_conocimiento`; **el dueño los edita en CRM → Agente de IA**.
- Gasto: tope diario vía RPC `ia_consumir_cupo`; **borradores de seguimiento prendidos hasta el 24-oct (tope 400/día)**;
  **desde el 25-oct se apagan y el tope vuelve a 150**. Espera de 30 s antes de redactar. Vigilar con
  `select * from whatsapp_ia_uso_diario order by dia desc limit 7;`
- Modos al 19-oct: Moca y Santiago automático, Navarrete copiloto (revisar contra la regla supervisada antes de cambiar nada).
- **Precio de pantalla sale del código**, no de la IA: `precio-pantalla.ts` (3 copias iguales: `_shared`, `whatsapp-ia-responder/_shared`,
  `social-automatizaciones/_shared`); QA `scripts/qa-precio-pantalla.mjs` (49 PASS). En WhatsApp dice «le sale»;
  **en `social-automatizaciones` (privado IG/FB) aún dice «te sale»** (pendiente).
- Formulario de financiamiento en usted (servidor v31 y botón del CRM), publicado. El encabezado «SOLICITUD DE FINANCIAMIENTO» no cambia.

## 6. Pendientes y esperas
- **IMEI por almacén: sin resolver.** `infoplus-imei-almacen` v1 (autenticada) prueba rutas candidatas, solo acepta IMEI que digan
  explícitamente artículo + almacén, guarda la primera que sirva como `FUENTE_OK` en `infoplus_diagnostico`. Prueba real (artículo 2517,
  almacén 1): ninguna ruta sirve. **Esperando a Dagoberto:** valor de `tipo` en `ListaArticulos?tipo`, si admite artículo/almacén,
  permiso para `InventarioActual` y `TransaccionInventario`, qué ruta da seriales disponibles por almacén.
- Dagoberto también: crédito y mínimo por nivel en `ListaArticulos` detallado; Comentarios, Atención, Cédula, Teléfono y Fecha de
  entrega en `PreFacturaModel`; cómo interpreta `porcentaje`/`descuento`.
- Primera prefactura real con descuento y con código de empleada: revisarla en Info Plus.
- Meta: el conector **WhatsApp Business MCP** solo ve «jose antonio peralta» y «Studiord»; el conector **Meta Ads** sí ve Bayol Cell,
  BayolCell RD - Cuenta Comercial y BayolCell. Plan: probar Cloud API directa con el **número de prueba gratis en Studiord** cuando el
  dueño cree la app de desarrollador. **No mover números reales**; un número está en un solo sitio a la vez (coexistencia posible).
  **Zernio se queda** hasta que cada paso esté probado.
- Cuenta publicitaria 988971888850978 fuera de portafolio (el dueño lo dejó para después; «Aubelle» sin aclarar).
- `reaction.received` en Zernio (lo hace el dueño). Frase «te sale» en `social-automatizaciones`.
- Revisar sugerencias reales de la IA (tono/largo) y el gasto diario tras el 25-oct.

## 7. Errores a no repetir
- **Clasificador de seguridad bloqueó** (no reintentar): una Edge **pública** que usa la clave de Info Plus; que Claude **la llame por su
  cuenta**; una **llamada automática silenciosa** con la sesión del admin. Lo correcto: función autenticada usada por la pantalla real.
- **MCP de Supabase:** `apply_migration` y `execute_sql` largos/complejos se cuelgan ~60 s → aplicar en sentencias pequeñas;
  **`UPDATE` sin `WHERE` se cuelga** (siempre con `WHERE`). Guardar igual el archivo de migración en el repo.
- `infoplus_articulos` puede tener descripciones viejas: leer en vivo antes de escribir precios. Códigos de Info Plus reutilizados
  para otros modelos (filtrar IMEI también por nombre).
- `\n` en `basedatos`/clave rompió despacho y sync: siempre `.trim()`.
- `POST /compra` con `codpedido` **reemplaza**, no agrega.
- No duplicar botones (pasó con el historial de la Prefactura). No ocultar con `[hidden]` si otra regla pone `display:flex`.
- Al medir animaciones, esperar a que termine la entrada (a medio abrir da 43/47 px).
- No sobrescribir un archivo sin leerlo (pasó con `DESIGN.md` de nexus-pro; se restauró).

## 8. Dónde buscar más
- `CLAUDE.md` (mapa completo, Info Plus, permisos, historial por fechas), `DESIGN.md`, `HERRAMIENTAS.md`, `PENDIENTES.md`
  (MDM/financiamiento), `docs/RUTAS-CONSULTA-IMEI.md`, `docs/REFERENCIAS-DISENO.md`, `AUDITORIA_SISTEMA_PARA_CLAUDE.md`.
- `docs/bitacora/` (leer las más recientes en orden), `git log --oneline origin/main -50`.
- Pruebas locales (Playwright, banco con Supabase simulado): `pftest`, `pfopc`, `pfvent`, `almfijo`, `imeialm`, `crmprecio`,
  `etqcount`, `acuse`; `scripts/qa-precio-pantalla.mjs`.
