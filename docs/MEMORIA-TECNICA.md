# MEMORIA-TECNICA.md — detalle técnico (complemento de `docs/MEMORIA.md`)

No se carga sola: leerla cuando el trabajo toque estas piezas. Actualizarla en cada entrega igual que la MEMORIA.

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

