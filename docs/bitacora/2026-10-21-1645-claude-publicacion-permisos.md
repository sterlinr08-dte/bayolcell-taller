# 21-oct-2026 16:45 · Claude · Publicación: permisos en dos listas y por empleado

- El dueño lo autorizó con «SI», en respuesta a «¿Lo publico?».
- Se pasó a `main` solo esta entrega (cherry-pick de `ed58511`):
  - `bc-permisos-listas.js` (nuevo);
  - `taller-app.js`: extras al iniciar sesión;
  - migración `20261021150000_permisos_por_empleado.sql`, que ya estaba aplicada en la base;
  - bitácora 1630.
- `taller.html` se armó a mano: solo se agregó `bc-permisos-listas.js?v=20261021-pl1`, sin `bc-wa-meta.js`, que sigue sin publicar.
- Los archivos publicados son iguales a los probados en la rama.
- Verificación en vivo: comprobar que bayolcell.com carga `pl1`.

## Siguiente
- El dueño entra a Configuración → Empleados → editar a una persona → «Permisos de esta persona» → le pasa el permiso extra → Guardar.
- La persona cierra sesión y vuelve a entrar para que le rija.
