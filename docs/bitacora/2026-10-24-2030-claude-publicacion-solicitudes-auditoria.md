# 24-oct-2026 (RD, noche) · Claude · Publicadas las correcciones de la auditoría de Solicitudes (PR #122)

- Dueño: «Publícalo». PR #122 unido a `main` (squash `a858e42`); CI verde en el último commit.
- Funciones del servidor: `whatsapp-flow-financiamiento` v9 (verify_jwt true, como antes) y `whatsapp-webhook` v44
  (verify_jwt false, con deno.json; copia desplegada idéntica byte a byte a la rama). Prueba en vivo con un enlace falso:
  responde 404 «Este enlace ya no sirve», sin tocar datos.
- Base:
  - `fin_solicitud_visible` y la nueva `fin_solicitud_seguimiento` (pasos en orden, corrección con motivo, nombre de la
    cuenta usuario en el historial) aplicadas por Claude.
  - La política de lectura y el retiro de escritura los pegó el dueño en el SQL Editor (la herramienta de Supabase se
    queda esperando confirmación con `drop policy`). Verificado: única política `fin_solicitudes_whatsapp_leer` =
    `fin_solicitud_visible(sucursal_id, enviado_por_id)`; `authenticated` solo SELECT/REFERENCES/TRIGGER; 4 filas intactas.
- bayolcell.com sirve `crm-solicitudes.js` s3, `solicitud` nueva (manejo sin red) y `taller.html` u25.
- Decisiones del dueño: «Cada uno su sucursal»; corregir «Cualquiera, con motivo». Las cuentas tipo «usuario» ven todo (app_is_admin).

## Pendiente (diseño aparte)
S08 constancia del permiso del cliente; S12 responsable y próxima gestión; S13 evitar enlaces duplicados; paginación en servidor; foco de la ficha (S14).
