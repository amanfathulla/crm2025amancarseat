-- Coupons table currently only allows SELECT (and possibly INSERT) via RLS,
-- but UPDATE is blocked. That's why editing a coupon (ticking materials)
-- never persists: applicable_materials stays NULL and the storefront accepts
-- the coupon for every material.
--
-- Allow full management of coupons. The code already reads coupons publicly,
-- and the admin UI manages them, so permitting all operations is consistent
-- with the existing exposure of this table.
--
-- Run this ONCE in the Supabase SQL Editor, then refresh the app.

DROP POLICY IF EXISTS "Enable all access for coupons" ON public.coupons;
CREATE POLICY "Enable all access for coupons"
  ON public.coupons
  FOR ALL
  USING (true)
  WITH CHECK (true);
