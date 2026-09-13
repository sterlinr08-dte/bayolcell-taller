-- Auditoria 12 sept 2026 (AUDITORIA_SISTEMA_PARA_CLAUDE.md), hallazgo F02:
-- 71 politicas ALL con USING(true)/WITH CHECK(true) para 'authenticated' --
-- cualquier sesion (incluso de un tecnico desactivado, o una sesion sin
-- vinculo valido) podia leer/escribir/borrar en esas tablas, aunque el
-- menu de la app lo ocultara.
--
-- Primer endurecimiento de bajo riesgo: exigir admin o tecnico ACTIVO en
-- vez de "cualquiera con sesion". app_is_admin() ya es true para
-- cualquier actor tipo 'usuario'; app_actor_es_tecnico_activo() ya se
-- usaba para las politicas de Instagram/Facebook (13 sept 2026). Esto NO
-- cambia que puede hacer cada empleado activo entre si -- eso lo sigue
-- controlando cada pantalla via tienePermiso()/isAdminUser() -- solo
-- cierra el paso a cuentas sin vinculo valido o desactivadas.
--
-- F02 sigue abierto para un segundo paso mas fino (por sucursal/rol en
-- tablas especificas como financiamiento); este es el piso minimo seguro.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public' and qual='true' and with_check='true' and cmd='ALL'
  loop
    execute format(
      'alter policy %I on %I.%I using (app_is_admin() OR app_actor_es_tecnico_activo()) with check (app_is_admin() OR app_actor_es_tecnico_activo())',
      r.policyname, r.schemaname, r.tablename
    );
  end loop;
end $$;
