# 2026-11-25 22:00 RD · Claude — Cómo crear el usuario del sistema en Info Plus (respuestas de Muse)

Sigue a `2026-11-25-2100-claude-infoplus-api-movil.md`. Muse revisó Info Plus Web (BAYOL CELL SRL).

## Respuestas verificadas por Muse
- **Pantalla de entrar:**
  - pide solo «usuario@dominio» y la clave;
  - no hay campo de Empresa ni de Base de datos;
  - la empresa va en el dominio, después de la @.
- **Dónde se crean los usuarios:** en Sistema → Nivel de Acceso.
  - «Registro de Password»: Usuario, Password, E-mail, Entidad, Nivel y Localidad. La lista de localidades incluye TALLER BAYOL.
  - «Niveles de Acceso»: 534 permisos, de los que 41 son de factura («Factura», «Factura Rápida», «Factura Tablet», «Prefactura»…).
- **API:** ningún permiso ni menú habla de API, app móvil o dispositivos.

## Cómo se conecta con la API móvil (deducción, falta probar)
- `POST api/Login` de `api.infoplusplatinum.com` pide `Username`, `Password` y `Domain`.
- Lo más probable es que `Username` sea lo de antes de la @ y `Domain` lo de después. Se probará también el usuario completo en `Username`.
- **No verificado** si la API móvil acepta un usuario creado en la web, ni qué permiso exige. Lo más probable es «Factura Tablet», porque la app móvil es la de tableta.

## Plan acordado para el dueño (o Muse con su OK)
1. En Niveles de Acceso, crear el nivel **«SISTEMA TALLER»** con «Factura», «Factura Tablet» y «Prefactura». **Sin** «Ver Facturas e Ingresos de Todas las Localidades».
2. En Registro de Password, crear el usuario (por ejemplo `sistema@<dominio>`) con ese nivel y Localidad = TALLER BAYOL.
3. En Supabase del taller → Edge Functions → Secrets, guardar:
   - `INFOPLUS_MOVIL_USUARIO`: el usuario completo, con @dominio;
   - `INFOPLUS_MOVIL_CLAVE`: la clave.
   - Nunca por el chat.
4. Claude hace **solo** el Login y una lectura inofensiva. Escribir en Info Plus necesita la autorización expresa del dueño.

Archivos: solo esta bitácora.
