# 2026-10-22 12:40 · Claude · «Enviar plantilla»: nombre del cliente y sucursal se llenan solos

- **Dueño:** «Si» a que el CRM llene solo {{1}} y {{2}} (bitácora 2026-10-22-1215).
- **Antes:** solo {{1}} se llenaba con el nombre del perfil del cliente; {{2}} quedaba vacía.
- **Ahora** (`taller-app.js`, `v=20261022-p2` en `taller.html`):
  - al abrir «Enviar plantilla» se consulta la RPC `whatsapp_lineas_directorio` (la ven todos los empleados) y se guarda la sucursal de la línea del chat abierto;
  - en plantillas con variables numeradas, {{1}} = nombre del cliente y {{2}} = sucursal (por ejemplo «Santiago», «Moca», «Navarrete»); se quita «Localidad»/«Sucursal» si el nombre lo trae.
  - La empleada puede corregir cualquiera de las dos antes de tocar Enviar. Las plantillas con variables con nombre no cambian.
- Sirve ya para `bayolcell_seguimiento_consulta` (en revisión de Meta) y para cualquier otra con dos variables.
- Rama `claude/zernio-plantilla-forma`. **No publicado** (el arreglo de `whatsapp-enviar` v21 sí está en vivo porque es Edge).
