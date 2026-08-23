-- SEGURIDAD (critico): cierra la escalacion de privilegios. Cualquier
-- tecnico logueado podia ejecutar UPDATE tecnicos SET rol='admin' contra
-- su propia fila (la tabla no tenia ninguna proteccion mas alla de
-- "estar logueado"), y con eso desbloquear todo lo que en pantalla se
-- ve como "solo administradores" — incluida la Contabilidad, que si
-- tenia proteccion real via app_is_admin(), pero esa misma funcion lee
-- el rol de tecnicos, asi que la escalada la burlaba tambien a ella.
--
-- Se descubrio que ya existia una funcion app_is_admin() (identica a
-- lo que se necesitaba) sin usar en estas tablas — solo se le aplico
-- donde faltaba.

-- TECNICOS: lectura abierta (se usa para listar nombres en varias
-- pantallas), pero solo un admin puede crear/editar/borrar tecnicos.
drop policy if exists app_authenticated_all on public.tecnicos;
create policy tecnicos_select_auth on public.tecnicos for select to authenticated using (true);
create policy tecnicos_admin_insert on public.tecnicos for insert to authenticated with check (app_is_admin());
create policy tecnicos_admin_update on public.tecnicos for update to authenticated using (app_is_admin()) with check (app_is_admin());
create policy tecnicos_admin_delete on public.tecnicos for delete to authenticated using (app_is_admin());

-- ROLES_TALLER: define los permisos de cada rol. Mismo criterio.
drop policy if exists app_authenticated_all on public.roles_taller;
create policy roles_taller_select_auth on public.roles_taller for select to authenticated using (true);
create policy roles_taller_admin_insert on public.roles_taller for insert to authenticated with check (app_is_admin());
create policy roles_taller_admin_update on public.roles_taller for update to authenticated using (app_is_admin()) with check (app_is_admin());
create policy roles_taller_admin_delete on public.roles_taller for delete to authenticated using (app_is_admin());

-- NOMINA: la pantalla ya era "solo administradores" en el navegador;
-- ahora la base de datos tambien lo exige.
drop policy if exists nomina_emp_acc on public.nomina_empleados;
create policy nomina_empleados_admin on public.nomina_empleados for all to authenticated using (app_is_admin()) with check (app_is_admin());

drop policy if exists nomina_per_acc on public.nomina_periodos;
create policy nomina_periodos_admin on public.nomina_periodos for all to authenticated using (app_is_admin()) with check (app_is_admin());

drop policy if exists nomina_lin_acc on public.nomina_lineas;
create policy nomina_lineas_admin on public.nomina_lineas for all to authenticated using (app_is_admin()) with check (app_is_admin());

-- CUENTAS POR PAGAR: idem.
drop policy if exists cxp_auth_all on public.cuentas_por_pagar;
create policy cuentas_por_pagar_admin on public.cuentas_por_pagar for all to authenticated using (app_is_admin()) with check (app_is_admin());

drop policy if exists cxp_abonos_auth_all on public.cxp_abonos;
create policy cxp_abonos_admin on public.cxp_abonos for all to authenticated using (app_is_admin()) with check (app_is_admin());

-- INVENTARIO FISICO: idem (escribe ajustes reales contra Info Plus).
drop policy if exists inv_fisico_sesiones_auth_all on public.inv_fisico_sesiones;
create policy inv_fisico_sesiones_admin on public.inv_fisico_sesiones for all to authenticated using (app_is_admin()) with check (app_is_admin());

drop policy if exists inv_fisico_lineas_auth_all on public.inv_fisico_lineas;
create policy inv_fisico_lineas_admin on public.inv_fisico_lineas for all to authenticated using (app_is_admin()) with check (app_is_admin());

-- RRHH: todo se carga solo dentro del modulo de Nomina, ya admin-only.
drop policy if exists rrhh_benef_acc on public.rrhh_beneficios_pagos;
create policy rrhh_beneficios_admin on public.rrhh_beneficios_pagos for all to authenticated using (app_is_admin()) with check (app_is_admin());

drop policy if exists rrhh_eval_acc on public.rrhh_evaluaciones;
create policy rrhh_evaluaciones_admin on public.rrhh_evaluaciones for all to authenticated using (app_is_admin()) with check (app_is_admin());

drop policy if exists rrhh_pruebas_acc on public.rrhh_pruebas;
create policy rrhh_pruebas_admin on public.rrhh_pruebas for all to authenticated using (app_is_admin()) with check (app_is_admin());

drop policy if exists rrhh_preg_acc on public.rrhh_prueba_preguntas;
create policy rrhh_prueba_preguntas_admin on public.rrhh_prueba_preguntas for all to authenticated using (app_is_admin()) with check (app_is_admin());
