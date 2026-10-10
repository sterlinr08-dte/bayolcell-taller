-- AI BOARD · fotos de placas: cada quien modifica solo lo suyo (10 oct 2026).
-- NO APLICADA. Requiere la autorización del dueño para tocar la base de producción.
--
-- Contexto verificado en producción el 10 oct 2026 (solo lectura):
--   placas_mapas = 0 filas, placas_puntos = 0 filas, bucket «placas» privado con 0 archivos.
--   Ningún otro módulo del taller usa estas tablas ni el bucket (taller-app.js no las nombra);
--   las creó la migración 20261009000000_placas_mapas.sql para el visor y solo las usa
--   diagnostico-ai-catalog.js, que guarda creado_por = auth.uid() y sube a ai-board/<auth.uid()>/…
-- Por eso se pueden reemplazar las reglas amplias sin romper nada existente.
--
-- Antes: cualquier usuario con permiso de Diagnóstico podía EDITAR o BORRAR fotos ajenas.
-- Después: todos los autorizados siguen VIENDO las fotos; solo el autor (o un admin) edita o borra.
begin;

drop policy if exists placas_mapas_acc on public.placas_mapas;
create policy placas_mapas_leer on public.placas_mapas for select to authenticated
  using (public.app_puede_diagnostico());
create policy placas_mapas_crear on public.placas_mapas for insert to authenticated
  with check (public.app_puede_diagnostico() and creado_por = (select auth.uid())::text);
create policy placas_mapas_editar on public.placas_mapas for update to authenticated
  using (public.app_puede_diagnostico() and (creado_por = (select auth.uid())::text or public.app_is_admin()))
  with check (public.app_puede_diagnostico() and (creado_por = (select auth.uid())::text or public.app_is_admin()));
create policy placas_mapas_borrar on public.placas_mapas for delete to authenticated
  using (public.app_puede_diagnostico() and (creado_por = (select auth.uid())::text or public.app_is_admin()));

-- placas_puntos: puntos marcados sobre una foto; los gobierna el dueño de la foto.
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='placas_puntos' loop
    execute format('drop policy %I on public.placas_puntos', p.policyname);
  end loop;
end $$;
create policy placas_puntos_leer on public.placas_puntos for select to authenticated
  using (public.app_puede_diagnostico());
create policy placas_puntos_escribir on public.placas_puntos for all to authenticated
  using (public.app_puede_diagnostico() and exists (
    select 1 from public.placas_mapas m where m.id = placas_puntos.mapa_id
      and (m.creado_por = (select auth.uid())::text or public.app_is_admin())))
  with check (public.app_puede_diagnostico() and exists (
    select 1 from public.placas_mapas m where m.id = placas_puntos.mapa_id
      and (m.creado_por = (select auth.uid())::text or public.app_is_admin())));

-- Archivos del bucket privado «placas»: subir solo dentro de la carpeta propia ai-board/<mi id>/.
drop policy if exists placas_obj_select on storage.objects;
drop policy if exists placas_obj_insert on storage.objects;
drop policy if exists placas_obj_update on storage.objects;
drop policy if exists placas_obj_delete on storage.objects;
create policy placas_obj_leer on storage.objects for select to authenticated
  using (bucket_id = 'placas' and public.app_puede_diagnostico());
create policy placas_obj_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'placas' and public.app_puede_diagnostico()
    and (storage.foldername(name))[1] = 'ai-board'
    and (storage.foldername(name))[2] = (select auth.uid())::text);
create policy placas_obj_editar on storage.objects for update to authenticated
  using (bucket_id = 'placas' and public.app_puede_diagnostico()
    and ((storage.foldername(name))[2] = (select auth.uid())::text or public.app_is_admin()))
  with check (bucket_id = 'placas' and public.app_puede_diagnostico()
    and ((storage.foldername(name))[2] = (select auth.uid())::text or public.app_is_admin()));
create policy placas_obj_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'placas' and public.app_puede_diagnostico()
    and ((storage.foldername(name))[2] = (select auth.uid())::text or public.app_is_admin()));

commit;
