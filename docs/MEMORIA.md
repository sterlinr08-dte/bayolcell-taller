# MEMORIA.md — Bayol Cell (para que la IA se ponga al día tras compactar)

Borrador del 21-oct-2026. Solo hechos verificados. Si algo de aquí choca con el código, la base o una bitácora más nueva,
manda lo más nuevo. Ante la duda, volver a leer (nunca suponer).

> Parte técnica y detalle: `docs/MEMORIA-TECNICA.md` (leerla cuando el trabajo toque esas piezas).

## 1. Propósito
- Se recarga sola al iniciar y al compactar el chat. Es un resumen: la fuente completa es `CLAUDE.md`, `.claude/rules/` y la bitácora. Actualizar en cada entrega; nunca borrar una regla del dueño sin su OK.

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

**Modo ligero (21-oct):** en PCs sencillas (≤4 núcleos o ≤4 GB) o con Chrome sin aceleración de gráficos se quitan las esferas animadas del fondo y el vidrio difuminado (`html.bc-ligero`, se decide en el `<head>`). Forzar en un equipo: `taller.html?ligero=1`; quitar: `?ligero=0`; automático: `?ligero=auto`. El aviso «Sin conexión en tiempo real» ya no se anima.

**Taller general:** ⓘ de ayuda en todas las pantallas (`taller-info.js`), capa táctil, texto en usted, Navarrete (almacén 7) en
listas y sincronización.

## IA de WhatsApp (resumen; detalle en MEMORIA-TECNICA)
- `whatsapp-ia-responder` v32 (Haiku 5.5): usted, «Buenas, a la orden», estimado/a solo si el nombre lo deja claro, sin «mi amor», casi sin emojis. Saludo lee al cliente; formulario solo si el último mensaje lo pide. Aprende de `whatsapp_ia_ejemplos` (42 + correcciones). Seguimientos prendidos hasta el 24-oct (tope 400/día); el 25-oct se apagan (tope 150).

## 6. Pendientes y esperas
- **IMEI por almacén:** `listaserie` (Edge v5) da {descripcion, serie, localidad} de todos los almacenes; localidad no sigue transferencias. Dagoberto (22-oct): «hay que agregar esos filtros» → esperar los nombres de parámetro (bit. 2026-10-22-1040).
- **Esperando a Dagoberto:** Comentarios/Atención/Cédula/Teléfono/Fecha de entrega en `PreFacturaModel`; crédito/mínimo por nivel y `porcentaje`.
- **Plantillas WA (22-oct):** `whatsapp-enviar` v22: con teléfono real abre conversación nueva (`POST /v1/inbox/conversations`), arregla los referidos. Plantilla aprobada en 5/6 líneas. Publicado: etiqueta «Transferido» y «Ver conversación anterior» (bit. 1405). Falta reintentar plantilla a ToNnY.
- Prefactura: «Limpiar sola» publicada (21-oct). Impresa con el mismo Nº de Info Plus (ticket 80 mm / carta, «COPIA» al reimprimir): rama, sin publicar (bit. 1200). IA v32 desplegada (código aún no en `main`).
- Revisar en Info Plus la 1.ª prefactura real con descuento y código de empleada.
- Meta: conector WhatsApp MCP no ve BayolCell (reconectar marcando BayolCell); app de desarrollador bloqueada para el dueño (ESTERLIN ESPINAL con 2FA puede crearla). **Zernio se queda** hasta probar cada paso.
- Cuenta publicitaria 988971888850978 fuera de portafolio (para después).
- `reaction.received` en Zernio (dueño). «te sale» en `social-automatizaciones`.
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
