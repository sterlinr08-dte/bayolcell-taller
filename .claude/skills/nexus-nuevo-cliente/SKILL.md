---
name: nexus-nuevo-cliente
description: >-
  Levantar un cliente NUEVO del ecosistema NEXUS PRO desde el molde (amatista-dental),
  modelo base-por-cliente. Úsala cuando Sterling diga "nuevo cliente / clonar el molde /
  montar app para [negocio] / arrancar sistema para [X]". Guía el flujo completo: nueva
  base Supabase, código rebrandeado (paleta, logo, nombre, dominio), quitar/poner módulos,
  usuario admin, SSO en la base madre NEXUS y deploy en Cloudflare. Pide los datos que falten.
---

# Nuevo cliente NEXUS PRO (clonar el molde)

Modelo **base-por-cliente**: cada cliente tiene su propio repo, su propia base
Supabase y su subdominio; nada se cruza. El molde de origen es
`sterlinr08-dte/amatista-dental` (que clonó de Deluxe). Este mismo flujo montó
geriatría — seguirlo como plantilla, adaptando al rubro.

## Datos a pedir al arrancar (si no los dio)
- Nombre del negocio/profesional y **rubro** (qué módulos aplican).
- **Marca**: logo, paleta (color principal + acento), nombre visible en la app.
- Datos de contacto reales (dirección, teléfonos, email, RNC/exequátur si es médico).
- Subdominio deseado (`<algo>.nexusprord.com`).

## Pasos

### 1. Base de datos (Supabase)
- Crear proyecto Supabase del cliente (org `sterlinr08`). Guardar `ref`, URL.
- Clonar el **esquema del molde** (Amatista `sdxyqaawxomnfhyaxuyo`): tablas con RLS,
  funciones, triggers. **Quitar lo que no aplique** al rubro (ej. en geriatría se
  quitó todo lo dental).
- La **publishable key** es pública (protegida por RLS); obtenerla con el MCP de
  Supabase `get_publishable_keys`. La key sensible **nunca** al repo.
- Crear usuario auth admin del cliente + fila en `perfiles` (rol admin). Clave
  temporal **por chat, jamás en el repo**.
  - GOTCHA: al crear el usuario por SQL directo, poner en `''` (no NULL) las columnas
    de token de `auth.users` (`confirmation_token`, `recovery_token`, `email_change*`,
    `phone_change*`, `reauthentication_token`); si quedan NULL, GoTrue rechaza el login.

### 2. Código (repo nuevo)
- Clonar el molde a un repo `sterlinr08-dte/<cliente>`.
- **Quitar los módulos** que no aplican (páginas, libs, rutas en `App.tsx`, menú en
  `Sidebar.tsx`, permisos en `lib/permisos.ts`, pestañas de la ficha).
- **Rebrand de raíz**: en `tailwind.config.js` redefinir `brand` al color del cliente
  y **sobrescribir** las paletas heredadas (`amber`/`pink`/`fuchsia`) a ese color, para
  que TODAS las clases heredadas se recoloreen solas. Agregar la paleta de acento.
  Ajustar los hex del molde en `index.css`, header y sidebar.
- **Branding**: `NEGOCIO.nombre`, `DOMINIO_USUARIO`, `constants.ts`, `public/logo.png`
  + `public/favicon.png`, `package.json` name, `index.html` (título + theme-color),
  `public/CNAME`.
- **Contenido**: consentimientos, categorías, canales de chat al rubro del cliente.
- `.env` (gitignored) con `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` de la base nueva.
- **Sin emojis, sin hex sueltos** (ver skill `nexus-convenciones`). `npm run build` VERDE.
- Escribir el `CLAUDE.md` del repo con el contexto del cliente.

### 3. Deploy + dominio (Cloudflare)
- Cloudflare Workers Static Assets: build `npm run build`, salida `dist`, `wrangler.jsonc`
  con SPA fallback (`not_found_handling: single-page-application`). Variables de build:
  `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- Custom Domain `<cliente>.nexusprord.com` **desde la cuenta Cloudflare que tiene la
  zona `nexusprord.com`** (si el Worker queda en otra cuenta, da "ninguna zona coincide").

### 4. SSO en la base madre NEXUS (`tnwsgcxurfyuszxsewsn`)
- En `organizaciones`, fila con `slug='<cliente>'`: `nombre`, `color`, `auth_url`
  (base del cliente), `auth_key` (**JWT anon** legacy, patrón de Amatista/Deluxe, NO
  la publishable), `email_dominio`, y `dominio='<cliente>.nexusprord.com'`.
- Verificar: entrar por `nexusprord.com` debe llevar al cliente **ya logueado** (SSO por
  `#access_token`). La app además tiene login propio (`pages/Login.tsx`).

## Al terminar
Confirmar: base creada + esquema, admin creado, build verde, deploy vivo, dominio
resolviendo, SSO entrando logueado. Actualizar el mapa de sistemas en el CLAUDE.md
madre. Entregar la clave temporal del admin por chat.
