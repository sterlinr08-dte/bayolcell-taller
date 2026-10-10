-- REVIEW ONLY. DO NOT APPLY TO PRODUCTION WITHOUT ACCOUNT / ROLE ACCEPTANCE TESTS.
-- The current policy placas_mapas_acc allows UPDATE/DELETE to ANY user
-- with app_puede_diagnostico(), without checking creado_por.
-- creado_por is TEXT; the AI Board writes auth.uid()::text.
-- Design: shared read for authorized users; writes only on user-owned AI Board rows.
-- PRECONDITION: catalogue legacy records may use non-UUID actor IDs or different
-- ownership conventions. Preserve their operations via an explicit admin workflow.
--
-- Proposed exact policy change (transactional; test in a staging clone first):
BEGIN;
DROP POLICY IF EXISTS placas_mapas_acc ON public.placas_mapas;
CREATE POLICY placas_mapas_read_authorized ON public.placas_mapas
 FOR SELECT TO authenticated
 USING (public.app_puede_diagnostico());
CREATE POLICY placas_mapas_insert_owned ON public.placas_mapas
 FOR INSERT TO authenticated
 WITH CHECK (public.app_puede_diagnostico()
   AND creado_por = (SELECT auth.uid())::text
   AND marca = 'Apple');
CREATE POLICY placas_mapas_update_owned ON public.placas_mapas
 FOR UPDATE TO authenticated
 USING (public.app_puede_diagnostico()
   AND creado_por = (SELECT auth.uid())::text
   AND marca = 'Apple')
 WITH CHECK (public.app_puede_diagnostico()
   AND creado_por = (SELECT auth.uid())::text
   AND marca = 'Apple');
CREATE POLICY placas_mapas_delete_owned ON public.placas_mapas
 FOR DELETE TO authenticated
 USING (public.app_puede_diagnostico()
   AND creado_por = (SELECT auth.uid())::text
   AND marca = 'Apple');
COMMIT;
-- Note: original bucket 'placas' has broad CRUD rules.
-- Postgres RLS policies are OR-combined. Adding a narrow policy without
-- dropping/replacing those broad rules WILL NOT RESTRICT access.
-- Bucket hardening MUST map existing asset ownership, including pre-AI Board
-- uploads, before replacing any storage.objects policies. Do not assume all
-- objects under 'placas' follow 'ai-board/<auth-user-id>/<uuid>.png'.
-- Staging tests: owner updates own Apple map; cross-user update/delete denied;
-- unauthorized roles denied; authorised reads preserved; old legacy maps unaffected
-- for required business functions; owned path deletions do not affect other images.
