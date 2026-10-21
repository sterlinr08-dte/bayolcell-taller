# 21-oct-2026 · Verificación de Bayol Cell en el conector de WhatsApp Business (Meta) — solo lectura

**Pedido del dueño:** «Verifica bayol cell» (después de ver un reel sobre conectar WhatsApp por el MCP de Meta y preguntar por un CRM sin Zernio).

**Qué se revisó (sin cambiar nada en Meta ni en la base):**
- Conector WhatsApp Business Tools: la cuenta de Facebook conectada administra **2 negocios**: «jose antonio peralta» (936305359029409, perfil incompleto, 0 cuentas) y «Studiord» (28811977941729276, perfil completo, 3 números, pago listo). A ninguno le han conectado una app de desarrollador.
- `whatsapp_lineas` (Supabase vkhwdvjtowrhkhqavnvk): **6 líneas de Bayol activas y conectadas**, todas por Zernio (Principal 8934412, Reparación 7072493 y 6709694, Servicio al Cliente 5644791, Al por Mayor 6793793 y 4899145). Ninguna de sus cuentas de WhatsApp (WABA) aparece entre las cuentas de los 2 negocios visibles.

**Conclusión:** el negocio de Meta de Bayol Cell no está en esta conexión. Probablemente pertenece a otra cuenta de Facebook o fue creado por Zernio cuando se conectaron los números. Para verlo desde el conector, el dueño tiene que entrar como administrador en el negocio de Bayol (o agregar su Facebook como admin) y volver a autorizar el conector.

**Archivos/migraciones/funciones:** ninguno. **Publicación:** no aplica.
**Riesgo:** no mover ningún número de Zernio; un número solo puede estar en un sitio y moverlo cortaría el CRM.
**Siguiente paso:** el dueño decide si da acceso al negocio de Bayol; la prueba sin Zernio se hará con el número de prueba gratis de Meta en Studiord.
