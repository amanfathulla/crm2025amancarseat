-- ============================================================
-- FIX: Reviews edit/delete "succeeds" but changes 0 rows.
-- CAUSE: RLS on the reviews table (project brxxmhnymhdlolelrjgy) only
-- allows SELECT/INSERT for anon; UPDATE/DELETE have no permissive
-- policy, so they return 204 but affect 0 rows (silent no-op).
--
-- RUN THIS in the SUPABASE PROJECT that hosts `reviews`
-- (brxxmhnymhdlolelrjgy), NOT the crm2025amancarseat project.
-- SQL Editor -> paste -> Run.
-- ============================================================

-- Allow anon (used by the CRM reviews client) to update & delete.
-- If you want it locked down, replace USING (true) with an admin-header
-- check like the crm customers table uses.

DROP POLICY IF EXISTS "allow anon update reviews" ON public.reviews;
CREATE POLICY "allow anon update reviews"
  ON public.reviews FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow anon delete reviews" ON public.reviews;
CREATE POLICY "allow anon delete reviews"
  ON public.reviews FOR DELETE USING (true);
